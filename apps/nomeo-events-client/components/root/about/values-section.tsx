import { HugeiconsIcon } from '@hugeicons/react';
import { SectionHeader } from './section-header';
import type { ValueItem } from '@/types/about-type';

interface ValuesSectionProps {
  values: ValueItem[];
}

const ValueCard = ({ value }: { value: ValueItem }) => (
  <div className="p-6 rounded-xl bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
    <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center mb-4 shadow-sm">
      <HugeiconsIcon icon={value.icon} className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      {value.title}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
      {value.description}
    </p>
  </div>
);

export const ValuesSection = ({ values }: ValuesSectionProps) => (
  <section id="values" className="py-20 md:py-24">
    <div className="container mx-auto px-4">
      <SectionHeader 
        badge="Our Values"
        title="What We Stand For"
        description="The principles that guide everything we do"
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {values.map((value) => (
          <ValueCard key={value.title} value={value} />
        ))}
      </div>
    </div>
  </section>
);