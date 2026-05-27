// app/api/admin/subscriptions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Subscription, SubscriptionStatus } from '@/models/subscription';
import { requireAuth } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment, PaymentGatewayStatus } from '@/models/payment';
import mongoose from 'mongoose';

// GET /api/admin/subscriptions/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const loggedInUser = await requireAuth();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const subscription = await Subscription.findById(id)
      .populate('userId', 'name email avatar phone company createdAt lastLogin')
      .populate({
        path:    'payments',
        options: { sort: { createdAt: -1 }, limit: 10 },
        // Use correct field names from Payment schema
        select:  'amount amountPaid gatewayStatus gatewayResponse createdAt reference channel cardLast4 cardType',
      })
      .lean();

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Payment analytics — match on gatewayStatus (not status) per the Payment schema
    const paymentStats = await Payment.aggregate([
      {
        $match: {
          subscriptionId: new mongoose.Types.ObjectId(id),
          gatewayStatus: PaymentGatewayStatus.SUCCESS, // fixed: was 'success' (string literal)
        },
      },
      {
        $group: {
          _id:           null,
          totalPayments: { $sum: 1 },
          totalAmount:   { $sum: '$amountPaid' }, // amountPaid = actual charged amount
          averageAmount: { $avg: '$amountPaid' },
          lastPayment:   { $max: '$createdAt' },
          firstPayment:  { $min: '$createdAt' },
        },
      },
    ]);

    const stats = paymentStats[0] ?? {
      totalPayments: 0,
      totalAmount:   0,
      averageAmount: 0,
    };

    // Subscription history — metadata is a Map, but .lean() converts it to a
    // plain object so we use Object.fromEntries / plain key access instead of .get()
    const history = buildSubscriptionHistory(subscription);

    return NextResponse.json({
      subscription,
      analytics: {
        totalPayments:        stats.totalPayments,
        totalRevenue:         (stats.totalAmount   ?? 0) / 100,
        averagePaymentAmount: (stats.averageAmount ?? 0) / 100,
        lifetimeValue:        (stats.totalAmount   ?? 0) / 100,
        firstPaymentDate:     stats.firstPayment ?? null,
        lastPaymentDate:      stats.lastPayment  ?? null,
      },
      history,
    });
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription details' }, { status: 500 });
  }
}

// PATCH /api/admin/subscriptions/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const loggedInUser = await requireAuth();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body                   = await req.json();
    const { action, reason, ...data } = body;

    // Validate action up front so we can return early cleanly
    const VALID_ACTIONS = ['cancel', 'pause', 'resume', 'extend', 'markActive', 'markPastDue'] as const;
    type ValidAction    = typeof VALID_ACTIONS[number];
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Allowed: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const auditEntry = {
      adminId:   loggedInUser.adminId,
      adminName: loggedInUser.name,
      action:    action as ValidAction,
      reason:    reason ?? 'No reason provided',
      timestamp: new Date(),
      previousStatus: subscription.status,
    };

    switch (action as ValidAction) {
      case 'cancel':
        await subscription.cancel(reason ?? 'Admin cancellation', data.immediately ?? false);
        break;

      case 'pause':
        if (
          subscription.status === SubscriptionStatus.ACTIVE ||
          subscription.status === SubscriptionStatus.TRIALING
        ) {
          // Save the current status so resume can restore it
          subscription.metadata.set('previous_status', subscription.status);
          subscription.status = SubscriptionStatus.PAUSED;
          subscription.metadata.set('paused_at',     new Date().toISOString());
          subscription.metadata.set('paused_by',     loggedInUser.adminId);
          subscription.metadata.set('pause_reason',  reason ?? '');
          await subscription.save();
        }
        break;

      case 'resume':
        if (subscription.status === SubscriptionStatus.PAUSED) {
          const previousStatus =
            (subscription.metadata.get('previous_status') as SubscriptionStatus) ??
            SubscriptionStatus.ACTIVE;
          subscription.status = previousStatus;
          subscription.metadata.set('resumed_at', new Date().toISOString());
          subscription.metadata.set('resumed_by', loggedInUser.adminId);
          await subscription.save();
        }
        break;

      case 'extend': {
        const days = parseInt(data.days ?? '0');
        if (days <= 0) {
          return NextResponse.json(
            { error: 'days must be a positive integer' },
            { status: 400 }
          );
        }
        const extensionMs             = days * 86_400_000;
        subscription.currentPeriodEnd = new Date(subscription.currentPeriodEnd.getTime() + extensionMs);
        if (subscription.trialEnd) {
          subscription.trialEnd = new Date(subscription.trialEnd.getTime() + extensionMs);
        }
        subscription.metadata.set('extended_at',      new Date().toISOString());
        subscription.metadata.set('extended_by',      loggedInUser.adminId);
        subscription.metadata.set('extension_days',   days);
        subscription.metadata.set('extension_reason', reason ?? '');
        await subscription.save();
        break;
      }

      case 'markActive':
        subscription.status = SubscriptionStatus.ACTIVE;
        await subscription.save();
        break;

      case 'markPastDue':
        subscription.status = SubscriptionStatus.PAST_DUE;
        await subscription.save();
        break;
    }

    // Append audit log — metadata is a live Map on the document instance (not lean)
    const existingLogs: any[] = subscription.metadata.get('admin_actions') ?? [];
    existingLogs.push(auditEntry);
    subscription.metadata.set('admin_actions', existingLogs);
    await subscription.save();

    return NextResponse.json({
      success:      true,
      message:      `Subscription ${action}ed successfully`,
      subscription: subscription.toObject(),
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}

// ─── History builder ──────────────────────────────────────────────────────────
// Works on lean documents (metadata is a plain object after lean, not a Map)

function buildSubscriptionHistory(subscription: any): any[] {
  const history: any[] = [];

  history.push({
    date:    subscription.createdAt,
    event:   'Subscription Created',
    type:    'creation',
    details: 'Initial subscription created',
  });

  // After .lean(), metadata is a plain object — access admin_actions directly
  const rawMeta     = subscription.metadata as Record<string, any> | undefined;
  const adminActions: any[] = rawMeta?.admin_actions ?? [];
  adminActions.forEach((a: any) => {
    history.push({
      date:    a.timestamp,
      event:   `Admin: ${a.action}`,
      type:    'admin_action',
      admin:   a.adminName,
      details: a.reason,
    });
  });

  if (subscription.cancelledAt) {
    history.push({
      date:    subscription.cancelledAt,
      event:   'Subscription Cancelled',
      type:    'cancellation',
      details: subscription.cancellationReason ?? 'Subscription was cancelled',
    });
  }

  return history.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}