import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { SectionHeader } from './section-header';
import type { FeatureItem } from '@/types/about-type';

interface FeaturesSectionProps {
  features: FeatureItem[];
}

const colorClasses = {
  indigo: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
  blue: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
  purple: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400',
  amber: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
  rose: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
  teal: 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400',
  cyan: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400',
  orange: 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400',
};

const FeatureCard = ({ feature }: { feature: FeatureItem }) => (
  <div className="group p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg transition-all duration-300">
    <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-4', colorClasses[feature.color])}>
      <HugeiconsIcon icon={feature.icon} className="h-6 w-6" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
      {feature.title}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
      {feature.description}
    </p>
  </div>
);

export const FeaturesSection = ({ features }: FeaturesSectionProps) => (
  <section id="features" className="py-20 md:py-24">
    <div className="container mx-auto px-4">
      <SectionHeader 
        badge="Why Choose Us"
        title="Everything You Need to Succeed"
        description="Powerful features designed to save you time and grow your events"
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </div>
  </section>
);