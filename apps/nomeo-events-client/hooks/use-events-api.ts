// hooks/use-events-api.ts
import axios from 'axios';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { Event } from '@/hooks/use-events';

export interface EventsApiResponse {
  success: boolean;
  data: Event[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  count: number;
}

export interface EventFilters {
  category?:  string;
  type?:      string;
  search?:    string;
  startDate?: Date;
  endDate?:   Date;
  // Typed as boolean | undefined — buildQueryString only sends flags === true
  upcoming?:  boolean;
  ongoing?:   boolean;
  completed?: boolean;
  featured?:  boolean;
  page?:      number;
  limit?:     number;
}

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30_000,
});

const buildQueryString = (filters: EventFilters): string => {
  const params = new URLSearchParams();

  if (filters.category)  params.append('category',  filters.category);
  if (filters.type)      params.append('type',       filters.type);
  if (filters.search?.trim()) params.append('search', filters.search.trim());

  // Dates sent as yyyy-MM-dd strings — the API parses them
  if (filters.startDate) params.append('startDate', format(filters.startDate, 'yyyy-MM-dd'));
  if (filters.endDate)   params.append('endDate',   format(filters.endDate,   'yyyy-MM-dd'));

  // Only send the status flag that is explicitly true
  if (filters.upcoming  === true) params.append('upcoming',  'true');
  if (filters.ongoing   === true) params.append('ongoing',   'true');
  if (filters.completed === true) params.append('completed', 'true');
  if (filters.featured  === true) params.append('featured',  'true');

  if (filters.page)  params.append('page',  String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

const fetchEvents = async (filters: EventFilters): Promise<EventsApiResponse> => {
  const response = await apiClient.get<EventsApiResponse>(`/events${buildQueryString(filters)}`);
  if (!response.data.success) throw new Error('Failed to fetch events');
  return response.data;
};

export const useEventsQuery = (
  filters: EventFilters,
  options?: Omit<UseQueryOptions<EventsApiResponse, Error>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery<EventsApiResponse, Error>({
    queryKey: ['events', filters],
    queryFn:  () => fetchEvents(filters),
    staleTime: 5  * 60 * 1000,
    gcTime:    10 * 60 * 1000,
    retry: 2,
    ...options,
  });
};