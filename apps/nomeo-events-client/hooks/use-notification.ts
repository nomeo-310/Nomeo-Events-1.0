import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Types } from 'mongoose';

// Types
export interface NotificationSender {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface NotificationMetadata {
  eventId?: string;
  registrationId?: string;
  action?: string;
}

export interface Notification {
  _id: string;
  senderId: NotificationSender;
  receiverId: string;
  title: string;
  message: string;
  message_type: "info" | "success" | "warning" | "error" | "update";
  sender_type: "system" | "user" | "admin";
  link?: string;
  metadata?: NotificationMetadata;
  status: 'unread' | 'read' | 'archived';
  timeAgo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCounts {
  unread: number;
  read: number;
  archived: number;
}

interface PaginatedResponse {
  success: boolean;
  data: Notification[];
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

interface CountsResponse {
  success: boolean;
  message: string;
  data: NotificationCounts;
}

interface UpdateNotificationResponse {
  success: boolean;
  message: string;
  data: Notification;
}

interface BulkActionResponse {
  success: boolean;
  message: string;
  data: { modifiedCount: number };
}

export interface GetNotificationsParams {
  status?: 'all' | 'unread' | 'read' | 'archived';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UpdateNotificationParams {
  notificationId: string;
  action: 'mark-as-read' | 'mark-as-unread' | 'archive' | 'restore' | 'delete';
}

interface BulkActionParams {
  action: 'mark-all-read' | 'clear-read' | 'archive-all' | 'delete-archived';
}

// API functions
const notificationApi = {
  getNotifications: async (params: GetNotificationsParams): Promise<PaginatedResponse> => {
    const { data } = await axios.get<PaginatedResponse>('/api/user/notifications', { params });
    return data;
  },

  getNotificationCounts: async (): Promise<CountsResponse> => {
    const { data } = await axios.get<CountsResponse>('/api/user/notifications/counts');
    return data;
  },

  updateNotification: async ({ notificationId, action }: UpdateNotificationParams): Promise<UpdateNotificationResponse> => {
    const { data } = await axios.patch<UpdateNotificationResponse>('/api/user/notifications', { notificationId, action });
    return data;
  },

  bulkAction: async ({ action }: BulkActionParams): Promise<BulkActionResponse> => {
    const { data } = await axios.post<BulkActionResponse>('/api/user/notifications', { action });
    return data;
  },
};

// Query Keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params: GetNotificationsParams) => [...notificationKeys.lists(), params] as const,
  counts: () => [...notificationKeys.all, 'counts'] as const,
  details: () => [...notificationKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
};

// Hook: Get notifications with pagination and filtering
export const useGetNotifications = (params: GetNotificationsParams = {}) => {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationApi.getNotifications(params),
    staleTime: 1000 * 60,
    placeholderData: (previousData) => previousData, 
  });
};

// Hook: Get notification counts
export const useNotificationCounts = () => {
  return useQuery({
    queryKey: notificationKeys.counts(),
    queryFn: () => notificationApi.getNotificationCounts(),
    staleTime: 1000 * 30,
    refetchInterval: 30000,
    select: (data): NotificationCounts => data.data,
  });
};

// Hook: Update single notification
export const useUpdateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateNotificationResponse, Error, UpdateNotificationParams>({
    mutationFn: notificationApi.updateNotification,
    onSuccess: (data, variables) => {
      toast.success(data.message);

      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.counts() });

      queryClient.setQueriesData<PaginatedResponse>(
        { queryKey: notificationKeys.lists(), exact: false },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((notification) =>
              notification._id === variables.notificationId
                ? { ...notification, ...data.data }
                : notification
            ),
          };
        }
      );
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Failed to update notification');
      } else {
        toast.error('Failed to update notification');
      }
    },
  });
};

// Hook: Bulk actions
export const useBulkNotificationAction = () => {
  const queryClient = useQueryClient();

  return useMutation<BulkActionResponse, Error, BulkActionParams>({
    mutationFn: notificationApi.bulkAction,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.counts() });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Failed to perform bulk action');
      } else {
        toast.error('Failed to perform bulk action');
      }
    },
  });
};

// Convenience hook: combines counts and recent unread notifications
export const useNotificationSummary = () => {
  const { data: counts, isLoading: countsLoading } = useNotificationCounts();
  const { data: recentUnread, isLoading: unreadLoading } = useGetNotifications({
    status: 'unread',
    limit: 5,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  return {
    counts: counts ?? ({ unread: 0, read: 0, archived: 0 } satisfies NotificationCounts),
    recentUnread: recentUnread?.data ?? [],
    isLoading: countsLoading || unreadLoading,
    hasUnread: (counts?.unread ?? 0) > 0,
  };
};