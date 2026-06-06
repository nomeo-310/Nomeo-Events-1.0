// events-stats.tsx
import { cn } from "@/lib/utils";
import { StatCard } from "./events-components";
import { categoryColors, formatMoney } from "./events-types";
import { StatsSkeleton } from "./events-skeletons";

export function StatsOverview({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) return <StatsSkeleton />;
  if (!data) return null;
  const { events, registrations, revenue, categoryBreakdown } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Events" value={events?.total ?? 0}
          sub={`${events?.grouping?.upcoming ?? 0} upcoming · ${events?.grouping?.ongoing ?? 0} live`} />
        <StatCard label="Total Registrations" value={registrations?.total ?? 0}
          sub={`${registrations?.byStatus?.confirmed ?? 0} confirmed · ${registrations?.byStatus?.pending ?? 0} pending`} />
        <StatCard label="Confirmed Revenue" value={formatMoney(revenue?.confirmed ?? 0)}
          sub={`${formatMoney(revenue?.projected ?? 0)} projected`} accent="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Refunded" value={formatMoney(revenue?.refunded ?? 0)}
          sub={`${registrations?.byStatus?.refunded ?? 0} refunded`} accent="text-red-600 dark:text-red-400" />
      </div>
      {categoryBreakdown?.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Events by Category</h3>
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {categoryBreakdown.map((c: any) => (
              <span key={c._id} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize", categoryColors[c._id] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300")}>
                {c._id?.replace(/_/g, " ")} <span className="font-bold">{c.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}