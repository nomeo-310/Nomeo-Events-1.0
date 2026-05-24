// app/notifications/page.tsx
'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { TickDouble02Icon, Archive03Icon, ArchiveRestoreIcon, Refresh04Icon, MailOpen01Icon, Mail01Icon, AlertCircleIcon, MoreVerticalIcon, ViewIcon, ViewOffSlashIcon, Delete03Icon } from '@hugeicons/core-free-icons'
import { formatDistanceToNow } from 'date-fns';
import { useGetNotifications, useUpdateNotification, useBulkNotificationAction, useNotificationSummary, type GetNotificationsParams, type Notification } from '@/hooks/use-notification';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { PaginationWithInfo } from '@/components/ui/pagination';
import { HugeiconsIcon } from '@hugeicons/react';

// Types for actions
type BulkAction = {
  label: string;
  action: 'mark-all-read' | 'clear-read' | 'archive-all' | 'delete-archived';
  icon: React.ReactNode;
  danger?: boolean;
};

// Notification Skeleton Component
const NotificationSkeleton = () => (
  <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
    </div>
    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
  </div>
);

// Empty State Component
const EmptyState = ({ status }: { status: string }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
      {status === 'unread' && <HugeiconsIcon icon={Mail01Icon} className="h-10 w-10 text-gray-400 dark:text-gray-600" />}
      {status === 'read' && <HugeiconsIcon icon={MailOpen01Icon} className="h-10 w-10 text-gray-400 dark:text-gray-600" />}
      {status === 'archived' && <HugeiconsIcon icon={Archive03Icon} className="h-10 w-10 text-gray-400 dark:text-gray-600" />}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No {status} notifications</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {status === 'unread' && "You're all caught up! No unread notifications."}
      {status === 'read' && "You haven't read any notifications yet."}
      {status === 'archived' && "Your archived notifications will appear here."}
    </p>
  </div>
);

// Error State Component
const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
      <HugeiconsIcon icon={AlertCircleIcon} className="h-10 w-10 text-blue-600 dark:text-blue-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
    <button
      onClick={onRetry}
      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 dark:focus:ring-offset-gray-900"
    >
      <HugeiconsIcon icon={Refresh04Icon} className="h-4 w-4 mr-2" />
      Try Again
    </button>
  </div>
);

