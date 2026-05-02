"use client"

import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon as XIcon } from '@hugeicons/core-free-icons';
import { FilterPanel } from './filter-panel';

interface MobileFilterSheetProps {
  isOpen:            boolean;
  selectedCategory:  string;
  selectedType:      string;
  showFeaturedOnly:  boolean;
  startDate?:        Date;
  endDate?:          Date;
  availableTypes:    string[];
  onClose:           () => void;
  onCategoryChange:  (v: string | null) => void;
  onTypeChange:      (v: string | null) => void;
  onFeaturedToggle:  () => void;
  onStartDateChange: (d?: Date) => void;
  onEndDateChange:   (d?: Date) => void;
  onApply:           () => void;
  onReset:           () => void;
}

export function MobileFilterSheet({
  isOpen, onClose,
  selectedCategory, selectedType, showFeaturedOnly, startDate, endDate,
  availableTypes, onCategoryChange, onTypeChange, onFeaturedToggle,
  onStartDateChange, onEndDateChange, onApply, onReset,
}: MobileFilterSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Filters</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <HugeiconsIcon icon={XIcon} size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <FilterPanel
            selectedCategory={selectedCategory}
            selectedType={selectedType}
            showFeaturedOnly={showFeaturedOnly}
            startDate={startDate}
            endDate={endDate}
            availableTypes={availableTypes}
            onCategoryChange={onCategoryChange}
            onTypeChange={onTypeChange}
            onFeaturedToggle={onFeaturedToggle}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
            onApply={() => { onApply(); onClose(); }}
            onReset={onReset}
          />
        </div>
      </div>
    </div>
  );
}