import { HugeiconsIcon } from '@hugeicons/react';
import { ActivityIcon, FilterHorizontalIcon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  hasFilters: boolean;
  onClear: () => void;
}

export function EmptyState({ hasFilters, onClear }: EmptyStateProps) {
  return (
    <div className="py-24 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
        <HugeiconsIcon icon={ActivityIcon} className="h-6 w-6 text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {hasFilters ? 'No matching logs' : 'No activity yet'}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {hasFilters
          ? 'Try adjusting your filters or search term'
          : 'Admin actions will appear here once recorded'}
      </p>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear}>
          <HugeiconsIcon icon={FilterHorizontalIcon} className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}