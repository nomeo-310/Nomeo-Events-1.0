// app/api/subscriptions/[id]/route.ts
// PATCH — cancel or reactivate a subscription

import { NextRequest, NextResponse } from 'next/server';
import { Subscription, SubscriptionStatus } from '@/models/subscription';
import { getCurrentUser } from '@/lib/session';
import { connectDB } from '@/lib/mongoose';

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
    trialEnd: sub.trialEnd ? new Date(sub.trialEnd).toISOString() : undefined,
    currentPeriodStart: new Date(sub.currentPeriodStart).toISOString(),
    currentPeriodEnd: new Date(sub.currentPeriodEnd).toISOString(),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    cancelledAt: sub.cancelledAt ? new Date(sub.cancelledAt).toISOString() : undefined,
    maxEvents: sub.maxEvents,
    maxAttendeesPerEvent: sub.maxAttendeesPerEvent,
    maxTeamMembers: sub.maxTeamMembers,
    storageGb: sub.storageGb,
    isActive,
    isInTrial,
    daysUntilRenewal,
  };
}

export async function PATCH( req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  
  const { id } = await params;
  try {
    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, reason, immediately = false } = body;

    await connectDB();

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Ownership check
    if (subscription.userId.toString() !== loggedInUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── Cancel ────────────────────────────────────────────────────────────────
    if (action === 'cancel') {
      if (
        subscription.status === SubscriptionStatus.CANCELLED ||
        subscription.status === SubscriptionStatus.EXPIRED
      ) {
        return NextResponse.json(
          { error: 'Subscription is already cancelled or expired.' },
          { status: 409 }
        );
      }

      const updated = await subscription.cancel(reason, immediately);
      return NextResponse.json({
        subscription: serializeSubscription(updated),
        message: immediately
          ? 'Subscription cancelled immediately.'
          : 'Subscription will cancel at the end of the current period.',
      });
    }

    // ── Reactivate ────────────────────────────────────────────────────────────
    if (action === 'reactivate') {
      if (!subscription.cancelAtPeriodEnd) {
        return NextResponse.json(
          { error: 'Subscription is not scheduled for cancellation.' },
          { status: 409 }
        );
      }
      if (new Date() > subscription.currentPeriodEnd) {
        return NextResponse.json(
          { error: 'Subscription has already expired. Please subscribe again.' },
          { status: 409 }
        );
      }

      subscription.cancelAtPeriodEnd = false;
      subscription.cancelledAt = undefined;
      subscription.cancellationReason = undefined;
      const updated = await subscription.save();

      return NextResponse.json({
        subscription: serializeSubscription(updated),
        message: 'Subscription reactivated.',
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[PATCH /api/subscriptions/:id]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}