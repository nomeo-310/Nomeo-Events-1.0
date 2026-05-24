import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { useState } from 'react';
import { authClient } from '@/lib/auth/auth-client';

// ====================== TYPES ======================

export interface AdminUser {
  _id: string;
  name: string;
  displayName: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support';
  adminStatus: 'active' | 'suspended' | 'inactive';
  isActive: boolean;
  isOnboarded: boolean;
  lastLoginAt?: string;
  lastLoginIP?: string;
  loginCount: number;
  createdAt: string;
  updatedAt?: string;
  userId: {
    _id: string;
    email: string;
    name: string;
    avatar?: string;
  };
}

export interface CreateAdminParams {
  email: string;
  name: string;
  displayName: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support';
  sendEmail?: boolean;
}

export interface UpdateAdminParams {
  adminId: string;
  action: 'promote' | 'demote' | 'suspend' | 'activate' | 'deactivate' | 'update-profile';
  data: {
    newRole?: 'super_admin' | 'admin' | 'moderator' | 'support';
    targetRole?: 'super_admin' | 'admin' | 'moderator' | 'support';
    name?: string;
    displayName?: string;
    reason?: string;
    sendEmail?: boolean;
  };
}

export interface DeleteAdminParams {
  adminId: string;
  hardDelete?: boolean;
  reason?: string;
  transferToEmail?: string;
}

export interface GetAdminsParams {
  status?: 'active' | 'suspended' | 'inactive';
  role?: 'super_admin' | 'admin' | 'moderator' | 'support';
  search?: string;
  page?: number;
  limit?: number;
}

