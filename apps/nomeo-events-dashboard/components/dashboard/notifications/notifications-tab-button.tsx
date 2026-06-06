// notifications-tab-button.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface TabButtonProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

export const TabButton = ({ label, count, isActive, onClick }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2 text-sm font-medium rounded-md transition-all",
      isActive 
        ? "bg-blue-600 text-white shadow-sm" 
        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
    )}
  >
    {label}
    {count > 0 && (
      <span className={cn(
        "ml-2 px-2 py-0.5 text-xs rounded-full",
        isActive 
          ? "bg-blue-500 text-white" 
          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
      )}>
        {count}
      </span>
    )}
  </button>
);