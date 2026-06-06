export function LogsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-3 mb-6">
        {[1, 140, 140, 128, 128].map((w, i) => (
          <div
            key={i}
            className={`h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ${
              i === 0 ? 'flex-1' : `w-[${w}px]`
            }`}
          />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800"
          style={{ opacity: 1 - i * 0.1 }}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="h-9 w-9 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-2 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-3 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
          <div className="h-7 w-7 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );
}