import { HugeiconsIcon } from '@hugeicons/react';
import type { StatItem } from '@/types/about-type';

interface StatsSectionProps {
  stats: StatItem[];
}

const StatCard = ({ stat }: { stat: StatItem }) => (
  <div className="group text-center p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
    <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
      <HugeiconsIcon icon={stat.icon} className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
    </div>
    <p className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</p>
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{stat.label}</p>
    <p className="text-xs text-gray-400 dark:text-gray-500">{stat.description}</p>
  </div>
);

export const StatsSection = ({ stats }: StatsSectionProps) => (
  <section id="stats" className="py-16 border-b border-gray-100 dark:border-gray-800">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>
    </div>
  </section>
);