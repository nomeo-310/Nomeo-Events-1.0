export function LoadingSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-5 md:p-4 flex gap-4 md:gap-3 animate-pulse">
          <div className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-muted flex-shrink-0" />
          <div className="flex-1 space-y-3 md:space-y-2">
            <div className="h-4 md:h-3 bg-muted rounded w-2/3" />
            <div className="h-3.5 md:h-2.5 bg-muted rounded w-full" />
            <div className="h-3 md:h-2 bg-muted rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}