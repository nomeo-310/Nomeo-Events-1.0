// hooks/usePayments.ts
import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData, type UseQueryOptions } from '@tanstack/react-query';

export enum PaymentPurpose {
  EVENT_REGISTRATION = 'event_registration',
  SUBSCRIPTION = 'subscription'
}

export enum PaymentGatewayStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  ABANDONED = 'abandoned',
  REVERSED = 'reversed'
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Payment {
  _id: string;
  purpose: PaymentPurpose;
  gatewayStatus: PaymentGatewayStatus;
  amount: number;
  amountPaid: number;
  discountAmount: number;
  currency: string;
  reference: string;
  paidAt?: string;
  channel?: string;
  gatewayResponse?: string;
  registrationId?: string;
  eventId?: string;
  subscriptionId?: string;
  planId?: string;
  couponCode?: string;
  couponDiscount?: number;
  refundedAt?: string;
  refundAmount?: number;
  refundReference?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

// New types for payment with plan details
export interface PricingBreakdown {
  originalKobo: number;
  originalAmountFormatted: string;
  discountKobo: number;
  discountAmountFormatted: string;
  finalKobo: number;
  finalAmountFormatted: string;
  discountPercentage: string;
  couponApplied?: {
    code: string;
    description?: string;
    discountType: string;
    discountValue: number;
    discountFormatted: string;
  } | null;
  discountApplied?: {
    name: string;
    description?: string;
    discountType: string;
    discountValue: number;
    discountFormatted: string;
  } | null;
}

export interface PlanFeature {
  name: string;
  description?: string;
  included: boolean;
  limit?: number;
  unit?: string;
  limitFormatted: string;
}

export interface PlanLimit {
  maxEvents?: number;
  maxEventsFormatted: string;
  maxAttendeesPerEvent?: number;
  maxAttendeesPerEventFormatted: string;
  maxTeamMembers?: number;
  maxTeamMembersFormatted: string;
  storageGb?: number;
  storageFormatted: string;
}

export interface PlanDiscount {
  name: string;
  description?: string;
  discountType: string;
  discountValue: number;
  discountFormatted: string;
  interval?: string;
  validPeriod: {
    startsAt?: string;
    endsAt?: string;
    isValid: boolean;
  };
}

export interface PlanCoupon {
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  discountFormatted: string;
  remainingRedemptions: string;
  minAmountRequired: string;
  applicableIntervals?: string[];
  expiresAt?: string;
  isExpired: boolean;
}

export interface PlanDetails {
  _id: string;
  name: string;
  slug: string;
  tier: string;
  description?: string;
  isActive: boolean;
  isPublic: boolean;
  pricing: {
    basePriceKobo: number;
    basePriceFormatted: string;
    currency: string;
    interval: string;
    intervalFormatted: string;
    isFree: boolean;
    trialDays: number;
    trialPeriodFormatted: string;
  };
  features: PlanFeature[];
  limits: PlanLimit;
  availableDiscounts: PlanDiscount[];
  availableCoupons: PlanCoupon[];
  sortOrder: number;
  metadata: Record<string, any>;
  paystackPlanCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentWithPlanDetails {
  payment: {
    _id: string;
    purpose: PaymentPurpose;
    provider: string;
    amount: {
      intended: number;
      intendedFormatted: string;
      paid: number;
      paidFormatted: string;
      discount: number;
      discountFormatted: string;
    };
    couponApplied: {
      code: string;
      discountValue?: number;
      discountFormatted: string | null;
    } | null;
    gateway: {
      status: PaymentGatewayStatus;
      reference: string;
      paystackReference?: string;
      channel?: string;
      response?: string;
      paidAt?: string;
    };
    paymentMethod: {
      type?: string;
      last4?: string;
      bank?: string;
      authorizationCode?: string;
    } | null;
    refund: {
      refundedAt?: string;
      amount?: number;
      amountFormatted: string | null;
      reference?: string;
      reason?: string;
    } | null;
    context: {
      registrationId?: string;
      eventId?: string;
      subscriptionId?: string;
      planId?: string;
    };
    createdAt: string;
    updatedAt: string;
  };
  planDetails: PlanDetails | null;
  pricingBreakdown: PricingBreakdown | null;
  summary: {
    planName: string;
    planTier: string;
    billingInterval: string;
    subtotal?: string;
    discount?: string;
    total?: string;
    amountPaid: string | null;
    paymentStatus: PaymentGatewayStatus;
    trialPeriod: string;
  } | null;
}

export interface PaymentWithPlanDetailsResponse {
  success: boolean;
  data: PaymentWithPlanDetails;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaymentsListResponse {
  success: boolean;
  payments: Payment[];
  pagination: Pagination;
}

export interface InitiatePaymentInput {
  purpose: PaymentPurpose;
  email: string;
  amount: number;
  currency?: string;
  couponCode?: string;
  couponDiscount?: number;
  discountAmount?: number;
  // Event registration
  registrationId?: string;
  eventId?: string;
  // Subscription
  subscriptionId?: string;
  planId?: string;
}

export interface InitiatePaymentResponse {
  paymentId: string;
  reference: string;
  accessCode: string;
  authorizationUrl: string;
}

export interface VerifyPaymentResponse {
  paymentId: string;
  reference: string;
  gatewayStatus: PaymentGatewayStatus;
  amount: number;
  amountPaid: number;
  currency: string;
  paidAt?: string;
  purpose: PaymentPurpose;
  channel?: string;
  gatewayResponse?: string;
}

export interface RefundInput {
  amount?: number; // kobo; omit for full refund
  reason?: string;
}

export interface RefundResponse {
  paymentId: string;
  refundAmount: number;
  refundReference: string;
  refundedAt: string;
  gatewayStatus: PaymentGatewayStatus;
}

export interface PaymentListFilters {
  purpose?: PaymentPurpose;
  gatewayStatus?: PaymentGatewayStatus;
  eventId?: string;
  registrationId?: string;
  subscriptionId?: string;
  page?: number;
  limit?: number;
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters: PaymentListFilters) => [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  detailWithPlan: (id: string) => [...paymentKeys.details(), id, 'with-plan'] as const,
  verify: (reference: string) => [...paymentKeys.all, 'verify', reference] as const
};

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message ?? 'Request failed');
  }
  return json;
}

