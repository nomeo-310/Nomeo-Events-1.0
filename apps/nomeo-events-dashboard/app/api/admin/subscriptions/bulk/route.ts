// app/api/admin/subscriptions/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Subscription, SubscriptionStatus } from '@/models/subscription';
import { requireAuth } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';

// POST /api/admin/subscriptions/bulk
export async function POST(req: NextRequest) {
  try {
    const loggedInUser = await requireAuth();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { action, subscriptionIds, reason, ...actionData } = body;

    if (!subscriptionIds || !Array.isArray(subscriptionIds) || subscriptionIds.length === 0) {
      return NextResponse.json({ error: 'No subscription IDs provided' }, { status: 400 });
    }

    const VALID_ACTIONS = ['cancel', 'pause', 'resume', 'extend', 'export'] as const;
    type ValidAction    = typeof VALID_ACTIONS[number];
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Allowed: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    const auditEntry = {
      adminId:   loggedInUser.adminId,
      adminName: loggedInUser.name,
      action,
      reason:    reason ?? 'Bulk operation',
      timestamp: new Date().toISOString(),
    };

    let modifiedCount = 0;

    switch (action as ValidAction) {
      case 'cancel': {
        const result = await Subscription.updateMany(
          {
            _id:    { $in: subscriptionIds },
            status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE] },
          },
          {
            $set: {
              status:             SubscriptionStatus.CANCELLED,
              cancelledAt:        new Date(),
              cancellationReason: reason ?? 'Bulk cancellation',
              cancelAtPeriodEnd:  actionData.immediately ? false : true,
            },
          }
        );
        modifiedCount = result.modifiedCount;

        // Append audit entry to each affected subscription's metadata.
        // Map fields cannot use $push — load docs individually and save.
        // Use bulkWrite with $set on the serialized array for efficiency.
        const affected = await Subscription.find({ _id: { $in: subscriptionIds } }).select('metadata');
        await Promise.all(
          affected.map(async (sub) => {
            const logs: any[] = sub.metadata.get('admin_actions') ?? [];
            logs.push(auditEntry);
            sub.metadata.set('admin_actions', logs);
            await sub.save();
          })
        );
        break;
      }

      case 'pause': {
        // Load docs so we can snapshot previous_status per-document
        const subs = await Subscription.find({
          _id:    { $in: subscriptionIds },
          status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
        });
        await Promise.all(
          subs.map(async (sub) => {
            sub.metadata.set('previous_status', sub.status);
            sub.status = SubscriptionStatus.PAUSED;
            sub.metadata.set('paused_at',    new Date().toISOString());
            sub.metadata.set('paused_by',    loggedInUser.adminId);
            sub.metadata.set('pause_reason', reason ?? '');
            const logs: any[] = sub.metadata.get('admin_actions') ?? [];
            logs.push(auditEntry);
            sub.metadata.set('admin_actions', logs);
            await sub.save();
          })
        );
        modifiedCount = subs.length;
        break;
      }

      case 'resume': {
        const subs = await Subscription.find({
          _id:    { $in: subscriptionIds },
          status: SubscriptionStatus.PAUSED,
        });
        await Promise.all(
          subs.map(async (sub) => {
            const previousStatus =
              (sub.metadata.get('previous_status') as SubscriptionStatus) ??
              SubscriptionStatus.ACTIVE;
            sub.status = previousStatus;
            sub.metadata.set('resumed_at', new Date().toISOString());
            sub.metadata.set('resumed_by', loggedInUser.adminId);
            const logs: any[] = sub.metadata.get('admin_actions') ?? [];
            logs.push(auditEntry);
            sub.metadata.set('admin_actions', logs);
            await sub.save();
          })
        );
        modifiedCount = subs.length;
        break;
      }

      case 'extend': {
        const days = parseInt(actionData.days ?? '0');
        if (days <= 0) {
          return NextResponse.json(
            { error: 'days must be a positive integer' },
            { status: 400 }
          );
        }
        const extensionMs = days * 86_400_000;
        const subs        = await Subscription.find({ _id: { $in: subscriptionIds } });
        await Promise.all(
          subs.map(async (sub) => {
            sub.currentPeriodEnd = new Date(sub.currentPeriodEnd.getTime() + extensionMs);
            if (sub.trialEnd) {
              sub.trialEnd = new Date(sub.trialEnd.getTime() + extensionMs);
            }
            sub.metadata.set('extended_at',      new Date().toISOString());
            sub.metadata.set('extended_by',      loggedInUser.adminId);
            sub.metadata.set('extension_days',   days);
            sub.metadata.set('extension_reason', reason ?? '');
            const logs: any[] = sub.metadata.get('admin_actions') ?? [];
            logs.push(auditEntry);
            sub.metadata.set('admin_actions', logs);
            await sub.save();
          })
        );
        modifiedCount = subs.length;
        break;
      }

      case 'export': {
        const subscriptions = await Subscription.find({ _id: { $in: subscriptionIds } })
          .populate('userId', 'name email')
          .select('-paystackAuthorizationCode -paystackEmailToken -metadata')
          .lean();

        return NextResponse.json({
          success:      true,
          action,
          results:      { subscriptions, exportReady: true },
          affectedCount: subscriptions.length,
        });
      }
    }

    return NextResponse.json({
      success:      true,
      action,
      affectedCount: modifiedCount,
    });
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json({ error: 'Failed to perform bulk operation' }, { status: 500 });
  }
}