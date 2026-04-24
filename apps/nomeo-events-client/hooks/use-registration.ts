// hooks/useRegistration.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

export interface Registration {
  _id: string;
  registrationNumber: string;
  ticketNumber: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  attendeeAge?: number;
  attendeeGender?: string;
  attendeeCompany?: string;
  status: string;
  planType: string;
  planName: string;
  price: number;
  isGroupRegistration: boolean;
  groupSize?: number;
  paymentStatus: string;
  amountPaid: number;
  checkedIn: boolean;
  ageVerified: boolean;
  ageGroup?: string;
  parentalConsentProvided: boolean;
  registeredAt: string;
  eventId: {
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
    location: { venue: string; city: string; address: string };
    banner?: { secure_url: string };
    slug: string;
    ageRequirement?: {
      required: boolean;
      minAge?: number;
      maxAge?: number;
      requiresParentalConsent: boolean;
    };
  };
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
}

export const useRegistration = () => {
  const queryClient = useQueryClient();

  // Check eligibility before registration
  const useCheckEligibility = (eventId: string, email?: string, phone?: string, age?: number) => {
    return useQuery({
      queryKey: ['eligibility', eventId, email, phone, age],
      queryFn: async () => {
        if (!email && !phone) return null;
        const { data } = await axios.post(`/api/events/${eventId}/check-eligibility`, {
          email, phone, age
        });
        return data.data;
      },
      enabled: !!eventId && (!!email || !!phone),
      staleTime: 1000 * 30,
    });
  };

  // Register for event
  const useRegister = () => {
    return useMutation({
      mutationFn: async (data: {
        eventId: string;
        planType: string;
        attendeeName: string;
        attendeeEmail: string;
        attendeePhone?: string;
        attendeeAge?: number;
        attendeeGender?: string;
        attendeeCompany?: string;
        attendeeTitle?: string;
        parentalConsentProvided?: boolean;
        parentalConsentByName?: string;
        parentalConsentByEmail?: string;
        isGroupRegistration?: boolean;
        groupSize?: number;
        groupName?: string;
        groupMembers?: Array<{ name: string; email: string; age?: number; phone?: string }>;
        specialRequests?: string;
        dietaryRestrictions?: string[];
        accessibilityNeeds?: string[];
      }) => {
        const res = await axios.post(`/api/events/${data.eventId}/register`, data);
        return res.data;
      },
      onSuccess: (data) => {
        if (data.alreadyRegistered) {
          toast.error(data.error);
        } else {
          toast.success('Registration successful!');
          queryClient.invalidateQueries({ queryKey: ['registrations'] });
          queryClient.invalidateQueries({ queryKey: ['events', data.eventId] });
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Registration failed');
      }
    });
  };

  // Get user's registrations (authenticated users)
  const useUserRegistrations = (userId?: string, status?: string, upcoming?: boolean) => {
    return useQuery({
      queryKey: ['registrations', 'user', userId, status, upcoming],
      queryFn: async () => {
        if (!userId) return [];
        const { data } = await axios.get(`/api/users/${userId}/registrations`, {
          params: { status, upcoming }
        });
        return data.data as Registration[];
      },
      enabled: !!userId,
    });
  };

  // Get event registrations (organizer view)
  const useEventRegistrations = (eventId: string, status?: string, ageVerified?: boolean) => {
    return useQuery({
      queryKey: ['registrations', 'event', eventId, status, ageVerified],
      queryFn: async () => {
        const { data } = await axios.get(`/api/events/${eventId}/registrations`, {
          params: { status, ageVerified }
        });
        return data;
      },
      enabled: !!eventId,
    });
  };

  // Get single registration
  const useRegistration = (registrationId: string) => {
    return useQuery({
      queryKey: ['registrations', registrationId],
      queryFn: async () => {
        const { data } = await axios.get(`/api/registrations/${registrationId}`);
        return data.data as Registration;
      },
      enabled: !!registrationId,
    });
  };

  // Cancel registration
  const useCancelRegistration = () => {
    return useMutation({
      mutationFn: async ({ registrationId, reason }: { registrationId: string; reason?: string }) => {
        const { data } = await axios.delete(`/api/registrations/${registrationId}`, {
          params: { reason }
        });
        return data;
      },
      onSuccess: () => {
        toast.success('Registration cancelled successfully');
        queryClient.invalidateQueries({ queryKey: ['registrations'] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to cancel');
      }
    });
  };

  // Verify attendee age (organizer only)
  const useVerifyAge = () => {
    return useMutation({
      mutationFn: async ({ registrationId, ageVerified }: { registrationId: string; ageVerified: boolean }) => {
        const { data } = await axios.patch(`/api/registrations/${registrationId}/verify-age`, { ageVerified });
        return data;
      },
      onSuccess: () => {
        toast.success('Age verification updated');
        queryClient.invalidateQueries({ queryKey: ['registrations'] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to verify age');
      }
    });
  };

  // Check-in attendee (organizer only)
  const useCheckIn = () => {
    return useMutation({
      mutationFn: async (registrationId: string) => {
        const { data } = await axios.patch(`/api/registrations/${registrationId}/checkin`);
        return data;
      },
      onSuccess: () => {
        toast.success('Checked in successfully');
        queryClient.invalidateQueries({ queryKey: ['registrations'] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Check-in failed');
      }
    });
  };

  // Submit feedback
  const useSubmitFeedback = () => {
    return useMutation({
      mutationFn: async ({ registrationId, rating, feedback }: { registrationId: string; rating: number; feedback: string }) => {
        const { data } = await axios.post(`/api/registrations/${registrationId}/feedback`, { rating, feedback });
        return data;
      },
      onSuccess: () => {
        toast.success('Thank you for your feedback!');
        queryClient.invalidateQueries({ queryKey: ['registrations'] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to submit feedback');
      }
    });
  };

  return {
    useCheckEligibility,
    useRegister,
    useUserRegistrations,
    useEventRegistrations,
    useRegistration,
    useCancelRegistration,
    useVerifyAge,
    useCheckIn,
    useSubmitFeedback,
  };
};