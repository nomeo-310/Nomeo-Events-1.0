// hooks/use-plan-management.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

// ====================== TYPES ======================

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
  interval?: string;
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
  applicableIntervals?: string[];
  status: CouponStatus;
  expiresAt?: string;
  createdAt: string;
}

export interface IPlanTier {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  planCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPlanInterval {
  _id: string;
  name: string;
  slug: string;
  monthsCount: number;
  multiplier: number;
  sortOrder: number;
  isActive: boolean;
  planCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IPlan {
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
  tierId?: {
    _id: string;
    name: string;
    slug: string;
    description: string;
    sortOrder: number,
    isActive: boolean,
    createdAt: string;
    updatedAt: string;
  };
  intervalId?: {
      _id: string;
    name: string;
    slug: string;
    monthsCount: number;
    multiplier: number;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
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

export interface CreatePlanParams {
  name: string;
  slug: string;
  tierId: string;
  intervalId: string;
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
  id: string;
  updates: Partial<Omit<CreatePlanParams, 'slug'>>;
}

export interface CreateTierParams {
  name: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateTierParams {
  id: string;
  name?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateIntervalParams {
  name: string;
  monthsCount: number;
  multiplier: number;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateIntervalParams {
  id: string;
  name?: string;
  monthsCount?: number;
  multiplier?: number;
  sortOrder?: number;
  isActive?: boolean;
}

// ====================== API FUNCTIONS ======================

const plansApi = {
  // Plans
  getPlans: async (params?: { tier?: string; interval?: string; isActive?: boolean; isPublic?: boolean; includeInactive?: boolean }) => {
    const { data } = await axios.get('/api/admin/plans', { params });
    return data;
  },
  getPlan: async (slug: string) => {
    const { data } = await axios.get(`/api/admin/plans/${slug}`);
    return data;
  },
  createPlan: async (params: CreatePlanParams) => {
    const { data } = await axios.post('/api/admin/plans', params);
    return data;
  },
  updatePlan: async ({ id, updates }: UpdatePlanParams) => {
    const { data } = await axios.put('/api/admin/plans', { id, ...updates });
    return data;
  },
  deletePlan: async (id: string) => {
    const { data } = await axios.delete(`/api/admin/plans?id=${id}`);
    return data;
  },

  // Tiers
  getTiers: async () => {
    const { data } = await axios.get('/api/admin/plans/tiers');
    return data;
  },
  createTier: async (params: CreateTierParams) => {
    const { data } = await axios.post('/api/admin/plans/tiers', params);
    return data;
  },
  updateTier: async (params: UpdateTierParams) => {
    const { data } = await axios.put('/api/admin/plans/tiers', params);
    return data;
  },
  deleteTier: async (id: string) => {
    const { data } = await axios.delete(`/api/admin/plans/tiers?id=${id}`);
    return data;
  },

  // Intervals
  getIntervals: async () => {
    const { data } = await axios.get('/api/admin/plans/intervals');
    return data;
  },
  createInterval: async (params: CreateIntervalParams) => {
    const { data } = await axios.post('/api/admin/plans/intervals', params);
    return data;
  },
  updateInterval: async (params: UpdateIntervalParams) => {
    const { data } = await axios.put('/api/admin/plans/intervals', params);
    return data;
  },
  deleteInterval: async (id: string) => {
    const { data } = await axios.delete(`/api/admin/plans/intervals?id=${id}`);
    return data;
  },

  // Bulk operations
  bulkAction: async (params: { action: 'activate' | 'deactivate'; tier?: string; interval?: string; slugs?: string[] }) => {
    const { data } = await axios.post('/api/admin/plans/bulk', params);
    return data;
  },
  bulkDelete: async (params: { tier?: string; interval?: string; slugs?: string[] }) => {
    const searchParams = new URLSearchParams();
    if (params.tier) searchParams.set('tier', params.tier);
    if (params.interval) searchParams.set('interval', params.interval);
    if (params.slugs?.length) searchParams.set('slugs', params.slugs.join(','));
    const { data } = await axios.delete(`/api/admin/plans/bulk?${searchParams.toString()}`);
    return data;
  },
};

// ====================== QUERY KEYS ======================

export const planKeys = {
  all: ['plans'] as const,
  lists: () => [...planKeys.all, 'list'] as const,
  list: (params?: any) => [...planKeys.lists(), params] as const,
  details: () => [...planKeys.all, 'detail'] as const,
  detail: (slug: string) => [...planKeys.details(), slug] as const,
  tiers: () => [...planKeys.all, 'tiers'] as const,
  intervals: () => [...planKeys.all, 'intervals'] as const,
};

// ====================== QUERY HOOKS ======================

export const useGetPlans = (params?: { tier?: string; interval?: string; isActive?: boolean; isPublic?: boolean; includeInactive?: boolean }) => {
  return useQuery({
    queryKey: planKeys.list(params),
    queryFn: () => plansApi.getPlans(params),
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
    select: (data) => ({
      plans: data.data.plans,
      tiers: data.data.tiers,
      intervals: data.data.intervals,
      count: data.count,
    }),
  });
};

export const useGetTiers = () => {
  return useQuery({
    queryKey: planKeys.tiers(),
    queryFn: () => plansApi.getTiers(),
    staleTime: 1000 * 60 * 5,
    select: (data) => data.data,
  });
};

export const useGetIntervals = () => {
  return useQuery({
    queryKey: planKeys.intervals(),
    queryFn: () => plansApi.getIntervals(),
    staleTime: 1000 * 60 * 5,
    select: (data) => data.data,
  });
};

// ====================== MUTATION HOOKS ======================

export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plansApi.createPlan,
    onSuccess: () => {
      toast.success('Plan created successfully');
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.tiers() });
      queryClient.invalidateQueries({ queryKey: planKeys.intervals() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create plan');
    },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plansApi.updatePlan,
    onSuccess: () => {
      toast.success('Plan updated successfully');
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.tiers() });
      queryClient.invalidateQueries({ queryKey: planKeys.intervals() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update plan');
    },
  });
};

export const useDeletePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plansApi.deletePlan,
    onSuccess: () => {
      toast.success('Plan deleted successfully');
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete plan');
    },
  });
};

export const useCreateTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plansApi.createTier,
    onSuccess: (data) => {
      toast.success(`Tier "${data.data.name}" created successfully`);
      queryClient.invalidateQueries({ queryKey: planKeys.tiers() });
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create tier');
    },
  });
};

export const useUpdateTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plansApi.updateTier,
    onSuccess: (data) => {
      toast.success(`Tier "${data.data.name}" updated successfully`);
      queryClient.invalidateQueries({ queryKey: planKeys.tiers() });
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update tier');
    },
  });
};

export const useDeleteTier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plansApi.deleteTier,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete tier');
    },
  });
};

export const useCreateInterval = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plansApi.createInterval,
    onSuccess: (data) => {
      toast.success(`Interval "${data.data.name}" created successfully`);
      queryClient.invalidateQueries({ queryKey: planKeys.intervals() });
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create interval');
    },
  });
};

export const useUpdateInterval = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plansApi.updateInterval,
    onSuccess: (data) => {
      toast.success(`Interval "${data.data.name}" updated successfully`);
      queryClient.invalidateQueries({ queryKey: planKeys.intervals() });
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update interval');
    },
  });
};

export const useDeleteInterval = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plansApi.deleteInterval,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete interval');
    },
  });
};

export const useBulkAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plansApi.bulkAction,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Bulk action failed');
    },
  });
};

export const useBulkDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: plansApi.bulkDelete,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Bulk delete failed');
    },
  });
};