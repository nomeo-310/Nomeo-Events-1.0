import { HugeiconsIcon } from '@hugeicons/react';
import { SectionHeader } from './section-header';
import type { FaqItem } from '@/types/help-center-type';

interface FaqGridSectionProps {
  faqs: FaqItem[];
}

const FaqCard = ({ faq }: { faq: FaqItem }) => (
  <div className="group p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
        <HugeiconsIcon icon={faq.icon} className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          {faq.question}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          {faq.answer}
        </p>
      </div>
    </div>
  </div>
);

export const FaqGridSection = ({ faqs }: FaqGridSectionProps) => (
  <section id="faq" className="py-16 bg-gray-50/50 dark:bg-gray-900/50">
    <div className="container mx-auto px-4">
      <SectionHeader 
        badge="FAQs"
        title="Frequently Asked Questions"
        description="Got questions? We've got answers"
      />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {faqs.map((faq, index) => (
          <FaqCard key={index} faq={faq} />
        ))}
      </div>
    </div>
  </section>
);