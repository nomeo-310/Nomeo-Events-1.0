// hooks/use-subscription-management.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

// ====================== TYPES (Updated for dynamic plans) ======================

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired'
  | 'paused';

// ✅ Changed from hardcoded enums to strings (dynamic)
export type PlanTier = string;  // Now dynamic - can be "free", "pro", "premium", etc.
export type PlanInterval = string;  // Now dynamic - can be "monthly", "weekly", "quarterly", etc.
export type DiscountType = 'percentage' | 'fixed';

// ── Subscription document ─────────────────────────────────────────────────────

export interface SubscriptionUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface ISubscription {
  _id: string;
  userId: SubscriptionUser | string;
  planId: string;
  planSlug?: string;  // ✅ Add plan slug for reference

  paystackSubscriptionCode?: string;

  status: SubscriptionStatus;

  // Plan snapshot (now using strings instead of enums)
  planTier:  PlanTier;
  planName:  string;
  interval:  PlanInterval;
  priceKobo: number;
  currency:  string;

  // Discount snapshot
  couponCode?:         string;
  couponDiscount?:     number;
  couponDiscountType?: DiscountType;
  discountKobo:        number;
  finalPriceKobo:      number;

  // Billing periods
  trialStart?: string;
  trialEnd?:   string;
  currentPeriodStart: string;
  currentPeriodEnd:   string;

  // Renewal
  cancelAtPeriodEnd:   boolean;
  cancelledAt?:        string;
  cancellationReason?: string;

  payments: string[];

  // Limits snapshot
  maxEvents?:            number;
  maxAttendeesPerEvent?: number;
  maxTeamMembers?:       number;
  storageGb?:            number;

  createdAt: string;
  updatedAt: string;
}

// ── Analytics (from GET /[id]) ────────────────────────────────────────────────

export interface SubscriptionAnalytics {
  totalPayments:        number;
  totalRevenue:         number;
  averagePaymentAmount: number;
  lifetimeValue:        number;
  firstPaymentDate:     string | null;
  lastPaymentDate:      string | null;
}

export interface SubscriptionHistoryEntry {
  date:    string;
  event:   string;
  type:    'creation' | 'admin_action' | 'cancellation' | string;
  admin?:  string;
  details: string;
}

export interface SubscriptionDetail {
  subscription: ISubscription;
  analytics:    SubscriptionAnalytics;
  history:      SubscriptionHistoryEntry[];
}

// ── Stats (from GET /stats) ───────────────────────────────────────────────────

export interface StatusBreakdownItem {
  status:     SubscriptionStatus;
  count:      number;
  percentage: string;
  revenue:    number;
}

export interface TierStat {
  name:           PlanTier;
  total:          number;
  active:         number;
  trialing:       number;
  percentage:     string;
  revenue:        number;
  averageRevenue: number;
}

export interface IntervalStat {
  name:       PlanInterval;
  count:      number;
  percentage: string;
  revenue:    number;
}

export interface TrialStats {
  active:         number;
  endingThisWeek: number;
  converted:      number;
  expired:        number;
  conversionRate: string;
}

export interface ChurnStats {
  thisPeriod: number;
  cancelled:  number;
  expired:    number;
  churnRate:  string;
}

export interface GrowthDataPoint {
  _id:               string; // 'YYYY-MM-DD'
  newSubscriptions:  number;
  activeCount:       number;
}

export interface RenewalDataPoint {
  date:            string;
  count:           number;
  expectedRevenue: number;
}

export interface PaymentStats {
  total:       number;
  successful:  number;
  failed:      number;
  successRate: string;
  totalAmount: number;
}

export interface TopPlan {
  name:        string;
  tier:        PlanTier;
  interval:    PlanInterval;
  subscribers: number;
  revenue:     number;
  avgPrice:    number;
}

export interface AcquisitionStat {
  tier:     PlanTier;
  newUsers: number;
  revenue:  number;
}

export interface SubscriptionStats {
  overview: {
    totalSubscriptions:  number;
    activeSubscriptions: number;
    statusBreakdown:     StatusBreakdownItem[];
  };
  revenue: {
    mrr:                    number;
    arr:                    number;
    totalRevenue:           number;
    averageSubscription:    number;
    subscriptionRange:      { min: number; max: number };
    projectedAnnualRevenue: number;
  };
  tiers:            TierStat[];
  intervals:        IntervalStat[];
  trials:           TrialStats;
  churn:            ChurnStats;
  growth:           GrowthDataPoint[];
  upcomingRenewals: RenewalDataPoint[];
  payments:         PaymentStats | null;
  topPlans:         TopPlan[];
  acquisition:      AcquisitionStat[];
  metadata: {
    period:      string;
    startDate:   string;
    endDate:     string;
    generatedAt: string;
  };
}

