/**
 * hooks/use-admin-payments.ts
 *
 * All admin payment hooks in one place.
 * Built on TanStack Query (react-query v5).
 *
 * Usage:
 *   import { usePayments, useRefundPayment, ... } from '@/hooks/use-admin-payments'
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  type UseQueryOptions,
} from '@tanstack/react-query';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentGatewayStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'abandoned'
  | 'reversed';

export type PaymentPurpose = 'event_registration' | 'subscription';

export type PaymentChannel =
  | 'card'
  | 'bank_transfer'
  | 'ussd'
  | 'qr'
  | 'mobile_money';

export interface Payment {
  _id: string;
  purpose: PaymentPurpose;
  reference: string;
  paystackReference?: string;
  gatewayStatus: PaymentGatewayStatus;
  gatewayResponse?: string;
  amount: number;
  amountPaid: number;
  discountAmount: number;
  currency: string;
  couponCode?: string;
  couponDiscount?: number;
  channel?: PaymentChannel;
  cardType?: string;
  cardLast4?: string;
  cardBank?: string;
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  refundReference?: string;
  eventId?: Record<string, any>;
  registrationId?: Record<string, any>;
  subscriptionId?: Record<string, any>;
  planId?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface StatsByStatus {
  _id: PaymentGatewayStatus;
  count: number;
  totalAmount: number;
  totalPaid: number;
  totalDiscount?: number;
}

export interface DailyTrend {
  date: string;   // "YYYY-MM-DD"
  count: number;
  totalPaid: number;
}

export interface CouponSummary {
  code: string;
  redemptions: number;
  totalDiscount: number;
  totalPaid: number;
  totalOriginal?: number;
  avgDiscountPct: number;
  byTier?: { tier: string; redemptions: number; totalDiscount: number }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared filter param types
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface DateRangeParams {
  dateFrom?: string;
  dateTo?: string;
}

export interface PaymentListParams extends PaginationParams, DateRangeParams {
  status?: PaymentGatewayStatus;
  purpose?: PaymentPurpose;
  channel?: PaymentChannel;
  search?: string;
}

export interface EventPaymentListParams extends PaginationParams, DateRangeParams {
  status?: PaymentGatewayStatus;
  search?: string;
}

export interface SubscriptionPaymentListParams extends PaginationParams, DateRangeParams {
  status?: PaymentGatewayStatus;
  search?: string;
}

export interface RefundPayload {
  refundReason: string;
  refundAmount?: number;      // kobo; omit to refund full amountPaid
  refundReference?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Query key factory — keeps cache keys consistent and makes targeted
// invalidation easy:  queryClient.invalidateQueries({ queryKey: paymentKeys.all })
// ─────────────────────────────────────────────────────────────────────────────

export const paymentKeys = {
  // top-level namespace
  all: ['admin', 'payments'] as const,

  // shared / cross-purpose
  lists:          (params?: PaymentListParams)  => [...paymentKeys.all, 'list',   params] as const,
  detail:         (id: string)                  => [...paymentKeys.all, 'detail', id]     as const,
  stats:          (params?: DateRangeParams)    => [...paymentKeys.all, 'stats',  params] as const,

  // event payments
  events: {
    all:      ['admin', 'payments', 'events'] as const,
    lists:    (params?: EventPaymentListParams) => [...paymentKeys.events.all, 'list',   params] as const,
    byEvent:  (eventId: string, params?: EventPaymentListParams) =>
                [...paymentKeys.events.all, 'byEvent', eventId, params] as const,
    stats:    (params?: DateRangeParams)        => [...paymentKeys.events.all, 'stats',  params] as const,
    eventStats: (eventId: string)               => [...paymentKeys.events.all, 'eventStats', eventId] as const,
    coupons:  (params?: DateRangeParams)        => [...paymentKeys.events.all, 'coupons', params] as const,
    byRegistration: (registrationId: string)    => [...paymentKeys.events.all, 'byRegistration', registrationId] as const,
  },

  // subscription payments
  subscriptions: {
    all:            ['admin', 'payments', 'subscriptions'] as const,
    lists:          (params?: SubscriptionPaymentListParams) =>
                      [...paymentKeys.subscriptions.all, 'list',   params] as const,
    bySubscription: (subscriptionId: string, params?: PaginationParams) =>
                      [...paymentKeys.subscriptions.all, 'bySubscription', subscriptionId, params] as const,
    stats:          (params?: DateRangeParams) => [...paymentKeys.subscriptions.all, 'stats',   params] as const,
    coupons:        (params?: DateRangeParams) => [...paymentKeys.subscriptions.all, 'coupons', params] as const,
    byPlan:         (planId: string, params?: PaginationParams & { status?: PaymentGatewayStatus }) =>
                      [...paymentKeys.subscriptions.all, 'byPlan', planId, params] as const,
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Internal fetcher helpers
// ─────────────────────────────────────────────────────────────────────────────

// Fixed: Accept any object and convert to Record<string, unknown>
function buildQuery(params: Record<string, unknown> | undefined): string {
  if (!params) return '';
  
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      qs.set(key, String(val));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

// Helper to convert any params object to Record<string, unknown>
function toRecord(obj: any): Record<string, unknown> {
  if (!obj) return {};
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null) {
      result[key] = obj[key];
    }
  }
  return result;
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error ?? `Request failed: ${res.status}`);
  }

  return json as T;
}

/** Triggers a CSV download from a Blob — works in Next.js client components */
async function downloadCSV(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as any)?.error ?? `Export failed: ${res.status}`);
  }
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}

