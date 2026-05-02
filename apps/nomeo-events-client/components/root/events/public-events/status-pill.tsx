import React from 'react';
import { cn } from '@/lib/utils';

interface StatusPillProps {
  active:  boolean;
  onClick: () => void;
  icon:    React.ReactNode;
  label:   string;
}

export function StatusPill({ active, onClick, icon, label }: StatusPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-150',
        active
          ? 'bg-indigo-600 text-white dark:bg-white dark:text-gray-900'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200',
      )}
    >
      {icon}
      {label}
    </button>
  );
}