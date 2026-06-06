// notifications-state.tsx
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Mail01Icon, 
  MailOpen01Icon, 
  Archive03Icon, 
  AlertCircleIcon, 
  Refresh04Icon 
} from '@hugeicons/core-free-icons';
import type { NotificationStatus } from './notifications-types';

interface EmptyStateProps {
  status: NotificationStatus;
}

export const EmptyState = ({ status }: EmptyStateProps) => (
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

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => (
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