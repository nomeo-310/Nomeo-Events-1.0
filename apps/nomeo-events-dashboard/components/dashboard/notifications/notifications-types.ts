// notifications-types.ts
import { formatDistanceToNow } from 'date-fns';
import { 
  TickDouble02Icon, 
  Archive03Icon, 
  Delete03Icon,
  ViewIcon,
  ViewOffSlashIcon,
  ArchiveRestoreIcon
} from '@hugeicons/core-free-icons';
import type { Notification } from '@/hooks/use-notification';

export type NotificationStatus = 'unread' | 'read' | 'archived';
export type NotificationAction = 'mark-as-read' | 'mark-as-unread' | 'archive' | 'restore' | 'delete';
export type BulkActionType = 'mark-all-read' | 'clear-read' | 'archive-all' | 'delete-archived';

export interface BulkAction {
  label: string;
  action: BulkActionType;
  icon: any;
  danger?: boolean;
}

export interface TabConfig {
  label: string;
  count: number;
}

export interface AvailableAction {
  label: string;
  action: NotificationAction;
  icon: any;
  danger?: boolean;
}

export const getMessageTypeStyles = (type: string): string => {
  switch (type) {
    case 'success': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
    case 'warning': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
    case 'error': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    case 'update': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
    default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
  }
};

export const getAvailableActions = (notification: Notification): AvailableAction[] => {
  if (notification.status === 'unread') {
    return [
      { label: 'Mark as read', action: 'mark-as-read', icon: ViewIcon },
      { label: 'Archive', action: 'archive', icon: Archive03Icon },
    ];
  }
  
  if (notification.status === 'read') {
    return [
      { label: 'Mark as unread', action: 'mark-as-unread', icon: ViewOffSlashIcon },
      { label: 'Archive', action: 'archive', icon: Archive03Icon },
    ];
  }
  
  if (notification.status === 'archived') {
    return [
      { label: 'Restore to read', action: 'restore', icon: ArchiveRestoreIcon },
      { label: 'Delete permanently', action: 'delete', icon: Delete03Icon, danger: true },
    ];
  }
  
  return [];
};

export const getBulkActions = (activeTab: NotificationStatus): BulkAction[] => {
  if (activeTab === 'unread') {
    return [
      { label: 'Mark all as read', action: 'mark-all-read', icon: TickDouble02Icon },
      { label: 'Archive all', action: 'archive-all', icon: Archive03Icon },
    ];
  }
  
  if (activeTab === 'read') {
    return [
      { label: 'Clear all read', action: 'clear-read', icon: Delete03Icon, danger: true },
      { label: 'Archive all', action: 'archive-all', icon: Archive03Icon },
    ];
  }
  
  if (activeTab === 'archived') {
    return [
      { label: 'Delete all archived', action: 'delete-archived', icon: Delete03Icon, danger: true },
    ];
  }
  
  return [];
};