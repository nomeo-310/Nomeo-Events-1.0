// plans-skeletons.tsx
import { cn } from '@/lib/utils';

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite]",
        className
      )}
    />
  );
}

export function PlansSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <div className="flex items-center gap-3 mb-4">
            <SkeletonLine className="h-6 w-32" />
            <SkeletonLine className="h-5 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <SkeletonLine className="h-6 w-24 rounded-full" />
                    <SkeletonLine className="h-8 w-8 rounded-lg" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <SkeletonLine className="h-5 w-40" />
                    <SkeletonLine className="h-8 w-32" />
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <SkeletonLine className="h-10 w-full" />
                      <SkeletonLine className="h-10 w-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TiersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <SkeletonLine className="h-8 w-8 rounded-full" />
            <div>
              <SkeletonLine className="h-5 w-32 mb-1" />
              <SkeletonLine className="h-3 w-48" />
            </div>
          </div>
          <SkeletonLine className="h-8 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function IntervalsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <SkeletonLine className="h-8 w-8 rounded-full" />
            <div>
              <SkeletonLine className="h-5 w-32 mb-1" />
              <SkeletonLine className="h-3 w-48" />
            </div>
          </div>
          <SkeletonLine className="h-8 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}