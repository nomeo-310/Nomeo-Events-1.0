// hooks/use-plans.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useState, useCallback } from 'react';

// ============================================================================
// Types - Updated for Dynamic System
// ============================================================================

// ✅ Changed from enums to strings (dynamic)
export type PlanTier = string;
export type PlanInterval = string;

export interface PlanFeature {
  name: string;
  description?: string;
  included: boolean;
  limit?: number;
  unit?: string;
}

// ✅ NEW: Tier and Interval types from API
export interface AvailableTier {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AvailableInterval {
  _id: string;
  name: string;
  slug: string;
  monthsCount: number;
  multiplier: number;
  sortOrder: number;
  isActive: boolean;
}

export interface IntervalPricing {
  interval: string;
  priceKobo: number;
  priceDisplay: string;
  pricePerMonthKobo: number;
  pricePerMonthDisplay: string;
  savings: {
    amount: number;
    percent: number;
    text: string;
    detailedText: string;
  } | null;
  badge: string | null;
  isBestValue: boolean;
  isPopular: boolean;
  trialDays: number;
  paystackPlanCode?: string;
  isAvailable: boolean;
  sortOrder: number;
}

export interface TierPricing {
  tier: string;
  name: string;
  slug: string;
  description: string;
  tagline: string;
  sortOrder: number;
  isActive: boolean;
  isPopular: boolean;
  features: PlanFeature[];
  limits: {
    maxEvents?: number;
    maxAttendeesPerEvent?: number;
    maxTeamMembers?: number;
    storageGb?: number;
  };
  intervals: IntervalPricing[];
  ctaText: string;
  metadata: Record<string, any>;
}

export interface SupportedInterval {
  value: string;
  label: string;
  discount: string | null;
  isPopular?: boolean;
  sortOrder: number;
}

export interface PricingResponse {
  tiers: TierPricing[];
  defaultInterval: string;
  supportedIntervals: SupportedInterval[];
}

export interface PlanDocument {
  _id: string;
  name: string;
  slug: string;
  tier: string;
  description?: string;
  isActive: boolean;
  isPublic: boolean;
  priceKobo: number;
  currency: string;
  interval: string;
  paystackPlanCode?: string;
  isFree: boolean;
  trialDays: number;
  maxEvents?: number;
  maxAttendeesPerEvent?: number;
  maxTeamMembers?: number;
  storageGb?: number;
  features: PlanFeature[];
  discounts: any[];
  coupons: any[];
  sortOrder: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PlansListResponse {
  plans: PlanDocument[];
  total: number;
  filters: {
    tiers?: string[];
    intervals?: string[];
    isActive?: boolean;
  };
}

// ============================================================================
// Query Keys
// ============================================================================

const queryKeys = {
  pricing: ['pricing'] as const,
  plans: ['plans'] as const,
  plan: (slug: string) => ['plan', slug] as const,
  plansByTier: (tier: string) => ['plans', 'tier', tier] as const,
  availableTiers: ['available-tiers'] as const,
  availableIntervals: ['available-intervals'] as const,
};

// ============================================================================
// NEW: Hooks for fetching available tiers and intervals from database
// ============================================================================

/**
 * Hook: Get available tiers from database (for dynamic filters)
 */
export const useAvailableTiers = () => {
  return useQuery({
    queryKey: queryKeys.availableTiers,
    queryFn: async () => {
      const response = await axios.get('/api/plans/tiers');
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch tiers');
      }
      return response.data.data as AvailableTier[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook: Get available intervals from database (for dynamic filters)
 */
export const useAvailableIntervals = () => {
  return useQuery({
    queryKey: queryKeys.availableIntervals,
    queryFn: async () => {
      const response = await axios.get('/api/plans/intervals');
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch intervals');
      }
      return response.data.data as AvailableInterval[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================================================
// Hook: usePricing
// ============================================================================

interface UsePricingReturn {
  data: PricingResponse | null;
  tiers: TierPricing[];
  supportedIntervals: SupportedInterval[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  selectedInterval: string;
  setSelectedInterval: (interval: string) => void;
  getPricingForTier: (tier: TierPricing) => IntervalPricing | undefined;
  getPricingForTierAndInterval: (tier: string, interval: string) => IntervalPricing | undefined;
  getIntervalLabel: (interval: string) => string;
  getBestValueInterval: (tier: TierPricing) => IntervalPricing | undefined;
  refetch: () => void;
}

export function usePricing(initialInterval = "monthly"): UsePricingReturn {
  const [selectedInterval, setSelectedInterval] = useState(initialInterval);
  
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.pricing,
    queryFn: async () => {
      const response = await axios.get('/api/plans/pricing');
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch pricing');
      }
      return response.data.data as PricingResponse;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const getPricingForTier = useCallback((tier: TierPricing) => {
    return tier.intervals.find(i => i.interval === selectedInterval);
  }, [selectedInterval]);

  const getPricingForTierAndInterval = useCallback((tier: string, interval: string) => {
    if (!data) return undefined;
    const tierData = data.tiers.find(t => t.tier === tier || t.name.toLowerCase() === tier.toLowerCase());
    return tierData?.intervals.find(i => i.interval === interval);
  }, [data]);

  // ✅ Updated: Dynamic interval label lookup
  const getIntervalLabel = useCallback((interval: string) => {
    // Return the interval name capitalized (or you could fetch from API)
    return interval.charAt(0).toUpperCase() + interval.slice(1);
  }, []);

  const getBestValueInterval = useCallback((tier: TierPricing) => {
    return tier.intervals.find(i => i.isBestValue) || tier.intervals.find(i => i.isPopular);
  }, []);

  return {
    data: data || null,
    tiers: data?.tiers || [],
    supportedIntervals: data?.supportedIntervals || [],
    isLoading,
    isError,
    error: error as Error | null,
    selectedInterval,
    setSelectedInterval,
    getPricingForTier,
    getPricingForTierAndInterval,
    getIntervalLabel,
    getBestValueInterval,
    refetch,
  };
}

// ============================================================================
// Hook: usePlans
// ============================================================================

interface UsePlansOptions {
  tiers?: string[];  // ✅ Changed from PlanTier[] to string[]
  intervals?: string[];  // ✅ Changed from PlanInterval[] to string[]
  isActive?: boolean;
  isPublic?: boolean;
}

interface UsePlansReturn {
  plans: PlanDocument[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePlans(options: UsePlansOptions = {}): UsePlansReturn {
  const queryParams = new URLSearchParams();
  
  if (options.tiers?.length) {
    queryParams.set('tiers', options.tiers.join(','));
  }
  if (options.intervals?.length) {
    queryParams.set('intervals', options.intervals.join(','));
  }
  if (options.isActive !== undefined) {
    queryParams.set('isActive', String(options.isActive));
  }
  if (options.isPublic !== undefined) {
    queryParams.set('isPublic', String(options.isPublic));
  }
  
  const queryString = queryParams.toString();
  const url = `/api/plans${queryString ? `?${queryString}` : ''}`;
  
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [...queryKeys.plans, options],
    queryFn: async () => {
      const response = await axios.get(url);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch plans');
      }
      return response.data.data as PlansListResponse;
    },
    staleTime: 5 * 60 * 1000,
  });
  
  return {
    plans: data?.plans || [],
    total: data?.total || 0,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}

// ============================================================================
// Hook: usePlan
// ============================================================================

interface UsePlanReturn {
  plan: PlanDocument | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePlan(slug: string): UsePlanReturn {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.plan(slug),
    queryFn: async () => {
      const response = await axios.get(`/api/plans/${slug}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch plan');
      }
      return response.data.data as PlanDocument;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
  
  return {
    plan: data || null,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}

// ============================================================================
// Hook: usePlansByTier
// ============================================================================

interface UsePlansByTierReturn {
  plans: PlanDocument[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePlansByTier(tier: string): UsePlansByTierReturn {  // ✅ Changed from PlanTier to string
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.plansByTier(tier),
    queryFn: async () => {
      const response = await axios.get(`/api/plans/tier/${tier}`);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch plans for tier');
      }
      return response.data.data.plans as PlanDocument[];
    },
    enabled: !!tier,
    staleTime: 5 * 60 * 1000,
  });
  
  return {
    plans: data || [],
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}

// ============================================================================
// Hook: useCoupon
// ============================================================================

interface UseCouponReturn {
  validating: boolean;
  result: { 
    valid: boolean; 
    discountAmount?: number; 
    discountPercentage?: number; 
    message?: string;
  } | null;
  error: Error | null;
  validate: (code: string, planId: string, interval: string) => Promise<boolean>;
  clear: () => void;
}

export function useCoupon(): UseCouponReturn {
  const [result, setResult] = useState<UseCouponReturn['result']>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const mutation = useMutation({
    mutationFn: async ({ code, planId, interval }: { code: string; planId: string; interval: string }) => {
      const response = await axios.post('/api/plans/validate-coupon', { code, planId, interval });
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to validate coupon');
      }
      return response.data.data;
    },
    onSuccess: (data) => {
      setResult(data);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err);
      setResult(null);
    },
  });

  const validate = useCallback(async (code: string, planId: string, interval: string) => {
    try {
      const result = await mutation.mutateAsync({ code, planId, interval });
      return result.valid;
    } catch {
      return false;
    }
  }, [mutation]);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    mutation.reset();
  }, [mutation]);

  return {
    validating: mutation.isPending,
    result,
    error,
    validate,
    clear,
  };
}

// ============================================================================
// NEW: Helper hook to get all available options for filters
// ============================================================================

interface UsePlanOptionsReturn {
  tiers: AvailableTier[];
  intervals: AvailableInterval[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePlanOptions(): UsePlanOptionsReturn {
  const { data: tiers, isLoading: tiersLoading, isError: tiersIsError, error: tiersError, refetch: refetchTiers } = useAvailableTiers();
  const { data: intervals, isLoading: intervalsLoading, isError: intervalsIsError, error: intervalsError, refetch: refetchIntervals } = useAvailableIntervals();
  
  return {
    tiers: tiers || [],
    intervals: intervals || [],
    isLoading: tiersLoading || intervalsLoading,
    isError: tiersIsError || intervalsIsError,
    error: (tiersError || intervalsError) as Error | null,
    refetch: () => {
      refetchTiers();
      refetchIntervals();
    },
  };
}

// ============================================================================
// Export all hooks
// ============================================================================

export default {
  usePricing,
  usePlans,
  usePlan,
  usePlansByTier,
  useCoupon,
  useAvailableTiers,
  useAvailableIntervals,
  usePlanOptions,
};