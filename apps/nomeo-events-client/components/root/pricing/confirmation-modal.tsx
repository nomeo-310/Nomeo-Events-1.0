"use client"

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { TierPricing, IntervalPricing, PlanInterval } from './types';

interface ConfirmationModalProps {
  open:      boolean;
  tier:      TierPricing;
  pricing:   IntervalPricing;
  interval:  PlanInterval;
  onClose:   () => void;
  onConfirm: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open, tier, pricing, interval, onClose, onConfirm,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <HugeiconsIcon icon={Alert01Icon} size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Subscription</h3>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You are about to subscribe to the{' '}
              <span className="font-semibold text-gray-900 dark:text-white">{tier.name}</span> plan.
            </p>

            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 space-y-2">
              {[
                { label: 'Plan',    value: tier.name },
                { label: 'Billing', value: <span className="capitalize">{interval}</span> },
                { label: 'Price',   value: <span className="font-bold text-indigo-600 dark:text-indigo-400">{pricing.priceDisplay}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{label}:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
              {pricing.trialDays > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Free trial:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{pricing.trialDays} days</span>
                </div>
              )}
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-lg p-3 border border-indigo-100 dark:border-indigo-900">
              <p className="text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                <HugeiconsIcon icon={InformationCircleIcon} size={14} className="flex-shrink-0 mt-0.5" />
                <span>
                  You won't be charged until after your {pricing.trialDays}-day free trial ends. Cancel anytime.
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};