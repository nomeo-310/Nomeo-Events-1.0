// lib/subscription/guard.ts
'use server';

import mongoose from 'mongoose';
import { Subscription, SubscriptionStatus } from '@/models/subscription';
import { connectDB } from '@/lib/mongoose';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubscriptionSnapshot {
  subscriptionId: string;
  planTier: string;
  isTrialing: boolean;
  maxEvents?: number;
  maxAttendeesPerEvent?: number;
  maxTeamMembers?: number;
  storageGb?: number;
}

interface GuardOk {
  ok: true;
  sub: SubscriptionSnapshot;
}

interface GuardBlocked {
  ok: false;
  error: {
    success: false;
    error: string;
    code: SubscriptionErrorCode;
    redirectTo: string;
  };
}

export type ActionGuardResult = GuardOk | GuardBlocked;

export type SubscriptionErrorCode =
  | 'SUBSCRIPTION_REQUIRED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'EVENT_LIMIT_REACHED'
  | 'ATTENDEE_LIMIT_EXCEEDED';

// ─── Options ──────────────────────────────────────────────────────────────────

export interface GuardOptions {
  requireFullyActive?: boolean;
  checkEventLimit?: () => Promise<number>;
  requestedCapacity?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isFreeTier(planTier: string): boolean {
  return planTier === 'free' || planTier === 'FREE';
}

function blocked(error: string, code: SubscriptionErrorCode): GuardBlocked {
  return {
    ok: false,
    error: { success: false, error, code, redirectTo: '/pricing' },
  };
}

// ─── Main guard function ──────────────────────────────────────────────────────

export async function guardSubscription(
  userId: string,
  opts: GuardOptions = {}
): Promise<ActionGuardResult> {
  const { requireFullyActive = false, checkEventLimit, requestedCapacity } = opts;

  await connectDB();

  const allowedStatuses = requireFullyActive
    ? [SubscriptionStatus.ACTIVE]
    : [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING];

  const sub = await Subscription.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    status: { $in: allowedStatuses },
    currentPeriodEnd: { $gte: new Date() },
  });

  if (!sub) {
    return blocked(
      requireFullyActive
        ? 'A paid subscription is required to perform this action.'
        : 'Your subscription has expired or is inactive. Please renew to continue.',
      'SUBSCRIPTION_REQUIRED'
    );
  }

  const snapshot: SubscriptionSnapshot = {
    subscriptionId: sub._id.toString(),
    planTier: sub.planTier,
    isTrialing: sub.isInTrial(),
    maxEvents: sub.maxEvents,
    maxAttendeesPerEvent: sub.maxAttendeesPerEvent,
    maxTeamMembers: sub.maxTeamMembers,
    storageGb: sub.storageGb,
  };

  if (checkEventLimit && sub.maxEvents !== undefined) {
    const currentCount = await checkEventLimit();
    if (currentCount >= sub.maxEvents) {
      return blocked(
        `You've reached the ${sub.maxEvents}-event limit on your plan. ${isFreeTier(sub.planTier) ? 'Upgrade to create more events.' : 'Please contact support.'}`,
        'EVENT_LIMIT_REACHED'
      );
    }
  }

  if (requestedCapacity !== undefined && sub.maxAttendeesPerEvent !== undefined) {
    if (requestedCapacity > sub.maxAttendeesPerEvent) {
      return blocked(
        `Your plan supports up to ${sub.maxAttendeesPerEvent.toLocaleString()} attendees per event. ${isFreeTier(sub.planTier) ? 'Upgrade to accommodate more attendees.' : 'Please contact support.'}`,
        'ATTENDEE_LIMIT_EXCEEDED'
      );
    }
  }

  return { ok: true, sub: snapshot };
}