import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

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

export interface PlanFeature {
  name: string;
  description?: string;
  included: boolean;
  limit?: number;
  unit?: string;
}

export interface IntervalPricing {
  interval: PlanInterval;
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
  tier: PlanTier;
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
  value: PlanInterval;
  label: string;
  discount: string | null;
  isPopular?: boolean;
  sortOrder: number;
}

export interface PricingResponse {
  tiers: TierPricing[];
  defaultInterval: PlanInterval;
  supportedIntervals: SupportedInterval[];
}

export interface PlanDocument {
  _id: string;
  name: string;
  slug: string;
  tier: PlanTier;
  description?: string;
  isActive: boolean;
  isPublic: boolean;
  priceKobo: number;
  currency: string;
  interval: PlanInterval;
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
    tiers?: PlanTier[];
    intervals?: PlanInterval[];
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
  selectedInterval: PlanInterval;
  setSelectedInterval: (interval: PlanInterval) => void;
  getPricingForTier: (tier: TierPricing) => IntervalPricing | undefined;
  getPricingForTierAndInterval: (tier: string, interval: PlanInterval) => IntervalPricing | undefined;
  getIntervalLabel: (interval: PlanInterval) => string;
  getBestValueInterval: (tier: TierPricing) => IntervalPricing | undefined;
  refetch: () => void;
}

export function usePricing(initialInterval: PlanInterval = PlanInterval.MONTHLY): UsePricingReturn {
  const [selectedInterval, setSelectedInterval] = useState<PlanInterval>(initialInterval);
  
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

  const getPricingForTierAndInterval = useCallback((tier: string, interval: PlanInterval) => {
    if (!data) return undefined;
    const tierData = data.tiers.find(t => t.tier === tier || t.name.toLowerCase() === tier.toLowerCase());
    return tierData?.intervals.find(i => i.interval === interval);
  }, [data]);

  const getIntervalLabel = useCallback((interval: PlanInterval) => {
    const labels: Record<PlanInterval, string> = {
      [PlanInterval.MONTHLY]: 'Monthly',
      [PlanInterval.QUARTERLY]: 'Quarterly',
      [PlanInterval.BIANNUAL]: 'Biannual',
      [PlanInterval.ANNUAL]: 'Annual',
      [PlanInterval.LIFETIME]: 'Lifetime'
    };
    return labels[interval];
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
  tiers?: PlanTier[];
  intervals?: PlanInterval[];
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

export function usePlansByTier(tier: PlanTier): UsePlansByTierReturn {
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
// Export all hooks
// ============================================================================

export default {
  usePricing,
  usePlans,
  usePlan,
  usePlansByTier,
  useCoupon,
};