// lib/plan-limits.ts
// ─────────────────────────────────────────────────────────────────────────────
// Utilities for extracting structured limits from a plan document.
// Works on both backend (Mongoose lean docs) and frontend (API response).
//
// Usage (backend):
//   import { getPlanLimits } from '@/lib/plan-limits';
//   const limits = getPlanLimits(planDoc);
//   if (!limits.canCreateTicketType(currentCount)) { throw new Error(...) }
//
// Usage (frontend):
//   import { getPlanLimits } from '@/lib/plan-limits';
//   const limits = getPlanLimits(plan);
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanFeatureEntry {
  name: string;
  description?: string;
  included: boolean;
  limit?: number;
  unit?: string;
}

export interface PlanDoc {
  name?: string;
  isFree?: boolean;
  maxEvents?: number;
  maxAttendeesPerEvent?: number;
  maxTeamMembers?: number;
  storageGb?: number;
  features?: PlanFeatureEntry[];
}

export interface PlanLimits {
  // ── Top-level limits ──────────────────────────────────────────────────────
  maxEvents:            number | null; // null = unlimited
  maxAttendeesPerEvent: number | null;
  maxTeamMembers:       number | null;
  storageGb:            number | null;

  // ── Feature-derived limits ────────────────────────────────────────────────
  maxTicketTypes:    number | null;
  maxDiscountCodes:  number | null;

  // ── Feature flags (included = true/false) ─────────────────────────────────
  hasApiAccess:            boolean;
  hasWebhooks:             boolean;
  hasCustomAnalytics:      boolean;
  hasDedicatedManager:     boolean;
  hasDiscountCodes:        boolean;
  hasTicketTypes:          boolean;

  // ── Guard helpers ─────────────────────────────────────────────────────────
  canCreateEvent:         (currentCount: number) => boolean;
  canAddAttendee:         (currentCount: number) => boolean;
  canAddTeamMember:       (currentCount: number) => boolean;
  canCreateTicketType:    (currentCount: number) => boolean;
  canCreateDiscountCode:  (currentCount: number) => boolean;

  // ── Raw feature lookup ────────────────────────────────────────────────────
  getFeatureLimit: (featureName: string) => number | null;
  isFeatureIncluded: (featureName: string) => boolean;
}

// ── Feature name matchers (case-insensitive partial match) ────────────────────
const FEATURE_MATCHERS = {
  ticketTypes:        ['ticket type', 'ticket categories'],
  discountCodes:      ['discount code', 'coupon', 'promo code'],
  apiAccess:          ['api access', 'rest api'],
  webhooks:           ['webhook'],
  customAnalytics:    ['custom analytics'],
  dedicatedManager:   ['dedicated account manager', 'account manager'],
} as const;

function matchFeature(name: string, matchers: readonly string[]): boolean {
  const lower = name.toLowerCase();
  return matchers.some(m => lower.includes(m));
}

function findFeature(
  features: PlanFeatureEntry[],
  matchers: readonly string[],
): PlanFeatureEntry | undefined {
  return features.find(f => matchFeature(f.name, matchers));
}

// ── Main utility ──────────────────────────────────────────────────────────────
export function getPlanLimits(plan: PlanDoc): PlanLimits {
  const features: PlanFeatureEntry[] = Array.isArray(plan.features) ? plan.features : [];

  // ── Helper: get limit from feature by matcher ─────────────────────────────
  const getFeatureLimit = (featureName: string): number | null => {
    const feature = features.find(f =>
      f.name.toLowerCase().includes(featureName.toLowerCase())
    );
    if (!feature || !feature.included) return null;
    return feature.limit ?? null;
  };

  const isFeatureIncluded = (featureName: string): boolean => {
    const feature = features.find(f =>
      f.name.toLowerCase().includes(featureName.toLowerCase())
    );
    return feature?.included ?? false;
  };

  // ── Top-level limits (undefined = unlimited → null) ───────────────────────
  const maxEvents            = plan.maxEvents            ?? null;
  const maxAttendeesPerEvent = plan.maxAttendeesPerEvent ?? null;
  const maxTeamMembers       = plan.maxTeamMembers       ?? null;
  const storageGb            = plan.storageGb            ?? null;

  // ── Feature-derived limits ────────────────────────────────────────────────
  const ticketTypeFeature   = findFeature(features, FEATURE_MATCHERS.ticketTypes);
  const discountCodeFeature = findFeature(features, FEATURE_MATCHERS.discountCodes);

  const hasTicketTypes   = ticketTypeFeature?.included   ?? false;
  const hasDiscountCodes = discountCodeFeature?.included ?? false;

  const maxTicketTypes   = hasTicketTypes   ? (ticketTypeFeature?.limit   ?? null) : 0;
  const maxDiscountCodes = hasDiscountCodes ? (discountCodeFeature?.limit ?? null) : 0;

  // ── Feature flags ─────────────────────────────────────────────────────────
  const hasApiAccess        = findFeature(features, FEATURE_MATCHERS.apiAccess)?.included        ?? false;
  const hasWebhooks         = findFeature(features, FEATURE_MATCHERS.webhooks)?.included         ?? false;
  const hasCustomAnalytics  = findFeature(features, FEATURE_MATCHERS.customAnalytics)?.included  ?? false;
  const hasDedicatedManager = findFeature(features, FEATURE_MATCHERS.dedicatedManager)?.included ?? false;

  // ── Guard helpers ─────────────────────────────────────────────────────────
  // null limit = unlimited → always true
  const withinLimit = (limit: number | null, current: number): boolean =>
    limit === null || current < limit;

  return {
    maxEvents,
    maxAttendeesPerEvent,
    maxTeamMembers,
    storageGb,

    maxTicketTypes,
    maxDiscountCodes,

    hasApiAccess,
    hasWebhooks,
    hasCustomAnalytics,
    hasDedicatedManager,
    hasDiscountCodes,
    hasTicketTypes,

    canCreateEvent:        (n) => withinLimit(maxEvents, n),
    canAddAttendee:        (n) => withinLimit(maxAttendeesPerEvent, n),
    canAddTeamMember:      (n) => withinLimit(maxTeamMembers, n),
    canCreateTicketType:   (n) => hasTicketTypes && withinLimit(maxTicketTypes, n),
    canCreateDiscountCode: (n) => hasDiscountCodes && withinLimit(maxDiscountCodes, n),

    getFeatureLimit,
    isFeatureIncluded,
  };
}

// ── Convenience: get a human-readable limit string ────────────────────────────
export function formatLimit(limit: number | null, unit = ''): string {
  if (limit === null) return `Unlimited${unit ? ' ' + unit : ''}`;
  return `${limit}${unit ? ' ' + unit : ''}`;
}

// ── Convenience: get upgrade message ─────────────────────────────────────────
export function getLimitMessage(
  feature: string,
  limit: number | null,
  current: number,
): string {
  if (limit === null) return '';
  if (current >= limit) {
    return `You've reached the ${feature} limit (${limit}) on your current plan. Please upgrade to add more.`;
  }
  return `${current} of ${limit} ${feature} used.`;
}