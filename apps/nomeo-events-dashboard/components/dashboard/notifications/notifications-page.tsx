// app/notifications/page.tsx
'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import { Refresh04Icon } from '@hugeicons/core-free-icons';
import { useQueryClient } from '@tanstack/react-query';
import { PaginationWithInfo } from '@/components/ui/pagination';

import { useGetNotifications, useUpdateNotification, useBulkNotificationAction, useNotificationSummary, type GetNotificationsParams } from '@/hooks/use-notification';

import type { NotificationStatus, NotificationAction, BulkActionType } from './notifications-types';
import { NotificationSkeleton } from './notifications-skeletons';
import { EmptyState, ErrorState } from './notifications-state';
import { TabButton } from './notifications-tab-button';
import { BulkActionsBar } from './notifications-bulk-actions';
import { NotificationItem } from './notifications-item';

// Tab Content Component with Pagination
const TabContent = ({ 
  status, 
  currentPage,
  onPageChange,
  onNotificationUpdate 
}: { 
  status: NotificationStatus;
  currentPage: number;
  onPageChange: (page: number) => void;
  onNotificationUpdate: (id: string, action: NotificationAction) => Promise<void>;
}) => {
  const params: GetNotificationsParams = {
    page: currentPage,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    status: status
  };

  const { data, isLoading, error, refetch } = useGetNotifications(params);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <NotificationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState 
        error={error instanceof Error ? error.message : 'Failed to load notifications'} 
        onRetry={() => refetch()}
      />
    );
  }

  const notifications = data?.data || [];
  const pagination = data?.pagination;
  
  if (notifications.length === 0 && currentPage === 1) {
    return <EmptyState status={status} />;
  }
  
  if (notifications.length === 0 && currentPage > 1) {
    onPageChange(1);
    return null;
  }

  return (
    <div>
      <div className="space-y-3">
        {notifications.map((notification) => (
          <NotificationItem 
            key={notification._id} 
            notification={notification} 
            onUpdate={onNotificationUpdate}
          />
        ))}
      </div>
      
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <PaginationWithInfo
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalCount}
            itemsPerPage={pagination.limit}
            onPageChange={onPageChange}
            showInfo={true}
            showPageNumbers={true}
            maxVisiblePages={5}
          />
        </div>
      )}
    </div>
  );
};

// Main Notification Center Component
const NotificationCenter = () => {
  const [activeTab, setActiveTab] = useState<NotificationStatus>('unread');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { counts, isLoading: countsLoading } = useNotificationSummary();
  const updateNotification = useUpdateNotification();
  const bulkAction = useBulkNotificationAction();
  const queryClient = useQueryClient();

  const handleNotificationUpdate = async (id: string, action: NotificationAction) => {
    await updateNotification.mutateAsync({ notificationId: id, action });
  };

  const handleBulkAction = async (action: BulkActionType) => {
    await bulkAction.mutateAsync({ action });
    setCurrentPage(1);
  };

  const handleTabChange = (tab: NotificationStatus) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const tabConfigs = {
    unread: { label: 'Unread', count: counts?.unread || 0 },
    read: { label: 'Read', count: counts?.read || 0 },
    archived: { label: 'Archived', count: counts?.archived || 0 },
  };

  const isPending = updateNotification.isPending || bulkAction.isPending;

  return (
    <div className="w-full">
      {/* Introduction Text */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
          {!countsLoading && counts?.unread > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
              {counts.unread} new
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Stay updated with your latest activities and system announcements. 
          Manage your notifications by marking them as read, archiving, or deleting.
        </p>
      </div>

      {/* Header with Refresh */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleRefresh}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          disabled={isPending}
        >
          <HugeiconsIcon icon={Refresh04Icon} className={cn("h-4 w-4 mr-2", isPending && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {Object.entries(tabConfigs).map(([key, { label, count }]) => (
          <TabButton
            key={key}
            label={label}
            count={count}
            isActive={activeTab === key}
            onClick={() => handleTabChange(key as NotificationStatus)}
          />
        ))}
      </div>

      {/* Bulk Actions */}
      <BulkActionsBar 
        activeTab={activeTab}
        onAction={handleBulkAction} 
        isPending={isPending}
      />

      {/* Notifications List */}
      <div>
        <TabContent 
          status={activeTab}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onNotificationUpdate={handleNotificationUpdate}
        />
      </div>
    </div>
  );
};

// Notifications Page Component
const NotificationsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-5xl px-4">
        <NotificationCenter />
      </div>
    </div>
  );
};

export default NotificationsPage;