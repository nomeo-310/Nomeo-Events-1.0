import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import { HeadphonesIcon, ArrowRightIcon, ClockIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { TicketCategory } from '@/types/help-center-type';

interface TicketSystemSectionProps {
  categories: TicketCategory[];
}

const priorityColors = {
  Low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const TicketSystemSection = ({ categories }: TicketSystemSectionProps) => (
  <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-600 text-white" id="ticket">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <Badge className="mb-4 bg-white/20 text-white border-white/30 py-3 px-4">
          <HugeiconsIcon icon={HeadphonesIcon} className="h-4 w-4 mr-2" />
          Priority Support
        </Badge>
        <h2 className="text-3xl font-bold mb-4">
          Need Personalized Help?
        </h2>
        <p className="text-indigo-100 max-w-2xl mx-auto">
          Our support team is ready to assist you with any complex issues or questions
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mx-auto">
        {categories.map((category) => (
          <div
            key={category.id}
            className="p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center mb-4">
              <HugeiconsIcon icon={category.icon} className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{category.title}</h3>
            <p className="text-sm text-indigo-100 mb-3">{category.description}</p>
            <div className="flex items-center justify-between text-xs">
              <Badge className={cn(priorityColors[category.priority], 'bg-opacity-20')}>
                {category.priority} Priority
              </Badge>
              <div className="flex items-center gap-1">
                <HugeiconsIcon icon={ClockIcon} className="h-3 w-3" />
                <span>{category.responseTime}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <Button className="bg-white text-indigo-600 hover:bg-gray-100 h-10 lg:h-11 lg:px-6">
          Submit a Support Ticket
          <HugeiconsIcon icon={ArrowRightIcon} className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  </section>
);