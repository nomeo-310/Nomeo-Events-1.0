'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export enum SubscriptionStatus {
  TRIALING  = 'trialing',
  ACTIVE    = 'active',
  PAST_DUE  = 'past_due',
  CANCELLED = 'cancelled',
  EXPIRED   = 'expired',
  PAUSED    = 'paused',
}

export enum PlanInterval {
  MONTHLY   = 'monthly',
  QUARTERLY = 'quarterly',
  BIANNUAL  = 'biannual',
  ANNUAL    = 'annual',
  LIFETIME  = 'lifetime',
}

export enum PlanTier {
  FREE       = 'free',
  STARTER    = 'starter',
  BASIC      = 'basic',
  PRO        = 'pro',
  BUSINESS   = 'business',
  ENTERPRISE = 'enterprise',
}

// ─── Subscription data type ───────────────────────────────────────────────────
// Mirrors the top-level fields returned by GET /api/subscriptions.
// isActive, isInTrial, daysUntilRenewal, and cancelAtPeriodEnd MUST stay
// at the top level — the hook and layout read them as subscription?.isActive
// etc. directly. They also appear inside `flags` for convenience but the
// hook never reads from there.

export interface SubscriptionData {
  id:                   string;
  status:               SubscriptionStatus;
  planTier:             PlanTier;
  planName:             string;
  planSlug:             string;
  interval:             PlanInterval;
  priceKobo:            number;
  finalPriceKobo:       number;
  currency:             string;
  trialEnd?:            string;
  currentPeriodStart:   string;
  currentPeriodEnd:     string;

  // ── Top-level computed fields ─────────────────────────────────────────────
  // These are returned directly by the serializer — NOT nested under flags.
  isActive:             boolean;
  isInTrial:            boolean;
  daysUntilRenewal:     number;
  cancelAtPeriodEnd:    boolean;

  // Optional rich fields from the populated serializer
  cancelledAt?:         string;
  maxEvents?:           number;
  maxAttendeesPerEvent?:number;
  maxTeamMembers?:      number;
  storageGb?:           number;
}

// ─── Guard types ──────────────────────────────────────────────────────────────

export interface CheckResult {
  allowed:          boolean;
  reason?:          string;
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
  planSlug:           string;
  paystackReference:  string;
  couponCode?:        string;
}

interface CancelOptions {
  reason?:      string;
  immediately?: boolean;
}

// ─── Query key ────────────────────────────────────────────────────────────────

export const SUBSCRIPTION_QUERY_KEY = ['subscription'] as const;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSubscription() {
  const queryClient = useQueryClient();
  const router      = useRouter();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data, error, isLoading } = useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: async () => {
      const { data } = await axios.get<{ subscription: SubscriptionData | null }>(
        '/api/subscriptions'
      );
      return data.subscription;
    },
    staleTime:            30_000,
    refetchOnWindowFocus: false,
    refetchOnMount:       true, // always refetch when layout mounts after payment
  });

  const subscription = data ?? null;

  // Read isActive from the top-level field the serializer returns.
  // Do NOT fall back to flags.isActive — the hook never reaches into flags.
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
      // Set immediately so the layout reads isActive = true before the
      // redirect lands — prevents the subscription_expired lock flashing.
      queryClient.setQueryData(SUBSCRIPTION_QUERY_KEY, newSubscription);
      // Invalidate so the background refetch picks up the fully populated
      // shape (plan, payments, etc.) from GET /api/subscriptions.
      queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
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
  const baseCheck = useCallback((): CheckResult | null => {
    if (isLoading) return null;
    if (!subscription || !isActive) {
      return {
        allowed: false,
        reason: subscription
          ? 'Your subscription has expired. Renew to continue.'
          : 'You need an active subscription for this.',
        upgradeRequired: true,
      };
    }
    return null;
  }, [subscription, isActive, isLoading]);

  // ── Guard: event creation ──────────────────────────────────────────────────
  const checkEventCreation = useCallback(
    (currentCount: number): CheckResult => {
      const base = baseCheck();
      if (base) return base;
      const max = subscription?.maxEvents;
      if (!max || max === 0) return { allowed: true };
      if (currentCount >= max) {
        return {
          allowed: false,
          reason: `You've used ${currentCount}/${max} events on your plan.`,
          upgradeRequired: true,
        };
      }
      return { allowed: true };
    },
    [baseCheck, subscription]
  );

  // ── Guard: attendee capacity ───────────────────────────────────────────────
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

  const top = baseCheck();

  return {
    // ── State ────────────────────────────────────────────────────────────────
    subscription,
    isLoading,
    error,
    isActive,
    isTrialing:      subscription?.isInTrial       ?? false,
    isCancelPending: subscription?.cancelAtPeriodEnd ?? false,
    tier:            subscription?.planTier         ?? null,
    daysLeft:        subscription?.daysUntilRenewal ?? 0,

    // ── Limits ────────────────────────────────────────────────────────────────
    limits: subscription ? {
      maxEvents:            subscription.maxEvents,
      maxAttendeesPerEvent: subscription.maxAttendeesPerEvent,
      maxTeamMembers:       subscription.maxTeamMembers,
      storageGb:            subscription.storageGb,
    } : null,

    // ── Mutations ─────────────────────────────────────────────────────────────
    subscribe,
    cancel,
    reactivate,
    isSubscribing:  subscribeMutation.isPending,
    isCancelling:   cancelMutation.isPending,
    isReactivating: reactivateMutation.isPending,

    // ── Guards ────────────────────────────────────────────────────────────────
    allowed:            !top,
    reason:             top?.reason,
    checkEventCreation,
    checkCapacity,
    checkFeature,

    // ── Helpers ───────────────────────────────────────────────────────────────
    goToPricing: () => router.push('/pricing'),
    refresh: () => queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY }),
  };
}

// ─── Invalidate from outside React ───────────────────────────────────────────

export function invalidateSubscription(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
}