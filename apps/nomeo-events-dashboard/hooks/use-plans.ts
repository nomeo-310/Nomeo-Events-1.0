import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

// ====================== TYPES (from plan schema) ======================

export enum PlanInterval {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  BIANNUAL = 'biannual',
  ANNUAL = 'annual',
  LIFETIME = 'lifetime',
}

export enum PlanTier {
  FREE = 'free',
  STARTER = 'starter',
  BASIC = 'basic',
  PRO = 'pro',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export enum CouponStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DEPLETED = 'depleted',
  DISABLED = 'disabled',
}

export interface IPlanFeature {
  name: string;
  description?: string;
  included: boolean;
  limit?: number;
  unit?: string;
}

export interface IDiscount {
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  interval?: PlanInterval;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
}

export interface ICoupon {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxRedemptions?: number;
  redemptionCount: number;
  minAmountKobo?: number;
  applicableIntervals?: PlanInterval[];
  status: CouponStatus;
  expiresAt?: string;
  createdAt: string;
}

export interface IPlan {
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
  features: IPlanFeature[];
  discounts: IDiscount[];
  coupons: ICoupon[];
  sortOrder: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ====================== PARAM TYPES ======================

export interface GetPlansParams {
  tier?: PlanTier;
  interval?: PlanInterval;
  isActive?: boolean;
  isPublic?: boolean;
  includeInactive?: boolean;
}

export interface CreatePlanParams {
  name: string;
  slug: string;
  tier: PlanTier;
  interval: PlanInterval;
  priceKobo: number;
  description?: string;
  isActive?: boolean;
  isPublic?: boolean;
  currency?: string;
  paystackPlanCode?: string;
  trialDays?: number;
  maxEvents?: number;
  maxAttendeesPerEvent?: number;
  maxTeamMembers?: number;
  storageGb?: number;
  features?: IPlanFeature[];
  discounts?: Omit<IDiscount, 'isActive'>[];
  coupons?: Omit<ICoupon, 'redemptionCount' | 'createdAt'>[];
  sortOrder?: number;
  metadata?: Record<string, any>;
}

export interface UpdatePlanParams {
  slug: string;
  updates: Partial<Omit<CreatePlanParams, 'slug'>>;
}

export interface AddCouponParams {
  slug: string;
  coupon: {
    code: string;
    discountType: DiscountType;
    discountValue: number;
    description?: string;
    maxRedemptions?: number;
    minAmountKobo?: number;
    applicableIntervals?: PlanInterval[];
    status?: CouponStatus;
    expiresAt?: string;
  };
}

export interface RemoveCouponParams {
  slug: string;
  couponCode: string;
}

export interface BulkActionParams {
  action: 'activate' | 'deactivate';
  tier?: PlanTier;
  interval?: PlanInterval;
  slugs?: string[];
}

export interface BulkDeleteParams {
  tier?: PlanTier;
  interval?: PlanInterval;
  slugs?: string[];
}

export interface IntervalActionParams {
  interval: PlanInterval;
  action: 'activate' | 'deactivate';
}

export interface TierActionParams {
  tier: PlanTier;
  action: 'activate' | 'deactivate';
}

export interface DeactivateWithFiltersParams {
  tier?: PlanTier;
  interval?: PlanInterval;
  slugs?: string[];
  includeIntervals?: PlanInterval[];
  excludeIntervals?: PlanInterval[];
}

// ====================== RESPONSE TYPES ======================

export interface PlanResponse {
  success: boolean;
  data: IPlan;
  message?: string;
}

export interface PlansListResponse {
  success: boolean;
  data: IPlan[];
  count: number;
}

export interface CouponsResponse {
  success: boolean;
  data: ICoupon[];
}

export interface BulkActionResponse {
  success: boolean;
  message: string;
  data: {
    modifiedCount: number;
    matchedCount?: number;
    action?: string;
    tier?: string;
    interval?: string;
    slugs?: string[];
  };
}

export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  data: {
    deletedCount: number;
    tier?: string;
    interval?: string;
    slugs?: string[];
  };
}

export interface DeletePlanResponse {
  success: boolean;
  message: string;
  data: { slug: string };
}

export interface IntervalPlansResponse {
  success: boolean;
  data: IPlan[];
  count: number;
  interval: string;
}

export interface TierPlansResponse {
  success: boolean;
  data: IPlan[];
  count: number;
  tier: string;
}

// ====================== API FUNCTIONS ======================