function buildQuery(filters: PaymentListFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ─── Shared verify response type ──────────────────────────────────────────────

type VerifyResponse = { success: boolean; data: VerifyPaymentResponse };

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * List payments with optional filters + pagination.
 */
export function usePayments( filters: PaymentListFilters = {}, options?: Omit<UseQueryOptions<PaymentsListResponse>, 'queryKey' | 'queryFn'>) {
  return useQuery<PaymentsListResponse>({
    queryKey: paymentKeys.list(filters),
    queryFn: () => apiFetch<PaymentsListResponse>(`/api/payments${buildQuery(filters)}`),
    placeholderData: keepPreviousData,
    ...options
  });
}

/**
 * Get a single payment by ID.
 */
export function usePayment(id: string, options?: Omit<UseQueryOptions<{ success: boolean; data: Payment }>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: () => apiFetch<{ success: boolean; data: Payment }>(`/api/payments/${id}`),
    enabled: !!id,
    ...options
  });
}

/**
 * Get a single payment by ID with complete plan details.
 * Includes full plan information, pricing breakdown, features, limits, discounts, and coupons.
 * 
 * @example
 * const { data, isLoading } = usePaymentWithPlanDetails('payment_id_here');
 * 
 * // Access payment details
 * console.log(data?.data.payment.amount.paidFormatted);
 * 
 * // Access plan details
 * console.log(data?.data.planDetails?.pricing.intervalFormatted);
 * console.log(data?.data.planDetails?.features);
 * 
 * // Access pricing breakdown
 * console.log(data?.data.pricingBreakdown?.originalAmountFormatted);
 * console.log(data?.data.pricingBreakdown?.finalAmountFormatted);
 * 
 * // Access summary
 * console.log(data?.data.summary?.planName);
 */
