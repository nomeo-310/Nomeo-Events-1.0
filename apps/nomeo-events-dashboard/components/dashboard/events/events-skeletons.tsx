// events-skeletons.tsx
import { cn } from "@/lib/utils";

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] dark:from-gray-800 dark:via-gray-700 dark:to-gray-800",
        className
      )}
    />
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-3 mb-6">
        <SkeletonLine className="h-10 flex-1" />
        <SkeletonLine className="h-10 w-36" />
        <SkeletonLine className="h-10 w-36" />
      </div>
      <SkeletonLine className="h-10 w-full" />
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <SkeletonLine className="h-4 w-4 rounded" />
          <div className="space-y-1 flex-1">
            <SkeletonLine className="h-3 w-48" />
            <SkeletonLine className="h-2 w-32" />
          </div>
          <SkeletonLine className="h-5 w-20 rounded-full" />
          <SkeletonLine className="h-5 w-16 rounded-full" />
          <SkeletonLine className="h-3 w-24" />
          <SkeletonLine className="h-7 w-7 rounded-lg" />
        </div>
      ))}
    </div>
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

export function ModalSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonLine className="h-48 w-full rounded-xl" />
      <div className="flex items-start gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-6 w-48" />
          <SkeletonLine className="h-4 w-64" />
          <div className="flex gap-2 mt-2">
            <SkeletonLine className="h-6 w-20 rounded-full" />
            <SkeletonLine className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <SkeletonLine key={i} className="h-20 rounded-lg" />)}
      </div>
      <div className="space-y-3">
        <SkeletonLine className="h-5 w-40" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <SkeletonLine key={i} className="h-16 rounded-lg" />)}
        </div>
      </div>
    </div>
  );
}