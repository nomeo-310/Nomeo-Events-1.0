// hooks/use-plan-limits.ts
// ─────────────────────────────────────────────────────────────────────────────
// Frontend hook that fetches the active plan for the current user's subscription
// and returns structured limits via getPlanLimits().
//
// Usage:
//   const { limits, isLoading } = usePlanLimits();
//
//   // Guard a button
//   <button disabled={!limits?.canCreateTicketType(currentTicketTypes.length)}>
//     Add Ticket Type
//   </button>
//
//   // Show a message
//   {!limits?.canCreateTicketType(count) && (
//     <p>{getLimitMessage('ticket types', limits?.maxTicketTypes ?? 0, count)}</p>
//   )}
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useMemo } from 'react';
import { getPlanLimits, PlanLimits, PlanDoc } from '@/lib/plan-limits';

interface ActivePlanResponse {
  success: boolean;
  data: {
    plan: PlanDoc;
    subscription: {
      status: string;
      interval: string;
      currentPeriodEnd: string;
    };
  };
}

interface UsePlanLimitsReturn {
  limits:    PlanLimits | null;
  plan:      PlanDoc    | null;
  isLoading: boolean;
  isError:   boolean;
  error:     Error | null;
  refetch:   () => void;
}

export function usePlanLimits(): UsePlanLimitsReturn {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['active-plan-limits'],
    queryFn: async () => {
      const res = await axios.get<ActivePlanResponse>('/api/subscriptions/active-plan');
      if (!res.data.success) {
        throw new Error('Failed to fetch active plan');
      }
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime:    10 * 60 * 1000,
  });

  const limits = useMemo(() => {
    if (!data?.plan) return null;
    return getPlanLimits(data.plan);
  }, [data?.plan]);

  return {
    limits,
    plan:      data?.plan      ?? null,
    isLoading,
    isError,
    error:     error as Error | null,
    refetch,
  };
}

// ── Variant: pass a plan document directly (e.g. from pricing page preview) ──
export function usePlanLimitsFromDoc(plan: PlanDoc | null): PlanLimits | null {
  return useMemo(() => {
    if (!plan) return null;
    return getPlanLimits(plan);
  }, [plan]);
}