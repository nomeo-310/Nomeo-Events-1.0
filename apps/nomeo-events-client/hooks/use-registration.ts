// hooks/useRegistration.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

// ─── Registration Status Enum ───────────────────────────────────────────────
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'attended' | 'waitlisted' | 'refunded';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partial';

// ─── Core Registration type (matches schema) ─────────────────────────────────
export interface Registration {
  _id: string;
  registrationNumber: string;
  
  // Event reference
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
      allowedAgeGroups?: string[];
    };
    organizerId?: string;
  };
  
  // References (optional - not in schema but might be populated)
  paymentId?: string;
  ticketId?: string;
  
  // Status fields
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  
  // Plan information
  planType: string;
  planName: string;
  price: number;
  currency: string;
  
  // Attendee information
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  attendeeGender?: string;
  attendeeCompany?: string;
  attendeeTitle?: string;
  attendeeAge?: number;
  
  // Age verification
  ageVerified: boolean;
  ageVerifiedAt?: string;
  ageVerifiedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  ageGroup?: string;
  
  // Parental consent
  parentalConsentProvided: boolean;
  parentalConsentAt?: string;
  parentalConsentByName?: string;
  parentalConsentByEmail?: string;
  
  // Special requirements
  specialRequests?: string;
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
  
  // Group registration
  isGroupRegistration: boolean;
  groupSize?: number;
  groupName?: string;
  groupMembers?: Array<{
    name: string;
    email: string;
    age?: number;
    phone?: string;
  }>;
  
  // Corporate registration
  isCorporateRegistration: boolean;
  companyName?: string;
  companySize?: number;
  companyMembers?: Array<{
    name: string;
    email: string;
    age?: number;
    phone?: string;
  }>;
  
  // Feedback and certificates
  feedbackSubmitted: boolean;
  certificateIssued: boolean;
  rating?: number;
  feedback?: string;
  
  // Metadata
  metadata?: Record<string, any>;
  
  // Timestamps
  registeredAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledBy?: string;
}

// ─── Register mutation input ───────────────────────────────────────────────────
export interface RegisterInput {
  eventId: string;
  planType: string;
  planName: string;
  price: number;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  attendeeAge?: number;
  attendeeGender?: string;
  attendeeCompany?: string;
  attendeeTitle?: string;
  paymentReference?: string; 
  paymentStatus?: string;
  parentalConsentProvided?: boolean;
  parentalConsentByName?: string;
  parentalConsentByEmail?: string;
  isGroupRegistration?: boolean;
  groupSize?: number;
  groupName?: string;
  groupMembers?: Array<{ name: string; email: string; age?: number; phone?: string }>;
  isCorporateRegistration?: boolean;
  companyName?: string;
  companySize?: number;
  companyMembers?: Array<{ name: string; email: string; age?: number; phone?: string }>;
  specialRequests?: string;
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
}

// ─── Bulk operation input ───────────────────────────────────────────────────
export interface BulkOperationInput {
  action: 'checkin' | 'cancel' | 'delete' | 'verify-age' | 'update-payment-status' | 'issue-certificate' | 'mark-attended';
  eventId: string;
  registrationIds: string[];
  data?: {
    reason?: string;
    paymentStatus?: PaymentStatus;
  };
}

// ─── Update registration input ───────────────────────────────────────────────────
export interface UpdateRegistrationInput {
  action?: 'checkin' | 'verify-age' | 'provide-parental-consent' | 'update-payment-status' | 'issue-certificate' | 'submit-feedback' | 'update-attendee-info';
  attendeePhone?: string;
  attendeeCompany?: string;
  attendeeTitle?: string;
  specialRequests?: string;
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
  paymentStatus?: PaymentStatus;
  rating?: number;
  feedback?: string;
  parentalConsentByName?: string;
  parentalConsentByEmail?: string;
}

// ─── Initiate cancellation input ──────────────────────────────────────────────
export interface InitiateCancellationInput {
  email: string;
  eventId: string;
}

// ─── Confirm cancellation input ──────────────────────────────────────────────
export interface ConfirmCancellationInput {
  email: string;
  eventId: string;
  otp: string;
  reason?: string;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
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

