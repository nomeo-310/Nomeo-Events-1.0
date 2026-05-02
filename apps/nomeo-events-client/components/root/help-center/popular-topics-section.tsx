import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRightIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { TopicItem } from '@/types/help-center-type';

interface PopularTopicsSectionProps {
  topics: TopicItem[];
}

const colorStyles = {
  indigo: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
  blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
  purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400',
  amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
  rose: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
};

export const PopularTopicsSection = ({ topics }: PopularTopicsSectionProps) => (
  <section className="py-20">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Popular Help Topics
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Browse our most frequently accessed guides and resources
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className="group p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-4', colorStyles[topic.color as keyof typeof colorStyles])}>
              <HugeiconsIcon icon={topic.icon} className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {topic.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {topic.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {topic.articleCount} articles
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                <HugeiconsIcon icon={ArrowRightIcon} className="h-4 w-4" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);