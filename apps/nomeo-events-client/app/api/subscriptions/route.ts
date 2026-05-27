// app/api/subscriptions/route.ts
// GET  — fetch current user's active subscription
// POST — activate subscription after Paystack modal succeeds

import { NextRequest, NextResponse } from 'next/server';
import { Subscription, SubscriptionStatus } from '@/models/subscription';
import { Plan, PlanInterval } from '@/models/plan';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';
import { getCurrentUser } from '@/lib/session';
import { Notification } from '@/models/notification';
import { User } from '@/models/user';
import { Payment } from '@/models/payment';

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

// ─── Serializer ───────────────────────────────────────────────────────────────
// Expects planId and payments to already be populated before calling.

async function serializeSubscription(sub: any) {
  const now = new Date();

  const isActive = typeof sub.isActive === 'function'
    ? sub.isActive()
    : (
        (sub.status === SubscriptionStatus.ACTIVE || sub.status === SubscriptionStatus.TRIALING) &&
        now <= new Date(sub.currentPeriodEnd)
      );

  const isInTrial = typeof sub.isInTrial === 'function'
    ? sub.isInTrial()
    : (
        sub.status === SubscriptionStatus.TRIALING &&
        !!sub.trialEnd &&
        now <= new Date(sub.trialEnd)
      );

  const daysUntilRenewal = Math.max(
    0,
    Math.ceil((new Date(sub.currentPeriodEnd).getTime() - now.getTime()) / 86_400_000)
  );

  const isExpiringSoon = daysUntilRenewal <= 7 && daysUntilRenewal > 0;
  const isOverdue =
    new Date(sub.currentPeriodEnd) < now &&
    ![SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED].includes(sub.status);

  // ── Payment statistics ────────────────────────────────────────────────────
  // sub.payments is populated — each element is a full Payment document.
  const rawPayments: any[] = Array.isArray(sub.payments) ? sub.payments : [];

  const paymentStats = {
    totalPaid:           0,
    totalCount:          rawPayments.length,
    lastPaymentDate:     null as string | null,
    nextPaymentDate:     null as string | null,
    failedPayments:      0,
    successfulPayments:  0,
  };

  const paymentsDetails = rawPayments.map((payment: any) => {
    // Populated document
    if (typeof payment === 'object' && payment !== null && payment._id) {
      const isSuccess = payment.gatewayStatus === 'success';
      const isFailed  = payment.gatewayStatus === 'failed';

      if (isSuccess) {
        paymentStats.successfulPayments++;
        paymentStats.totalPaid += payment.amount || 0;
        if (!paymentStats.lastPaymentDate) {
          paymentStats.lastPaymentDate = payment.paidAt?.toISOString() ?? payment.createdAt?.toISOString() ?? null;
        }
      }
      if (isFailed) paymentStats.failedPayments++;

      return {
        id:              payment._id.toString(),
        planId:         payment.planId?.toString() ?? null,
        subscriptionId: payment.subscriptionId?.toString() ?? null,
        amount:          payment.amount,
        amountFormatted: `${((payment.amount ?? 0) / 100).toFixed(2)} ${payment.currency || 'NGN'}`,
        currency:        payment.currency,
        status:          payment.status,
        gatewayStatus:   payment.gatewayStatus,
        reference:       payment.reference,
        gateway:         payment.gateway,
        paymentMethod:   payment.paymentMethod,
        gatewayResponse: payment.gatewayResponse,
        paidAt:          payment.paidAt?.toISOString() ?? null,
        metadata:        payment.metadata instanceof Map
          ? Object.fromEntries(payment.metadata)
          : payment.metadata,
        createdAt: payment.createdAt?.toISOString() ?? null,
        updatedAt: payment.updatedAt?.toISOString() ?? null,
      };
    }

    // Unpopulated fallback — shouldn't happen but safe to handle
    return { id: payment?.toString?.() ?? String(payment) };
  });

  if (!sub.cancelAtPeriodEnd && sub.status === SubscriptionStatus.ACTIVE) {
    paymentStats.nextPaymentDate = new Date(sub.currentPeriodEnd).toISOString();
  }

  // ── Plan details ──────────────────────────────────────────────────────────
  // sub.planId is populated — it is a full Plan document.
  let planDetails: Record<string, any> | null = null;

  if (sub.planId) {
    if (typeof sub.planId === 'object' && sub.planId !== null && sub.planId._id) {
      planDetails = {
        id:                  sub.planId._id.toString(),
        name:                sub.planId.name,
        slug:                sub.planId.slug,
        tier:                sub.planId.tier,
        interval:            sub.planId.interval,
        priceKobo:           sub.planId.priceKobo,
        priceFormatted:      `${((sub.planId.priceKobo ?? 0) / 100).toFixed(2)} ${sub.planId.currency || 'NGN'}`,
        currency:            sub.planId.currency,
        description:         sub.planId.description,
        features:            sub.planId.features,
        trialDays:           sub.planId.trialDays,
        maxEvents:           sub.planId.maxEvents,
        maxAttendeesPerEvent:sub.planId.maxAttendeesPerEvent,
        maxTeamMembers:      sub.planId.maxTeamMembers,
        storageGb:           sub.planId.storageGb,
        isActive:            sub.planId.isActive,
        metadata:            sub.planId.metadata instanceof Map
          ? Object.fromEntries(sub.planId.metadata)
          : sub.planId.metadata,
      };
    } else {
      // ObjectId only — populate was skipped somehow
      planDetails = { id: sub.planId.toString() };
    }
  }

  // ── User details ──────────────────────────────────────────────────────────
  const userDetails = sub.userId && typeof sub.userId === 'object' && sub.userId._id
    ? {
        id:       sub.userId._id.toString(),
        name:     sub.userId.name,
        email:    sub.userId.email,
        username: sub.userId.username,
      }
    : sub.userId
      ? { id: sub.userId.toString() }
      : null;

  return {
    // ── Identity ─────────────────────────────────────────────────────────────
    id:     sub._id.toString(),
    status: sub.status,
    statusDescription: getStatusDescription(sub.status),

    // ── Plan snapshot (denormalised at subscription time) ────────────────────
    planTier:           sub.planTier,
    planName:           sub.planName,
    planSlug:           sub.planSlug ?? '',
    interval:           sub.interval,
    priceKobo:          sub.priceKobo,
    priceFormatted:     `${((sub.priceKobo ?? 0) / 100).toFixed(2)} ${sub.currency}`,
    finalPriceKobo:     sub.finalPriceKobo,
    finalPriceFormatted:`${((sub.finalPriceKobo ?? 0) / 100).toFixed(2)} ${sub.currency}`,
    currency:           sub.currency,

    // ── Discount ─────────────────────────────────────────────────────────────
    coupon: sub.couponCode ? {
      code:         sub.couponCode,
      discount:     sub.couponDiscount,
      discountType: sub.couponDiscountType,
      discountKobo: sub.discountKobo,
    } : null,

    // ── Trial ─────────────────────────────────────────────────────────────────
    trial: sub.trialStart ? {
      start:         sub.trialStart?.toISOString(),
      end:           sub.trialEnd?.toISOString() ?? null,
      daysRemaining: sub.trialEnd
        ? Math.max(0, Math.ceil((new Date(sub.trialEnd).getTime() - now.getTime()) / 86_400_000))
        : 0,
      isActive: isInTrial,
    } : null,

    // ── Billing period ────────────────────────────────────────────────────────
    currentPeriod: {
      start:         new Date(sub.currentPeriodStart).toISOString(),
      end:           new Date(sub.currentPeriodEnd).toISOString(),
      daysRemaining: daysUntilRenewal,
      isExpiringSoon,
      isOverdue,
    },

    // ── Cancellation ─────────────────────────────────────────────────────────
    cancellation: sub.cancelledAt ? {
      at:              sub.cancelledAt?.toISOString(),
      reason:          sub.cancellationReason,
      endsAtPeriodEnd: sub.cancelAtPeriodEnd,
      effectiveEndDate: sub.cancelAtPeriodEnd
        ? new Date(sub.currentPeriodEnd).toISOString()
        : sub.cancelledAt?.toISOString(),
    } : null,

    // ── Limits ────────────────────────────────────────────────────────────────
    limits: {
      maxEvents:            sub.maxEvents,
      maxAttendeesPerEvent: sub.maxAttendeesPerEvent,
      maxTeamMembers:       sub.maxTeamMembers,
      storageGb:            sub.storageGb,
    },

    // ── Paystack tokens ───────────────────────────────────────────────────────
    paystack: {
      subscriptionCode:  sub.paystackSubscriptionCode  ?? null,
      emailToken:        sub.paystackEmailToken        ?? null,
      authorizationCode: sub.paystackAuthorizationCode ?? null,
    },

    // ── Payments ──────────────────────────────────────────────────────────────
    paymentStats,
    payments: paymentsDetails,

    // ── Top-level computed fields (hook reads these directly) ─────────────────
    // Keep these at the top level — useSubscription reads subscription?.isActive,
    // subscription?.isInTrial, subscription?.daysUntilRenewal, and
    // subscription?.cancelAtPeriodEnd directly. Moving them only into flags
    // breaks the hook and causes the dashboard layout to always lock.
    isActive,
    isInTrial,
    daysUntilRenewal,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,

    // ── Computed flags (grouped copy for convenience) ─────────────────────────
    flags: {
      isActive,
      isInTrial,
      isExpiringSoon,
      isOverdue,
      isCancelled:      sub.status === SubscriptionStatus.CANCELLED,
      isExpired:        sub.status === SubscriptionStatus.EXPIRED,
      isPaused:         sub.status === SubscriptionStatus.PAUSED,
      cancelAtPeriodEnd:sub.cancelAtPeriodEnd,
    },

    // ── Populated relations ───────────────────────────────────────────────────
    plan: planDetails,
    user: userDetails,

    // ── Metadata ──────────────────────────────────────────────────────────────
    metadata: sub.metadata instanceof Map
      ? Object.fromEntries(sub.metadata)
      : sub.metadata,

    // ── Timestamps ────────────────────────────────────────────────────────────
    createdAt: sub.createdAt?.toISOString() ?? null,
    updatedAt: sub.updatedAt?.toISOString() ?? null,
  };
}

