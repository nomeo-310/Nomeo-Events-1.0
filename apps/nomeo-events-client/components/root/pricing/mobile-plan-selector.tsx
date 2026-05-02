"use client"

import React, { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon as ChevronDownIcon,
  ArrowUp01Icon as ChevronUpIcon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { PlanTier } from '@/hooks/use-plans';
import { TierPricing, IntervalPricing } from './types';

interface MobilePlanSelectorProps {
  tiers:             TierPricing[];
  selectedTier:      PlanTier | null;
  onSelectTier:      (tier: PlanTier) => void;
  getPricingForTier: (tier: TierPricing) => IntervalPricing | null | undefined;
}

export const MobilePlanSelector: React.FC<MobilePlanSelectorProps> = ({
  tiers, selectedTier, onSelectTier, getPricingForTier,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedTierData = tiers.find((t) => t.tier === selectedTier);

  return (
    <div className="lg:hidden mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Selected Plan</span>
            {selectedTierData?.isPopular && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                Popular
              </span>
            )}
          </div>
          <div className="mt-1">
            <span className="text-base font-bold text-gray-900 dark:text-white">
              {selectedTierData?.name}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              {selectedTierData && getPricingForTier(selectedTierData)?.priceDisplay}
            </span>
          </div>
        </div>
        <HugeiconsIcon
          icon={isOpen ? ChevronUpIcon : ChevronDownIcon}
          size={20}
          className="text-gray-400"
        />
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {tiers.map((tier) => (
            <div
              key={tier.tier}
              onClick={() => { onSelectTier(tier.tier); setIsOpen(false); }}
              className={cn(
                'p-4 rounded-xl border cursor-pointer transition-all',
                selectedTier === tier.tier
                  ? 'border-indigo-600 dark:border-white bg-gray-50 dark:bg-gray-900'
                  : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-950',
              )}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{tier.name}</span>
                    {tier.isPopular && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{tier.tagline}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {getPricingForTier(tier)?.priceDisplay}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};