"use client"

import React from 'react';
import { format } from 'date-fns';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon as XIcon, StarIcon } from '@hugeicons/core-free-icons';
import { EventCategory } from '@/types/create-event-type';
import { CATEGORY_LABELS, formatTypeLabel } from './constant';

interface FilterChipsProps {
  searchQuery:       string;
  selectedCategory:  string;
  selectedType:      string;
  showFeaturedOnly:  boolean;
  startDate?:        Date;
  endDate?:          Date;
  onClearSearch:     () => void;
  onClearCategory:   () => void;
  onClearType:       () => void;
  onClearStartDate:  () => void;
  onClearEndDate:    () => void;
  onClearFeatured:   () => void;
}

export function FilterChips({
  searchQuery, selectedCategory, selectedType, showFeaturedOnly,
  startDate, endDate,
  onClearSearch, onClearCategory, onClearType,
  onClearStartDate, onClearEndDate, onClearFeatured,
}: FilterChipsProps) {
  const hasAny = searchQuery || selectedCategory || selectedType || showFeaturedOnly || startDate || endDate;
  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {searchQuery && (
        <Chip onRemove={onClearSearch}>
          &ldquo;{searchQuery}&rdquo;
        </Chip>
      )}
      {selectedCategory && (
        <Chip color="indigo" onRemove={onClearCategory}>
          {CATEGORY_LABELS[selectedCategory as EventCategory]}
        </Chip>
      )}
      {selectedType && (
        <Chip onRemove={onClearType}>
          {formatTypeLabel(selectedType)}
        </Chip>
      )}
      {startDate && (
        <Chip color="sky" onRemove={onClearStartDate}>
          From {format(startDate, 'MMM d')}
        </Chip>
      )}
      {endDate && (
        <Chip color="sky" onRemove={onClearEndDate}>
          To {format(endDate, 'MMM d')}
        </Chip>
      )}
      {showFeaturedOnly && (
        <Chip color="amber" onRemove={onClearFeatured}>
          <HugeiconsIcon icon={StarIcon} size={10} /> Featured
        </Chip>
      )}
    </div>
  );
}

// ─── Internal chip ────────────────────────────────────────────────────────────

const COLOR_MAP = {
  default: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
  indigo:  'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300',
  sky:     'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300',
  amber:   'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
} as const;

function Chip({
  children,
  color = 'default',
  onRemove,
}: {
  children: React.ReactNode;
  color?: keyof typeof COLOR_MAP;
  onRemove: () => void;
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${COLOR_MAP[color]}`}>
      {children}
      <button type="button" onClick={onRemove}>
        <HugeiconsIcon icon={XIcon} size={10} className="opacity-60 hover:opacity-100" />
      </button>
    </span>
  );
}