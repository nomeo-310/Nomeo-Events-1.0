import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface VerifyProfilesParams {
  profileIds: string[];
  sendEmail?: boolean;
  sendNotification?: boolean;
}

interface RejectProfilesParams {
  profileIds: string[];
  reason: string;
  sendEmail?: boolean;
  sendNotification?: boolean;
}

interface ResetProfilesParams {
  profileIds: string[];
  hardReset?: boolean;
  resetReason?: string;
  sendNotification?: boolean;
}

interface AdminAccountActionParams {
  profileId: string;
  reason?: string;
  duration?: number;
  hardDelete?: boolean;
  sendEmail?: boolean;
}

interface AdminActionResponse {
  success: boolean;
  message: string;
  data: {
    profileId: string;
    userId: string;
    action: string;
    actionedBy: string;
    stats: any;
    eventsRestored?: number;
    deletionType?: string;
    duration?: number;
  };
}

interface VerifyResponse {
  success: boolean;
  message: string;
  data: {
    totalProcessed: number;
    verifiedCount: number;
    failedCount: number;
    notificationsSent: number;
    emailsSent: number;
    verified: Array<{ id: string; name: string; email: string; status: string }>;
    failed: Array<{ id: string; name: string; error: string }>;
  };
}

interface RejectResponse {
  success: boolean;
  message: string;
  data: {
    totalProcessed: number;
    rejectedCount: number;
    failedCount: number;
    notificationsSent: number;
    emailsSent: number;
    rejected: Array<{ id: string; name: string; email: string; status: string; reason: string }>;
    failed: Array<{ id: string; name: string; error: string }>;
  };
}

interface ResetResponse {
  success: boolean;
  message: string;
  data: {
    totalProcessed: number;
    resetCount: number;
    failedCount: number;
    notificationsSent: number;
    reset: Array<{ id: string; name: string; email: string; previousStatus: string; newStatus: string; hardReset: boolean }>;
    failed: Array<{ id: string; name: string; error: string }>;
  };
}

// ====================== API FUNCTIONS ======================

async function verifyProfilesApi(params: VerifyProfilesParams): Promise<VerifyResponse> {
  const response = await fetch("/api/admin/profiles/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to verify profiles");
  }
  
  return response.json();
}

async function rejectProfilesApi(params: RejectProfilesParams): Promise<RejectResponse> {
  const response = await fetch("/api/admin/profiles/reject", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to reject profiles");
  }
  
  return response.json();
}

async function resetProfilesApi(params: ResetProfilesParams): Promise<ResetResponse> {
  const response = await fetch("/api/admin/profiles/verify", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to reset profiles");
  }
  
  return response.json();
}

async function adminDeactivateAccountApi(params: AdminAccountActionParams): Promise<AdminActionResponse> {
  const response = await fetch(`/api/admin/profiles/${params.profileId}?action=deactivate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reason: params.reason,
      sendEmail: params.sendEmail ?? true,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to deactivate account");
  }
  
  return response.json();
}

async function adminReactivateAccountApi(profileId: string): Promise<AdminActionResponse> {
  const response = await fetch(`/api/admin/profiles/${profileId}?action=reactivate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to reactivate account");
  }
  
  return response.json();
}

async function adminSuspendAccountApi(params: AdminAccountActionParams): Promise<AdminActionResponse> {
  const response = await fetch(`/api/admin/profiles/${params.profileId}?action=suspend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reason: params.reason,
      duration: params.duration,
      sendEmail: params.sendEmail ?? true,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to suspend account");
  }
  
  return response.json();
}

async function adminLiftSuspensionApi(profileId: string, sendEmail: boolean = true): Promise<AdminActionResponse> {
  const response = await fetch(`/api/admin/profiles/${profileId}?action=lift-suspension`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sendEmail }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to lift suspension");
  }
  
  return response.json();
}

async function adminDeleteAccountApi(params: AdminAccountActionParams): Promise<AdminActionResponse> {
  const response = await fetch(`/api/admin/profiles/${params.profileId}?action=delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      reason: params.reason,
      hardDelete: params.hardDelete ?? false,
      sendEmail: params.sendEmail ?? true,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete account");
  }
  
  return response.json();
}

// ====================== VERIFICATION HOOKS ======================

export function useVerifyProfiles() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: verifyProfilesApi,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["pending-verification"] });
      
      toast.success(data.message);
      
      if (data.data.emailsSent > 0) {
        toast.success(`📧 ${data.data.emailsSent} verification ${data.data.emailsSent === 1 ? 'email' : 'emails'} sent`);
      }
      
      if (data.data.notificationsSent > 0) {
        toast.success(`🔔 ${data.data.notificationsSent} ${data.data.notificationsSent === 1 ? 'notification' : 'notifications'} created`);
      }
      
      if (data.data.failedCount > 0) {
        toast.warning(`${data.data.failedCount} ${data.data.failedCount === 1 ? 'profile failed' : 'profiles failed'} to verify`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to verify profiles");
    },
  });
}

