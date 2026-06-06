import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// ====================== TYPES ======================

// User Analytics
export interface UserAnalytics {
  total: number;
  verified: number;
  unverified: number;
  verificationRate: number;
  monthlyTrend: Array<{ label: string; count: number }>;
}

// Profile Analytics
export interface ProfileAnalytics {
  total: number;
  verified: number;
  byAccountType: Record<string, number>;
  byActiveStatus: Record<string, number>;
}

// Event Analytics
export interface EventAnalytics {
  total: number;
  deleted: number;
  featured: number;
  byStatus: Record<string, number>;
  avgRegistrationsPerEvent: number;
  topOrganizers: Array<{ name: string; eventCount: number }>;
  monthlyTrend: Array<{ label: string; count: number }>;
}

// Registration Analytics
export interface RegistrationAnalytics {
  total: number;
  groupRegistrations: number;
  byStatus: Record<string, number>;
  byPaymentStatus: Record<string, number>;
  totalRevenue: number;
  monthlyTrend: Array<{ label: string; count: number }>;
}

// Subscription Analytics
export interface SubscriptionAnalyticsData {
  total: number;
  active: number;
  cancelledThisMonth: number;
  churnRate: number;
  byStatus: Record<string, number>;
  byTier: Record<string, number>;
  byInterval: Record<string, number>;
  monthlyTrend: Array<{ label: string; count: number }>;
}

// Newsletter Analytics
export interface NewsletterAnalytics {
  totalSubscribers: number;
  activeSubscribers: number;
  unsubscribed: number;
  retentionRate: number;
  monthlySignupTrend: Array<{ label: string; count: number }>;
  campaigns: {
    total: number;
    byStatus: Record<string, number>;
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalFailed: number;
    openRate: number;
    clickRate: number;
  };
}

// Admin Analytics
export interface AdminAnalytics {
  total: number;
  active: number;
  suspended: number;
  loggedInThisMonth: number;
  byRole: Record<string, number>;
}

// Main Analytics Response
export interface AnalyticsResponse {
  generatedAt: string;
  period: {
    months: number;
    from: string;
    to: string;
  };
  users: UserAnalytics;
  profiles: ProfileAnalytics;
  events: EventAnalytics;
  registrations: RegistrationAnalytics;
  subscriptions: SubscriptionAnalyticsData;
  newsletter: NewsletterAnalytics;
  admins: AdminAnalytics;
}

// Analytics Period Options
export type AnalyticsPeriod = 1 | 3 | 6 | 12 | 24;

// Chart Data Types
export interface ChartDataPoint {
  label: string;
  count: number;
}

export interface RevenueChartDataPoint {
  label: string;
  revenue: number;
  registrations: number;
}

// ====================== API FUNCTIONS ======================

const analyticsApi = {
  /**
   * Get full analytics dashboard data
   * @param months - Number of months to look back (default: 6)
   */
  getAnalytics: async (months: AnalyticsPeriod = 6): Promise<AnalyticsResponse> => {
    const { data } = await axios.get<AnalyticsResponse>('/api/admin/analytics', {
      params: { months }
    });
    return data;
  },

  /**
   * Get user analytics only
   */
  getUserAnalytics: async (months: AnalyticsPeriod = 6): Promise<UserAnalytics> => {
    const { data } = await axios.get<AnalyticsResponse>('/api/admin/analytics', {
      params: { months }
    });
    return data.users;
  },

  /**
   * Get event analytics only
   */
  getEventAnalytics: async (months: AnalyticsPeriod = 6): Promise<EventAnalytics> => {
    const { data } = await axios.get<AnalyticsResponse>('/api/admin/analytics', {
      params: { months }
    });
    return data.events;
  },

  /**
   * Get registration analytics only
   */
  getRegistrationAnalytics: async (months: AnalyticsPeriod = 6): Promise<RegistrationAnalytics> => {
    const { data } = await axios.get<AnalyticsResponse>('/api/admin/analytics', {
      params: { months }
    });
    return data.registrations;
  },

  /**
   * Get subscription analytics only
   */
  getSubscriptionAnalytics: async (months: AnalyticsPeriod = 6): Promise<SubscriptionAnalyticsData> => {
    const { data } = await axios.get<AnalyticsResponse>('/api/admin/analytics', {
      params: { months }
    });
    return data.subscriptions;
  },

  /**
   * Get newsletter analytics only
   */
  getNewsletterAnalytics: async (months: AnalyticsPeriod = 6): Promise<NewsletterAnalytics> => {
    const { data } = await axios.get<AnalyticsResponse>('/api/admin/analytics', {
      params: { months }
    });
    return data.newsletter;
  },

  /**
   * Get admin analytics only
   */
  getAdminAnalytics: async (months: AnalyticsPeriod = 6): Promise<AdminAnalytics> => {
    const { data } = await axios.get<AnalyticsResponse>('/api/admin/analytics', {
      params: { months }
    });
    return data.admins;
  },
};

