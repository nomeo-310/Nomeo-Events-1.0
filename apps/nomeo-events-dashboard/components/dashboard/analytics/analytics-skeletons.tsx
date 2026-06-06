// analytics-skeletons.tsx
import { cn } from "@/lib/utils";

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={cn(
      "rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] dark:from-gray-800 dark:via-gray-700 dark:to-gray-800",
      className
    )} />
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="mt-2 h-7 w-32" />
          <SkeletonLine className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <SkeletonLine className="h-4 w-40 mb-4" />
      <SkeletonLine className="h-[180px] w-full" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonLine className="h-8 w-56 mb-2" />
        <SkeletonLine className="h-4 w-80" />
      </div>
      <StatsSkeleton />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <SkeletonLine className="h-3 w-20 mb-2" />
            <SkeletonLine className="h-6 w-24 mb-1" />
            <SkeletonLine className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}