const plansApi = {
  // ── Plans CRUD ────────────────────────────────────────────────────────────

  getPlans: async (params: GetPlansParams = {}): Promise<PlansListResponse> => {
    const { data } = await axios.get<PlansListResponse>('/api/admin/plans', { params });
    return data;
  },

  getPlan: async (slug: string): Promise<PlanResponse> => {
    const { data } = await axios.get<PlanResponse>(`/api/admin/plans/${slug}`);
    return data;
  },

  createPlan: async (params: CreatePlanParams): Promise<PlanResponse> => {
    const { data } = await axios.post<PlanResponse>('/api/admin/plans', params);
    return data;
  },

  updatePlan: async ({ slug, updates }: UpdatePlanParams): Promise<PlanResponse> => {
    const { data } = await axios.patch<PlanResponse>(`/api/admin/plans/${slug}`, updates);
    return data;
  },

  deletePlan: async (slug: string): Promise<DeletePlanResponse> => {
    const { data } = await axios.delete<DeletePlanResponse>(`/api/admin/plans/${slug}`);
    return data;
  },

  // ── Activate / Deactivate single plan ────────────────────────────────────

  activatePlan: async (slug: string): Promise<PlanResponse> => {
    const { data } = await axios.patch<PlanResponse>(`/api/admin/plans/${slug}/activate`);
    return data;
  },

  deactivatePlan: async (slug: string): Promise<PlanResponse> => {
    const { data } = await axios.patch<PlanResponse>(`/api/admin/plans/${slug}/deactivate`);
    return data;
  },

  // ── Coupons ───────────────────────────────────────────────────────────────

  getCoupons: async (slug: string): Promise<CouponsResponse> => {
    const { data } = await axios.get<CouponsResponse>(`/api/admin/plans/${slug}/coupons`);
    return data;
  },

  addCoupon: async ({ slug, coupon }: AddCouponParams): Promise<CouponsResponse> => {
    const { data } = await axios.post<CouponsResponse>(`/api/admin/plans/${slug}/coupons`, coupon);
    return data;
  },

  removeCoupon: async ({ slug, couponCode }: RemoveCouponParams): Promise<CouponsResponse> => {
    const { data } = await axios.delete<CouponsResponse>(
      `/api/admin/plans/${slug}/coupons/${couponCode}`
    );
    return data;
  },

  // ── Bulk operations ───────────────────────────────────────────────────────

  bulkAction: async (params: BulkActionParams): Promise<BulkActionResponse> => {
    const { action, ...filters } = params;
    const { data } = await axios.post<BulkActionResponse>('/api/admin/plans/bulk', {
      action,
      ...filters,
    });
    return data;
  },

  bulkDelete: async (params: BulkDeleteParams): Promise<BulkDeleteResponse> => {
    const searchParams = new URLSearchParams();
    if (params.tier) searchParams.set('tier', params.tier);
    if (params.interval) searchParams.set('interval', params.interval);
    if (params.slugs?.length) searchParams.set('slugs', params.slugs.join(','));

    const { data } = await axios.delete<BulkDeleteResponse>(
      `/api/admin/plans/bulk?${searchParams.toString()}`
    );
    return data;
  },

  deactivateWithFilters: async (params: DeactivateWithFiltersParams): Promise<BulkActionResponse> => {
    const { data } = await axios.post<BulkActionResponse>('/api/admin/plans/deactivate', params);
    return data;
  },

  // ── Interval operations ───────────────────────────────────────────────────

  getPlansByInterval: async (interval: PlanInterval): Promise<IntervalPlansResponse> => {
    const { data } = await axios.get<IntervalPlansResponse>(
      `/api/admin/plans/intervals/${interval}`
    );
    return data;
  },

  intervalAction: async ({ interval, action }: IntervalActionParams): Promise<BulkActionResponse> => {
    const { data } = await axios.patch<BulkActionResponse>(
      `/api/admin/plans/intervals/${interval}`,
      { action }
    );
    return data;
  },

  deleteInterval: async (interval: PlanInterval): Promise<BulkDeleteResponse> => {
    const { data } = await axios.delete<BulkDeleteResponse>(
      `/api/admin/plans/intervals/${interval}`
    );
    return data;
  },

  // ── Tier operations ───────────────────────────────────────────────────────

  getPlansByTier: async (tier: PlanTier): Promise<TierPlansResponse> => {
    const { data } = await axios.get<TierPlansResponse>(`/api/admin/plans/tiers/${tier}`);
    return data;
  },

  tierAction: async ({ tier, action }: TierActionParams): Promise<BulkActionResponse> => {
    const { data } = await axios.patch<BulkActionResponse>(
      `/api/admin/plans/tiers/${tier}`,
      { action }
    );
    return data;
  },

  deleteTier: async (tier: PlanTier): Promise<BulkDeleteResponse> => {
    const { data } = await axios.delete<BulkDeleteResponse>(`/api/admin/plans/tiers/${tier}`);
    return data;
  },
};