export interface ChangePasswordParams {
  action: 'change-password';
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface FirstTimeSetupParams {
  action: 'first-time-setup';
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SuperAdminResetPasswordParams {
  action: 'admin-reset';
  adminId: string;
  newPassword: string;
  confirmPassword: string;
}

export type PasswordUpdateParams = 
  | ChangePasswordParams 
  | FirstTimeSetupParams 
  | SuperAdminResetPasswordParams;

export interface PasswordUpdateResponse {
  success: boolean;
  message: string;
  data?: {
    isOnboarded?: boolean;
    isActive?: boolean;
    admin?: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
}

export interface PaginatedAdminsResponse {
  success: boolean;
  data: {
    admins: AdminUser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface CreateAdminResponse {
  success: boolean;
  message: string;
}

export interface UpdateAdminResponse {
  success: boolean;
  message: string;
  data: {
    admin: {
      _id: string;
      name: string;
      displayName: string;
      email: string;
      role: string;
      adminStatus: string;
      isActive: boolean;
    };
  };
}

export interface DeleteAdminResponse {
  success: boolean;
  message: string;
}

export interface UpdateProfileParams {
  adminId: string;
  name: string;
  displayName: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: {
    admin: {
      _id: string;
      name: string;
      displayName: string;
      email: string;
      role: string;
      adminStatus: string;
      isActive: boolean;
    };
  };
}

// ====================== API FUNCTIONS ======================

const adminApi = {
  getAdmins: async (params: GetAdminsParams = {}): Promise<PaginatedAdminsResponse> => {
    const { data } = await axios.get<PaginatedAdminsResponse>('/api/admin/manage', { params });
    return data;
  },

  createAdmin: async (params: CreateAdminParams): Promise<CreateAdminResponse> => {
    const { data } = await axios.post<CreateAdminResponse>('/api/admin/manage', params);
    return data;
  },

  updateAdmin: async ({ adminId, action, data }: UpdateAdminParams): Promise<UpdateAdminResponse> => {
    const { data: responseData } = await axios.patch<UpdateAdminResponse>('/api/admin/manage', {
      adminId,
      action,
      data
    });
    return responseData;
  },

  deleteAdmin: async ({ adminId, hardDelete, reason, transferToEmail }: DeleteAdminParams): Promise<DeleteAdminResponse> => {
    const { data } = await axios.delete<DeleteAdminResponse>('/api/admin/manage', {
      data: { adminId, hardDelete, reason, transferToEmail }
    });
    return data;
  },

  updatePassword: async (params: PasswordUpdateParams): Promise<PasswordUpdateResponse> => {
    const { data } = await axios.put<PasswordUpdateResponse>('/api/admin/manage', params);
    return data;
  },

  updateProfile: async ({ adminId, name, displayName }: UpdateProfileParams): Promise<UpdateProfileResponse> => {
    const { data } = await axios.patch<UpdateProfileResponse>('/api/admin/manage', {
      adminId,
      action: 'update-profile',
      data: {
        name,
        displayName,
        sendEmail: false,
      },
    });
    return data;
  },
};

// ====================== QUERY KEYS ======================

export const adminKeys = {
  all: ['admins'] as const,
  lists: () => [...adminKeys.all, 'list'] as const,
  list: (params: GetAdminsParams) => [...adminKeys.lists(), params] as const,
  details: () => [...adminKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminKeys.details(), id] as const,
  roles: () => [...adminKeys.all, 'roles'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  password: () => [...adminKeys.all, 'password'] as const,
  profile: () => [...adminKeys.all, 'profile'] as const,
};

// ====================== BASE HOOKS ======================

/**
 * Hook: Get admins with pagination and filtering
 */
export const useGetAdmins = (params: GetAdminsParams = {}) => {
  return useQuery({
    queryKey: adminKeys.list(params),
    queryFn: () => adminApi.getAdmins(params),
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
    select: (data) => ({
      admins: data.data.admins,
      pagination: data.data.pagination,
    }),
  });
};

/**
 * Hook: Get single admin by ID
 */
export const useGetAdminById = (adminId: string | null) => {
  const { data: adminsData } = useGetAdmins({ limit: 1000 });
  
  return useQuery({
    queryKey: adminKeys.detail(adminId || ''),
    queryFn: () => {
      if (!adminId) throw new Error('Admin ID is required');
      const admin = adminsData?.admins.find(a => a._id === adminId);
      if (!admin) throw new Error('Admin not found');
      return admin;
    },
    enabled: !!adminId && !!adminsData?.admins,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook: Get single admin by userId
 */
export const useGetAdminByUserId = (userId: string | null) => {
  const { data: adminsData } = useGetAdmins({ limit: 1000 });
  
  return useQuery({
    queryKey: adminKeys.detail(userId || ''),
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      const admin = adminsData?.admins.find(a => a.userId._id === userId);
      if (!admin) throw new Error('Admin not found');
      return admin;
    },
    enabled: !!userId && !!adminsData?.admins,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook: Get current admin profile
 */
export const useCurrentAdmin = () => {
  const { data: session, isPending } = authClient.useSession();
  const adminId = session?.user?.id;
  
  return useGetAdminByUserId(adminId || null);
};

/** 
 * Hook: Create new admin
 */
export const useCreateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateAdminResponse, Error, CreateAdminParams>({
    mutationFn: adminApi.createAdmin,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
    onError: (error: Error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Failed to create admin');
      } else {
        toast.error('Failed to create admin');
      }
    },
  });
};

/**
 * Hook: Update admin (promote, demote, suspend, activate, deactivate, update-profile)
 */
export const useUpdateAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateAdminResponse, Error, UpdateAdminParams>({
    mutationFn: adminApi.updateAdmin,
    onSuccess: (data, variables) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminKeys.detail(variables.adminId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
    onError: (error: Error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Failed to update admin');
      } else {
        toast.error('Failed to update admin');
      }
    },
  });
};

/**
 * Hook: Delete admin
 */
export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteAdminResponse, Error, DeleteAdminParams>({
    mutationFn: adminApi.deleteAdmin,
    onSuccess: (data, variables) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
      queryClient.removeQueries({ queryKey: adminKeys.detail(variables.adminId) });
    },
    onError: (error: Error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Failed to delete admin');
      } else {
        toast.error('Failed to delete admin');
      }
    },
  });
};

/**
 * Hook: Update password (handles all password operations via action parameter)
 */
export const useUpdatePassword = () => {
  const queryClient = useQueryClient();

  return useMutation<PasswordUpdateResponse, Error, PasswordUpdateParams>({
    mutationFn: adminApi.updatePassword,
    onSuccess: (data, variables) => {
      toast.success(data.message);
      
      // If this was first-time setup, invalidate admin data to reflect activation
      if (variables.action === 'first-time-setup') {
        queryClient.invalidateQueries({ queryKey: adminKeys.all });
        queryClient.invalidateQueries({ queryKey: ['session'] });
      }
      
      // If super admin reset another admin's password, invalidate that admin's data
      if (variables.action === 'admin-reset' && 'adminId' in variables) {
        queryClient.invalidateQueries({ queryKey: adminKeys.detail(variables.adminId) });
      }
      
      // For regular password change, invalidate session
      if (variables.action === 'change-password') {
        queryClient.invalidateQueries({ queryKey: ['session'] });
      }
      
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
    },
    onError: (error: Error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Failed to update password');
      } else {
        toast.error('Failed to update password');
      }
    },
  });
};

/**
 * Hook: Update admin profile (name and display name)
 */
export const useUpdateAdminProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateProfileResponse, Error, UpdateProfileParams>({
    mutationFn: adminApi.updateProfile,
    onSuccess: (data, variables) => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: adminKeys.detail(variables.adminId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.profile() });
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    onError: (error: Error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Failed to update profile');
      } else {
        toast.error('Failed to update profile');
      }
    },
  });
};

// ====================== CONVENIENCE HOOKS ======================

/**
 * Hook: Get admin statistics (counts by role and status)
 */
export const useAdminStats = () => {
  const { data: adminsData, isLoading } = useGetAdmins({ limit: 1000 });
  
  const stats = {
    total: 0,
    byRole: {
      super_admin: 0,
      admin: 0,
      moderator: 0,
      support: 0,
    },
    byStatus: {
      active: 0,
      suspended: 0,
      inactive: 0,
    },
    activePercentage: 0,
  };
  
  if (adminsData?.admins) {
    stats.total = adminsData.admins.length;
    
    adminsData.admins.forEach((admin) => {
      if (admin.role === 'super_admin') stats.byRole.super_admin++;
      if (admin.role === 'admin') stats.byRole.admin++;
      if (admin.role === 'moderator') stats.byRole.moderator++;
      if (admin.role === 'support') stats.byRole.support++;
      
      if (admin.adminStatus === 'active') stats.byStatus.active++;
      if (admin.adminStatus === 'suspended') stats.byStatus.suspended++;
      if (admin.adminStatus === 'inactive') stats.byStatus.inactive++;
    });
    
    stats.activePercentage = stats.total > 0 
      ? (stats.byStatus.active / stats.total) * 100 
      : 0;
  }
  
  return { stats, isLoading };
};

/**
 * Hook: Check if current user can perform certain actions
 */
export const useAdminPermissions = (currentUserRole?: string) => {
  const canCreateAdmin = currentUserRole === 'super_admin';
  const canDeleteAdmin = currentUserRole === 'super_admin';

  const canPromoteAdmin = (targetRole?: string) => {
    if (currentUserRole !== 'super_admin') return false;
    return true;
  };

  const canDemoteAdmin = (targetRole?: string) => {
    if (currentUserRole !== 'super_admin') return false;
    if (targetRole === 'super_admin') return false;
    return true;
  };

  const canSuspendAdmin = (targetRole?: string) => {
    if (currentUserRole !== 'super_admin') return false;
    if (targetRole === 'super_admin') return false;
    return true;
  };

  const canActivateAdmin = (targetRole?: string) => {
    if (currentUserRole !== 'super_admin') return false;
    return true;
  };
  
  const canResetPassword = (targetRole?: string) => {
    if (currentUserRole !== 'super_admin') return false;
    return true;
  };
  
  return {
    canCreateAdmin,
    canDeleteAdmin,
    canPromoteAdmin,
    canDemoteAdmin,
    canSuspendAdmin,
    canActivateAdmin,
    canResetPassword,
    isSuperAdmin: currentUserRole === 'super_admin',
    isAdmin: currentUserRole === 'admin',
    isModerator: currentUserRole === 'moderator',
    isSupport: currentUserRole === 'support',
  };
};

/**
 * Hook: Combined admin management with all actions
 */
export const useAdminManagement = () => {
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin();
  const deleteAdmin = useDeleteAdmin();
  const updatePassword = useUpdatePassword();
  const updateProfile = useUpdateAdminProfile();
  
  return {
    createAdmin: createAdmin.mutateAsync,
    updateAdmin: updateAdmin.mutateAsync,
    deleteAdmin: deleteAdmin.mutateAsync,
    updatePassword: updatePassword.mutateAsync,
    updateProfile: updateProfile.mutateAsync,
    isCreating: createAdmin.isPending,
    isUpdating: updateAdmin.isPending,
    isDeleting: deleteAdmin.isPending,
    isUpdatingPassword: updatePassword.isPending,
    isUpdatingProfile: updateProfile.isPending,
    createError: createAdmin.error,
    updateError: updateAdmin.error,
    deleteError: deleteAdmin.error,
    updatePasswordError: updatePassword.error,
    updateProfileError: updateProfile.error,
  };
};

// ====================== PASSWORD MANAGEMENT HOOKS ======================

/**
 * Hook: Handle first-time setup (onboarding) password creation
 * This requires current password (temporary password from email)
 */
export const useFirstTimeSetup = () => {
  const updatePassword = useUpdatePassword();
  const queryClient = useQueryClient();
  
  const setup = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    const result = await updatePassword.mutateAsync({
      action: 'first-time-setup',
      currentPassword,
      newPassword,
      confirmPassword,
    });
    
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    }
    