// ── NEW: Available tiers and intervals from database ─────────────────────────

export interface AvailablePlanTier {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface AvailablePlanInterval {
  _id: string;
  name: string;
  slug: string;
  monthsCount: number;
  multiplier: number;
  isActive: boolean;
  sortOrder: number;
}

// ── Param types ───────────────────────────────────────────────────────────────

export interface GetSubscriptionsParams {
  page?:      number;
  limit?:     number;
  status?:    SubscriptionStatus | 'all';
  planTier?:  PlanTier | 'all';
  interval?:  PlanInterval | 'all';
  search?:    string;
  sortBy?:    string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?:   string;
}

export interface SubscriptionActionParams {
  id:          string;
  action:      'cancel' | 'pause' | 'resume' | 'extend' | 'markActive' | 'markPastDue';
  reason?:     string;
  immediately?: boolean; // for cancel
  days?:       number;   // for extend
}

export type BulkSubscriptionAction = 'cancel' | 'pause' | 'resume' | 'extend' | 'export';

export interface BulkSubscriptionParams {
  action:          BulkSubscriptionAction;
  subscriptionIds: string[];
  reason?:         string;
  immediately?:    boolean; // for cancel
  days?:           number;  // for extend
}

export interface ExportSubscriptionsParams {
  format?:    'csv' | 'json';
  status?:    SubscriptionStatus | 'all';
  planTier?:  PlanTier | 'all';
  startDate?: string;
  endDate?:   string;
}

// ── Response types ────────────────────────────────────────────────────────────

export interface PaginatedSubscriptionsResponse {
  subscriptions: ISubscription[];
  pagination: {
    currentPage:     number;
    totalPages:      number;
    totalCount:      number;
    limit:           number;
    hasNextPage:     boolean;
    hasPreviousPage: boolean;
  };
}

export interface SubscriptionActionResponse {
  success:      boolean;
  message:      string;
  subscription: ISubscription;
}

export interface BulkSubscriptionResponse {
  success:       boolean;
  action:        BulkSubscriptionAction;
  affectedCount: number;
  results?:      { subscriptions?: ISubscription[]; exportReady?: boolean };
}

// ====================== API FUNCTIONS ======================

const subscriptionApi = {
  // ── List ─────────────────────────────────────────────────────────────────
  getSubscriptions: async (
    params: GetSubscriptionsParams = {}
  ): Promise<PaginatedSubscriptionsResponse> => {
    const { data } = await axios.get<PaginatedSubscriptionsResponse>(
      '/api/admin/subscriptions',
      { params }
    );
    return data;
  },

  // ── Detail ────────────────────────────────────────────────────────────────
  getSubscription: async (id: string): Promise<SubscriptionDetail> => {
    const { data } = await axios.get<SubscriptionDetail>(
      `/api/admin/subscriptions/${id}`
    );
    return data;
  },

  // ── Single action (cancel / pause / resume / extend / markActive / markPastDue)
  subscriptionAction: async ({
    id,
    action,
    reason,
    immediately,
    days,
  }: SubscriptionActionParams): Promise<SubscriptionActionResponse> => {
    const { data } = await axios.patch<SubscriptionActionResponse>(
      `/api/admin/subscriptions/${id}`,
      { action, reason, immediately, days }
    );
    return data;
  },

  // ── Bulk ─────────────────────────────────────────────────────────────────
  bulkAction: async (
    params: BulkSubscriptionParams
  ): Promise<BulkSubscriptionResponse> => {
    const { data } = await axios.post<BulkSubscriptionResponse>(
      '/api/admin/subscriptions/bulk',
      params
    );
    return data;
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  getStats: async (period = 30): Promise<SubscriptionStats> => {
    const { data } = await axios.get<SubscriptionStats>(
      '/api/admin/subscriptions/stats',
      { params: { period } }
    );
    return data;
  },

  // ── Export ────────────────────────────────────────────────────────────────
  export: async (params: ExportSubscriptionsParams = {}): Promise<void> => {
    const response = await axios.get('/api/admin/subscriptions/export', {
      params,
      responseType: params.format === 'json' ? 'json' : 'blob',
    });

    if (params.format === 'json') {
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json',
      });
      triggerDownload(blob, `subscriptions-${Date.now()}.json`);
    } else {
      triggerDownload(response.data as Blob, `subscriptions-${Date.now()}.csv`);
    }
  },

