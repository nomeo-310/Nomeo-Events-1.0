import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

export interface Settings {
  _id: string;
  userId: string;
  
  notifications: {
    email: {
      newRegistration: boolean;
      eventReminder: boolean;
      weeklyReport: boolean;
      monthlyDigest: boolean;
      marketing: boolean;
      paymentReceived: boolean;
      eventCancelled: boolean;
    };
    sms: {
      alerts: boolean;
      reminders: boolean;
      otpVerification: boolean;
    };
    push: {
      updates: boolean;
      messages: boolean;
      reminders: boolean;
    };
    inApp: {
      newRegistration: boolean;
      eventUpdates: boolean;
      teamInvites: boolean;
    };
  };
  
  display: {
    timezone: string;
    dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
    timeFormat: "12h" | "24h";
    language: string;
    currency: "NGN" | "USD" | "EUR" | "GBP";
    theme: "light" | "dark" | "system";
    compactView: boolean;
  };
  
  payment: {
    currency: "NGN" | "USD" | "EUR" | "GBP";
    minimumPayout: number;
    payoutSchedule: "daily" | "weekly" | "biweekly" | "monthly";
    autoPayout: boolean;
    payoutMethod: "bank" | "paypal" | "stripe";
    taxRate: number;
    taxId?: string;
    invoicePrefix: string;
  };
  
  eventDefaults: {
    defaultTimezone: string;
    defaultReminderTime: number;
    defaultTicketTypes: {
      name: string;
      price: number;
      quantity: number;
    }[];
    defaultRefundPolicy: string;
    autoApproveRegistrations: boolean;
    sendReminderEmail: boolean;
    sendThankYouEmail: boolean;
    defaultCoverImage?: string;
  };
  
  privacy: {
    showEmailOnPublicProfile: boolean;
    showPhoneOnPublicProfile: boolean;
    showLocationOnPublicProfile: boolean;
    showEventHistory: boolean;
    allowDirectMessages: boolean;
    allowEventSharing: boolean;
    dataRetentionDays: number;
    allowAnalyticsTracking: boolean;
  };
  
  security: {
    twoFactorEnabled: boolean;
    twoFactorMethod: "authenticator" | "sms" | "email";
    sessionTimeout: number;
    loginAlerts: boolean;
    ipWhitelist: string[];
    allowedDomains: string[];
  };
  
  integrations: {
    googleCalendar: {
      connected: boolean;
      syncEnabled: boolean;
      calendarId?: string;
    };
    zoom: {
      connected: boolean;
      defaultSettings?: {
        autoRecord: boolean;
        waitingRoom: boolean;
        muteParticipants: boolean;
      };
    };
    mailchimp: {
      connected: boolean;
      audienceId?: string;
      syncEnabled: boolean;
    };
    webhooks: {
      url?: string;
      events: string[];
      secret?: string;
    }[];
  };
  
  teamSettings: {
    allowTeamMembers: boolean;
    maxTeamMembers: number;
    defaultRole: "admin" | "editor" | "viewer";
    requireApproval: boolean;
    auditLog: boolean;
  };
  
  billing: {
    autoRenew: boolean;
    invoiceEmail: string;
    billingAddress: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    vatNumber?: string;
  };
  
  features: {
    earlyAccess: boolean;
    betaFeatures: boolean;
    analyticsEnabled: boolean;
    customBranding: boolean;
    apiAccess: boolean;
  };
  
  createdAt: string;
  updatedAt: string;
}

// ====================== MAIN HOOK ======================
export const useSettings = () => {
  const queryClient = useQueryClient();

  // ================== QUERIES ==================

  // Get all settings
  const useGetSettings = () => {
    return useQuery({
      queryKey: ['settings'],
      queryFn: async () => {
        const { data } = await axios.get('/api/settings');
        return data.settings as Settings;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  // Get specific settings section
  const useGetSettingsSection = (section: string) => {
    return useQuery({
      queryKey: ['settings', section],
      queryFn: async () => {
        const { data } = await axios.get(`/api/settings/${section}`);
        return data.data;
      },
      enabled: !!section,
    });
  };

  // ================== MUTATIONS ==================

  // Update settings by section
  const useUpdateSettings = () => {
    return useMutation({
      mutationFn: async ({ section, data: sectionData }: { section: string; data: any }) => {
        const { data } = await axios.patch('/api/settings', { section, data: sectionData });
        return data;
      },
      onSuccess: () => {
        toast.success('Settings updated successfully');
        queryClient.invalidateQueries({ queryKey: ['settings'] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update settings');
      }
    });
  };

  // Update specific section directly
  const useUpdateSection = () => {
    return useMutation({
      mutationFn: async ({ section, data: sectionData }: { section: string; data: any }) => {
        const { data } = await axios.patch(`/api/settings/${section}`, sectionData);
        return data;
      },
      onSuccess: (_, variables) => {
        toast.success(`${variables.section} settings updated`);
        queryClient.invalidateQueries({ queryKey: ['settings'] });
        queryClient.invalidateQueries({ queryKey: ['settings', variables.section] });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update settings');
      }
    });
  };

  return {
    useGetSettings,
    useGetSettingsSection,
    useUpdateSettings,
    useUpdateSection,
  };
};