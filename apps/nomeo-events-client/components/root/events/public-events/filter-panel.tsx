"use client"

import { format } from 'date-fns';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon as CalendarIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ALL_CATEGORIES, CATEGORY_LABELS, formatTypeLabel } from './constant';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FilterPanelProps {
  selectedCategory:  string;
  selectedType:      string;
  showFeaturedOnly:  boolean;
  startDate?:        Date;
  endDate?:          Date;
  availableTypes:    string[];
  onCategoryChange:  (v: string | null) => void;
  onTypeChange:      (v: string | null) => void;
  onFeaturedToggle:  () => void;
  onStartDateChange: (d?: Date) => void;
  onEndDateChange:   (d?: Date) => void;
  onApply:           () => void;
  onReset:           () => void;
}

export function FilterPanel({
  selectedCategory, selectedType, showFeaturedOnly, startDate, endDate,
  availableTypes, onCategoryChange, onTypeChange, onFeaturedToggle,
  onStartDateChange, onEndDateChange, onApply, onReset,
}: FilterPanelProps) {
  return (
    <div className="space-y-5">
      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Category
        </label>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full h-9 lg:h-10 text-sm">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {ALL_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Event Type
        </label>
        <Select
          value={selectedType}
          onValueChange={onTypeChange}
          disabled={!selectedCategory || availableTypes.length === 0}
        >
          <SelectTrigger className="w-full h-9 lg:h-10 text-sm">
            <SelectValue placeholder={selectedCategory ? 'All Types' : 'Pick category first'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {availableTypes.map((type) => (
              <SelectItem key={type} value={type}>{formatTypeLabel(type)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date range */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Date Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Popover>
            <PopoverTrigger>
              <div
                role="button"
                className="flex items-center gap-1.5 w-full h-10 px-2.5 text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-gray-600 dark:text-gray-300"
              >
                <HugeiconsIcon icon={CalendarIcon} size={12} className="shrink-0 text-gray-400" />
                {startDate ? format(startDate, 'MMM d') : 'From'}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={startDate} onSelect={onStartDateChange} initialFocus />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger>
              <div
                role="button"
                className="flex items-center gap-1.5 w-full h-10 px-2.5 text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-gray-600 dark:text-gray-300"
              >
                <HugeiconsIcon icon={CalendarIcon} size={12} className="shrink-0 text-gray-400" />
                {endDate ? format(endDate, 'MMM d') : 'To'}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={endDate} onSelect={onEndDateChange} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Featured toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Featured Only
        </span>
        <button
          type="button"
          onClick={onFeaturedToggle}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none',
            showFeaturedOnly ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-4 w-4 transform rounded-full shadow-lg transition duration-200',
              showFeaturedOnly
                ? 'translate-x-4 bg-white dark:bg-gray-900'
                : 'translate-x-0 bg-white dark:bg-gray-400',
            )}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="pt-1 flex gap-2">
        <Button
          onClick={onApply}
          size="sm"
          className="flex-1 h-8 lg:h-10 text-xs bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
        >
          Apply
        </Button>
        <Button onClick={onReset} size="sm" variant="outline" className="flex-1 h-8 lg:h-10 text-xs">
          Reset
        </Button>
      </div>
    </div>
  );
}