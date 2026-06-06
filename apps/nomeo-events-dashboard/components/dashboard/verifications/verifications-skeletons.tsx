// verifications-skeletons.tsx

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] ${className ?? ""}`}
    />
  );
}

export const TableSkeleton = () => (
  <div className="space-y-0">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800"
        style={{ opacity: 1 - i * 0.1 }}
      >
        <SkeletonLine className="h-4 w-4 rounded" />
        <div className="flex items-center gap-3 flex-1">
          <SkeletonLine className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <SkeletonLine className="h-3 w-36" />
            <SkeletonLine className="h-2.5 w-24" />
          </div>
        </div>
        <SkeletonLine className="h-3 w-40" />
        <SkeletonLine className="h-6 w-24 rounded-full" />
        <SkeletonLine className="h-6 w-28 rounded-full" />
        <SkeletonLine className="h-3 w-24" />
        <SkeletonLine className="h-8 w-20 rounded-lg" />
      </div>
    ))}
  </div>
);

export const MobileCardSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <SkeletonLine className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <SkeletonLine className="h-3 w-32" />
            <SkeletonLine className="h-2.5 w-24" />
          </div>
        </div>
      </div>
    ))}
  </div>
);