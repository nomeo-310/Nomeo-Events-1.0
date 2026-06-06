// users-skeletons.tsx

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={`rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] ${className ?? ''}`} />
  );
}

export const UsersSkeleton = () => (
  <div className="space-y-3">
    <div className="flex gap-3 mb-6">
      <SkeletonLine className="h-10 flex-1" />
      <SkeletonLine className="h-10 w-36" />
      <SkeletonLine className="h-10 w-36" />
    </div>
    <div className="flex gap-4 px-4 pb-3 border-b border-gray-100 dark:border-gray-800">
      <SkeletonLine className="h-3 w-3" />
      <SkeletonLine className="h-3 w-32" />
      <SkeletonLine className="h-3 w-28" />
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="h-3 w-20" />
      <SkeletonLine className="h-3 w-24 ml-auto" />
    </div>
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800" style={{ opacity: 1 - i * 0.1 }}>
        <SkeletonLine className="h-4 w-4 rounded" />
        <div className="flex items-center gap-3 flex-1">
          <SkeletonLine className="h-9 w-9 rounded-full" />
          <div className="space-y-1 flex-1">
            <SkeletonLine className="h-3 w-32" />
            <SkeletonLine className="h-2 w-24" />
          </div>
        </div>
        <SkeletonLine className="h-3 w-28" />
        <SkeletonLine className="h-5 w-20 rounded-full" />
        <SkeletonLine className="h-7 w-7 rounded-lg" />
      </div>
    ))}
  </div>
);