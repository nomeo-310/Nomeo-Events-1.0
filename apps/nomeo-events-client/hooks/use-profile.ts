// hooks/use-profile.ts
'use client';

import { BaseProfile, PrivateProfile, ProfilePicture } from '@/types/profile-type';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

// Types for the hooks
export interface ProfileHeader {
  name: string;
  avatar: string | null;
  coverImage: string | null;
  completionPercentage: number;
  isVerified: boolean;
  isLoading: boolean;
}

export interface ProfileCompletion {
  checklist: any;
  percentage: number;
  completedItems: Array<{ key: string; label: string; completed: boolean }>;
  incompleteItems: Array<{ key: string; label: string; completed: boolean }>;
  isLoading: boolean;
}

export interface VerificationStatus {
  status: "pending" | "verified" | "rejected" | "suspended" | "unverified";
  isVerified: boolean;
  isPending: boolean;
  isRejected: boolean;
  isUnverified: boolean;
  isLoading: boolean;
}

// Types for verification request - matches the schema's verificationDocuments array
export interface VerificationDocument {
  documentType: "id_card" | "passport" | "drivers_license" | "voters_card" | "proof_of_address" | "cac_document";
  secure_url: string;
  public_id: string;
}

// Query Keys
const profileKeys = {
  me: () => ['profile', 'me'] as const,
  public: (slug?: string) => ['profile', 'public', slug] as const,
};

// API Functions
const profileApi = {
  getMyProfile: async (): Promise<PrivateProfile> => {
    const { data } = await axios.get('/api/user/profile/me');
    if (!data.success) throw new Error(data.error || 'Failed to fetch profile');
    return data.data;
  },

  getPublicProfile: async (slug: string): Promise<BaseProfile> => {
    const { data } = await axios.get(`/api/user/profile/${slug}`);
    if (!data.success) throw new Error(data.error || 'Failed to fetch profile');
    return data.data;
  },

  updateProfile: async (patch: Partial<BaseProfile>): Promise<PrivateProfile> => {
    const { data } = await axios.patch('/api/user/profile/me', patch);
    if (!data.success) throw new Error(data.error || 'Failed to update profile');
    return data.data;
  },

  updateProfilePicture: async ({ url, type }: { url: string; type: 'profilePicture' | 'coverPicture' }): Promise<PrivateProfile> => {
    const updateData = type === 'profilePicture' 
      ? { profilePicture: { secure_url: url, public_id: 'updated' } }
      : { coverPicture: { secure_url: url, public_id: 'updated' } };
    return profileApi.updateProfile(updateData);
  },

  updateSlug: async (slug: string): Promise<PrivateProfile> => {
    const { data } = await axios.patch('/api/user/profile/me/slug', { slug });
    if (!data.success) throw new Error(data.error || 'Failed to update slug');
    return data.data;
  },

  requestVerification: async (documents: VerificationDocument[]): Promise<{ status: string }> => {
    const { data } = await axios.post('/api/user/profile/verify/request', { documents });
    if (!data.success) throw new Error(data.error || 'Failed to request verification');
    return data.data;
  },
};

// Hooks remain the same as before...
export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => profileApi.getMyProfile(),
    staleTime: 1000 * 60,
  });
}

export function usePublicProfile(slug?: string | null) {
  return useQuery({
    queryKey: profileKeys.public(slug || undefined),
    queryFn: () => {
      if (!slug) throw new Error('Slug is required');
      return profileApi.getPublicProfile(slug);
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<BaseProfile>) => profileApi.updateProfile(patch),
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.me(), data);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}

export function useUpdateProfilePicture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ url, type }: { url: string; type: 'profilePicture' | 'coverPicture' }) =>
      profileApi.updateProfilePicture({ url, type }),
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.me(), data);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update picture');
    },
  });
}

export function useUpdateProfileSlug() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slug: string) => profileApi.updateSlug(slug),
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.me(), data);
      toast.success('Profile URL updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update URL');
    },
  });
}

export function useRequestVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documents: VerificationDocument[]) => 
      profileApi.requestVerification(documents),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
      toast.success('Verification request submitted successfully! Our team will review your documents.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit verification request');
    },
  });
}

export function useProfileCompletion(): ProfileCompletion {
  const { data: profile, isLoading } = useMyProfile();
  
  if (!profile || isLoading) {
    return {
      checklist: [],
      percentage: 0,
      completedItems: [],
      incompleteItems: [],
      isLoading: true,
    };
  }

  const checklist = [
    { key: 'profilePicture', label: 'Profile picture', completed: !!profile.profilePicture?.secure_url , path: '/dashboard/profile'},
    { key: 'coverPicture', label: 'Cover photo', completed: !!profile.coverPicture?.secure_url, path: '/dashboard/profile' },
    { key: 'fullName', label: 'Full name', completed: !!profile.fullName , path: '/dashboard/profile?activeTab=basic'},
    { key: 'bio', label: 'Bio', completed: !!profile.bio, path: '/dashboard/profile?activeTab=basic' },
    { key: 'location', label: 'Address', completed: !!profile.location?.address, path: '/dashboard/profile?activeTab=contact' },
    { key: 'phoneNumber', label: 'Phone number', completed: !!profile.contact?.phoneNumber, path: '/dashboard/profile?activeTab=contact' },
    { key: 'email', label: 'Contact email', completed: !!profile.contact?.email, path: '/dashboard/profile?activeTab=contact' },
    { key: 'specialties', label: 'Specialties', completed: !!(profile.specialties?.length), path: '/dashboard/profile?activeTab=professional'},
    { key: 'slug', label: 'Public profile URL', completed: !!profile.publicProfile?.slug , path: '/dashboard/profile?activeTab=visibility'},
    { key: 'accountDetails', label: 'Payment details', completed: !!profile.accountDetails?.accountNumber , path: '/dashboard/profile?activeTab=payment'},
    { key: 'verification', label: 'Account verification', completed: profile.verificationStatus === 'verified' , path: '/dashboard/profile?activeTab=verification'},
  ];

  const completedItems = checklist.filter(item => item.completed);
  const incompleteItems = checklist.filter(item => !item.completed);
  const percentage = profile.completionPercentage || Math.floor((completedItems.length / checklist.length) * 100);

  return {
    checklist,
    percentage,
    completedItems,
    incompleteItems,
    isLoading: false,
  };
}

export function useProfileHeader(): ProfileHeader {
  const { data: profile, isLoading } = useMyProfile();
  
  return {
    name: profile?.displayName || profile?.fullName || 'Guest',
    avatar: profile?.profilePicture?.secure_url || null,
    coverImage: profile?.coverPicture?.secure_url || null,
    completionPercentage: profile?.completionPercentage || 0,
    isVerified: profile?.verificationStatus === 'verified',
    isLoading,
  };
}

export function useProfileVerificationStatus(): VerificationStatus {
  const { data: profile, isLoading } = useMyProfile();
  
  const status = profile?.verificationStatus ?? 'unverified';
  
  return {
    status: status as VerificationStatus['status'],
    isUnverified: status === 'unverified',
    isVerified: status === 'verified',
    isPending: status === 'pending',
    isRejected: status === 'rejected',
    isLoading,
  };
}