import axios from 'axios';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useRef } from 'react';

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export enum EventStatus {
  DRAFT     = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  ARCHIVED  = 'archived',
}

export enum EventCategory {
  WEBINAR           = 'webinar',
  SEMINAR           = 'seminar',
  ENTERTAINMENT     = 'entertainment',
  FILM_SHOW         = 'film_show',
  SCIENCE_TECH      = 'science_tech',
  SCHOOL_ACTIVITIES = 'school_activities',
  SPIRITUALITY      = 'spirituality',
  FASHION           = 'fashion',
  BUSINESS          = 'business',
  SPORTS            = 'sports',
  HEALTH_WELLNESS   = 'health_wellness',
  ART_CULTURE       = 'art_culture',
  FOOD_DRINK        = 'food_drink',
  NETWORKING        = 'networking',
  CHARITY           = 'charity',
}

export enum EventMode {
  PHYSICAL = 'physical',
  VIRTUAL  = 'virtual',
  HYBRID   = 'hybrid',
}

export enum PlanType {
  REGULAR    = 'regular',
  VIP        = 'vip',
  PREMIUM    = 'premium',
  GROUP      = 'group',
  EARLY_BIRD = 'early_bird',
  STUDENT    = 'student',
  CORPORATE  = 'corporate',
}

// ─── DOMAIN TYPES ─────────────────────────────────────────────────────────────

export type SortOrder = 'asc' | 'desc';

export interface FetchEventsParams {
  page?: number;
  limit?: number;
  status?: EventStatus;
  category?: EventCategory;
  eventMode?: EventMode;
  featured?: boolean;
  search?: string;
  startAfter?: string;
  startBefore?: string;
  sortBy?: 'startDate' | 'createdAt' | 'title' | 'availableSeats';
  sortOrder?: SortOrder;
}

export interface RegistrationStats {
  total: number;
  pending: number;
  confirmed: number;
  attended: number;
  cancelled: number;
  waitlisted: number;
  refunded: number;
  projectedRevenue: number;
  confirmedRevenue: number;
}