// ─── Period end calculator ────────────────────────────────────────────────────

function calcPeriodEnd(from: Date, interval: string): Date {
  const d = new Date(from);
  switch (interval) {
    case 'monthly':   d.setMonth(d.getMonth() + 1);         break;
    case 'quarterly': d.setMonth(d.getMonth() + 3);         break;
    case 'biannual':  d.setMonth(d.getMonth() + 6);         break;
    case 'annual':    d.setFullYear(d.getFullYear() + 1);   break;
    case 'lifetime':  d.setFullYear(d.getFullYear() + 100); break;
    default:          d.setMonth(d.getMonth() + 1);
  }
  return d;
}

// ─── GET ──────────────────────────────────────────────────────────────────────

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

    // Populate so the serializer receives full documents, not bare ObjectIds.
    // Without this, planDetails falls back to { id: '...' } and the frontend
    // sees no plan data.
    await subscription.populate('planId');
    await subscription.populate('payments');

    return NextResponse.json({ subscription: await serializeSubscription(subscription) });
  } catch (err) {
    console.error('[GET /api/subscriptions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
// Called after Paystack modal fires onSuccess and verify returns 'success'.
// The payment record already exists — we create + activate the subscription here.

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

    // Block if already subscribed
    const existing = await Subscription.findActiveByUser(loggedInUser.id);
    if (existing) {
      return NextResponse.json(
        { error: 'You already have an active subscription.', code: 'ALREADY_SUBSCRIBED' },
        { status: 409 }
      );
    }

    const plan = await Plan.findOne({ slug: planSlug, isActive: true });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Verify payment exists and is confirmed before writing anything to DB.
    // This prevents someone from calling this endpoint directly without paying.
    const payment = await Payment.findOne({ reference: paystackReference });
    if (!payment || payment.gatewayStatus !== 'success') {
      return NextResponse.json({ error: 'Payment not verified' }, { status: 400 });
    }

    // Calculate price with optional coupon
    const priceResult = plan.calculatePrice(plan.interval as PlanInterval, couponCode);

    // Redeem coupon now that payment is confirmed
    if (couponCode && priceResult.couponApplied) {
      await plan.redeemCoupon(couponCode);
    }

    const now      = new Date();
    const hasTrial = plan.trialDays > 0;
    const trialEnd = hasTrial
      ? new Date(now.getTime() + plan.trialDays * 86_400_000)
      : undefined;

    // Create subscription with the payment _id already in the payments array
    const subscription = await Subscription.create({
      userId:               new mongoose.Types.ObjectId(loggedInUser.id),
      planId:               plan._id,
      status:               hasTrial ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
      planTier:             plan.tier,
      planName:             plan.name,
      interval:             plan.interval,
      priceKobo:            plan.priceKobo,
      currency:             plan.currency,
      couponCode:           priceResult.couponApplied?.code,
      couponDiscount:       priceResult.couponApplied?.discountValue,
      couponDiscountType:   priceResult.couponApplied?.discountType,
      discountKobo:         priceResult.discountKobo,
      finalPriceKobo:       priceResult.finalKobo,
      trialStart:           hasTrial ? now : undefined,
      trialEnd,
      currentPeriodStart:   now,
      currentPeriodEnd:     plan.isFree
        ? calcPeriodEnd(now, 'monthly')
        : calcPeriodEnd(now, plan.interval),
      cancelAtPeriodEnd:    false,
      maxEvents:            plan.maxEvents,
      maxAttendeesPerEvent: plan.maxAttendeesPerEvent,
      maxTeamMembers:       plan.maxTeamMembers,
      storageGb:            plan.storageGb,
      payments:             [payment._id],   // ← linked on creation
      metadata:             new Map([['paystackReference', paystackReference]]),
    });

    // Back-link the subscription onto the payment record
    await Payment.findByIdAndUpdate(payment._id, { subscriptionId: subscription._id });

    // ── Notifications ─────────────────────────────────────────────────────────
    try {
      const SYSTEM_USER_ID = new mongoose.Types.ObjectId('000000000000000000000001');

      await Notification.create({
        senderId:     SYSTEM_USER_ID,
        receiverId:   new mongoose.Types.ObjectId(loggedInUser.id),
        title:        hasTrial ? 'Subscription Started - Trial Period' : 'Subscription Activated',
        message:      hasTrial
          ? `Your ${plan.name} plan has started with a ${plan.trialDays}-day free trial. You will be billed after the trial ends.`
          : `Your ${plan.name} plan is now active. Enjoy all the features of your plan.`,
        message_type: 'info',
        sender_type:  'system',
        createdAt:    now,
        updatedAt:    now,
      });

      const adminUsers = await User.find({
        role: { $in: ['admin', 'super_admin'] },
      }).select('_id name email role');

      if (adminUsers.length > 0) {
        await Notification.insertMany(
          adminUsers.map((admin) => ({
            senderId:     new mongoose.Types.ObjectId(loggedInUser.id),
            receiverId:   admin._id,
            title:        'New Subscription Created',
            message:      `${loggedInUser.name || loggedInUser.email} subscribed to the ${plan.name} plan.`,
            message_type: 'info',
            sender_type:  'user',
            isRead:       false,
            createdAt:    now,
            updatedAt:    now,
          }))
        );
      }
    } catch (notifError) {
      // Notifications are non-critical — don't fail the subscription
      console.error('[NOTIFICATION ERROR]', notifError);
    }

    // Re-fetch with populations so the serializer gets full documents
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