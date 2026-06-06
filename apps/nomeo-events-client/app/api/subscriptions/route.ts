// app/api/subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Subscription, SubscriptionStatus } from '@/models/subscription';
import { Plan } from '@/models/plan';
import { Payment } from '@/models/payment';
import { Notification } from '@/models/notification';
import { User } from '@/models/user';
import { connectDB } from '@/lib/mongoose';
import { getCurrentUser } from '@/lib/session';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    [SubscriptionStatus.TRIALING]: 'Free trial period - no payment required yet',
    [SubscriptionStatus.ACTIVE]:   'Active subscription - all features available',
    [SubscriptionStatus.PAST_DUE]: 'Payment failed - update payment method to continue',
    [SubscriptionStatus.CANCELLED]:'Cancelled - access until period end',
    [SubscriptionStatus.EXPIRED]:  'Expired - renew to continue using features',
    [SubscriptionStatus.PAUSED]:   'Paused by administrator - contact support',
  };
  return descriptions[status] || 'Unknown status';
}

function calcPeriodEnd(from: Date, interval: string): Date {
  const d = new Date(from);
  switch (interval) {
    case 'monthly':   d.setMonth(d.getMonth() + 1); break;
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'biannual':  d.setMonth(d.getMonth() + 6); break;
    case 'annual':    d.setFullYear(d.getFullYear() + 1); break;
    case 'lifetime':  d.setFullYear(d.getFullYear() + 100); break;
    default:          d.setMonth(d.getMonth() + 1);
  }
  return d;
}

// ─── Serializer ───────────────────────────────────────────────────────────────