    return result;
  };
  
  return {
    setup,
    isLoading: updatePassword.isPending,
    error: updatePassword.error,
    isSuccess: updatePassword.isSuccess,
  };
};

/**
 * Hook: Handle regular password change for already onboarded admin
 * This requires current password (their existing password)
 */
export const useChangePassword = () => {
  const updatePassword = useUpdatePassword();
  
  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    return updatePassword.mutateAsync({
      action: 'change-password',
      currentPassword,
      newPassword,
      confirmPassword,
    });
  };
  
  return {
    changePassword,
    isLoading: updatePassword.isPending,
    error: updatePassword.error,
  };
};

/**
 * Hook: Handle password reset by super admin
 * This does NOT require current password
 */
export const useResetAdminPassword = () => {
  const updatePassword = useUpdatePassword();
  
  const resetPassword = async (adminId: string, newPassword: string, confirmPassword: string) => {
    return updatePassword.mutateAsync({
      action: 'admin-reset',
      adminId,
      newPassword,
      confirmPassword,
    });
  };
  
  return {
    resetPassword,
    isLoading: updatePassword.isPending,
    error: updatePassword.error,
  };
};

/**
 * Hook: Get password requirements
 */
export const usePasswordRequirements = () => {
  const requirements = [
    { id: 'length', label: 'At least 8 characters long', validator: (pwd: string) => pwd.length >= 8 },
    { id: 'uppercase', label: 'Contains at least one uppercase letter', validator: (pwd: string) => /[A-Z]/.test(pwd) },
    { id: 'lowercase', label: 'Contains at least one lowercase letter', validator: (pwd: string) => /[a-z]/.test(pwd) },
    { id: 'number', label: 'Contains at least one number', validator: (pwd: string) => /[0-9]/.test(pwd) },
    { id: 'special', label: 'Contains at least one special character (!@#$%^&*)', validator: (pwd: string) => /[!@#$%^&*]/.test(pwd) },
  ];
  
  const validatePassword = (password: string) => {
    return requirements.map(req => ({
      ...req,
      isValid: req.validator(password),
    }));
  };
  
  const isPasswordStrong = (password: string) => {
    return validatePassword(password).every(req => req.isValid);
  };
  
  return {
    requirements,
    validatePassword,
    isPasswordStrong,
  };
};

// ====================== ONBOARDING HOOKS ======================

/**
 * Hook: Complete onboarding (update password and profile in sequence)
 */
export const useCompleteOnboarding = () => {
  const updatePassword = useUpdatePassword();
  const updateProfile = useUpdateAdminProfile();
  const [isCompleting, setIsCompleting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'password' | 'profile' | null>(null);

  const completeOnboarding = async (
    adminId: string,
    passwordData: { currentPassword: string; newPassword: string; confirmPassword: string },
    profileData: { name: string; displayName: string }
  ) => {
    setIsCompleting(true);
    
    try {
      // Step 1: Update password (first-time setup)
      setCurrentStep('password');
      const passwordResult = await updatePassword.mutateAsync({
        action: 'first-time-setup',
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      if (!passwordResult.success) {
        throw new Error(passwordResult.message || 'Failed to set password');
      }

      // Step 2: Update profile
      setCurrentStep('profile');
      const profileResult = await updateProfile.mutateAsync({
        adminId,
        name: profileData.name,
        displayName: profileData.displayName,
      });

      if (!profileResult.success) {
        throw new Error(profileResult.message || 'Failed to update profile');
      }

      return { success: true, message: 'Onboarding completed successfully!' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Onboarding failed' };
    } finally {
      setIsCompleting(false);
      setCurrentStep(null);
    }
  };

  return {
    completeOnboarding,
    isCompleting,
    currentStep,
    isPasswordUpdating: updatePassword.isPending,
    isProfileUpdating: updateProfile.isPending,
    passwordError: updatePassword.error,
    profileError: updateProfile.error,
  };
};

/**
 * Hook: Get current admin ID from session
 */
export const useCurrentAdminId = () => {
  const { data: session, isPending } = authClient.useSession();
  return session?.user?.id;
};

/**
 * Hook: Check if current admin needs onboarding
 */
export const useNeedsOnboarding = () => {
  const { data: admin, isLoading } = useCurrentAdmin();
  const needsOnboarding = !admin?.isOnboarded;
  
  return {
    needsOnboarding,
    isLoading,
    admin,
  };
};