export interface AdminEventRow {
  _id: string;
  title: string;
  slug: string;
  category: EventCategory;
  type: string;
  status: EventStatus;
  startDate: string;
  endDate: string;
  eventMode: EventMode;
  totalSeats: number;
  availableSeats: number;
  isPublic: boolean;
  featured: boolean;
  isDeleted: boolean;
  isArchived: boolean;
  waitlistEnabled: boolean;
  requiresApproval: boolean;
  organizerId: { _id: string; name: string; email: string; avatar?: string };
  createdBy: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
  registrationStats: RegistrationStats;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AdminEventsListResponse {
  data: AdminEventRow[];
  pagination: Pagination;
}

export interface StatusStat { count: number; revenue: number }

export interface AdminEventDetail {
  event: AdminEventRow & {
    description: string;
    shortDescription: string;
    speakers: unknown[];
    plans?: unknown[];
    tags: string[];
    location?: Record<string, string>;
    ageRequirement?: Record<string, unknown>;
    banner?: { secure_url: string; public_id: string; alt?: string };
  };
  statistics: {
    byStatus: {
      pending: StatusStat;
      confirmed: StatusStat;
      attended: StatusStat;
      cancelled: StatusStat;
      waitlisted: StatusStat;
      refunded: StatusStat;
    };
    byPlan: Array<{
      _id: string;
      planName: string;
      count: number;
      price: number;
      projectedRevenue: number;
      confirmedRevenue: number;
    }>;
    revenue: { projected: number; confirmed: number; refunded: number; currency: string };
    totals: {
      registrations: number;
      groupRegistrations: number;
      corporateRegistrations: number;
      certificatesIssued: number;
      feedbackCount: number;
      avgRating: number | null;
    };
  };
  recentRegistrations: AdminRegistrationRow[];
}

export interface FetchRegistrationsParams {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  planType?: PlanType;
  search?: string;
  sortBy?: 'createdAt' | 'attendeeName' | 'price' | 'status';
  sortOrder?: SortOrder;
}

export interface AdminRegistrationRow {
  _id: string;
  registrationNumber: string;
  attendeeName: string;
  attendeeEmail: string;
  status: string;
  planType: string;
  planName: string;
  price: number;
  paymentStatus: string;
  createdAt: string;
}

export interface AdminEventRegistrationsResponse {
  event: { _id: string; title: string; slug: string };
  data: AdminRegistrationRow[];
  pagination: Pagination;
}

export interface AdminEventsStats {
  events: {
    total: number;
    byStatus: Record<string, number>;
    grouping: { upcoming: number; ongoing: number; past: number };
  };
  registrations: { total: number; byStatus: Record<string, number> };
  revenue: { confirmed: number; projected: number; refunded: number; currency: string };
  categoryBreakdown: Array<{ _id: string; count: number }>;
}

export type EventAction =
  | 'publish'
  | 'unpublish'
  | 'cancel'
  | 'archive'
  | 'restore'
  | 'soft-delete'
  | 'feature'
  | 'unfeature'
  | 'make-public'
  | 'make-private'
  | 'enable-waitlist'
  | 'disable-waitlist'
  | 'enable-approval'
  | 'disable-approval'
  | 'update-seats'
  | 'confirm-all-registrations'
  | 'cancel-all-registrations'
  | 'issue-all-certificates';

export interface UpdateSeatsBody   { totalSeats?: number; availableSeats?: number }
export interface CancelEventBody   { cancelRegistrations?: boolean }
export interface CancelAllRegsBody { reason?: string }

export interface ActionResult {
  message: string;
  [key: string]: unknown;
}

export interface EventActionVariables {
  eventId: string;
  action: EventAction;
  body?: Record<string, unknown>;
}

// ─── Simple callback shape — avoids all TQ v5 callback arity issues ───────────
export interface ActionCallbacks {
  onSuccess?: (data: ActionResult) => void;
  onError?: (error: Error) => void;
}

// ─── AXIOS INSTANCE ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api/admin/events',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ─── QUERY KEY FACTORY ────────────────────────────────────────────────────────

export const adminEventKeys = {
  all:           ['admin', 'events'] as const,
  lists:         () => [...adminEventKeys.all, 'list'] as const,
  list:          (params: FetchEventsParams) => [...adminEventKeys.lists(), params] as const,
  stats:         () => [...adminEventKeys.all, 'stats'] as const,
  details:       () => [...adminEventKeys.all, 'detail'] as const,
  detail:        (id: string) => [...adminEventKeys.details(), id] as const,
  registrations: (id: string, params: FetchRegistrationsParams) =>
    [...adminEventKeys.detail(id), 'registrations', params] as const,
};

// ─── API FUNCTIONS ────────────────────────────────────────────────────────────

const adminEventsApi = {
  getList: (params: FetchEventsParams) =>
    api.get<AdminEventsListResponse>('', { params }).then((r) => r.data),

  getStats: () =>
    api.get<AdminEventsStats>('/stats').then((r) => r.data),

  getDetail: (eventId: string) =>
    api.get<AdminEventDetail>(`/${eventId}`).then((r) => r.data),

  getRegistrations: (eventId: string, params: FetchRegistrationsParams) =>
    api
      .get<AdminEventRegistrationsResponse>(`/${eventId}/registrations`, { params })
      .then((r) => r.data),

  // ── The key insight: invalidations + caller callbacks live inside mutationFn,
  //    not in onSuccess/onError, so there are zero TQ callback arity issues. ──
  runAction: async (
    { eventId, action, body = {} }: EventActionVariables,
    invalidate: (eventId: string, extraKeys?: readonly unknown[][]) => void,
    callbacks: ActionCallbacks,
  ): Promise<ActionResult> => {
    try {
      const data = await api
        .post<ActionResult>(`/${eventId}/actions/${action}`, body)
        .then((r) => r.data);
      invalidate(eventId);
      callbacks.onSuccess?.(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      callbacks.onError?.(error);
      throw error;
    }
  },
};

// ─── QUERY HOOKS ──────────────────────────────────────────────────────────────

export function useAdminEvents(
  params: FetchEventsParams = {},
  options?: Omit<UseQueryOptions<AdminEventsListResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: adminEventKeys.list(params),
    queryFn: () => adminEventsApi.getList(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    ...options,
  });
}

export function useAdminEventsStats(
  options?: Omit<UseQueryOptions<AdminEventsStats>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: adminEventKeys.stats(),
    queryFn: adminEventsApi.getStats,
    staleTime: 60_000,
    ...options,
  });
}

export function useAdminEvent(
  eventId: string | null | undefined,
  options?: Omit<UseQueryOptions<AdminEventDetail>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: adminEventKeys.detail(eventId ?? ''),
    queryFn: () => adminEventsApi.getDetail(eventId!),
    enabled: !!eventId,
    staleTime: 30_000,
    ...options,
  });
}

export function useAdminEventRegistrations(
  eventId: string | null | undefined,
  params: FetchRegistrationsParams = {},
  options?: Omit<UseQueryOptions<AdminEventRegistrationsResponse>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: adminEventKeys.registrations(eventId ?? '', params),
    queryFn: () => adminEventsApi.getRegistrations(eventId!, params),
    enabled: !!eventId,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    ...options,
  });
}

// ─── BASE ACTION MUTATION ─────────────────────────────────────────────────────
//
// Strategy: mutationFn itself handles invalidations and caller callbacks so we
// never touch TQ's onSuccess / onError slots at all — zero arity issues.

