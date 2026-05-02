import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { HelpCircleIcon as HelpIcon , ChatIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { SectionHeader } from './section-header';
import type { FaqItem, FaqCategory } from '@/types/about-type';

interface FaqSectionProps {
  faqs: FaqItem[];
  filteredFaqs: FaqItem[];
  faqCategories: FaqCategory[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  onContactSupport: () => void;
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

export const FaqSection = ({ 
  filteredFaqs, 
  faqCategories, 
  activeCategory, 
  onCategoryChange,
  onContactSupport 
}: FaqSectionProps) => (
  <section id="faq" className="py-20 md:py-24 bg-gray-50/50 dark:bg-gray-900/50">
    <div className="container mx-auto px-4">
      <SectionHeader 
        badge="FAQs"
        title="Frequently Asked Questions"
        description="Got questions? We&apos;ve got answers"
      />
      
      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {faqCategories.map((category) => (
          <Button 
            key={category.key}
            onClick={() => onCategoryChange(category.key)}
            variant="outline" 
            size="sm" 
            className={cn(
              "rounded-full transition-all duration-200 h-10 lg:h-11 lg:px-6",
              activeCategory === category.key 
                ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 hover:text-white" 
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
            )}
          >
            <HugeiconsIcon icon={category.icon} className="h-3.5 w-3.5 mr-1.5" />
            {category.name}
          </Button>
        ))}
      </div>
      
      {/* FAQ Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mx-auto">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <FaqCard key={index} faq={faq} />
          ))
        ) : (
          <div className="col-span-2 text-center py-12">
            <HugeiconsIcon icon={HelpIcon} className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No FAQs found in this category.</p>
            <Button 
              variant="link" 
              onClick={() => onCategoryChange('all')}
              className="text-indigo-600 mt-2"
            >
              View all FAQs
            </Button>
          </div>
        )}
      </div>
      
      {/* Contact Support Button */}
      <div className="text-center mt-10">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Still have questions?</p>
        <Button 
          variant="outline" 
          className="hover:border-indigo-300 dark:hover:border-indigo-700"
          onClick={onContactSupport}
        >
          <HugeiconsIcon icon={ChatIcon} className="h-4 w-4 mr-2" />
          Contact Support
        </Button>
      </div>
    </div>
  </section>
);