// lib/plan-limit-guard.ts
// ─────────────────────────────────────────────────────────────────────────────
// Backend guard — call inside route handlers to enforce plan limits.
//
// Usage in a route handler:
//   import { checkPlanLimit } from '@/lib/plan-limit-guard';
//
//   const check = await checkPlanLimit(userId, 'ticketTypes', currentCount);
//   if (!check.allowed) {
//     return NextResponse.json({ success: false, error: check.message }, { status: 403 });
//   }
// ─────────────────────────────────────────────────────────────────────────────

import { connectDB } from '@/lib/mongoose';
import { getPlanLimits, PlanLimits } from '@/lib/plan-limits';

type LimitKey =
  | 'events'
  | 'attendees'
  | 'teamMembers'
  | 'ticketTypes'
  | 'discountCodes';

interface GuardResult {
  allowed:  boolean;
  message:  string;
  limits:   PlanLimits | null;
}

// ── Fetch the active plan for a user ─────────────────────────────────────────
// Adjust the import path to wherever your Subscription/Plan models live.
async function getActivePlanForUser(userId: string) {
  const { Subscription } = await import('@/models/subscription');
  const { Plan }         = await import('@/models/plan');

  await connectDB();

  const sub = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'trialing'] },
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!sub) return null;

  const plan = await Plan.findById((sub as any).planId).lean();
  return plan ?? null;
}

// ── Main guard ────────────────────────────────────────────────────────────────
export async function checkPlanLimit(
  userId: string,
  feature: LimitKey,
  currentCount: number,
): Promise<GuardResult> {
  const plan = await getActivePlanForUser(userId);

  if (!plan) {
    return {
      allowed: false,
      message: 'No active subscription found.',
      limits:  null,
    };
  }

  const limits = getPlanLimits(plan as any);

  const guardMap: Record<LimitKey, () => boolean> = {
    events:        () => limits.canCreateEvent(currentCount),
    attendees:     () => limits.canAddAttendee(currentCount),
    teamMembers:   () => limits.canAddTeamMember(currentCount),
    ticketTypes:   () => limits.canCreateTicketType(currentCount),
    discountCodes: () => limits.canCreateDiscountCode(currentCount),
  };

  const limitValueMap: Record<LimitKey, number | null> = {
    events:        limits.maxEvents,
    attendees:     limits.maxAttendeesPerEvent,
    teamMembers:   limits.maxTeamMembers,
    ticketTypes:   limits.maxTicketTypes,
    discountCodes: limits.maxDiscountCodes,
  };

  const featureLabelMap: Record<LimitKey, string> = {
    events:        'events',
    attendees:     'attendees per event',
    teamMembers:   'team members',
    ticketTypes:   'ticket types',
    discountCodes: 'discount codes',
  };

  const allowed = guardMap[feature]();
  const limit   = limitValueMap[feature];
  const label   = featureLabelMap[feature];

  return {
    allowed,
    limits,
    message: allowed
      ? ''
      : limit === 0
        ? `Your current plan does not include ${label}. Please upgrade to access this feature.`
        : `You've reached the ${label} limit (${limit}) on your current plan. Please upgrade to add more.`,
  };
}