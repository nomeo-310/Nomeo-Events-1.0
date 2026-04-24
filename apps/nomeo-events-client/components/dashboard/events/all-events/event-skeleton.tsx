import { ViewMode } from "./event-helpers";

export function SkeletonCard({ view }: { view: ViewMode }) {
  if (view === "list") {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-pulse">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-52 h-40 sm:h-auto bg-gray-200 dark:bg-gray-800 shrink-0" />
          <div className="flex-1 p-4 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-3 bg-gray-200 dark:bg-gray-800 rounded" />)}
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16" />
              <div className="h-7 bg-gray-200 dark:bg-gray-800 rounded w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200 dark:bg-gray-800" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between gap-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-14" />
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
        <div className="space-y-1.5 pt-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/5" />
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-12" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-16" />
        </div>
      </div>
    </div>
  );
}