// ====================== QUERY KEYS ======================

export const planKeys = {
  all: ['plans'] as const,
  lists: () => [...planKeys.all, 'list'] as const,
  list: (params: GetPlansParams) => [...planKeys.lists(), params] as const,
  details: () => [...planKeys.all, 'detail'] as const,
  detail: (slug: string) => [...planKeys.details(), slug] as const,
  coupons: (slug: string) => [...planKeys.detail(slug), 'coupons'] as const,
  byInterval: (interval: PlanInterval) => [...planKeys.all, 'interval', interval] as const,
  byTier: (tier: PlanTier) => [...planKeys.all, 'tier', tier] as const,
};

// ====================== QUERY HOOKS ======================

/**
 * Hook: Get all plans with optional filters
 */
export const useGetPlans = (params: GetPlansParams = {}) => {
  return useQuery({
    queryKey: planKeys.list(params),
    queryFn: () => plansApi.getPlans(params),
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
    select: (data) => ({
      plans: data.data,
      count: data.count,
    }),
  });
};

/**
 * Hook: Get a single plan by slug
 */
export const useGetPlan = (slug: string | null) => {
  return useQuery({
    queryKey: planKeys.detail(slug ?? ''),
    queryFn: () => {
      if (!slug) throw new Error('Slug is required');
      return plansApi.getPlan(slug);
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    select: (data) => data.data,
  });
};

/**
 * Hook: Get all plans for a specific interval
 */
export const useGetPlansByInterval = (interval: PlanInterval | null) => {
  return useQuery({
    queryKey: planKeys.byInterval(interval ?? PlanInterval.MONTHLY),
    queryFn: () => {
      if (!interval) throw new Error('Interval is required');
      return plansApi.getPlansByInterval(interval);
    },
    enabled: !!interval,
    staleTime: 1000 * 60 * 5,
    select: (data) => ({
      plans: data.data,
      count: data.count,
    }),
  });
};

/**
 * Hook: Get all plans for a specific tier
 */
export const useGetPlansByTier = (tier: PlanTier | null) => {
  return useQuery({
    queryKey: planKeys.byTier(tier ?? PlanTier.FREE),
    queryFn: () => {
      if (!tier) throw new Error('Tier is required');
      return plansApi.getPlansByTier(tier);
    },
    enabled: !!tier,
    staleTime: 1000 * 60 * 5,
    select: (data) => ({
      plans: data.data,
      count: data.count,
    }),
  });
};

/**
 * Hook: Get coupons for a plan
 */
export const useGetCoupons = (slug: string | null) => {
  return useQuery({
    queryKey: planKeys.coupons(slug ?? ''),
    queryFn: () => {
      if (!slug) throw new Error('Slug is required');
      return plansApi.getCoupons(slug);
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
    select: (data) => data.data,
  });
};

// ====================== MUTATION HOOKS ======================

/**
 * Hook: Create a new plan
 */
export const useCreatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation<PlanResponse, Error, CreatePlanParams>({
    mutationFn: plansApi.createPlan,
    onSuccess: (data) => {
      toast.success(data.message ?? 'Plan created successfully');
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      if (data.data?.tier) {
        queryClient.invalidateQueries({ queryKey: planKeys.byTier(data.data.tier) });
      }
      if (data.data?.interval) {
        queryClient.invalidateQueries({ queryKey: planKeys.byInterval(data.data.interval) });
      }
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? 'Failed to create plan');
      } else {
        toast.error('Failed to create plan');
      }
    },
  });
};

/**
 * Hook: Update an existing plan
 */
export const useUpdatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation<PlanResponse, Error, UpdatePlanParams>({
    mutationFn: plansApi.updatePlan,
    onSuccess: (data, variables) => {
      toast.success(data.message ?? 'Plan updated successfully');
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.detail(variables.slug) });
      if (data.data?.tier) {
        queryClient.invalidateQueries({ queryKey: planKeys.byTier(data.data.tier) });
      }
      if (data.data?.interval) {
        queryClient.invalidateQueries({ queryKey: planKeys.byInterval(data.data.interval) });
      }
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? 'Failed to update plan');
      } else {
        toast.error('Failed to update plan');
      }
    },
  });
};

/**
 * Hook: Delete a plan (superadmin only)
 */
