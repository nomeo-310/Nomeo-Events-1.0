// notifications-item.tsx
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  MoreVerticalIcon, 
  ViewIcon, 
  ViewOffSlashIcon, 
  Archive03Icon, 
  ArchiveRestoreIcon, 
  Delete03Icon 
} from '@hugeicons/core-free-icons';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Notification } from '@/hooks/use-notification';
import type { NotificationAction } from './notifications-types';
import { getMessageTypeStyles } from './notifications-types';

interface NotificationItemProps {
  notification: Notification;
  onUpdate: (id: string, action: NotificationAction) => Promise<void>;
  onClose?: () => void;
}

const getAvailableActions = (notification: Notification) => {
  if (notification.status === 'unread') {
    return [
      { label: 'Mark as read', action: 'mark-as-read' as const, icon: ViewIcon },
      { label: 'Archive', action: 'archive' as const, icon: Archive03Icon },
    ];
  }
  
  if (notification.status === 'read') {
    return [
      { label: 'Mark as unread', action: 'mark-as-unread' as const, icon: ViewOffSlashIcon },
      { label: 'Archive', action: 'archive' as const, icon: Archive03Icon },
    ];
  }
  
  if (notification.status === 'archived') {
    return [
      { label: 'Restore to read', action: 'restore' as const, icon: ArchiveRestoreIcon },
      { label: 'Delete permanently', action: 'delete' as const, icon: Delete03Icon, danger: true },
    ];
  }
  
  return [];
};

export const NotificationItem = ({ notification, onUpdate, onClose }: NotificationItemProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleAction = async (action: NotificationAction) => {
    setIsUpdating(true);
    await onUpdate(notification._id, action);
    setIsUpdating(false);
    setShowDropdown(false);
  };

  const availableActions = getAvailableActions(notification);

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
                      <HugeiconsIcon icon={action.icon} className="h-4 w-4 mr-2" />
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