// Notification Item Component with tailoblue actions
const NotificationItem = ({ 
  notification, 
  onUpdate,
  onClose 
}: { 
  notification: Notification; 
  onUpdate: (id: string, action: 'mark-as-read' | 'mark-as-unread' | 'archive' | 'restore' | 'delete') => Promise<void>;
  onClose?: () => void;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleAction = async (action: 'mark-as-read' | 'mark-as-unread' | 'archive' | 'restore' | 'delete') => {
    setIsUpdating(true);
    await onUpdate(notification._id, action);
    setIsUpdating(false);
    setShowDropdown(false);
  };

  const getMessageTypeStyles = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'warning': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'error': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'update': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  // Define available actions based on notification status
  const getAvailableActions = () => {
    if (notification.status === 'unread') {
      return [
        { label: 'Mark as read', action: 'mark-as-read' as const, icon: <HugeiconsIcon icon={ViewIcon} className="h-4 w-4 mr-2" /> },
        { label: 'Archive', action: 'archive' as const, icon: <HugeiconsIcon icon={Archive03Icon} className="h-4 w-4 mr-2" /> },
      ];
    }
    
    if (notification.status === 'read') {
      return [
        { label: 'Mark as unread', action: 'mark-as-unread' as const, icon: <HugeiconsIcon icon={ViewOffSlashIcon} className="h-4 w-4 mr-2" /> },
        { label: 'Archive', action: 'archive' as const, icon: <HugeiconsIcon icon={Archive03Icon} className="h-4 w-4 mr-2" /> },
      ];
    }
    
    if (notification.status === 'archived') {
      return [
        { label: 'Restore to read', action: 'restore' as const, icon: <HugeiconsIcon icon={ArchiveRestoreIcon} className="h-4 w-4 mr-2" /> },
        { label: 'Delete permanently', action: 'delete' as const, icon: <HugeiconsIcon icon={Delete03Icon} className="h-4 w-4 mr-2" />, danger: true },
      ];
    }
    
    return [];
  };

  const availableActions = getAvailableActions();

  return (
    <div className={cn(
      "p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors relative",
      notification.status === 'unread' && "bg-blue-50/30 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    )}>
      <div className="flex items-start gap-3">
        {/* Status Indicator */}
        {notification.status === 'unread' && (
          <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-2 flex-shrink-0" />
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {notification.title}
            </h4>
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", getMessageTypeStyles(notification.message_type))}>
              {notification.message_type}
            </span>
            {notification.sender_type === 'system' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                System
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {notification.message}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
            <span>{notification.timeAgo || formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
            {notification.senderId && (
              <span>From: {notification.senderId.name}</span>
            )}
            {notification.link && (
              <a 
                href={notification.link} 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                onClick={onClose}
              >
                View Details →
              </a>
            )}
          </div>
        </div>

        {/* Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={isUpdating}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isUpdating ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-gray-600" />
            ) : (
              <HugeiconsIcon icon={MoreVerticalIcon} className="h-5 w-5 text-gray-400 dark:text-gray-600" />
            )}
          </button>
          
          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-20">
                <div className="py-1">
                  {availableActions.map((action) => (
                    <button
                      key={action.action}
                      onClick={() => handleAction(action.action)}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center",
                        'danger' in action && action.danger 
                          ? "text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
                          : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      {action.icon}
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Bulk Actions Bar Component
const BulkActionsBar = ({ 
  activeTab,
  onAction, 
  isPending 
}: { 
  activeTab: string;
  onAction: (action: 'mark-all-read' | 'clear-read' | 'archive-all' | 'delete-archived') => void; 
  isPending: boolean;
}) => {
  const getBulkActions = (): BulkAction[] => {
    if (activeTab === 'unread') {
      return [
        { label: 'Mark all as read', action: 'mark-all-read', icon: <HugeiconsIcon icon={TickDouble02Icon} className="h-4 w-4 mr-2" /> },
        { label: 'Archive all', action: 'archive-all', icon: <HugeiconsIcon icon={Archive03Icon} className="h-4 w-4 mr-2" /> },
      ];
    }
    
    if (activeTab === 'read') {
      return [
        { label: 'Clear all read', action: 'clear-read', icon: <HugeiconsIcon icon={Delete03Icon} className="h-4 w-4 mr-2" /> },
        { label: 'Archive all', action: 'archive-all', icon: <HugeiconsIcon icon={Archive03Icon} className="h-4 w-4 mr-2" /> },
      ];
    }
    
    if (activeTab === 'archived') {
      return [
        { label: 'Delete all archived', action: 'delete-archived', icon: <HugeiconsIcon icon={Delete03Icon} className="h-4 w-4 mr-2" />, danger: true },
      ];
    }
    
    return [];
  };

  const bulkActions = getBulkActions();
  
  if (bulkActions.length === 0) return null;

  return (
    <div className="flex gap-2 mb-4">
      {bulkActions.map((action) => (
        <button
          key={action.action}
          onClick={() => onAction(action.action)}
          disabled={isPending}
          className={cn(
            "inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
            action.danger 
              ? "border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20" 
              : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          )}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
};

// Tab Button Component
const TabButton = ({ 
  label, 
  count, 
  isActive, 
  onClick 
}: { 
  label: string; 
  count: number; 
  isActive: boolean; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2 text-sm font-medium rounded-md transition-all",
      isActive 
        ? "bg-blue-600 text-white shadow-sm" 
        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
    )}
  >
    {label}
    {count > 0 && (
      <span className={cn(
        "ml-2 px-2 py-0.5 text-xs rounded-full",
        isActive 
          ? "bg-blue-500 text-white" 
          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
      )}>
        {count}
      </span>
    )}
  </button>
);

// Tab Content Component with Pagination
const TabContent = ({ 
  status, 
  currentPage,
  onPageChange,
  onNotificationUpdate 
}: { 
  status: 'unread' | 'read' | 'archived';
  currentPage: number;
  onPageChange: (page: number) => void;
  onNotificationUpdate: (id: string, action: 'mark-as-read' | 'mark-as-unread' | 'archive' | 'restore' | 'delete') => Promise<void>;
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
  const [activeTab, setActiveTab] = useState<'unread' | 'read' | 'archived'>('unread');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { counts, isLoading: countsLoading } = useNotificationSummary();
  const updateNotification = useUpdateNotification();
  const bulkAction = useBulkNotificationAction();
  const queryClient = useQueryClient();

  const handleNotificationUpdate = async (id: string, action: 'mark-as-read' | 'mark-as-unread' | 'archive' | 'restore' | 'delete') => {
    await updateNotification.mutateAsync({ notificationId: id, action });
  };

  const handleBulkAction = async (action: 'mark-all-read' | 'clear-read' | 'archive-all' | 'delete-archived') => {
    await bulkAction.mutateAsync({ action });
    setCurrentPage(1);
  };

  const handleTabChange = (tab: 'unread' | 'read' | 'archived') => {
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
            onClick={() => handleTabChange(key as any)}
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