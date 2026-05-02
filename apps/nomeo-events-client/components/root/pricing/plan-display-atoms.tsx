"use client"

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon, CancelCircleIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

// ─── LimitStat ────────────────────────────────────────────────────────────────

interface LimitStatProps {
  value: string;
  label: string;
}

export const LimitStat: React.FC<LimitStatProps> = ({ value, label }) => (
  <div className="text-center p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
    <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{value}</div>
    <div className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{label}</div>
  </div>
);

// ─── FeatureRow ───────────────────────────────────────────────────────────────

interface FeatureRowProps {
  name:         string;
  included:     boolean;
  limit?:       number | string;
  unit?:        string;
  description?: string;
}

export const FeatureRow: React.FC<FeatureRowProps> = ({ name, included, limit, unit, description }) => (
  <div className={cn(
    'flex items-start gap-2.5 px-2 py-2 rounded-lg transition-colors',
    included ? 'hover:bg-gray-50 dark:hover:bg-gray-900' : 'opacity-50',
  )}>
    <div className={cn(
      'flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center',
      included ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-gray-100 dark:bg-gray-800',
    )}>
      <HugeiconsIcon
        icon={included ? CheckmarkCircle02Icon : CancelCircleIcon}
        size={12}
        className={included ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}
      />
    </div>
    <div>
      <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
      {limit != null && (
        <span className="text-xs text-gray-400 ml-1">({limit} {unit})</span>
      )}
      {description && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
      )}
    </div>
  </div>
);