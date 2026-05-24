import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

export interface ProfileLocation {
  state: string;
  city: string;
  address: string;
  postalCode?: string;
  country?: string;
}

export interface ProfileContact {
  phoneNumber: string;
  officeNumber?: string;
  email: string;
  supportEmail?: string;
  website?: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
    threads?: string;
    whatsApp?: string;
  };
}

export interface ProfileAccountDetails {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
  routingNumber?: string;
  swiftCode?: string;
  currency?: string;
}

export interface ProfilePublicProfile {
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
}

export interface ProfileUser {
  _id: string;
  email: string;
  role: string;
  status: string;
  lastLogin?: string;
}

export interface Profile {
  _id: string;
  userId: ProfileUser | string;
  verificationStatus: "pending" | "verified" | "rejected" | "suspended" | "unverified";
  verifiedAt?: Date;
  verifiedBy?: { _id: string; fullName: string; email: string };
  profilePicture?: { secure_url: string; public_id: string };
  coverPicture?: { secure_url: string; public_id: string };
  fullName: string;
  displayName?: string;
  location: ProfileLocation;
  accountType: "individual" | "organization";
  organizationName?: string;
  organizationType?: "individual" | "company" | "nonprofit" | "agency" | "government";
  organizationRegistrationNumber?: string;
  taxId?: string;
  activeStatus: "active" | "deactivated" | "pending" | "suspended";
  suspendedAt?: Date;
  suspensionReason?: string;
  deactivatedAt?: Date;
  lastActiveAt?: Date;
  contact: ProfileContact;
  bio?: string;
  shortBio?: string;
  specialties?: string[];
  yearsOfExperience?: number;
  paymentMethod: "manual" | "online" | "transfer" | "auto";
  accountDetails?: ProfileAccountDetails;
  events: string[];
  totalEvents?: number;
  totalAttendees?: number;
  totalRevenue?: number;
  averageRating?: number;
  totalReviews?: number;
  publicProfile: ProfilePublicProfile;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    deletionScheduled?: string;
    deletionReason?: string;
    finalDeletionDate?: string;
    deletedBy?: string;
    deletedByEmail?: string;
    deactivationReason?: string;
    deactivatedAt?: string;
    deactivatedBy?: string;
    deactivatedByEmail?: string;
    suspensionDuration?: number;
    expectedReactivation?: string;
    suspensionLiftedBy?: string;
    suspensionLiftedAt?: string;
  };
}

export interface GetProfilesParams {
  page?: number;
  limit?: number;
  search?: string;
  name?: string;
  organization?: string;
  email?: string;
  state?: string;
  city?: string;
  country?: string;
  accountType?: 'individual' | 'organization';
  verificationStatus?: 'pending' | 'verified' | 'rejected' | 'suspended' | 'unverified';
  activeStatus?: 'active' | 'deactivated' | 'pending' | 'suspended';
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProfilesResponse {
  success: boolean;
  data: Profile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters?: any;
}

export interface SingleProfileResponse {
  success: boolean;
  data: Profile;
}

export interface AdminActionResult {
  success: boolean;
  message: string;
  data: {
    profileId: string;
    userId: string;
    action: string;
    actionedBy: string;
    stats?: any;
    deletionType?: string;
    scheduledDeletion?: Date;
    eventsRestored?: number;
    duration?: number;
  };
}

export interface DeactivateParams {
  reason?: string;
  sendEmail?: boolean;
}

export interface SuspendParams {
  reason: string;
  duration?: number;
  sendEmail?: boolean;
}

export interface DeleteParams {
  reason?: string;
  hardDelete?: boolean;
  sendEmail?: boolean;
}

export interface LiftSuspensionParams {
  sendEmail?: boolean;
}

// ============================================
// API FUNCTIONS
// ============================================

const adminProfilesApi = {
  // Get all profiles with filters
  getProfiles: async (params: GetProfilesParams): Promise<ProfilesResponse> => {
    const { data } = await axios.get<ProfilesResponse>('/api/admin/profiles', { params });
    return data;
  },

  // Get single profile by ID
  getProfile: async (id: string): Promise<SingleProfileResponse> => {
    const { data } = await axios.get<SingleProfileResponse>(`/api/admin/profiles/${id}`);
    return data;
  },

  // Deactivate account
  deactivateAccount: async (id: string, params: DeactivateParams): Promise<AdminActionResult> => {
    const { data } = await axios.post<AdminActionResult>(
      `/api/admin/profiles/${id}/actions?action=deactivate`,
      params
    );
    return data;
  },

  // Reactivate account
  reactivateAccount: async (id: string): Promise<AdminActionResult> => {
    const { data } = await axios.post<AdminActionResult>(
      `/api/admin/profiles/${id}/actions?action=reactivate`,
      {}
    );
    return data;
  },

  // Suspend account
  suspendAccount: async (id: string, params: SuspendParams): Promise<AdminActionResult> => {
    const { data } = await axios.post<AdminActionResult>(
      `/api/admin/profiles/${id}/actions?action=suspend`,
      params
    );
    return data;
  },

  // Lift suspension
  liftSuspension: async (id: string, params: LiftSuspensionParams): Promise<AdminActionResult> => {
    const { data } = await axios.post<AdminActionResult>(
      `/api/admin/profiles/${id}/actions?action=lift-suspension`,
      params
    );
    return data;
  },

  // Delete account
  deleteAccount: async (id: string, params: DeleteParams): Promise<AdminActionResult> => {
    const { data } = await axios.post<AdminActionResult>(
      `/api/admin/profiles/${id}/actions?action=delete`,
      params
    );
    return data;
  },
};

// ============================================
// QUERY KEYS
// ============================================

export const adminProfileKeys = {
  all: ['admin-profiles'] as const,
  lists: () => [...adminProfileKeys.all, 'list'] as const,
  list: (params: GetProfilesParams) => [...adminProfileKeys.lists(), params] as const,
  details: () => [...adminProfileKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminProfileKeys.details(), id] as const,
};

// ============================================
// HOOKS
// ============================================

// Hook: Get all profiles with pagination and filtering
export const useGetProfiles = (params: GetProfilesParams = {}) => {
  return useQuery({
    queryKey: adminProfileKeys.list(params),
    queryFn: () => adminProfilesApi.getProfiles(params),
    staleTime: 1000 * 60, // 1 minute
    placeholderData: (previousData) => previousData,
  });
};

// Hook: Get single profile by ID
export const useGetProfile = (id: string | null) => {
  return useQuery({
    queryKey: adminProfileKeys.detail(id || ''),
    queryFn: () => adminProfilesApi.getProfile(id!),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
};

// Hook: Deactivate account
export const useDeactivateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: DeactivateParams }) =>
      adminProfilesApi.deactivateAccount(id, params),
    onSuccess: (data, variables) => {
      toast.success(data.message);
      
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: adminProfileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminProfileKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: adminProfileKeys.all });
    },
    onError: (error: any) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Failed to deactivate account');
      } else {
        toast.error('Failed to deactivate account');
      }
    },
  });
};