export const useDeletePlan = () => {
  const queryClient = useQueryClient();

  return useMutation<DeletePlanResponse, Error, string>({
    mutationFn: plansApi.deletePlan,
    onSuccess: (data, slug) => {
      toast.success(data.message ?? 'Plan deleted successfully');
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.removeQueries({ queryKey: planKeys.detail(slug) });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? 'Failed to delete plan');
      } else {
        toast.error('Failed to delete plan');
      }
    },
  });
};

/**
 * Hook: Activate a single plan
 */
export const useActivatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation<PlanResponse, Error, string>({
    mutationFn: plansApi.activatePlan,
    onSuccess: (data, slug) => {
      toast.success(data.message ?? 'Plan activated');
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.detail(slug) });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? 'Failed to activate plan');
      } else {
        toast.error('Failed to activate plan');
      }
    },
  });
};

/**
 * Hook: Deactivate a single plan
 */
export const useDeactivatePlan = () => {
  const queryClient = useQueryClient();

  return useMutation<PlanResponse, Error, string>({
    mutationFn: plansApi.deactivatePlan,
    onSuccess: (data, slug) => {
      toast.success(data.message ?? 'Plan deactivated');
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.detail(slug) });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? 'Failed to deactivate plan');
      } else {
        toast.error('Failed to deactivate plan');
      }
    },
  });
};

/**
 * Hook: Add a coupon to a plan
 */
export const useAddCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation<CouponsResponse, Error, AddCouponParams>({
    mutationFn: plansApi.addCoupon,
    onSuccess: (data, variables) => {
      toast.success(`Coupon '${variables.coupon.code.toUpperCase()}' added`);
      queryClient.invalidateQueries({ queryKey: planKeys.coupons(variables.slug) });
      queryClient.invalidateQueries({ queryKey: planKeys.detail(variables.slug) });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? 'Failed to add coupon');
      } else {
        toast.error('Failed to add coupon');
      }
    },
  });
};

/**
 * Hook: Remove a coupon from a plan
 */
export const useRemoveCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation<CouponsResponse, Error, RemoveCouponParams>({
    mutationFn: plansApi.removeCoupon,
    onSuccess: (data, variables) => {
      toast.success(`Coupon '${variables.couponCode.toUpperCase()}' removed`);
      queryClient.invalidateQueries({ queryKey: planKeys.coupons(variables.slug) });
      queryClient.invalidateQueries({ queryKey: planKeys.detail(variables.slug) });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? 'Failed to remove coupon');
      } else {
        toast.error('Failed to remove coupon');
      }
    },
  });
};

/**
 * Hook: Bulk activate or deactivate plans
 */
export const useBulkAction = () => {
  const queryClient = useQueryClient();

  return useMutation<BulkActionResponse, Error, BulkActionParams>({
    mutationFn: plansApi.bulkAction,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? 'Bulk action failed');
      } else {
        toast.error('Bulk action failed');
      }
    },
  });
};

/**
 * Hook: Bulk delete plans by tier, interval, or slugs (superadmin only)
 */
export const useBulkDelete = () => {
  const queryClient = useQueryClient();

  return useMutation<BulkDeleteResponse, Error, BulkDeleteParams>({
    mutationFn: plansApi.bulkDelete,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? 'Bulk delete failed');
      } else {
        toast.error('Bulk delete failed');
      }
    },
  });
};

/**
 * Hook: Deactivate plans with advanced filters (tier + interval inclusions/exclusions)
 */
export const useDeactivateWithFilters = () => {
  const queryClient = useQueryClient();

  return useMutation<BulkActionResponse, Error, DeactivateWithFiltersParams>({
    mutationFn: plansApi.deactivateWithFilters,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? 'Failed to deactivate plans');
      } else {
        toast.error('Failed to deactivate plans');
      }
    },
  });
};

/**
 * Hook: Activate or deactivate all plans in an interval
 */
export const useIntervalAction = () => {
  const queryClient = useQueryClient();

  return useMutation<BulkActionResponse, Error, IntervalActionParams>({
    mutationFn: plansApi.intervalAction,
    onSuccess: (data, variables) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.byInterval(variables.interval) });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? 'Interval action failed');
      } else {
        toast.error('Interval action failed');
      }
    },
  });
};

/**
 * Hook: Delete all plans in an interval (superadmin only)
 */
export const useDeleteInterval = () => {
  const queryClient = useQueryClient();

  return useMutation<BulkDeleteResponse, Error, PlanInterval>({
    mutationFn: plansApi.deleteInterval,
    onSuccess: (data, interval) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: planKeys.all });
      queryClient.removeQueries({ queryKey: planKeys.byInterval(interval) });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? 'Failed to delete interval plans');
      } else {
        toast.error('Failed to delete interval plans');
      }
    },
  });
};

