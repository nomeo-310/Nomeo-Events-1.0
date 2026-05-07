// hooks/useSubscription.ts
// 'use client'
//
// Single hook for subscription state, mutations, and UI access guards.
// Merges useSubscription + useSubscriptionGuard into one import.
//
// Usage:
//   const {
//     subscription, isActive, subscribe, cancel, reactivate,
//     checkEventCreation, checkCapacity, checkFeature,
//     goToPricing, limits,
//   } = useSubscription();

'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export enum SubscriptionStatus {
  TRIALING  = 'trialing',
  ACTIVE    = 'active',
  PAST_DUE  = 'past_due',   // Payment failed but within grace period
  CANCELLED = 'cancelled',  // User cancelled; access until periodEnd
  EXPIRED   = 'expired',    // Period ended and not renewed
  PAUSED    = 'paused'      // Admin-paused (e.g. dispute)
}

export enum PlanInterval {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  BIANNUAL = 'biannual',
  ANNUAL = 'annual',
  LIFETIME = 'lifetime'
}

export enum PlanTier {
  FREE = 'free',
  STARTER = 'starter',
  BASIC = 'basic',
  PRO = 'pro',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise'
}

// ─── Subscription data type ───────────────────────────────────────────────────

export interface SubscriptionData {
  id: string;
  status: SubscriptionStatus;
  planTier: PlanTier;
  planName: string;
  planSlug: string;
  interval: PlanInterval;
  priceKobo: number;
  finalPriceKobo: number;
  currency: string;
  trialEnd?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  maxEvents?: number;
  maxAttendeesPerEvent?: number;
  maxTeamMembers?: number;
  storageGb?: number;
  isActive: boolean;
  isInTrial: boolean;
  daysUntilRenewal: number;
}

// ─── Guard types ──────────────────────────────────────────────────────────────

export interface CheckResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
}

// ─── Tier + feature config ────────────────────────────────────────────────────

const TIER_ORDER: Record<string, number> = {
  free: 0, starter: 1, basic: 2, pro: 3, business: 4, enterprise: 5,
};

const isTierAtLeast = (current: string, required: string) =>
  (TIER_ORDER[current] ?? 0) >= (TIER_ORDER[required] ?? 0);

const FEATURE_MIN_TIER: Record<string, string> = {
  custom_branding:           'basic',
  api_access:                'basic',
  checkout_customization:    'basic',
  webhooks:                  'pro',
  white_label:               'pro',
  dedicated_account_manager: 'business',
  custom_development:        'enterprise',
  sso_integration:           'enterprise',
};

// ─── Mutation input types ─────────────────────────────────────────────────────

interface CreateSubscriptionBody {
  planSlug: string;
  paystackReference: string;
  couponCode?: string;
}

interface CancelOptions {
  reason?: string;
  immediately?: boolean;
}

// ─── Query key ────────────────────────────────────────────────────────────────