export function useAdminEventAction(callbacks: ActionCallbacks = {}) {
  const qc = useQueryClient();

  // Keep callbacks in a ref so mutationFn always sees the latest values
  // without needing to be re-created on every render.
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  const invalidate = (eventId: string, extraKeys: readonly unknown[][] = []) => {
    qc.invalidateQueries({ queryKey: adminEventKeys.detail(eventId) });
    qc.invalidateQueries({ queryKey: adminEventKeys.lists() });
    qc.invalidateQueries({ queryKey: adminEventKeys.stats() });
    for (const key of extraKeys) {
      qc.invalidateQueries({ queryKey: key, exact: false });
    }
  };

  return useMutation<ActionResult, Error, EventActionVariables>({
    mutationFn: (variables) =>
      adminEventsApi.runAction(variables, invalidate, cbRef.current),
  });
}

// ─── TYPED CONVENIENCE HOOKS ──────────────────────────────────────────────────

function makeActionHook(action: EventAction) {
  return (callbacks: ActionCallbacks = {}) => {
    const mutation = useAdminEventAction(callbacks);
    return {
      ...mutation,
      mutate: (eventId: string, body?: Record<string, unknown>) =>
        mutation.mutate({ eventId, action, body }),
      mutateAsync: (eventId: string, body?: Record<string, unknown>) =>
        mutation.mutateAsync({ eventId, action, body }),
    };
  };
}

export const usePublishEvent            = makeActionHook('publish');
export const useUnpublishEvent          = makeActionHook('unpublish');
export const useArchiveEvent            = makeActionHook('archive');
export const useRestoreEvent            = makeActionHook('restore');
export const useSoftDeleteEvent         = makeActionHook('soft-delete');
export const useFeatureEvent            = makeActionHook('feature');
export const useUnfeatureEvent          = makeActionHook('unfeature');
export const useMakePublicEvent         = makeActionHook('make-public');
export const useMakePrivateEvent        = makeActionHook('make-private');
export const useEnableWaitlist          = makeActionHook('enable-waitlist');
export const useDisableWaitlist         = makeActionHook('disable-waitlist');
export const useEnableApproval          = makeActionHook('enable-approval');
export const useDisableApproval         = makeActionHook('disable-approval');
export const useConfirmAllRegistrations = makeActionHook('confirm-all-registrations');
export const useIssueAllCertificates    = makeActionHook('issue-all-certificates');

export function useCancelEvent(callbacks: ActionCallbacks = {}) {
  const mutation = useAdminEventAction(callbacks);
  return {
    ...mutation,
    mutate: (eventId: string, body: CancelEventBody = {}) =>
      mutation.mutate({ eventId, action: 'cancel', body: body as Record<string, unknown> }),
    mutateAsync: (eventId: string, body: CancelEventBody = {}) =>
      mutation.mutateAsync({ eventId, action: 'cancel', body: body as Record<string, unknown> }),
  };
}

export function useUpdateSeats(callbacks: ActionCallbacks = {}) {
  const mutation = useAdminEventAction(callbacks);
  return {
    ...mutation,
    mutate: (eventId: string, body: UpdateSeatsBody) =>
      mutation.mutate({ eventId, action: 'update-seats', body: body as Record<string, unknown> }),
    mutateAsync: (eventId: string, body: UpdateSeatsBody) =>
      mutation.mutateAsync({ eventId, action: 'update-seats', body: body as Record<string, unknown> }),
  };
}

// useCancelAllRegistrations also busts the registrations cache for the event.
export function useCancelAllRegistrations(callbacks: ActionCallbacks = {}) {
  const qc = useQueryClient();
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  const invalidate = (eventId: string) => {
    qc.invalidateQueries({ queryKey: adminEventKeys.detail(eventId) });
    qc.invalidateQueries({ queryKey: adminEventKeys.lists() });
    qc.invalidateQueries({ queryKey: adminEventKeys.stats() });
    // Also bust all registration pages for this event
    qc.invalidateQueries({
      queryKey: [...adminEventKeys.detail(eventId), 'registrations'],
      exact: false,
    });
  };

  const mutation = useMutation<ActionResult, Error, EventActionVariables>({
    mutationFn: (variables) =>
      adminEventsApi.runAction(variables, invalidate, cbRef.current),
  });

  return {
    ...mutation,
    mutate: (eventId: string, body: CancelAllRegsBody = {}) =>
      mutation.mutate({ eventId, action: 'cancel-all-registrations', body: body as Record<string, unknown> }),
    mutateAsync: (eventId: string, body: CancelAllRegsBody = {}) =>
      mutation.mutateAsync({ eventId, action: 'cancel-all-registrations', body: body as Record<string, unknown> }),
  };
}