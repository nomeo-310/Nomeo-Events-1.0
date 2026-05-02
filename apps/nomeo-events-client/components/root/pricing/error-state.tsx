"use client"

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

interface ErrorStateProps {
  error:   string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-4">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center mx-auto">
        <HugeiconsIcon icon={Cancel01Icon} size={20} className="text-red-500" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  </div>
);