// lib/subscription/guard.ts
//
// guardSubscription — drop this into any server action or API route handler
// to enforce subscription status before proceeding.
//
// Returns a typed ActionGuardResult. If blocked, return it directly to the client.
// If allowed, the `sub` field has the plan limits for further checks.
//
// ─── Usage in an existing event creation route/action ─────────────────────────
//
//   import { guardSubscription } from '@/lib/subscription/guard';
//
//   // Basic: just needs an active subscription
//   const guard = await guardSubscription(session.user.id);
//   if (!guard.ok) return guard.error;   // NextResponse or ActionResult error
//
//   // With event count limit check:
//   const guard = await guardSubscription(session.user.id, {
//     checkEventLimit: async () =>
//       Event.countDocuments({ organizerId: userId, status: { $nin: ['archived','cancelled'] } })
//   });
//   if (!guard.ok) return guard.error;
//
//   // With attendee capacity check:
//   const guard = await guardSubscription(session.user.id, {
//     requestedCapacity: input.capacity,
//   });
//   if (!guard.ok) return guard.error;
//
//   // Require fully active (blocks trialing — use for publish, not draft):
//   const guard = await guardSubscription(session.user.id, { requireFullyActive: true });
//   if (!guard.ok) return guard.error;
//
// ─── Usage in an event registration route ────────────────────────────────────
//
//   const guard = await guardSubscription(organizerId); // check the event owner's sub
//   if (!guard.ok) {
//     // Owner's subscription expired — registrations should be blocked
//     return NextResponse.json({ error: 'Event registrations are currently unavailable.' }, { status: 403 });
//   }

'use server';


import { Subscription, SubscriptionStatus } from '@/models/subscription';
import { PlanTier } from '@/models/plan';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubscriptionSnapshot {
  subscriptionId: string;
  planTier: PlanTier;
  isTrialing: boolean;
  maxEvents?: number;
  maxAttendeesPerEvent?: number;
  maxTeamMembers?: number;
  storageGb?: number;
}

/** Returned when the guard passes */
interface GuardOk {
  ok: true;
  sub: SubscriptionSnapshot;
}

/** Returned when the guard blocks — pass error directly to your caller */
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
  | 'UPGRADE_REQUIRED'
  | 'EVENT_LIMIT_REACHED'
  | 'ATTENDEE_LIMIT_EXCEEDED';

// ─── Options ──────────────────────────────────────────────────────────────────

export interface GuardOptions {
  /**
   * Block trialing users. Use for actions that require a paid subscription
   * (e.g. publishing an event). Drafting/creating can allow trial.
   * Default: false (trial is allowed)
   */
  requireFullyActive?: boolean;

  /**
   * Pass a function that returns the user's current active event count.
   * Guard will block if count >= plan's maxEvents.
   */
  checkEventLimit?: () => Promise<number>;

  /**
   * Requested attendee capacity for the event being created/updated.
   * Guard will block if this exceeds plan's maxAttendeesPerEvent.
   */
  requestedCapacity?: number;
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

  // ── No active subscription ─────────────────────────────────────────────────
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

  // ── Event count limit ──────────────────────────────────────────────────────
  if (checkEventLimit && sub.maxEvents !== undefined) {
    const currentCount = await checkEventLimit();
    if (currentCount >= sub.maxEvents) {
      return blocked(
        `You've reached the ${sub.maxEvents}-event limit on your plan. Upgrade to create more.`,
        'EVENT_LIMIT_REACHED'
      );
    }
  }

  // ── Attendee capacity limit ────────────────────────────────────────────────
  if (requestedCapacity !== undefined && sub.maxAttendeesPerEvent !== undefined) {
    if (requestedCapacity > sub.maxAttendeesPerEvent) {
      return blocked(
        `Your plan supports up to ${sub.maxAttendeesPerEvent.toLocaleString()} attendees per event.`,
        'ATTENDEE_LIMIT_EXCEEDED'
      );
    }
  }

  return { ok: true, sub: snapshot };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function blocked(error: string, code: SubscriptionErrorCode): GuardBlocked {
  return {
    ok: false,
    error: { success: false, error, code, redirectTo: '/pricing' },
  };
}