// ─────────────────────────────────────────────────────────────────────────────
// ── SHARED / CROSS-PURPOSE HOOKS ─────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List all payments (across both event and subscription purposes).
 * Supports filtering by purpose, status, channel, search, and date range.
 *
 * @example
 * const { data } = usePayments({ purpose: 'event_registration', status: 'success' })
 */
export function usePayments(params?: PaymentListParams) {
  return useQuery({
    queryKey: paymentKeys.lists(params),
    queryFn:  () =>
      apiFetch<PaginatedResponse<Payment>>(
        `/api/admin/payments${buildQuery(toRecord(params))}`
      ),
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetch a single payment by ID.
 * Accessible to support-level admins — useful for customer support lookups.
 *
 * @example
 * const { data } = usePayment('64f1a2b3c4d5e6f7a8b9c0d1')
 */
export function usePayment(
  id: string,
  options?: Partial<UseQueryOptions<ApiResponse<Payment>>>
) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn:  () => apiFetch<ApiResponse<Payment>>(`/api/admin/payments/${id}`),
    enabled:  !!id,
    ...options,
  });
}

/**
 * Global payment stats: revenue totals, breakdown by status/purpose/channel,
 * and a 30-day daily trend.
 *
 * @example
 * const { data } = usePaymentStats({ dateFrom: '2025-01-01', dateTo: '2025-01-31' })
 */
export function usePaymentStats(params?: DateRangeParams) {
  return useQuery({
    queryKey: paymentKeys.stats(params),
    queryFn:  () =>
      apiFetch<ApiResponse<{
        summary: {
          totalRevenue: number;
          totalTransactions: number;
          totalRefunded: number;
          refundCount: number;
          totalDiscount: number;
        };
        byStatus:   StatsByStatus[];
        byPurpose:  { _id: PaymentPurpose; count: number; totalPaid: number; totalDiscount: number }[];
        byChannel:  { _id: string; count: number; totalPaid: number }[];
        dailyTrend: DailyTrend[];
      }>>(`/api/admin/payments/stats${buildQuery(toRecord(params))}`),
  });
}

/**
 * Refund a payment.
 * Only callable by super_admin — the API enforces this server-side.
 *
 * On success, automatically invalidates:
 *   - the refunded payment's detail cache
 *   - global and event/subscription list caches
 *
 * @example
 * const { mutate } = useRefundPayment()
 * mutate({ id: '...', refundReason: 'Customer requested', refundAmount: 50000 })
 */
export function useRefundPayment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & RefundPayload) =>
      apiFetch<ApiResponse<{ payment: Payment }>>(
        `/api/admin/payments/${id}/refund`,
        { method: 'POST', body: JSON.stringify(body) }
      ),

    onSuccess: (_, { id }) => {
      // Invalidate the specific payment detail
      qc.invalidateQueries({ queryKey: paymentKeys.detail(id) });
      // Invalidate all list + stat caches so totals reflect the refund
      qc.invalidateQueries({ queryKey: paymentKeys.all });
      qc.invalidateQueries({ queryKey: paymentKeys.events.all });
      qc.invalidateQueries({ queryKey: paymentKeys.subscriptions.all });
    },
  });
}

/**
 * Trigger a full-payments CSV download (max 10,000 rows).
 * Returns a mutate function — call it with optional filter params.
 *
 * @example
 * const { mutate: exportAll } = useExportPayments()
 * exportAll({ purpose: 'subscription', status: 'success' })
 */