  // Register for event — returns registrationId + registrationNumber
  const useRegister = () => {
    return useMutation({
      mutationFn: async (input: RegisterInput) => {
        const { data } = await axios.post(`/api/events/${input.eventId}/register`, input);
        return data as {
          success: boolean;
          message: string;
          data: { registrationId: string; registrationNumber: string };
        };
      },
      onSuccess: (_, variables) => {
        toast.success('Registration successful!');
        queryClient.invalidateQueries({ queryKey: ['registrations'] });
        queryClient.invalidateQueries({ queryKey: ['events', variables.eventId] });
      },
      onError: (error: any) => {
        const message = error.response?.data?.error || 'Registration failed';
        const alreadyRegistered = error.response?.data?.alreadyRegistered;
        toast.error(alreadyRegistered ? 'You are already registered for this event' : message);
      }
    });
  };

  // Get user's registrations (by email since no account)
  const useUserRegistrations = (email?: string, status?: string) => {
    return useQuery({
      queryKey: ['registrations', 'user', email, status],
      queryFn: async () => {
        if (!email) return [];
        const { data } = await axios.get(`/api/registrations/user/${encodeURIComponent(email)}`, {
          params: { status }
        });
        return data.data as Registration[];
      },
      enabled: !!email,
    });
  };

  // Get event registrations (organizer view) - UPDATED to match our endpoint
  const useEventRegistrations = ( eventId: string, filters?: {
      status?: RegistrationStatus;
      paymentStatus?: PaymentStatus;
      ageVerified?: boolean;
      planType?: string;
      isGroup?: boolean;
      isCorporate?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    if (filters?.ageVerified !== undefined) params.append('ageVerified', String(filters.ageVerified));
    if (filters?.planType) params.append('planType', filters.planType);
    if (filters?.isGroup !== undefined) params.append('isGroup', String(filters.isGroup));
    if (filters?.isCorporate !== undefined) params.append('isCorporate', String(filters.isCorporate));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    
    return useQuery({
      queryKey: ['registrations', 'event', eventId, filters],
      queryFn: async () => {
        const { data } = await axios.get(`/api/events/${eventId}/registrations${params.toString() ? `?${params.toString()}` : ''}`);
        return data as {
          success: boolean;
          data: Registration[];
          stats: any;
          pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
          };
        };
      },
      enabled: !!eventId,
    });
  };

  // Get single registration (updated to match our GET endpoint)
  const useGetRegistration = (registrationId: string) => {
    return useQuery({
      queryKey: ['registrations', registrationId],
      queryFn: async () => {
        const { data } = await axios.get(`/api/registrations/${registrationId}`);
        return data.data as Registration;
      },
      enabled: !!registrationId,
    });
  };

