// notifications-skeletons.tsx
import React from 'react';

export const NotificationSkeleton = () => (
  <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
    </div>
    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
  </div>
);

export const TabSkeleton = () => (
  <div className="flex gap-3 mb-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
    ))}
  </div>
);