// Hook: Reactivate account
export const useReactivateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      adminProfilesApi.reactivateAccount(id),
    onSuccess: (data, variables) => {
      toast.success(data.message);
      
      queryClient.invalidateQueries({ queryKey: adminProfileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminProfileKeys.detail(variables.id) });
    },
    onError: (error: any) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Failed to reactivate account');
      } else {
        toast.error('Failed to reactivate account');
      }
    },
  });
};

// Hook: Suspend account
export const useSuspendAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: SuspendParams }) =>
      adminProfilesApi.suspendAccount(id, params),
    onSuccess: (data, variables) => {
      toast.success(data.message);
      
      queryClient.invalidateQueries({ queryKey: adminProfileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminProfileKeys.detail(variables.id) });
    },
    onError: (error: any) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Failed to suspend account');
      } else {
        toast.error('Failed to suspend account');
      }
    },
  });
};

// Hook: Lift suspension
export const useLiftSuspension = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params?: LiftSuspensionParams }) =>
      adminProfilesApi.liftSuspension(id, params || { sendEmail: true }),
    onSuccess: (data, variables) => {
      toast.success(data.message);
      
      queryClient.invalidateQueries({ queryKey: adminProfileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminProfileKeys.detail(variables.id) });
      
      // Show additional info if events were restored
      if (data.data?.eventsRestored && data.data.eventsRestored > 0) {
        toast.info(`${data.data.eventsRestored} events have been restored`);
      }
    },
    onError: (error: any) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Failed to lift suspension');
      } else {
        toast.error('Failed to lift suspension');
      }
    },
  });
};

// Hook: Delete account
export const useDeleteAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: string; params: DeleteParams }) =>
      adminProfilesApi.deleteAccount(id, params),
    onSuccess: (data, variables) => {
      toast.success(data.message);
      
      queryClient.invalidateQueries({ queryKey: adminProfileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminProfileKeys.detail(variables.id) });
      
      // If hard delete, remove from cache completely
      if (variables.params.hardDelete) {
        queryClient.removeQueries({ queryKey: adminProfileKeys.detail(variables.id) });
      }
    },
    onError: (error: any) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Failed to delete account');
      } else {
        toast.error('Failed to delete account');
      }
    },
  });
};

// ============================================
// CONVENIENCE HOOKS
// ============================================

// Hook: Get profile statistics summary
export const useProfileStats = () => {
  const { data: profilesData, isLoading } = useGetProfiles({ limit: 1 });
  
  return {
    isLoading,
    // These would need a dedicated stats endpoint
    // For now, just return placeholder
    stats: {
      total: profilesData?.pagination?.total || 0,
      active: 0,
      suspended: 0,
      deactivated: 0,
      verified: 0,
    }
  };
};

// Hook: Get active profiles count
export const useActiveProfilesCount = () => {
  const { data, isLoading } = useGetProfiles({ 
    activeStatus: 'active', 
    limit: 1 
  });
  
  return {
    count: data?.pagination?.total || 0,
    isLoading
  };
};

// Hook: Get suspended profiles count
export const useSuspendedProfilesCount = () => {
  const { data, isLoading } = useGetProfiles({ 
    activeStatus: 'suspended', 
    limit: 1 
  });
  
  return {
    count: data?.pagination?.total || 0,
    isLoading
  };
};

// Hook: Get verified profiles count
export const useVerifiedProfilesCount = () => {
  const { data, isLoading } = useGetProfiles({ 
    verificationStatus: 'verified', 
    limit: 1 
  });
  
  return {
    count: data?.pagination?.total || 0,
    isLoading
  };
};

// Hook: Get recent profiles
export const useRecentProfiles = (limit: number = 5) => {
  return useGetProfiles({
    limit,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
};

// Hook: Search profiles
export const useSearchProfiles = (searchTerm: string) => {
  return useGetProfiles({
    search: searchTerm,
    limit: 20,
  });
};

// Hook: Filter profiles by location
export const useProfilesByLocation = (state?: string, city?: string) => {
  return useGetProfiles({
    state,
    city,
    limit: 50,
  });
};

// Hook: Filter profiles by status
export const useProfilesByStatus = (activeStatus?: string, verificationStatus?: string) => {
  return useGetProfiles({
    activeStatus: activeStatus as any,
    verificationStatus: verificationStatus as any,
    limit: 50,
  });
};