// ====================== QUERY KEYS ======================

export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (months: AnalyticsPeriod = 6) => [...analyticsKeys.all, 'dashboard', months] as const,
  users: (months: AnalyticsPeriod = 6) => [...analyticsKeys.all, 'users', months] as const,
  events: (months: AnalyticsPeriod = 6) => [...analyticsKeys.all, 'events', months] as const,
  registrations: (months: AnalyticsPeriod = 6) => [...analyticsKeys.all, 'registrations', months] as const,
  subscriptions: (months: AnalyticsPeriod = 6) => [...analyticsKeys.all, 'subscriptions', months] as const,
  newsletter: (months: AnalyticsPeriod = 6) => [...analyticsKeys.all, 'newsletter', months] as const,
  admins: (months: AnalyticsPeriod = 6) => [...analyticsKeys.all, 'admins', months] as const,
};

// ====================== QUERY HOOKS ======================

/**
 * Main hook: Get complete analytics dashboard
 * @param months - Number of months to look back (1, 3, 6, 12, 24)
 */
export const useAnalytics = (months: AnalyticsPeriod = 6) => {
  return useQuery({
    queryKey: analyticsKeys.dashboard(months),
    queryFn: () => analyticsApi.getAnalytics(months),
    staleTime: 1000 * 60 * 5, // 5 minutes - analytics don't change that often
    refetchOnWindowFocus: false,
    refetchInterval: 1000 * 60 * 15, // Refetch every 15 minutes
    select: (data) => ({
      ...data,
      // Add computed properties for convenience
      summary: {
        totalUsers: data.users.total,
        totalEvents: data.events.total,
        totalRegistrations: data.registrations.total,
        totalRevenue: data.registrations.totalRevenue,
        activeSubscribers: data.newsletter.activeSubscribers,
        campaignOpenRate: data.newsletter.campaigns.openRate,
        campaignClickRate: data.newsletter.campaigns.clickRate,
      }
    }),
  });
};

/**
 * Hook: Get user analytics only
 */
