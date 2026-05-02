import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { EventManagementIllustration } from './event-management-illustration';

export const MissionSection = () => (
  <section id="mission" className="py-20 md:py-24">
    <div className="container mx-auto px-4">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1">
          <Badge variant="secondary" className="mb-4 px-4 py-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 tracking-wide font-bold">
            Our Mission
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Making Event Management Simple & Accessible
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            At Nomeo Events, we believe that great events shouldn&apos;t require technical expertise. 
            Our platform combines powerful features with an intuitive interface, enabling organizers 
            to focus on what truly matters — creating memorable experiences for their attendees.
          </p>
          <div className="space-y-3">
            {[
              'No-code event setup and management',
              'Automated ticketing and check-in',
              'Real-time analytics and reporting',
              'Multi-payment gateway support',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-5 w-5 text-emerald-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 md:order-2 relative">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white/50 to-purple-50/50 dark:from-indigo-950/20 dark:via-gray-950/20 dark:to-purple-950/20 p-2">
            <EventManagementIllustration />
          </div>
        </div>
      </div>
    </div>
  </section>
);