async function serializeSubscription(sub: any) {
  const now = new Date();

  const isActive = typeof sub.isActive === 'function'
    ? sub.isActive()
    : (sub.status === SubscriptionStatus.ACTIVE || sub.status === SubscriptionStatus.TRIALING) &&
      now <= new Date(sub.currentPeriodEnd);

  const isInTrial = typeof sub.isInTrial === 'function'
    ? sub.isInTrial()
    : sub.status === SubscriptionStatus.TRIALING &&
      !!sub.trialEnd &&
      now <= new Date(sub.trialEnd);

  const daysUntilRenewal = Math.max(0, Math.ceil((new Date(sub.currentPeriodEnd).getTime() - now.getTime()) / 86_400_000));
  const isExpiringSoon = daysUntilRenewal <= 7 && daysUntilRenewal > 0;
  const isOverdue = new Date(sub.currentPeriodEnd) < now &&
    ![SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED].includes(sub.status);

  // Payment statistics
  const rawPayments: any[] = Array.isArray(sub.payments) ? sub.payments : [];
  let totalPaid = 0;
  let successfulPayments = 0;
  let failedPayments = 0;
  let lastPaymentDate: string | null = null;

  const paymentsDetails = rawPayments.map((payment: any) => {
    if (typeof payment === 'object' && payment !== null && payment._id) {
      const isSuccess = payment.gatewayStatus === 'success';
      const isFailed = payment.gatewayStatus === 'failed';

      if (isSuccess) {
        successfulPayments++;
        totalPaid += payment.amount || 0;
        if (!lastPaymentDate) {
          lastPaymentDate = payment.paidAt?.toISOString() ?? payment.createdAt?.toISOString() ?? null;
        }
      }
      if (isFailed) failedPayments++;

      return {
        id: payment._id.toString(),
        amount: payment.amount,
        amountFormatted: `${((payment.amount ?? 0) / 100).toFixed(2)} ${payment.currency || 'NGN'}`,
        currency: payment.currency,
        status: payment.status,
        gatewayStatus: payment.gatewayStatus,
        reference: payment.reference,
        paidAt: payment.paidAt?.toISOString() ?? null,
        createdAt: payment.createdAt?.toISOString() ?? null,
      };
    }
    return { id: payment?.toString?.() ?? String(payment) };
  });

  // Plan details
  let planDetails: Record<string, any> | null = null;
  if (sub.planId && typeof sub.planId === 'object' && sub.planId._id) {
    planDetails = {
      id: sub.planId._id.toString(),
      name: sub.planId.name,
      slug: sub.planId.slug,
      tier: sub.planId.tier,
      interval: sub.planId.interval,
      priceKobo: sub.planId.priceKobo,
      priceFormatted: `${((sub.planId.priceKobo ?? 0) / 100).toFixed(2)} ${sub.planId.currency || 'NGN'}`,
      currency: sub.planId.currency,
      trialDays: sub.planId.trialDays,
      maxEvents: sub.planId.maxEvents,
      maxAttendeesPerEvent: sub.planId.maxAttendeesPerEvent,
      maxTeamMembers: sub.planId.maxTeamMembers,
      storageGb: sub.planId.storageGb,
    };
  }

  // User details
  const userDetails = sub.userId && typeof sub.userId === 'object' && sub.userId._id
    ? {
        id: sub.userId._id.toString(),
        name: sub.userId.name,
        email: sub.userId.email,
      }
    : null;

  return {
    id: sub._id.toString(),
    status: sub.status,
    statusDescription: getStatusDescription(sub.status),

    // Plan snapshot
    planTier: sub.planTier,
    planName: sub.planName,
    interval: sub.interval,
    priceKobo: sub.priceKobo,
    priceFormatted: `${((sub.priceKobo ?? 0) / 100).toFixed(2)} ${sub.currency}`,
    finalPriceKobo: sub.finalPriceKobo,
    finalPriceFormatted: `${((sub.finalPriceKobo ?? 0) / 100).toFixed(2)} ${sub.currency}`,
    currency: sub.currency,

    // Discount
    coupon: sub.couponCode ? {
      code: sub.couponCode,
      discount: sub.couponDiscount,
      discountType: sub.couponDiscountType,
    } : null,

    // Trial
    trial: sub.trialStart ? {
      start: sub.trialStart?.toISOString(),
      end: sub.trialEnd?.toISOString() ?? null,
      daysRemaining: sub.trialEnd ? Math.max(0, Math.ceil((new Date(sub.trialEnd).getTime() - now.getTime()) / 86_400_000)) : 0,
      isActive: isInTrial,
    } : null,

    // Billing period
    currentPeriod: {
      start: new Date(sub.currentPeriodStart).toISOString(),
      end: new Date(sub.currentPeriodEnd).toISOString(),
      daysRemaining: daysUntilRenewal,
      isExpiringSoon,
      isOverdue,
    },

    // Cancellation
    cancellation: sub.cancelledAt ? {
      at: sub.cancelledAt?.toISOString(),
      reason: sub.cancellationReason,
      endsAtPeriodEnd: sub.cancelAtPeriodEnd,
    } : null,

    // Limits
    limits: {
      maxEvents: sub.maxEvents,
      maxAttendeesPerEvent: sub.maxAttendeesPerEvent,
      maxTeamMembers: sub.maxTeamMembers,
      storageGb: sub.storageGb,
    },

    // Payments
    paymentStats: {
      totalPaid,
      totalCount: rawPayments.length,
      lastPaymentDate,
      successfulPayments,
      failedPayments,
    },
    payments: paymentsDetails,

    // Computed flags
    isActive,
    isInTrial,
    daysUntilRenewal,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    flags: {
      isActive,
      isInTrial,
      isExpiringSoon,
      isOverdue,
      isCancelled: sub.status === SubscriptionStatus.CANCELLED,
      isExpired: sub.status === SubscriptionStatus.EXPIRED,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    },

    // Populated relations
    plan: planDetails,
    user: userDetails,

    // Metadata
    metadata: sub.metadata instanceof Map ? Object.fromEntries(sub.metadata) : sub.metadata,

    // Timestamps
    createdAt: sub.createdAt?.toISOString() ?? null,
    updatedAt: sub.updatedAt?.toISOString() ?? null,
  };
}

// ─── GET /api/subscriptions ───────────────────────────────────────────────────

