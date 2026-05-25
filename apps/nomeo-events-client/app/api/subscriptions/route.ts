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

// ─── Serializer ───────────────────────────────────────────────────────────────
// Defined inline so this file is self-contained.
// Handles both Mongoose documents (with methods) and plain objects (from webhook).

function serializeSubscription(sub: any) {
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

  return {
    id: sub._id.toString(),
    status: sub.status,
    planTier: sub.planTier,
    planName: sub.planName,
    planSlug: sub.planSlug ?? '',
    interval: sub.interval,
    priceKobo: sub.priceKobo,
    finalPriceKobo: sub.finalPriceKobo,
    currency: sub.currency,
    trialEnd: sub.trialEnd
      ? new Date(sub.trialEnd).toISOString()
      : undefined,
    currentPeriodStart: new Date(sub.currentPeriodStart).toISOString(),
    currentPeriodEnd: new Date(sub.currentPeriodEnd).toISOString(),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    cancelledAt: sub.cancelledAt
      ? new Date(sub.cancelledAt).toISOString()
      : undefined,
    maxEvents: sub.maxEvents,
    maxAttendeesPerEvent: sub.maxAttendeesPerEvent,
    maxTeamMembers: sub.maxTeamMembers,
    storageGb: sub.storageGb,
    isActive,
    isInTrial,
    daysUntilRenewal,
  };
}

// ─── Period end calculator ────────────────────────────────────────────────────

function calcPeriodEnd(from: Date, interval: string): Date {
  const d = new Date(from);
  switch (interval) {
    case 'monthly':   d.setMonth(d.getMonth() + 1);        break;
    case 'quarterly': d.setMonth(d.getMonth() + 3);        break;
    case 'biannual':  d.setMonth(d.getMonth() + 6);        break;
    case 'annual':    d.setFullYear(d.getFullYear() + 1);  break;
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

    // findActiveByUser returns a full Mongoose document — methods are intact
    const subscription = await Subscription.findActiveByUser(loggedInUser.id);

    console.log('subscription found:', {
      found: !!subscription,
      status: subscription?.status,
      currentPeriodEnd: subscription?.currentPeriodEnd,
      now: new Date(),
      isExpired: subscription ? new Date() > subscription.currentPeriodEnd : null,
      isActiveMethod: subscription?.isActive?.(),
    });

    if (!subscription) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({ subscription: serializeSubscription(subscription) });
  } catch (err) {
    console.error('[GET /api/subscriptions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
// Called immediately after the Paystack modal fires onSuccess.
// Payment is already done — we record and activate the subscription here.

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

    // Calculate price with optional coupon
    const priceResult = plan.calculatePrice(plan.interval as PlanInterval, couponCode);

    // Redeem coupon now that payment succeeded
    if (couponCode && priceResult.couponApplied) {
      await plan.redeemCoupon(couponCode);
    }

    const now = new Date();
    const hasTrial = plan.trialDays > 0;
    const trialEnd = hasTrial
      ? new Date(now.getTime() + plan.trialDays * 86_400_000)
      : undefined;

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
      currentPeriodEnd: plan.isFree
        ? calcPeriodEnd(now, 'monthly')
        : calcPeriodEnd(now, plan.interval),
      cancelAtPeriodEnd: false,
      maxEvents: plan.maxEvents,
      maxAttendeesPerEvent: plan.maxAttendeesPerEvent,
      maxTeamMembers: plan.maxTeamMembers,
      storageGb: plan.storageGb,
      payments: [],
      metadata: new Map([['paystackReference', paystackReference]]),
    });

    // ─── Send notifications for new subscription ─────────────────────────────
    try {
      const SYSTEM_USER_ID = new mongoose.Types.ObjectId("000000000000000000000001");
      
      // 1. Notify the user who subscribed
      const userNotification = {
        senderId: SYSTEM_USER_ID,
        receiverId: new mongoose.Types.ObjectId(loggedInUser.id),
        title: hasTrial ? "Subscription Started - Trial Period" : "Subscription Activated",
        message: hasTrial 
          ? `Your ${plan.name} plan subscription has been started with a ${plan.trialDays}-day trial period. You will be billed after the trial ends.`
          : `Your ${plan.name} plan subscription has been successfully activated. You can now enjoy all the benefits of your selected plan.`,
        message_type: "info",
        sender_type: 'system',
        createdAt: now,
        updatedAt: now,
      };

      await Notification.create(userNotification);

      const adminUsers = await User.find({  role: { $in: ["admin", "super_admin"] }}).select('_id name email role');

      if (adminUsers.length > 0) {

        const adminMessage = `${loggedInUser.name || loggedInUser.email} has subscribed to the ${plan.name} plan. Review this subscription in the admin dashboard.`;

        const adminNotifications = adminUsers.map((admin) => ({
          senderId: new mongoose.Types.ObjectId(loggedInUser.id),
          receiverId: admin._id,
          title: "New Subscription Created",
          message: adminMessage,
          message_type: "info",
          sender_type: 'user',
          createdAt: now,
          updatedAt: now,
          isRead: false,
        }));

        await Notification.insertMany(adminNotifications);
        
        console.log(`[NOTIFICATIONS] Sent ${adminNotifications.length} admin notifications to users with roles: ${adminUsers.map(u => u.role).join(', ')}`);
      } else {
        console.log('[NOTIFICATIONS] No admin or super_admin users found to notify');
      }

    } catch (notifError) {
      // Don't fail the subscription if notifications fail
      console.error('[NOTIFICATION ERROR] Failed to send subscription notifications:', notifError);
    }

    // Re-fetch as a full document so instance methods work in serializer
    const full = await Subscription.findById(subscription._id);

    return NextResponse.json(
      { subscription: serializeSubscription(full!) },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/subscriptions]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}