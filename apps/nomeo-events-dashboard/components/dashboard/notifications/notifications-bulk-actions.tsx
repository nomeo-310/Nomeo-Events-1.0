// notifications-bulk-actions.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import type { NotificationStatus, BulkActionType, BulkAction } from './notifications-types';
import { getBulkActions } from './notifications-types';

interface BulkActionsBarProps {
  activeTab: NotificationStatus;
  onAction: (action: BulkActionType) => void;
  isPending: boolean;
}

export const BulkActionsBar = ({ activeTab, onAction, isPending }: BulkActionsBarProps) => {
  const bulkActions = getBulkActions(activeTab);
  
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
          <HugeiconsIcon icon={action.icon} className="h-4 w-4 mr-2" />
          {action.label}
        </button>
      ))}
    </div>
  );
};