export function useExportPayments() {
  return useMutation({
    mutationFn: (params?: Omit<PaymentListParams, 'page' | 'limit'>) =>
      downloadCSV(
        `/api/admin/payments/export${buildQuery(toRecord(params))}`,
        `payments-${new Date().toISOString().slice(0, 10)}.csv`
      ),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ── EVENT PAYMENT HOOKS ───────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List all event registration payments, paginated.
 *
 * @example
 * const { data } = useEventPayments({ status: 'success', page: 1 })
 */
export function useEventPayments(params?: EventPaymentListParams) {
  return useQuery({
    queryKey: paymentKeys.events.lists(params),
    queryFn:  () =>
      apiFetch<PaginatedResponse<Payment>>(
        `/api/admin/payments/events${buildQuery(toRecord(params))}`
      ),
    placeholderData: keepPreviousData,
  });
}

/**
 * All payments for a specific event.
 *
 * @example
 * const { data } = useEventPaymentsByEvent('64f1a2b3...', { status: 'success' })
 */
export function useEventPaymentsByEvent(
  eventId: string,
  params?: EventPaymentListParams
) {
  return useQuery({
    queryKey: paymentKeys.events.byEvent(eventId, params),
    queryFn:  () =>
      apiFetch<PaginatedResponse<Payment>>(
        `/api/admin/payments/events/${eventId}${buildQuery(toRecord(params))}`
      ),
    enabled:         !!eventId,
    placeholderData: keepPreviousData,
  });
}

/**
 * Aggregate stats across all event payments.
 * Includes top 10 revenue events, channel breakdown, and daily trend.
 *
 * @example
 * const { data } = useEventPaymentStats({ dateFrom: '2025-01-01' })
 */
export function useEventPaymentStats(params?: DateRangeParams) {
  return useQuery({
    queryKey: paymentKeys.events.stats(params),
    queryFn:  () =>
      apiFetch<ApiResponse<{
        summary: { totalRevenue: number; totalDiscount: number; count: number };
        topEvents:  { eventId: string; title: string; slug: string; totalPaid: number; count: number }[];
        byChannel:  { _id: string; count: number; totalPaid: number }[];
        dailyTrend: DailyTrend[];
      }>>(`/api/admin/payments/events/stats${buildQuery(toRecord(params))}`),
  });
}

/**
 * Revenue breakdown for a single event: totals by status, channel,
 * plan type, and coupon usage.
 *
 * @example
 * const { data } = useEventStats('64f1a2b3...')
 */
export function useEventStats(eventId: string) {
  return useQuery({
    queryKey: paymentKeys.events.eventStats(eventId),
    queryFn:  () =>
      apiFetch<ApiResponse<{
        summary:     { totalRevenue: number; totalTransactions: number; totalDiscount: number };
        byStatus:    StatsByStatus[];
        byChannel:   { _id: string; count: number; totalPaid: number }[];
        byPlanType:  { _id: string; count: number; totalPaid: number }[];
        couponUsage: { _id: string; redemptions: number; totalDiscount: number; totalPaid: number }[];
      }>>(`/api/admin/payments/events/${eventId}/stats`),
    enabled: !!eventId,
  });
}

/**
 * Coupon usage summary across all event registration payments.
 *
 * @example
 * const { data } = useEventCoupons({ dateFrom: '2025-01-01' })
 */
export function useEventCoupons(params?: DateRangeParams) {
  return useQuery({
    queryKey: paymentKeys.events.coupons(params),
    queryFn:  () =>
      apiFetch<ApiResponse<CouponSummary[]>>(
        `/api/admin/payments/events/coupons${buildQuery(toRecord(params))}`
      ),
  });
}

/**
 * Payment record linked to a specific registration.
 * Accessible to support-level admins.
 *
 * @example
 * const { data } = usePaymentByRegistration('64f1a2b3...')
 */
export function usePaymentByRegistration(registrationId: string) {
  return useQuery({
    queryKey: paymentKeys.events.byRegistration(registrationId),
    queryFn:  () =>
      apiFetch<ApiResponse<Payment>>(
        `/api/admin/payments/registrations/${registrationId}`
      ),
    enabled: !!registrationId,
  });
}

/**
 * Trigger a CSV download of event registration payments.
 *
 * @example
 * const { mutate: exportEvents } = useExportEventPayments()
 * exportEvents({ status: 'success', dateFrom: '2025-01-01' })
 */
export function useExportEventPayments() {
  return useMutation({
    mutationFn: (params?: Omit<EventPaymentListParams, 'page' | 'limit'>) =>
      downloadCSV(
        `/api/admin/payments/events/export${buildQuery(toRecord(params))}`,
        `event-payments-${new Date().toISOString().slice(0, 10)}.csv`
      ),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ── SUBSCRIPTION PAYMENT HOOKS ────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List all subscription payments, paginated.
 *
 * @example
 * const { data } = useSubscriptionPayments({ status: 'success', page: 2 })
 */
export function useSubscriptionPayments(params?: SubscriptionPaymentListParams) {
  return useQuery({
    queryKey: paymentKeys.subscriptions.lists(params),
    queryFn:  () =>
      apiFetch<PaginatedResponse<Payment>>(
        `/api/admin/payments/subscriptions${buildQuery(toRecord(params))}`
      ),
    placeholderData: keepPreviousData,
  });
}

/**
 * Full payment history for a specific subscription.
 *
 * @example
 * const { data } = useSubscriptionPaymentHistory('64f1a2b3...')
 */
export function useSubscriptionPaymentHistory(
  subscriptionId: string,
  params?: PaginationParams
) {
  return useQuery({
    queryKey: paymentKeys.subscriptions.bySubscription(subscriptionId, params),
    queryFn:  () =>
      apiFetch<PaginatedResponse<Payment>>(
        `/api/admin/payments/subscriptions/${subscriptionId}${buildQuery(toRecord(params))}`
      ),
    enabled:         !!subscriptionId,
    placeholderData: keepPreviousData,
  });
}

/**
 * Subscription payment analytics: MRR, ARR, breakdown by plan tier/interval,
 * failed vs successful, coupon usage, and daily trend.
 *
 * @example
 * const { data } = useSubscriptionStats()
 * // data.data.mrr  → current month MRR in kobo
 * // data.data.arr  → ARR estimate in kobo
 */
export function useSubscriptionStats(params?: DateRangeParams) {
  return useQuery({
    queryKey: paymentKeys.subscriptions.stats(params),
    queryFn:  () =>
      apiFetch<ApiResponse<{
        mrr:                   number;
        arr:                   number;
        mrrTransactionCount:   number;
        byStatus:              StatsByStatus[];
        byPlanTier:            { _id: { tier: string; interval: string }; count: number; totalPaid: number }[];
        topCoupons:            { _id: string; redemptions: number; totalDiscount: number }[];
        dailyTrend:            DailyTrend[];
      }>>(`/api/admin/payments/subscriptions/stats${buildQuery(toRecord(params))}`),
  });
}

/**
 * Coupon usage for subscription payments, broken down by plan tier.
 *
 * @example
 * const { data } = useSubscriptionCoupons({ dateFrom: '2025-01-01' })
 */
export function useSubscriptionCoupons(params?: DateRangeParams) {
  return useQuery({
    queryKey: paymentKeys.subscriptions.coupons(params),
    queryFn:  () =>
      apiFetch<ApiResponse<CouponSummary[]>>(
        `/api/admin/payments/subscriptions/coupons${buildQuery(toRecord(params))}`
      ),
  });
}

/**
 * All subscription payments for a specific plan, with MRR/ARR contribution
 * and a by-status revenue breakdown.
 *
 * @example
 * const { data } = usePlanPayments('64f1a2b3...', { status: 'success' })
 * // data.data.summary.mrr  → this plan's contribution to current month MRR
 */
export function usePlanPayments(
  planId: string,
  params?: PaginationParams & { status?: PaymentGatewayStatus }
) {
  return useQuery({
    queryKey: paymentKeys.subscriptions.byPlan(planId, params),
    queryFn:  () =>
      apiFetch<
        ApiResponse<{
          summary: {
            totalRevenue:  number;
            totalDiscount: number;
            mrr:           number;
            arr:           number;
            byStatus:      StatsByStatus[];
          };
        }> &
        PaginatedResponse<Payment>
      >(`/api/admin/payments/plans/${planId}${buildQuery(toRecord(params))}`),
    enabled:         !!planId,
    placeholderData: keepPreviousData,
  });
}

/**
 * Trigger a CSV download of subscription payments.
 *
 * @example
 * const { mutate: exportSubs } = useExportSubscriptionPayments()
 * exportSubs({ status: 'success' })
 */
export function useExportSubscriptionPayments() {
  return useMutation({
    mutationFn: (params?: Omit<SubscriptionPaymentListParams, 'page' | 'limit'>) =>
      downloadCSV(
        `/api/admin/payments/subscriptions/export${buildQuery(toRecord(params))}`,
        `subscription-payments-${new Date().toISOString().slice(0, 10)}.csv`
      ),
  });
}