  // ── NEW: Get available tiers and intervals for filters ───────────────────
  getAvailableTiers: async (): Promise<AvailablePlanTier[]> => {
    const { data } = await axios.get('/api/admin/plans/tiers');
    return data.data;
  },

  getAvailableIntervals: async (): Promise<AvailablePlanInterval[]> => {
    const { data } = await axios.get('/api/admin/plans/intervals');
    return data.data;
  },
};

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ====================== QUERY KEYS ======================

export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  lists: () => [...subscriptionKeys.all, 'list'] as const,
  list: (params: GetSubscriptionsParams) => [...subscriptionKeys.lists(), params] as const,
  details: () => [...subscriptionKeys.all, 'detail'] as const,
  detail: (id: string) => [...subscriptionKeys.details(), id] as const,
  stats: (period?: number) => [...subscriptionKeys.all, 'stats', period ?? 30] as const,
  availableTiers: () => [...subscriptionKeys.all, 'availableTiers'] as const,
  availableIntervals: () => [...subscriptionKeys.all, 'availableIntervals'] as const,
};

// ====================== QUERY HOOKS ======================

/**
 * Hook: List subscriptions with filtering, sorting and pagination
 */
export const useGetSubscriptions = (params: GetSubscriptionsParams = {}) => {
  return useQuery({
    queryKey: subscriptionKeys.list(params),
    queryFn: () => subscriptionApi.getSubscriptions(params),
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
    select: (data) => ({
      subscriptions: data.subscriptions,
      pagination: data.pagination,
    }),
  });
};

/**
 * Hook: Get a single subscription with analytics and history
 */
