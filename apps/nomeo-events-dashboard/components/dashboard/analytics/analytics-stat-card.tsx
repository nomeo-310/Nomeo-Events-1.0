// analytics-stat-card.tsx
import { cn } from "@/lib/utils";

export function StatCard({
  label, value, sub, accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className={cn("mt-0.5 text-base font-bold", accent ?? "text-gray-900 dark:text-white")}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}