export function useRejectProfiles() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rejectProfilesApi,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["pending-verification"] });
      
      toast.success(data.message);
      
      if (data.data.emailsSent > 0) {
        toast.info(`📧 ${data.data.emailsSent} rejection ${data.data.emailsSent === 1 ? 'email' : 'emails'} sent with reason`);
      }
      
      if (data.data.notificationsSent > 0) {
        toast.info(`🔔 ${data.data.notificationsSent} ${data.data.notificationsSent === 1 ? 'notification' : 'notifications'} created`);
      }
      
      if (data.data.failedCount > 0) {
        toast.error(`${data.data.failedCount} ${data.data.failedCount === 1 ? 'profile failed' : 'profiles failed'} to reject`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject profiles");
    },
  });
}

export function useResetProfiles() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: resetProfilesApi,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["pending-verification"] });
      
      toast.success(data.message);
      
      if (data.data.notificationsSent > 0) {
        toast.info(`🔔 ${data.data.notificationsSent} reset ${data.data.notificationsSent === 1 ? 'notification' : 'notifications'} sent`);
      }
      
      if (variables.hardReset) {
        toast.warning("All verification documents have been permanently cleared");
      } else {
        toast.info("Profiles have been reset to pending verification status");
      }
      
      if (data.data.failedCount > 0) {
        toast.error(`${data.data.failedCount} ${data.data.failedCount === 1 ? 'profile failed' : 'profiles failed'} to reset`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reset profiles");
    },
  });
}

// ====================== ACCOUNT MANAGEMENT HOOKS ======================

export function useAdminDeactivateAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminDeactivateAccountApi,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profile", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["admin-account-status"] });
      
      toast.success(data.message);
      
      if (data.data.stats?.eventsUnpublished > 0) {
        toast.info(`${data.data.stats.eventsUnpublished} events unpublished`);
      }
      
      if (data.data.stats?.emailsSent > 0) {
        toast.success(`📧 ${data.data.stats.emailsSent} notification email sent`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to deactivate account");
    },
  });
}

export function useAdminReactivateAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminReactivateAccountApi,
    onSuccess: (data, profileId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profile", profileId] });
      queryClient.invalidateQueries({ queryKey: ["admin-account-status"] });
      
      toast.success(data.message);
      
      if (data.data.eventsRestored && data.data.eventsRestored > 0) {
        toast.info(`${data.data.eventsRestored} events restored`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reactivate account");
    },
  });
}

export function useAdminSuspendAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminSuspendAccountApi,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profile", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["admin-account-status"] });
      
      toast.success(data.message);
      
      if (variables.duration) {
        toast.info(`Suspension period: ${variables.duration} days`);
      }
      
      if (data.data.stats?.eventsUnpublished > 0) {
        toast.info(`${data.data.stats.eventsUnpublished} events unpublished`);
      }
      
      if (data.data.stats?.emailsSent > 0) {
        toast.success(`📧 ${data.data.stats.emailsSent} suspension email sent`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to suspend account");
    },
  });
}

export function useAdminLiftSuspension() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ profileId, sendEmail }: { profileId: string; sendEmail?: boolean }) => 
      adminLiftSuspensionApi(profileId, sendEmail),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profile", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["admin-account-status"] });
      
      toast.success(data.message);
      
      if (data.data.stats?.eventsUnpublished > 0) {
        toast.info(`${data.data.stats.eventsUnpublished} events restored`);
      }
      
      if (data.data.stats?.emailsSent > 0) {
        toast.success(`📧 ${data.data.stats.emailsSent} notification email sent`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to lift suspension");
    },
  });
}

export function useAdminDeleteAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: adminDeleteAccountApi,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profile", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["admin-account-status"] });
      
      toast.success(data.message);
      
      if (variables.hardDelete) {
        toast.warning("Account permanently deleted. This action cannot be undone.");
        
        if (data.data.stats?.eventsDeleted > 0) {
          toast.info(`${data.data.stats.eventsDeleted} events deleted`);
        }
        
        if (data.data.stats?.registrationsCancelled > 0) {
          toast.info(`${data.data.stats.registrationsCancelled} registrations cancelled`);
        }
        
        if (data.data.stats?.refundsInitiated > 0) {
          toast.info(`💰 ${data.data.stats.refundsInitiated} refunds initiated`);
        }
      } else {
        toast.info("30-day grace period started. Account will be permanently deleted after 30 days.");
      }
      
      if (data.data.stats?.emailsSent > 0) {
        toast.success(`📧 ${data.data.stats.emailsSent} notification emails sent`);
      }
    }, 
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete account");
    },
  });
}