export const useGetSubscription = (id: string | null) => {
  return useQuery({
    queryKey: subscriptionKeys.detail(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('Subscription ID is required');
      return subscriptionApi.getSubscription(id);
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
};

/**
 * Hook: Subscription stats dashboard (MRR, ARR, churn, trials, growth…)
 */
export const useGetSubscriptionStats = (period = 30) => {
  return useQuery({
    queryKey: subscriptionKeys.stats(period),
    queryFn: () => subscriptionApi.getStats(period),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * NEW: Hook: Get available tiers for filters
 */
export const useGetAvailableTiers = () => {
  return useQuery({
    queryKey: subscriptionKeys.availableTiers(),
    queryFn: () => subscriptionApi.getAvailableTiers(),
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * NEW: Hook: Get available intervals for filters
 */
export const useGetAvailableIntervals = () => {
  return useQuery({
    queryKey: subscriptionKeys.availableIntervals(),
    queryFn: () => subscriptionApi.getAvailableIntervals(),
    staleTime: 1000 * 60 * 5,
  });
};

// ====================== MUTATION HOOKS ======================

/**
 * Hook: Perform a single action on a subscription
 */
export const useSubscriptionAction = () => {
  const queryClient = useQueryClient();

  return useMutation<SubscriptionActionResponse, Error, SubscriptionActionParams>({
    mutationFn: subscriptionApi.subscriptionAction,
    onSuccess: (data, variables) => {
      toast.success(data.message ?? `Subscription ${variables.action}ed successfully`);
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: subscriptionKeys.stats() });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? 'Action failed');
      } else {
        toast.error('Action failed');
      }
    },
  });
};

/**
 * Hook: Cancel a subscription (convenience wrapper)
 */
export const useCancelSubscription = () => {
  const action = useSubscriptionAction();
  return {
    cancel: (id: string, reason?: string, immediately?: boolean) =>
      action.mutateAsync({ id, action: 'cancel', reason, immediately }),
    isPending: action.isPending,
    error: action.error,
  };
};

/**
 * Hook: Pause a subscription
 */
export const usePauseSubscription = () => {
  const action = useSubscriptionAction();
  return {
    pause: (id: string, reason?: string) =>
      action.mutateAsync({ id, action: 'pause', reason }),
    isPending: action.isPending,
    error: action.error,
  };
};

/**
 * Hook: Resume a paused subscription
 */
export const useResumeSubscription = () => {
  const action = useSubscriptionAction();
  return {
    resume: (id: string, reason?: string) =>
      action.mutateAsync({ id, action: 'resume', reason }),
    isPending: action.isPending,
    error: action.error,
  };
};

/**
 * Hook: Extend a subscription by N days
 */
export const useExtendSubscription = () => {
  const action = useSubscriptionAction();
  return {
    extend: (id: string, days: number, reason?: string) =>
      action.mutateAsync({ id, action: 'extend', days, reason }),
    isPending: action.isPending,
    error: action.error,
  };
};

/**
 * Hook: Mark a subscription as active (admin override)
 */
export const useMarkSubscriptionActive = () => {
  const action = useSubscriptionAction();
  return {
    markActive: (id: string) =>
      action.mutateAsync({ id, action: 'markActive' }),
    isPending: action.isPending,
    error: action.error,
  };
};

/**
 * Hook: Mark a subscription as past-due (admin override)
 */
export const useMarkSubscriptionPastDue = () => {
  const action = useSubscriptionAction();
  return {
    markPastDue: (id: string) =>
      action.mutateAsync({ id, action: 'markPastDue' }),
    isPending: action.isPending,
    error: action.error,
  };
};

/**
 * Hook: Bulk action on multiple subscriptions
 */
export const useBulkSubscriptionAction = () => {
  const queryClient = useQueryClient();

  return useMutation<BulkSubscriptionResponse, Error, BulkSubscriptionParams>({
    mutationFn: subscriptionApi.bulkAction,
    onSuccess: (data) => {
      if (data.action !== 'export') {
        toast.success(`${data.action}ed ${data.affectedCount} subscription(s)`);
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.lists() });
        queryClient.invalidateQueries({ queryKey: subscriptionKeys.stats() });
      }
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
 * Hook: Export subscriptions (triggers a file download)
 */
export const useExportSubscriptions = () => {
  return useMutation<void, Error, ExportSubscriptionsParams>({
    mutationFn: subscriptionApi.export,
    onSuccess: (_, variables) => {
      toast.success(`Subscriptions exported as ${variables.format?.toUpperCase() ?? 'CSV'}`);
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? 'Export failed');
      } else {
        toast.error('Export failed');
      }
    },
  });
};

// ====================== CONVENIENCE HOOKS ======================

/**
 * Hook: Compute quick stats from the list response (client-side)
 */
export const useSubscriptionSummary = () => {
  const { data, isLoading } = useGetSubscriptions({ limit: 1000 } as any);

  const summary = {
    total: 0,
    active: 0,
    trialing: 0,
    pastDue: 0,
    paused: 0,
    cancelled: 0,
    expired: 0,
    byTier: {} as Record<string, number>,  // Now dynamic
  };

  if (data?.subscriptions) {
    data.subscriptions.forEach((sub) => {
      summary.total++;
      if (sub.status === 'active') summary.active++;
      if (sub.status === 'trialing') summary.trialing++;
      if (sub.status === 'past_due') summary.pastDue++;
      if (sub.status === 'paused') summary.paused++;
      if (sub.status === 'cancelled') summary.cancelled++;
      if (sub.status === 'expired') summary.expired++;
      summary.byTier[sub.planTier] = (summary.byTier[sub.planTier] ?? 0) + 1;
    });
  }

  return { summary, isLoading };
};

/**
 * Hook: Combined subscription management — every action in one place
 */
export const useSubscriptionManagement = () => {
  const action = useSubscriptionAction();
  const bulkAction = useBulkSubscriptionAction();
  const exportSubs = useExportSubscriptions();

  return {
    // Single-subscription actions
    cancelSubscription: (id: string, reason?: string, immediately?: boolean) =>
      action.mutateAsync({ id, action: 'cancel', reason, immediately }),
    pauseSubscription: (id: string, reason?: string) =>
      action.mutateAsync({ id, action: 'pause', reason }),
    resumeSubscription: (id: string, reason?: string) =>
      action.mutateAsync({ id, action: 'resume', reason }),
    extendSubscription: (id: string, days: number, reason?: string) =>
      action.mutateAsync({ id, action: 'extend', days, reason }),
    markSubscriptionActive: (id: string) =>
      action.mutateAsync({ id, action: 'markActive' }),
    markSubscriptionPastDue: (id: string) =>
      action.mutateAsync({ id, action: 'markPastDue' }),

    // Bulk actions
    bulkAction: bulkAction.mutateAsync,

    // Export
    exportSubscriptions: exportSubs.mutateAsync,

    // Loading states
    isActioning: action.isPending,
    isBulkActioning: bulkAction.isPending,
    isExporting: exportSubs.isPending,

    // Errors
    actionError: action.error,
    bulkError: bulkAction.error,
    exportError: exportSubs.error,
  };
};