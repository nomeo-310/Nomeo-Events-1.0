"use client"

import React from 'react';

export const PricingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-white dark:bg-gray-950">
    <div className="border-b border-gray-100 dark:border-gray-800 py-12 sm:py-16 px-4">
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <div className="h-8 sm:h-10 w-56 sm:w-72 bg-gray-100 dark:bg-gray-800 rounded-lg mx-auto animate-pulse" />
        <div className="h-4 sm:h-5 w-64 sm:w-96 bg-gray-100 dark:bg-gray-800 rounded-lg mx-auto animate-pulse" />
        <div className="h-4 sm:h-5 w-48 sm:w-64 bg-gray-100 dark:bg-gray-800 rounded-lg mx-auto animate-pulse" />
        <div className="mt-6 sm:mt-8 flex justify-center">
          <div className="flex gap-1 p-1 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse">
            {[100, 80, 90].map((w, i) => (
              <div key={i} style={{ width: w }} className="h-8 sm:h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        </div>
      </div>
    </div>

    <div className="container mx-auto px-4 py-6 sm:py-10">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left sidebar skeleton */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0 space-y-3">
          <div className="h-5 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mb-3" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-2 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-4 w-14 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
              <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
              <div className="flex gap-2 mt-2">
                <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-3 w-12 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Right content skeleton */}
        <div className="flex-1 space-y-4 animate-pulse">
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-2">
                <div className="h-6 sm:h-7 w-28 sm:w-36 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-4 w-48 sm:w-64 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
              <div className="space-y-2 text-left sm:text-right">
                <div className="h-7 sm:h-8 w-20 sm:w-24 bg-gray-100 dark:bg-gray-800 rounded" />
                <div className="h-3 w-14 sm:w-16 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
            <div className="h-5 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-lg border border-gray-100 dark:border-gray-800 p-3 space-y-2">
                  <div className="h-6 sm:h-7 w-10 sm:w-12 bg-gray-100 dark:bg-gray-800 rounded mx-auto" />
                  <div className="h-3 w-14 sm:w-16 bg-gray-100 dark:bg-gray-800 rounded mx-auto" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-3">
            <div className="h-5 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);