  // Update registration (single) - UPDATED to use our PATCH endpoint
  const useUpdateRegistration = () => {
    return useMutation({
      mutationFn: async ({ registrationId, updateData }: { registrationId: string; updateData: UpdateRegistrationInput }) => {
        const { data } = await axios.patch(`/api/registrations/${registrationId}`, updateData);
        return data as {
          success: boolean;
          message: string;
          data: Registration;
        };
      },
      onSuccess: (_, variables) => {
        toast.success('Registration updated successfully');
        queryClient.invalidateQueries({ queryKey: ['registrations', variables.registrationId] });
        queryClient.invalidateQueries({ queryKey: ['registrations', 'event'] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update registration');
      }
    });
  };

  // Cancel registration (single) - UPDATED to use our DELETE endpoint
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
        toast.error(error.response?.data?.error || 'Failed to cancel registration');
      }
    });
  };

  // ─── NEW: Initiate cancellation (request OTP) ──────────────────────────────────
  const useInitiateCancellation = () => {
    return useMutation({
      mutationFn: async (input: InitiateCancellationInput) => {
        const { data } = await axios.post('/api/registrations/initiate-cancellation', input);
        return data as {
          success: boolean;
          message: string;
        };
      },
      onSuccess: (data) => {
        toast.success(data.message || 'Cancellation code sent to your email');
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Failed to initiate cancellation';
        const status = error.response?.status;
        
        if (status === 429) {
          toast.error(message); // Rate limiting message
        } else if (status === 403) {
          toast.error(message); // Group/corporate member restriction
        } else if (status === 409) {
          toast.error(message); // Already cancelled
        } else {
          toast.error(message);
        }
      }
    });
  };

  // ─── NEW: Confirm cancellation (verify OTP) ─────────────────────────────────────
  const useConfirmCancellation = () => {
    return useMutation({
      mutationFn: async (input: ConfirmCancellationInput) => {
        const { data } = await axios.post('/api/registrations/confirm-cancellation', input);
        return data as {
          success: boolean;
          message: string;
          data?: {
            registrationNumber: string;
            cancelledAt: string;
            cascadedCancellations?: number;
            note?: string;
          };
        };
      },
      onSuccess: (data, variables) => {
        toast.success(data.message || 'Registration cancelled successfully');
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['registrations'] });
        queryClient.invalidateQueries({ queryKey: ['registrations', 'user', variables.email] });
        queryClient.invalidateQueries({ queryKey: ['registrations', 'event', variables.eventId] });
        
        // Show additional info if there were cascaded cancellations
        if (data.data?.cascadedCancellations && data.data.cascadedCancellations > 0) {
          toast.info(data.data.note || `${data.data.cascadedCancellations} linked registration(s) were also cancelled`);
        }
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || 'Failed to confirm cancellation';
        const status = error.response?.status;
        
        if (status === 400) {
          toast.error(message); // Invalid or expired OTP
        } else if (status === 403) {
          toast.error(message); // Group/corporate member restriction
        } else if (status === 404) {
          toast.error(message); // Registration not found
        } else if (status === 409) {
          toast.error(message); // Already cancelled
        } else {
          toast.error(message);
        }
      }
    });
  };

  // Bulk operations - NEW
  const useBulkOperation = () => {
    return useMutation({
      mutationFn: async (input: BulkOperationInput) => {
        const { data } = await axios.post(`/api/registrations/bulk`, input);
        return data as {
          success: boolean;
          message: string;
          data: {
            total: number;
            successful: number;
            failed: number;
            results: Array<{ id: string; registrationNumber: string; status: string }>;
            errors: Array<{ id: string; error: string }>;
          };
        };
      },
      onSuccess: (data, variables) => {
        const actionMap = {
          'checkin': 'checked in',
          'cancel': 'cancelled',
          'delete': 'deleted',
          'verify-age': 'age verified',
          'update-payment-status': 'payment status updated',
          'issue-certificate': 'certificates issued',
          'mark-attended': 'marked as attended'
        };
        toast.success(`${data.data.successful} registrations ${actionMap[variables.action]} successfully`);
        if (data.data.failed > 0) {
          toast.warning(`${data.data.failed} registrations failed to process`);
        }
        queryClient.invalidateQueries({ queryKey: ['registrations'] });
        queryClient.invalidateQueries({ queryKey: ['events', variables.eventId, 'registrations'] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Bulk operation failed');
      }
    });
  };

  // Verify attendee age (organizer only) - UPDATED to use PATCH with action
  const useVerifyAge = () => {
    return useMutation({
      mutationFn: async ({ registrationId }: { registrationId: string }) => {
        const { data } = await axios.patch(`/api/registrations/${registrationId}`, {
          action: 'verify-age'
        });
        return data;
      },
      onSuccess: (_, variables) => {
        toast.success('Age verified successfully');
        queryClient.invalidateQueries({ queryKey: ['registrations', variables.registrationId] });
        queryClient.invalidateQueries({ queryKey: ['registrations', 'event'] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to verify age');
      }
    });
  };

  // Provide parental consent
  const useProvideParentalConsent = () => {
    return useMutation({
      mutationFn: async ({ 
        registrationId, 
        parentalConsentByName, 
        parentalConsentByEmail 
      }: { 
        registrationId: string; 
        parentalConsentByName: string; 
        parentalConsentByEmail: string;
      }) => {
        const { data } = await axios.patch(`/api/registrations/${registrationId}`, {
          action: 'provide-parental-consent',
          parentalConsentByName,
          parentalConsentByEmail
        });
        return data;
      },
      onSuccess: (_, variables) => {
        toast.success('Parental consent provided successfully');
        queryClient.invalidateQueries({ queryKey: ['registrations', variables.registrationId] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to provide parental consent');
      }
    });
  };

  // Check-in attendee (organizer only) - UPDATED to use PATCH with action
  const useCheckIn = () => {
    return useMutation({
      mutationFn: async (registrationId: string) => {
        const { data } = await axios.patch(`/api/registrations/${registrationId}`, {
          action: 'checkin'
        });
        return data as {
          success: boolean;
          message: string;
          data: Registration;
        };
      },
      onSuccess: (_, registrationId) => {
        toast.success('Checked in successfully');
        queryClient.invalidateQueries({ queryKey: ['registrations', registrationId] });
        queryClient.invalidateQueries({ queryKey: ['registrations', 'event'] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Check-in failed');
      }
    });
  };

  // Update payment status (organizer only)
  const useUpdatePaymentStatus = () => {
    return useMutation({
      mutationFn: async ({ registrationId, paymentStatus }: { registrationId: string; paymentStatus: PaymentStatus }) => {
        const { data } = await axios.patch(`/api/registrations/${registrationId}`, {
          action: 'update-payment-status',
          paymentStatus
        });
        return data;
      },
      onSuccess: (_, variables) => {
        toast.success(`Payment status updated to ${variables.paymentStatus}`);
        queryClient.invalidateQueries({ queryKey: ['registrations', variables.registrationId] });
        queryClient.invalidateQueries({ queryKey: ['registrations', 'event'] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update payment status');
      }
    });
  };

  // Issue certificate (organizer only)
  const useIssueCertificate = () => {
    return useMutation({
      mutationFn: async (registrationId: string) => {
        const { data } = await axios.patch(`/api/registrations/${registrationId}`, {
          action: 'issue-certificate'
        });
        return data;
      },
      onSuccess: (_, registrationId) => {
        toast.success('Certificate issued successfully');
        queryClient.invalidateQueries({ queryKey: ['registrations', registrationId] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to issue certificate');
      }
    });
  };

  // Submit feedback
  const useSubmitFeedback = () => {
    return useMutation({
      mutationFn: async ({
        registrationId,
        rating,
        feedback
      }: {
        registrationId: string;
        rating: number;
        feedback: string;
      }) => {
        const { data } = await axios.patch(`/api/registrations/${registrationId}`, {
          action: 'submit-feedback',
          rating,
          feedback
        });
        return data;
      },
      onSuccess: (_, variables) => {
        toast.success('Thank you for your feedback!');
        queryClient.invalidateQueries({ queryKey: ['registrations', variables.registrationId] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to submit feedback');
      }
    });
  };

  // Update attendee info
  const useUpdateAttendeeInfo = () => {
    return useMutation({
      mutationFn: async ({ 
        registrationId, 
        attendeeInfo 
      }: { 
        registrationId: string; 
        attendeeInfo: {
          attendeePhone?: string;
          attendeeCompany?: string;
          attendeeTitle?: string;
          specialRequests?: string;
          dietaryRestrictions?: string[];
          accessibilityNeeds?: string[];
        }
      }) => {
        const { data } = await axios.patch(`/api/registrations/${registrationId}`, {
          action: 'update-attendee-info',
          ...attendeeInfo
        });
        return data;
      },
      onSuccess: (_, variables) => {
        toast.success('Attendee information updated');
        queryClient.invalidateQueries({ queryKey: ['registrations', variables.registrationId] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to update attendee information');
      }
    });
  };

  return {
    // Queries
    useCheckEligibility,
    useUserRegistrations,
    useEventRegistrations,
    useGetRegistration,
    
    // Mutations - Registration
    useRegister,
    useUpdateRegistration,
    useCancelRegistration,
    
    // Mutations - Cancellation with OTP (NEW)
    useInitiateCancellation,
    useConfirmCancellation,
    
    // Mutations - Bulk operations
    useBulkOperation,
    
    // Mutations - Organizer actions
    useVerifyAge,
    useProvideParentalConsent,
    useCheckIn,
    useUpdatePaymentStatus,
    useIssueCertificate,
    
    // Mutations - Attendee actions
    useSubmitFeedback,
    useUpdateAttendeeInfo,
  };
};