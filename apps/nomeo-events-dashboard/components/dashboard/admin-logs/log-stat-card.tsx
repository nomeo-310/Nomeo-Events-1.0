import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowUp02Icon,
  ArrowDown02Icon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon: any;
  trend?: number;
  accent?: string;
}

export function StatCard({ label, value, icon, trend, accent }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
            {value.toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{label}</p>
          {trend !== undefined && (
            <p className={cn(
              'text-[10px] mt-1 flex items-center gap-0.5',
              trend > 0 ? 'text-green-600 dark:text-green-400'
              : trend < 0 ? 'text-red-600 dark:text-red-400'
              : 'text-gray-500',
            )}>
              {trend > 0
                ? <HugeiconsIcon icon={ArrowUp02Icon} className="h-3 w-3" />
                : trend < 0
                ? <HugeiconsIcon icon={ArrowDown02Icon} className="h-3 w-3" />
                : null}
              {Math.abs(trend)}% vs last period
            </p>
          )}
        </div>
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          accent ?? 'bg-blue-100 dark:bg-blue-900/30',
        )}>
          <HugeiconsIcon icon={icon} className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </div>
  );
}