export async function GET() {
  try {
    const loggedInUser = await getCurrentUser();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const subscription = await Subscription.findActiveByUser(loggedInUser.id);
    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    await subscription.populate('planId');
    await subscription.populate('payments');

    return NextResponse.json({ subscription: await serializeSubscription(subscription) });
  } catch (err) {
    console.error('[GET /api/subscriptions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/subscriptions ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const loggedInUser = await getCurrentUser();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { planSlug, paystackReference, couponCode } = body;

    if (!planSlug || !paystackReference) {
      return NextResponse.json(
        { error: 'planSlug and paystackReference are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check existing subscription
    const existing = await Subscription.findActiveByUser(loggedInUser.id);
    if (existing) {
      return NextResponse.json(
        { error: 'You already have an active subscription.', code: 'ALREADY_SUBSCRIBED' },
        { status: 409 }
      );
    }

    // Find plan
    const plan = await Plan.findOne({ slug: planSlug, isActive: true });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Verify payment
    const payment = await Payment.findOne({ reference: paystackReference });
    if (!payment || payment.gatewayStatus !== 'success') {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 400 });
    }

    // Calculate price with coupon
    const priceResult = plan.calculatePrice(plan.interval, couponCode);

    // Redeem coupon if applied
    if (couponCode && priceResult.couponApplied) {
      await plan.redeemCoupon(couponCode);
    }

    const now = new Date();
    const hasTrial = plan.trialDays > 0;
    const trialEnd = hasTrial ? new Date(now.getTime() + plan.trialDays * 86_400_000) : undefined;

    // Create subscription
    const subscription = await Subscription.create({
      userId: new mongoose.Types.ObjectId(loggedInUser.id),
      planId: plan._id,
      status: hasTrial ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
      planTier: plan.tier,
      planName: plan.name,
      interval: plan.interval,
      priceKobo: plan.priceKobo,
      currency: plan.currency,
      couponCode: priceResult.couponApplied?.code,
      couponDiscount: priceResult.couponApplied?.discountValue,
      couponDiscountType: priceResult.couponApplied?.discountType,
      discountKobo: priceResult.discountKobo,
      finalPriceKobo: priceResult.finalKobo,
      trialStart: hasTrial ? now : undefined,
      trialEnd,
      currentPeriodStart: now,
      currentPeriodEnd: plan.isFree ? calcPeriodEnd(now, 'monthly') : calcPeriodEnd(now, plan.interval),
      cancelAtPeriodEnd: false,
      maxEvents: plan.maxEvents,
      maxAttendeesPerEvent: plan.maxAttendeesPerEvent,
      maxTeamMembers: plan.maxTeamMembers,
      storageGb: plan.storageGb,
      payments: [payment._id],
      metadata: new Map([['paystackReference', paystackReference]]),
    });

    // Link payment to subscription
    await Payment.findByIdAndUpdate(payment._id, { subscriptionId: subscription._id });

    // Send notifications
    const SYSTEM_USER_ID = new mongoose.Types.ObjectId('000000000000000000000001');

    await Notification.create({
      senderId: SYSTEM_USER_ID,
      receiverId: new mongoose.Types.ObjectId(loggedInUser.id),
      title: hasTrial ? 'Subscription Started - Trial Period' : 'Subscription Activated',
      message: hasTrial
        ? `Your ${plan.name} plan has started with a ${plan.trialDays}-day free trial.`
        : `Your ${plan.name} plan is now active. Enjoy all the features.`,
      message_type: 'info',
      sender_type: 'system',
      createdAt: now,
    });

    // Notify admins
    const adminUsers = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('_id');
    if (adminUsers.length > 0) {
      await Notification.insertMany(
        adminUsers.map((admin) => ({
          senderId: new mongoose.Types.ObjectId(loggedInUser.id),
          receiverId: admin._id,
          title: 'New Subscription Created',
          message: `${loggedInUser.name || loggedInUser.email} subscribed to the ${plan.name} plan.`,
          message_type: 'info',
          sender_type: 'user',
          isRead: false,
          createdAt: now,
        }))
      );
    }

    // Return subscription
    const full = await Subscription.findById(subscription._id)
      .populate('planId')
      .populate('payments');

    return NextResponse.json(
      { subscription: await serializeSubscription(full!) },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/subscriptions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}