export const useUserAnalytics = (months: AnalyticsPeriod = 6) => {
  return useQuery({
    queryKey: analyticsKeys.users(months),
    queryFn: () => analyticsApi.getUserAnalytics(months),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook: Get event analytics only
 */
export const useEventAnalytics = (months: AnalyticsPeriod = 6) => {
  return useQuery({
    queryKey: analyticsKeys.events(months),
    queryFn: () => analyticsApi.getEventAnalytics(months),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook: Get registration analytics only
 */
export const useRegistrationAnalytics = (months: AnalyticsPeriod = 6) => {
  return useQuery({
    queryKey: analyticsKeys.registrations(months),
    queryFn: () => analyticsApi.getRegistrationAnalytics(months),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook: Get subscription analytics only
 */
export const useSubscriptionAnalytics = (months: AnalyticsPeriod = 6) => {
  return useQuery({
    queryKey: analyticsKeys.subscriptions(months),
    queryFn: () => analyticsApi.getSubscriptionAnalytics(months),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook: Get newsletter analytics only
 */
export const useNewsletterAnalytics = (months: AnalyticsPeriod = 6) => {
  return useQuery({
    queryKey: analyticsKeys.newsletter(months),
    queryFn: () => analyticsApi.getNewsletterAnalytics(months),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook: Get admin analytics only
 */
export const useAdminAnalytics = (months: AnalyticsPeriod = 6) => {
  return useQuery({
    queryKey: analyticsKeys.admins(months),
    queryFn: () => analyticsApi.getAdminAnalytics(months),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};

// ====================== CONVENIENCE HOOKS ======================

/**
 * Hook: Get summary statistics for dashboard cards
 */
export const useAnalyticsSummary = () => {
  const { data, isLoading, error } = useAnalytics(6);
  
  return {
    summary: data?.summary ?? {
      totalUsers: 0,
      totalEvents: 0,
      totalRegistrations: 0,
      totalRevenue: 0,
      activeSubscribers: 0,
      campaignOpenRate: 0,
      campaignClickRate: 0,
    },
    isLoading,
    error,
  };
};

/**
 * Hook: Get user growth chart data
 */
export const useUserGrowthData = (months: AnalyticsPeriod = 6) => {
  const { data, isLoading, error } = useAnalytics(months);
  
  return {
    chartData: data?.users.monthlyTrend ?? [],
    totalUsers: data?.users.total ?? 0,
    verificationRate: data?.users.verificationRate ?? 0,
    isLoading,
    error,
  };
};

/**
 * Hook: Get event trends and top organizers
 */
export const useEventTrends = (months: AnalyticsPeriod = 6) => {
  const { data, isLoading, error } = useAnalytics(months);
  
  return {
    eventTrends: data?.events.monthlyTrend ?? [],
    topOrganizers: data?.events.topOrganizers ?? [],
    totalEvents: data?.events.total ?? 0,
    featuredEvents: data?.events.featured ?? 0,
    avgRegistrationsPerEvent: data?.events.avgRegistrationsPerEvent ?? 0,
    isLoading,
    error,
  };
};

/**
 * Hook: Get revenue and registration trends
 */
export const useRevenueData = (months: AnalyticsPeriod = 6) => {
  const { data, isLoading, error } = useAnalytics(months);
  
  // Combine registration and revenue data for chart
  const revenueTrend: RevenueChartDataPoint[] = (data?.registrations.monthlyTrend ?? []).map((item, index) => ({
    label: item.label,
    revenue: 0, // You can add revenue by month from your API if available
    registrations: item.count,
  }));
  
  return {
    totalRevenue: data?.registrations.totalRevenue ?? 0,
    totalRegistrations: data?.registrations.total ?? 0,
    groupRegistrations: data?.registrations.groupRegistrations ?? 0,
    revenueTrend,
    registrationTrend: data?.registrations.monthlyTrend ?? [],
    byPaymentStatus: data?.registrations.byPaymentStatus ?? {},
    isLoading,
    error,
  };
};

/**
 * Hook: Get newsletter performance metrics
 */
export const useNewsletterPerformance = (months: AnalyticsPeriod = 6) => {
  const { data, isLoading, error } = useAnalytics(months);
  
  return {
    subscribers: {
      total: data?.newsletter.totalSubscribers ?? 0,
      active: data?.newsletter.activeSubscribers ?? 0,
      unsubscribed: data?.newsletter.unsubscribed ?? 0,
      retentionRate: data?.newsletter.retentionRate ?? 0,
      signupTrend: data?.newsletter.monthlySignupTrend ?? [],
    },
    campaigns: {
      total: data?.newsletter.campaigns.total ?? 0,
      totalSent: data?.newsletter.campaigns.totalSent ?? 0,
      totalOpened: data?.newsletter.campaigns.totalOpened ?? 0,
      totalClicked: data?.newsletter.campaigns.totalClicked ?? 0,
      openRate: data?.newsletter.campaigns.openRate ?? 0,
      clickRate: data?.newsletter.campaigns.clickRate ?? 0,
      byStatus: data?.newsletter.campaigns.byStatus ?? {},
    },
    isLoading,
    error,
  };
};

/**
 * Hook: Get subscription performance metrics
 */
export const useSubscriptionPerformance = (months: AnalyticsPeriod = 6) => {
  const { data, isLoading, error } = useAnalytics(months);
  
  return {
    subscriptions: {
      total: data?.subscriptions.total ?? 0,
      active: data?.subscriptions.active ?? 0,
      churnRate: data?.subscriptions.churnRate ?? 0,
      cancelledThisMonth: data?.subscriptions.cancelledThisMonth ?? 0,
      byStatus: data?.subscriptions.byStatus ?? {},
      byTier: data?.subscriptions.byTier ?? {},
      byInterval: data?.subscriptions.byInterval ?? {},
      trend: data?.subscriptions.monthlyTrend ?? [],
    },
    isLoading,
    error,
  };
};

/**
 * Hook: Get admin activity metrics
 */
export const useAdminActivity = (months: AnalyticsPeriod = 6) => {
  const { data, isLoading, error } = useAnalytics(months);
  
  return {
    admins: {
      total: data?.admins.total ?? 0,
      active: data?.admins.active ?? 0,
      suspended: data?.admins.suspended ?? 0,
      loggedInThisMonth: data?.admins.loggedInThisMonth ?? 0,
      byRole: data?.admins.byRole ?? {},
    },
    isLoading,
    error,
  };
};

// ====================== REFRESH HOOK ======================

/**
 * Hook: Manual refresh for analytics data
 */
export const useRefreshAnalytics = () => {
  const queryClient = useQueryClient();
  
  const refreshAll = (months?: AnalyticsPeriod) => {
    queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
  };
  
  const refreshDashboard = (months: AnalyticsPeriod = 6) => {
    queryClient.invalidateQueries({ queryKey: analyticsKeys.dashboard(months) });
  };
  
  const refreshUsers = (months: AnalyticsPeriod = 6) => {
    queryClient.invalidateQueries({ queryKey: analyticsKeys.users(months) });
  };
  
  const refreshEvents = (months: AnalyticsPeriod = 6) => {
    queryClient.invalidateQueries({ queryKey: analyticsKeys.events(months) });
  };
  
  const refreshNewsletter = (months: AnalyticsPeriod = 6) => {
    queryClient.invalidateQueries({ queryKey: analyticsKeys.newsletter(months) });
  };
  
  const refreshSubscriptions = (months: AnalyticsPeriod = 6) => {
    queryClient.invalidateQueries({ queryKey: analyticsKeys.subscriptions(months) });
  };
  
  return {
    refreshAll,
    refreshDashboard,
    refreshUsers,
    refreshEvents,
    refreshNewsletter,
    refreshSubscriptions,
  };
};

// ====================== COMBINED MANAGEMENT HOOK ======================

/**
 * Hook: Complete analytics management
 * Similar to useSubscriptionManagement pattern
 */
export const useAnalyticsManagement = () => {
  const [period, setPeriod] = useState<AnalyticsPeriod>(6);
  
  const analytics = useAnalytics(period);
  const userAnalytics = useUserAnalytics(period);
  const eventAnalytics = useEventAnalytics(period);
  const registrationAnalytics = useRegistrationAnalytics(period);
  const subscriptionAnalytics = useSubscriptionAnalytics(period);
  const newsletterAnalytics = useNewsletterAnalytics(period);
  const adminAnalytics = useAdminAnalytics(period);
  const { refreshAll, refreshDashboard } = useRefreshAnalytics();
  
  return {
    // Data
    analytics: analytics.data,
    userAnalytics: userAnalytics.data,
    eventAnalytics: eventAnalytics.data,
    registrationAnalytics: registrationAnalytics.data,
    subscriptionAnalytics: subscriptionAnalytics.data,
    newsletterAnalytics: newsletterAnalytics.data,
    adminAnalytics: adminAnalytics.data,
    
    // Loading states
    isLoading: 
      analytics.isLoading ||
      userAnalytics.isLoading ||
      eventAnalytics.isLoading ||
      registrationAnalytics.isLoading ||
      subscriptionAnalytics.isLoading ||
      newsletterAnalytics.isLoading ||
      adminAnalytics.isLoading,
    
    // Errors
    error: 
      analytics.error ||
      userAnalytics.error ||
      eventAnalytics.error ||
      registrationAnalytics.error ||
      subscriptionAnalytics.error ||
      newsletterAnalytics.error ||
      adminAnalytics.error,
    
    // Period control
    period,
    setPeriod: (newPeriod: AnalyticsPeriod) => {
      setPeriod(newPeriod);
    },
    
    // Refresh actions
    refresh: refreshAll,
    refreshDashboard: () => refreshDashboard(period),
  };
};

// Import useState for the management hook
import { useState } from 'react';