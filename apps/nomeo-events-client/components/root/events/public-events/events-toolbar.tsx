
"use client"

import { HugeiconsIcon } from '@hugeicons/react';
import { FilterIcon, GridViewIcon, ListViewIcon, Clock01Icon as ClockIcon, PlayCircleIcon, CheckmarkCircle01Icon as CheckCircleIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { StatusPill } from './status-pill';
import { EventStatus, ViewMode } from './constant';

interface EventsToolbarProps {
  activeStatus:     EventStatus;
  viewMode:         ViewMode;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  onStatusChange:   (s: EventStatus) => void;
  onViewModeChange: (m: ViewMode) => void;
  onOpenMobileFilter: () => void;
}

export function EventsToolbar({
  activeStatus, viewMode, hasActiveFilters, activeFilterCount,
  onStatusChange, onViewModeChange, onOpenMobileFilter,
}: EventsToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2">
        {/* Status pills */}
        <div className="flex items-center gap-1.5">
          <StatusPill
            active={activeStatus === 'upcoming'}
            onClick={() => onStatusChange('upcoming')}
            icon={<HugeiconsIcon icon={ClockIcon} size={11} />}
            label="Upcoming"
          />
          <StatusPill
            active={activeStatus === 'ongoing'}
            onClick={() => onStatusChange('ongoing')}
            icon={<HugeiconsIcon icon={PlayCircleIcon} size={11} />}
            label="Ongoing"
          />
          <StatusPill
            active={activeStatus === 'completed'}
            onClick={() => onStatusChange('completed')}
            icon={<HugeiconsIcon icon={CheckCircleIcon} size={11} />}
            label="Completed"
          />
        </div>

        {/* Mobile filter button */}
        <button
          type="button"
          onClick={onOpenMobileFilter}
          className={cn(
            'lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            hasActiveFilters
              ? 'border-gray-900 text-gray-900 bg-gray-50 dark:border-white dark:text-white dark:bg-gray-800'
              : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400',
          )}
        >
          <HugeiconsIcon icon={FilterIcon} size={11} />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-600 text-white dark:bg-white dark:text-gray-900 text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-700 p-0.5 bg-white dark:bg-gray-900">
        {(['grid', 'list'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              viewMode === mode
                ? 'bg-indigo-600 text-white dark:bg-white dark:text-gray-900'
                : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
            )}
          >
            <HugeiconsIcon icon={mode === 'grid' ? GridViewIcon : ListViewIcon} size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}