export function usePaymentWithPlanDetails( id: string,  options?: Omit<UseQueryOptions<PaymentWithPlanDetailsResponse>, 'queryKey' | 'queryFn'>) {
  return useQuery<PaymentWithPlanDetailsResponse>({
    queryKey: paymentKeys.detailWithPlan(id),
    queryFn: () => apiFetch<PaymentWithPlanDetailsResponse>(`/api/payments/${id}/with-plan-details`),
    enabled: !!id,
    ...options
  });
}

/**
 * Verify a payment by reference (polling-friendly).
 *
 * React Query v5 dropped onSuccess from useQuery. Pass it here instead —
 * it is wired up via useEffect internally and is StrictMode-safe.
 *
 * @example
 * const { data } = useVerifyPayment(reference, {
 *   refetchInterval: (query) =>
 *     query.state.data?.data?.gatewayStatus === 'success' ? false : 3000,
 *   onSuccess: (data) => {
 *     if (data.data.gatewayStatus === 'success') doSomething();
 *   },
 * });
 */
export function useVerifyPayment( reference: string, options?: Omit<UseQueryOptions<VerifyResponse>, 'queryKey' | 'queryFn'> & { onSuccess?: (data: VerifyResponse) => void; }) {
  const { onSuccess, ...queryOptions } = options ?? {};

  const query = useQuery<VerifyResponse>({
    queryKey: paymentKeys.verify(reference),
    queryFn: () =>
      apiFetch<VerifyResponse>(`/api/payments/verify/${reference}`),
    enabled: !!reference,
    ...queryOptions,
  });

  // Replicate onSuccess safely for v5.
  // prevRef tracks last seen value so we don't double-fire in StrictMode.
  const prevRef = useRef<string>('');
  useEffect(() => {
    if (!query.data || !onSuccess || !query.isSuccess) return;
    const serialised = JSON.stringify(query.data);
    if (serialised === prevRef.current) return;
    prevRef.current = serialised;
    onSuccess(query.data);
  // onSuccess is intentionally excluded — callers should memoize if needed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, query.isSuccess]);

  return query;
}

/**
 * Initiate a payment — creates a Payment record and returns Paystack access_code.
 *
 * @example
 * const { mutate: initiatePayment } = useInitiatePayment();
 * initiatePayment(
 *   { purpose: PaymentPurpose.EVENT_REGISTRATION, email, amount, eventId },
 *   { onSuccess: ({ data }) => openModal(data.accessCode) }
 * );
 */
export function useInitiatePayment() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; data: InitiatePaymentResponse },
    Error,
    InitiatePaymentInput
  >({
    mutationFn: (input) =>
      apiFetch('/api/payments/initiate', {
        method: 'POST',
        body: JSON.stringify(input)
      }),
    onSuccess: () => {
      // Invalidate list so new pending payment appears
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    }
  });
}

/**
 * Refund a payment (full or partial).
 *
 * @example
 * const { mutate: refund } = useRefundPayment();
 * refund({ paymentId: '664abc...', amount: 50000, reason: 'Event cancelled' });
 */
export function useRefundPayment() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; message: string; data: RefundResponse },
    Error,
    { paymentId: string } & RefundInput
  >({
    mutationFn: ({ paymentId, ...body }) =>
      apiFetch(`/api/payments/${paymentId}/refund`, {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    onSuccess: (_data, { paymentId }) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.detail(paymentId) });
      queryClient.invalidateQueries({ queryKey: paymentKeys.detailWithPlan(paymentId) });
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    }
  });
}