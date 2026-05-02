"use client"

import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon as CalendarIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ViewMode } from './constant';
import { Button } from '@/components/ui/button';
import { PaginationWithInfo } from '@/components/ui/pagination';
import { GridCardSkeleton, ListCardSkeleton } from '../../home/events/event-skeletons';
import { UpcomingEventGridCard } from '../../home/events/event-card-grid';
import { UpcomingEventListCard } from '../../home/events/event-card-list';

interface EventsGridProps {
  events:           any[];
  isLoading:        boolean;
  isError:          boolean;
  error?:           Error | null;
  viewMode:         ViewMode;
  hasActiveFilters: boolean;
  currentPage:      number;
  totalPages:       number;
  totalEvents:      number;
  itemsPerPage:     number;
  onRefetch:        () => void;
  onResetFilters:   () => void;
  onPageChange:     (page: number) => void;
}

export function EventsGrid({
  events, isLoading, isError, error, viewMode,
  hasActiveFilters, currentPage, totalPages, totalEvents,
  itemsPerPage, onRefetch, onResetFilters, onPageChange,
}: EventsGridProps) {
  const gridClass = cn(
    viewMode === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
      : 'space-y-3',
  );

  if (isLoading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: viewMode === 'grid' ? 6 : 4 }).map((_, i) =>
          viewMode === 'grid'
            ? <GridCardSkeleton key={i} />
            : <ListCardSkeleton key={i} />,
        )}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <HugeiconsIcon icon={CalendarIcon} size={36} className="text-gray-300 dark:text-gray-700 mb-3" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed to load events</p>
        <p className="text-xs text-gray-400 mt-1 mb-4">{error?.message}</p>
        <Button onClick={onRefetch} size="sm" variant="outline">Try Again</Button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <HugeiconsIcon icon={CalendarIcon} size={36} className="text-gray-300 dark:text-gray-700 mb-3" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No events found</p>
        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or search</p>
        {hasActiveFilters && (
          <Button onClick={onResetFilters} size="sm" variant="outline" className="mt-4">
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={gridClass}>
        {events.map((event) =>
          viewMode === 'grid'
            ? <UpcomingEventGridCard key={event._id} event={event} />
            : <UpcomingEventListCard key={event._id} event={event} />,
        )}
      </div>
      {totalPages > 1 && (
        <div className="mt-8">
          <PaginationWithInfo
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalEvents}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </>
  );
}