'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

// Types
export interface Profile {
  _id: string;
  fullName?: string;
  bio?: string;
  profilePicture?: string;
  coverPicture?: string;
  verificationStatus: string;
  completionPercentage: number;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  contact?: {
    phoneNumber?: string;
    email?: string;
    website?: string;
  };
  specialties?: string[];
  publicProfile?: {
    slug?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Query Keys
// ─────────────────────────────────────────────────────────────────────────────
const profileKeys = {
  me: () => ['profile', 'me'] as const,
  public: (slug?: string) => ['profile', 'public', slug] as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────
const profileApi = {
  getMyProfile: async (): Promise<Profile> => {
    const { data } = await axios.get('/api/user/profile/me');
    return data.data;
  },

  getPublicProfile: async (slug: string): Promise<Profile> => {
    const { data } = await axios.get(`/api/user/profile/${slug}`);
    return data.data;
  },

  updateProfile: async (patch: Partial<Profile>): Promise<Profile> => {
    const { data } = await axios.patch('/api/user/profile/me', patch);
    return data.data;
  },

  updateSlug: async (slug: string): Promise<Profile> => {
    const { data } = await axios.patch('/api/user/profile/me/slug', { slug });
    return data.data;
  },

  requestVerification: async (): Promise<{ status: string }> => {
    const { data } = await axios.post('/api/user/profile/verify/request');
    return data.data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

// Get my profile
export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: () => profileApi.getMyProfile(),
    staleTime: 1000 * 60,
  });
}

// Get public profile by slug - FIXED: handle null/undefined properly
export function usePublicProfile(slug?: string | null) {
  return useQuery({
    queryKey: profileKeys.public(slug || undefined),
    queryFn: () => {
      // Ensure slug is a string before calling API
      if (!slug) throw new Error('Slug is required');
      return profileApi.getPublicProfile(slug);
    },
    enabled: !!slug, // Only enable when slug is truthy (not null, undefined, or empty string)
    staleTime: 1000 * 60 * 5,
  });
}

// Update profile (with optimistic updates)
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<Profile>) => profileApi.updateProfile(patch),
    onMutate: async (newProfileData) => {
      await queryClient.cancelQueries({ queryKey: profileKeys.me() });
      const previousProfile = queryClient.getQueryData<Profile>(profileKeys.me());
      
      queryClient.setQueryData<Profile>(profileKeys.me(), (old) => {
        if (!old) return old;
        return { ...old, ...newProfileData };
      });
      
      return { previousProfile };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(profileKeys.me(), context?.previousProfile);
      toast.error('Failed to update profile');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
    },
  });
}

// Update profile picture (just send URL)
export function useUpdateProfilePicture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ url, type }: { url: string; type: 'profilePicture' | 'coverPicture' }) => {
      return profileApi.updateProfile({ [type]: url });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.me(), data);
      toast.success('Profile picture updated');
    },
    onError: () => {
      toast.error('Failed to update picture');
    },
  });
}

// Update profile slug
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

// Request verification
export function useRequestVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => profileApi.requestVerification(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
      toast.success('Verification request submitted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit request');
    },
  });
}

// Profile completion summary
export function useProfileCompletion() {
  const { data: profile, isLoading } = useMyProfile();
  
  if (!profile || isLoading) {
    return {
      percentage: 0,
      completedItems: [],
      incompleteItems: [],
      isLoading,
    };
  }

  const checklist = [
    { key: 'profilePicture', label: 'Profile picture', completed: !!profile.profilePicture },
    { key: 'coverPicture', label: 'Cover photo', completed: !!profile.coverPicture },
    { key: 'fullName', label: 'Full name', completed: !!profile.fullName },
    { key: 'bio', label: 'Bio', completed: !!profile.bio },
    { key: 'address', label: 'Address', completed: !!profile.location?.address },
    { key: 'phoneNumber', label: 'Phone number', completed: !!profile.contact?.phoneNumber },
    { key: 'email', label: 'Contact email', completed: !!profile.contact?.email },
    { key: 'specialties', label: 'Specialties', completed: !!(profile.specialties?.length) },
    { key: 'slug', label: 'Public profile URL', completed: !!profile.publicProfile?.slug },
  ];

  const completedItems = checklist.filter(item => item.completed);
  const incompleteItems = checklist.filter(item => !item.completed);
  const percentage = profile.completionPercentage || Math.floor((completedItems.length / checklist.length) * 100);

  return {
    percentage,
    completedItems,
    incompleteItems,
    isLoading,
  };
}

// Profile header summary (convenience hook)
export function useProfileHeader() {
  const { data: profile, isLoading } = useMyProfile();
  
  return {
    name: profile?.fullName || 'Guest',
    avatar: profile?.profilePicture,
    coverImage: profile?.coverPicture,
    completionPercentage: profile?.completionPercentage || 0,
    isVerified: profile?.verificationStatus === 'verified',
    isLoading,
  };
}

// Profile verification status
export function useProfileVerificationStatus() {
  const { data: profile, isLoading } = useMyProfile();
  
  return {
    status: profile?.verificationStatus ?? 'unverified',
    isVerified: profile?.verificationStatus === 'verified',
    isPending: profile?.verificationStatus === 'pending',
    isRejected: profile?.verificationStatus === 'rejected',
    isLoading,
  };
}