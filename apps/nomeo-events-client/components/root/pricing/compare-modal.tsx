"use client"

import React, { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Cancel01Icon,
  Tick01Icon,
  ArrowDataTransferHorizontalIcon as CompareIcon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TierPricing, IntervalPricing } from './types';

// ✅ Helper to check if a tier is free (based on name/slug)
const isFreeTier = (tier: TierPricing): boolean => {
  return tier.tier === 'free' || tier.name?.toLowerCase() === 'free' || tier.slug === 'free';
};

interface CompareModalProps {
  tiers:             TierPricing[];
  selectedTiers:     string[];  // ✅ Changed from PlanTier[] to string[]
  selectedInterval:  string;    // ✅ Changed from PlanInterval to string
  onClose:           () => void;
  onUpdateSelection: (tiers: string[]) => void;  // ✅ Changed to string[]
  getPricingForTier: (tier: TierPricing) => IntervalPricing | null | undefined;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  tiers, selectedTiers, selectedInterval, onClose, onUpdateSelection, getPricingForTier,
}) => {
  const [tempSelectedTiers, setTempSelectedTiers] = useState<string[]>(selectedTiers);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ✅ Filter out free tiers for comparison (can't compare free tier)
  const compareableTiers = tiers.filter((t) => !isFreeTier(t));

  const handleToggleTier = (tier: string) => {
    setTempSelectedTiers((prev) => {
      if (prev.includes(tier)) return prev.filter((t) => t !== tier);
      if (prev.length >= 3) {
        setErrorMessage('You can compare up to 3 plans at once');
        return prev;
      }
      setErrorMessage(null);
      return [...prev, tier];
    });
  };

  const handleApply = () => {
    if (tempSelectedTiers.length < 2) {
      setErrorMessage('Please select at least 2 plans to compare');
      return;
    }
    onUpdateSelection(tempSelectedTiers);
    onClose();
  };

  const tiersToCompare = tiers.filter((t) => tempSelectedTiers.includes(t.tier));
  
  // ✅ Get unique features across selected tiers
  const allFeatures = Array.from(
    new Map(tiersToCompare.flatMap((t) => t.features.map((f) => [f.name, f]))).values(),
  );

  // ✅ Helper to format limit values
  const formatLimitValue = (value: number | undefined, label: string): string => {
    if (value === undefined) return '∞';
    if (label === 'attendees/event') return value.toLocaleString();
    if (label === 'GB storage') return `${value} GB`;
    return String(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 sm:p-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Compare Plans</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select up to 3 plans to compare features</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Plan selector buttons */}
          <div className="mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select plans to compare:</p>
            <div className="flex flex-wrap gap-3">
              {compareableTiers.map((tier) => (
                <button
                  key={tier.tier}
                  onClick={() => handleToggleTier(tier.tier)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    tempSelectedTiers.includes(tier.tier)
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
                  )}
                >
                  {tier.name}
                </button>
              ))}
            </div>
            {errorMessage && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-2 flex items-center gap-1">
                <HugeiconsIcon icon={Cancel01Icon} size={12} /> {errorMessage}
              </p>
            )}
          </div>

          {/* Comparison table */}
          {tiersToCompare.length >= 2 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-4 bg-gray-50 dark:bg-gray-800/50 rounded-l-xl border border-gray-100 dark:border-gray-800">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">Features</span>
                    </th>
                    {tiersToCompare.map((tier) => {
                      const pricing = getPricingForTier(tier);
                      return (
                        <th key={tier.tier} className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-r border-b border-gray-100 dark:border-gray-800 last:rounded-r-xl min-w-[180px]">
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              <span className="text-base font-semibold text-gray-900 dark:text-white">{tier.name}</span>
                              {tier.isPopular && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                  Popular
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{tier.tagline || tier.description?.slice(0, 60)}</p>
                            {pricing && (
                              <>
                                <div className="text-xl font-bold text-gray-900 dark:text-white">{pricing.priceDisplay}</div>
                                <div className="text-xs text-gray-400">per {selectedInterval}</div>
                                {pricing.savings && (
                                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                                    {pricing.savings.text}
                                  </span>
                                )}
                                {pricing.trialDays > 0 && (
                                  <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                                    {pricing.trialDays}-day trial
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Limits row */}
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="p-4 font-medium text-gray-900 dark:text-white bg-gray-50/50">Plan limits</td>
                    {tiersToCompare.map((tier) => (
                      <td key={`limits-${tier.tier}`} className="p-4 text-center border-l border-gray-100 dark:border-gray-800">
                        <div className="space-y-1.5">
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatLimitValue(tier.limits.maxEvents, 'events')}
                            </span>
                            <span className="text-gray-500 text-xs ml-1">events</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatLimitValue(tier.limits.maxAttendeesPerEvent, 'attendees/event')}
                            </span>
                            <span className="text-gray-500 text-xs ml-1">attendees/event</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatLimitValue(tier.limits.maxTeamMembers, 'team members')}
                            </span>
                            <span className="text-gray-500 text-xs ml-1">team members</span>
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatLimitValue(tier.limits.storageGb, 'GB storage')}
                            </span>
                            <span className="text-gray-500 text-xs ml-1">storage</span>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Feature rows */}
                  {allFeatures.map((feature) => (
                    <tr key={feature.name} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="p-4 text-sm text-gray-700 dark:text-gray-300 bg-gray-50/50">
                        {feature.name}
                        {feature.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{feature.description}</p>
                        )}
                      </td>
                      {tiersToCompare.map((tier) => {
                        const tf = tier.features.find((f) => f.name === feature.name);
                        return (
                          <td key={`${tier.tier}-${feature.name}`} className="p-4 text-center border-l border-gray-100 dark:border-gray-800">
                            {tf?.included ? (
                              <div className="flex flex-col items-center gap-1">
                                <HugeiconsIcon icon={Tick01Icon} size={16} className="text-emerald-500" />
                                {tf.limit != null && tf.limit > 0 && (
                                  <span className="text-xs text-gray-500">{tf.limit} {tf.unit || ''}</span>
                                )}
                              </div>
                            ) : (
                              <HugeiconsIcon icon={Cancel01Icon} size={14} className="text-gray-400 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <HugeiconsIcon icon={CompareIcon} size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">Select at least 2 plans to compare</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Click on the plan buttons above to add them</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
            >
              Apply Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};