export const SUBSCRIPTION_QUERY_KEY = ['subscription'] as const;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSubscription() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data, error, isLoading } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: async () => {
      const { data } = await axios.get<{ subscription: SubscriptionData | null }>(
        '/api/subscriptions'
      );
      return data.subscription;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const subscription = data ?? null;
  const isActive = subscription?.isActive ?? false;

  // ── Subscribe ──────────────────────────────────────────────────────────────
  const subscribeMutation = useMutation({
    mutationFn: async (body: CreateSubscriptionBody): Promise<SubscriptionData> => {
      const { data } = await axios.post<{ subscription: SubscriptionData }>(
        '/api/subscriptions',
        body
      );
      return data.subscription;
    },
    onSuccess: (newSubscription) => {
      queryClient.setQueryData(SUBSCRIPTION_QUERY_KEY, newSubscription);
    },
  });

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const cancelMutation = useMutation({
    mutationFn: async (opts: CancelOptions = {}): Promise<void> => {
      if (!subscription) throw new Error('No active subscription');
      await axios.patch(`/api/subscriptions/${subscription.id}`, {
        action: 'cancel',
        ...opts,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
    },
  });

  // ── Reactivate ─────────────────────────────────────────────────────────────
  const reactivateMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!subscription) throw new Error('No subscription to reactivate');
      await axios.patch(`/api/subscriptions/${subscription.id}`, {
        action: 'reactivate',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
    },
  });

  // ── Stable mutation callbacks ──────────────────────────────────────────────
  const subscribe = useCallback(
    (body: CreateSubscriptionBody) => subscribeMutation.mutateAsync(body),
    [subscribeMutation]
  );

  const cancel = useCallback(
    (opts?: CancelOptions) => cancelMutation.mutateAsync(opts ?? {}),
    [cancelMutation]
  );

  const reactivate = useCallback(
    () => reactivateMutation.mutateAsync(),
    [reactivateMutation]
  );

  // ── Guard: base check ──────────────────────────────────────────────────────
  // Returns a blocked CheckResult if subscription is missing/expired,
  // null if everything is fine. Used internally by all other checks.
  const baseCheck = useCallback((): CheckResult | null => {
    if (isLoading) return null;

    if (!subscription || !isActive) {
      return {
        allowed: false,
        reason: subscription ? 'Your subscription has expired. Renew to continue.' : 'You need an active subscription for this.',
        upgradeRequired: true,
      };
    }
    return null;
  }, [subscription, isActive, isLoading]);

  // ── Guard: event creation ──────────────────────────────────────────────────
  // Pass current active event count — returns whether another can be created.
  //
  //   const { allowed, reason } = checkEventCreation(myEventCount);
  //   <button disabled={!allowed} title={reason}>Create Event</button>
  const checkEventCreation = useCallback(
    (currentCount: number): CheckResult => {
      const base = baseCheck();
      if (base) return base;
      
      const max = subscription?.maxEvents;
      
      // If no max limit (enterprise/unlimited) or max is 0 (unlimited)
      if (!max || max === 0) {
        return { allowed: true };
      }
      
      // Check if at or over the limit
      if (currentCount >= max) {
        return {
          allowed: false,
          reason: `You've used ${currentCount}/${max} events on your plan. ${currentCount === max ? 'You cannot create more events.' : `You're ${currentCount - max} over your limit.`}`,
          upgradeRequired: true,
        };
      }
      
      return { allowed: true };
    },
    [baseCheck, subscription]
  );

  // ── Guard: attendee capacity ───────────────────────────────────────────────
  // Pass the requested capacity for an event being created or updated.
  //
  //   const { allowed, reason } = checkCapacity(500);
  const checkCapacity = useCallback(
    (requestedCapacity: number): CheckResult => {
      const base = baseCheck();
      if (base) return base;
      const max = subscription!.maxAttendeesPerEvent;
      if (max !== undefined && requestedCapacity > max) {
        return {
          allowed: false,
          reason: `Your plan supports up to ${max.toLocaleString()} attendees per event.`,
          upgradeRequired: true,
        };
      }
      return { allowed: true };
    },
    [baseCheck, subscription]
  );

  // ── Guard: feature / tier ──────────────────────────────────────────────────
  // Pass a feature key from FEATURE_MIN_TIER above.
  //
  //   const { allowed } = checkFeature('api_access');
  //   const { allowed } = checkFeature('webhooks');
  const checkFeature = useCallback(
    (feature: string): CheckResult => {
      const base = baseCheck();
      if (base) return base;
      const required = FEATURE_MIN_TIER[feature];
      if (required && !isTierAtLeast(subscription!.planTier, required)) {
        return {
          allowed: false,
          reason: `This feature requires the ${required} plan or higher.`,
          upgradeRequired: true,
        };
      }
      return { allowed: true };
    },
    [baseCheck, subscription]
  );

  // ── Top-level guard state (no args needed) ─────────────────────────────────
  const top = baseCheck();

  return {
    // ── State ────────────────────────────────────────────────────────────────
    subscription,
    isLoading,
    error,
    isActive,
    isTrialing: subscription?.isInTrial ?? false,
    isCancelPending: subscription?.cancelAtPeriodEnd ?? false,
    tier: subscription?.planTier ?? null,
    daysLeft: subscription?.daysUntilRenewal ?? 0,

    // ── Limits snapshot ───────────────────────────────────────────────────────
    limits: subscription
      ? {
          maxEvents: subscription.maxEvents,
          maxAttendeesPerEvent: subscription.maxAttendeesPerEvent,
          maxTeamMembers: subscription.maxTeamMembers,
          storageGb: subscription.storageGb,
        }
      : null,

    // ── Mutations ─────────────────────────────────────────────────────────────
    subscribe,
    cancel,
    reactivate,
    isSubscribing: subscribeMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isReactivating: reactivateMutation.isPending,

    // ── Guards ────────────────────────────────────────────────────────────────
    // Top-level: is the subscription itself valid?
    allowed: !top,
    reason: top?.reason,
    // Specific checks
    checkEventCreation,
    checkCapacity,
    checkFeature,

    // ── Helpers ───────────────────────────────────────────────────────────────
    goToPricing: () => router.push('/pricing'),
    refresh: () => queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY }),
  };
}

// ─── Invalidate from outside React ───────────────────────────────────────────
// Usage:
//   import { getQueryClient } from '@/lib/query-client';
//   invalidateSubscription(getQueryClient());

export function invalidateSubscription(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
}