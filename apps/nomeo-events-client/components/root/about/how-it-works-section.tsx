import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { SectionHeader } from './section-header';
import type { HowItWorksStep } from '@/types/about-type';

interface HowItWorksSectionProps {
  steps: HowItWorksStep[];
}

const HowItWorksStepCard = ({ step }: { step: HowItWorksStep }) => (
  <div className="group p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg transition-all duration-300">
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{step.step}</span>
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <HugeiconsIcon icon={step.icon} className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{step.title}</h3>
        </div>
        <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mb-3">{step.description}</p>
        <ul className="space-y-2">
          {step.details.map((detail, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export const HowItWorksSection = ({ steps }: HowItWorksSectionProps) => (
  <section id="how-it-works" className="py-20 md:py-24 bg-gray-50/50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800">
    <div className="container mx-auto px-4">
      <SectionHeader 
        badge="Simple Process"
        title="How Nomeo Events Works"
        description="A clear path from start to success — no confusion, no complexity"
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {steps.map((step) => (
          <HowItWorksStepCard key={step.step} step={step} />
        ))}
      </div>
    </div>
  </section>
);