/**
 * Hook: Activate or deactivate an entire tier
 */
export const useTierAction = () => {
  const queryClient = useQueryClient();

  return useMutation<BulkActionResponse, Error, TierActionParams>({
    mutationFn: plansApi.tierAction,
    onSuccess: (data, variables) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.byTier(variables.tier) });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? 'Tier action failed');
      } else {
        toast.error('Tier action failed');
      }
    },
  });
};

/**
 * Hook: Delete an entire tier (superadmin only)
 */
export const useDeleteTier = () => {
  const queryClient = useQueryClient();

  return useMutation<BulkDeleteResponse, Error, PlanTier>({
    mutationFn: plansApi.deleteTier,
    onSuccess: (data, tier) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: planKeys.all });
      queryClient.removeQueries({ queryKey: planKeys.byTier(tier) });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? 'Failed to delete tier');
      } else {
        toast.error('Failed to delete tier');
      }
    },
  });
};

// ====================== CONVENIENCE HOOKS ======================

/**
 * Hook: Get plan statistics (counts by tier and interval, price ranges)
 */
export const usePlanStats = () => {
  const { data, isLoading } = useGetPlans({ includeInactive: true });

  const stats = {
    total: 0,
    active: 0,
    inactive: 0,
    byTier: Object.fromEntries(Object.values(PlanTier).map((t) => [t, 0])) as Record<PlanTier, number>,
    byInterval: Object.fromEntries(Object.values(PlanInterval).map((i) => [i, 0])) as Record<PlanInterval, number>,
    free: 0,
    paid: 0,
  };

  if (data?.plans) {
    stats.total = data.plans.length;

    data.plans.forEach((plan) => {
      if (plan.isActive) stats.active++;
      else stats.inactive++;

      stats.byTier[plan.tier]++;
      stats.byInterval[plan.interval]++;

      if (plan.isFree) stats.free++;
      else stats.paid++;
    });
  }

  return { stats, isLoading };
};

/**
 * Hook: Combined plan management — all actions in one place
 */
export const usePlanManagement = () => {
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const activatePlan = useActivatePlan();
  const deactivatePlan = useDeactivatePlan();
  const addCoupon = useAddCoupon();
  const removeCoupon = useRemoveCoupon();
  const bulkAction = useBulkAction();
  const bulkDelete = useBulkDelete();
  const deactivateWithFilters = useDeactivateWithFilters();
  const intervalAction = useIntervalAction();
  const deleteInterval = useDeleteInterval();
  const tierAction = useTierAction();
  const deleteTier = useDeleteTier();

  return {
    // Actions
    createPlan: createPlan.mutateAsync,
    updatePlan: updatePlan.mutateAsync,
    deletePlan: deletePlan.mutateAsync,
    activatePlan: activatePlan.mutateAsync,
    deactivatePlan: deactivatePlan.mutateAsync,
    addCoupon: addCoupon.mutateAsync,
    removeCoupon: removeCoupon.mutateAsync,
    bulkAction: bulkAction.mutateAsync,
    bulkDelete: bulkDelete.mutateAsync,
    deactivateWithFilters: deactivateWithFilters.mutateAsync,
    intervalAction: intervalAction.mutateAsync,
    deleteInterval: deleteInterval.mutateAsync,
    tierAction: tierAction.mutateAsync,
    deleteTier: deleteTier.mutateAsync,

    // Loading states
    isCreating: createPlan.isPending,
    isUpdating: updatePlan.isPending,
    isDeleting: deletePlan.isPending,
    isActivating: activatePlan.isPending,
    isDeactivating: deactivatePlan.isPending,
    isAddingCoupon: addCoupon.isPending,
    isRemovingCoupon: removeCoupon.isPending,
    isBulkActioning: bulkAction.isPending,
    isBulkDeleting: bulkDelete.isPending,
    isDeactivatingFiltered: deactivateWithFilters.isPending,
    isIntervalActioning: intervalAction.isPending,
    isDeletingInterval: deleteInterval.isPending,
    isTierActioning: tierAction.isPending,
    isDeletingTier: deleteTier.isPending,

    // Errors
    createError: createPlan.error,
    updateError: updatePlan.error,
    deleteError: deletePlan.error,
    activateError: activatePlan.error,
    deactivateError: deactivatePlan.error,
    addCouponError: addCoupon.error,
    removeCouponError: removeCoupon.error,
    bulkActionError: bulkAction.error,
    bulkDeleteError: bulkDelete.error,
  };
};