// hooks/useEvents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

export interface Event {
  _id: string;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  type: string;
  status: string;
  startDate: string;
  timezone: string;
  eventMode: 'physical' | 'virtual' | 'hybrid';
  endDate: string;
  isPublic: boolean;
  isDeleted: boolean;
  isArchived: boolean;
  deletedAt?: string | null;
  archivedAt?: string | null;
  
  location?: {
    venue: string;
    address: string;
    city: string;
    country: string;
    notes?: string;
    googleMapsLink?: string;
  };
  organizerId: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  banner?: {
    secure_url: string;
    public_id: string;
  };
  gallery?: Array<{
    secure_url: string;
    public_id: string;
  }>;
  totalSeats: number;
  availableSeats: number;
  plans: Array<{
    type: string;
    name: string;
    price: number;
    currency: string;
    benefits: string[];
    availableSeats?: number;
    earlyBirdDeadline?: string;
  }>;
  featured: boolean;
  slug: string;
  registrationDeadline?: string;
  grouping?: 'upcoming' | 'ongoing' | 'completed';
}

// ====================== MAIN HOOK ======================
export const useEvents = () => {
  const queryClient = useQueryClient();

  // ================== PUBLIC QUERIES ==================

  // Main public events endpoint - Used for homepage, explore, category pages, etc.
  const usePublicEvents = (
    category?: string,
    type?: string,
    upcoming?: boolean,
    featured?: boolean,
    page = 1,
    limit = 12
  ) => {
    return useQuery({
      queryKey: ['events', 'public', category, type, upcoming, featured, page, limit],
      queryFn: async () => {
        const { data } = await axios.get('/api/events', {
          params: {
            category,
            type,
            upcoming,
            featured,
            page,
            limit
          }
        });
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  // Get single event by ID
  const useGetEvent = (eventId: string) => {
    return useQuery({
      queryKey: ['events', eventId],
      queryFn: async () => {
        const { data } = await axios.get(`/api/events/${eventId}`);
        return data.data as Event;
      },
      enabled: !!eventId,
    });
  };

  // Get single event by slug (for public event detail page)
  const useGetEventBySlug = (slug: string) => {
    return useQuery({
      queryKey: ['events', 'slug', slug],
      queryFn: async () => {
        const { data } = await axios.get(`/api/events/slug/${slug}`);
        return data.data as Event;
      },
      enabled: !!slug,
    });
  };

  // Get upcoming events for hero section
  const useHeroUpcomingEvents = (limit = 6, category?: string) => {
    return useQuery({
      queryKey: ['events', 'hero', 'upcoming', limit, category],
      queryFn: async () => {
        const { data } = await axios.get('/api/events', {
          params: { upcoming: true, limit, category }
        });
        return data.data as Event[];
      },
      staleTime: 10 * 60 * 1000,
    });
  };

  // Get featured events
  const useFeaturedEvents = (limit = 6) => {
    return useQuery({
      queryKey: ['events', 'featured', limit],
      queryFn: async () => {
        const { data } = await axios.get('/api/events', {
          params: { featured: true, limit }
        });
        return data.data as Event[];
      },
      staleTime: 15 * 60 * 1000,
    });
  };

  // Get events by category
  const useGetEventsByCategory = (category: string, limit = 12) => {
    return useQuery({
      queryKey: ['events', 'category', category, limit],
      queryFn: async () => {
        const { data } = await axios.get('/api/events', {
          params: { category, limit }
        });
        return data.data as Event[];
      },
      enabled: !!category,
    });
  };

  // ================== ORGANIZER QUERIES ==================

  const useOrganizerAllEvents = (
    status?: string,
    isDeleted?: boolean,
    isArchived?: boolean,
    upcoming?: boolean,
    page = 1,
    limit = 20
  ) => {
    return useQuery({
      queryKey: ['events', 'organizer', 'all', status, isDeleted, isArchived, upcoming, page, limit],
      queryFn: async () => {
        const { data } = await axios.get('/api/user/events', {
          params: {
            status,
            isDeleted,
            isArchived,
            upcoming,
            page,
            limit
          }
        });
        return data;
      },
    });
  };

  // ================== MUTATIONS ==================

  const useCreateEvent = () => {
    return useMutation({
      mutationFn: async (eventData: Partial<Event>) => {
        const { data } = await axios.post('/api/events', eventData);
        return data;
      },
      onSuccess: () => {
        toast.success('Event created successfully as Draft');
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['events', 'organizer'] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to create event');
      }
    });
  };

  const useUpdateEvent = () => {
    return useMutation({
      mutationFn: async ({ eventId, eventData }: { eventId: string; eventData: Partial<Event> }) => {
        const { data } = await axios.patch(`/api/events/${eventId}`, eventData);
        return data;
      },
      onSuccess: (_, variables) => {
        toast.success('Event updated successfully');
        queryClient.invalidateQueries({ queryKey: ['events', variables.eventId] });
        queryClient.invalidateQueries({ queryKey: ['events', 'organizer'] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update event');
      }
    });
  };

  const usePublishEvent = () => {
    return useMutation({
      mutationFn: async (eventId: string) => {
        const { data } = await axios.patch(`/api/events/${eventId}/action`, { action: 'publish' });
        return data;
      },
      onSuccess: () => {
        toast.success('Event published successfully!');
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['events', 'organizer'] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to publish event');
      }
    });
  };

  const useSoftDeleteEvent = () => {
    return useMutation({
      mutationFn: async (eventId: string) => {
        const { data } = await axios.patch(`/api/events/${eventId}/action`, { action: 'soft-delete' });
        return data;
      },
      onSuccess: () => {
        toast.success('Event moved to trash');
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['events', 'organizer'] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete event');
      }
    });
  };

  const useRestoreEvent = () => {
    return useMutation({
      mutationFn: async (eventId: string) => {
        const { data } = await axios.patch(`/api/events/${eventId}/action`, { action: 'restore' });
        return data;
      },
      onSuccess: () => {
        toast.success('Event restored successfully');
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['events', 'organizer'] });
      }
    });
  };

  const useArchiveEvent = () => {
    return useMutation({
      mutationFn: async (eventId: string) => {
        const { data } = await axios.patch(`/api/events/${eventId}/action`, { action: 'archive' });
        return data;
      },
      onSuccess: () => {
        toast.success('Event archived successfully');
        queryClient.invalidateQueries({ queryKey: ['events'] });
        queryClient.invalidateQueries({ queryKey: ['events', 'organizer'] });
      }
    });
  };

  return {
    usePublicEvents,
    useGetEvent,
    useGetEventBySlug,
    useHeroUpcomingEvents,
    useFeaturedEvents,
    useGetEventsByCategory,
    useOrganizerAllEvents,
    useCreateEvent,
    useUpdateEvent,
    usePublishEvent,
    useSoftDeleteEvent,
    useRestoreEvent,
    useArchiveEvent,
  };
};