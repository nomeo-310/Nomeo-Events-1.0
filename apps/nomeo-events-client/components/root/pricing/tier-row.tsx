"use client"


import React from 'react';
import { cn } from '@/lib/utils';
import { TierPricing, IntervalPricing } from './types';

interface TierRowProps {
  tier:       TierPricing;
  pricing:    IntervalPricing | null | undefined;
  isSelected: boolean;
  onSelect:   () => void;
}

export const TierRow: React.FC<TierRowProps> = ({ tier, pricing, isSelected, onSelect }) => (
  <div
    className={cn(
      'relative w-full rounded-xl border transition-all duration-200 select-none overflow-hidden cursor-pointer',
      isSelected
        ? 'border-indigo-600 dark:border-white bg-gray-50 dark:bg-gray-900'
        : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 bg-gray-50 dark:bg-gray-900/20',
    )}
    onClick={onSelect}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onSelect()}
  >
    <div className="p-4">
      <div className="flex items-start justify-between pr-6">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{tier.name}</span>
            {tier.isPopular && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Popular
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">{tier.tagline}</p>
        </div>
        {pricing && (
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{pricing.priceDisplay}</div>
            {pricing.savings && (
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400">{pricing.savings.text}</div>
            )}
          </div>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-x-2 gap-y-0.5">
        {tier.features.slice(0, 2).map((f, i) => (
          <span key={i} className="text-[11px] text-gray-400 dark:text-gray-500">
            · {f.name}
          </span>
        ))}
        {tier.features.length > 2 && (
          <span className="text-[11px] text-gray-400 dark:text-gray-500">+{tier.features.length - 2} more</span>
        )}
      </div>
    </div>

    {isSelected && (
      <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-600 dark:bg-white" />
    )}
  </div>
);