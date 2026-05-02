import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import { SettingsIcon, ArrowRightIcon } from '@hugeicons/core-free-icons';
import type { RevenueStream, ServiceDeliveryPoint } from '@/types/about-type';

interface BusinessModelSectionProps {
  revenueStreams: RevenueStream[];
  serviceDeliveryPoints: ServiceDeliveryPoint[];
}

const RevenueCard = ({ revenue }: { revenue: RevenueStream }) => (
  <div className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
    <div className="w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mb-3">
      <HugeiconsIcon icon={revenue.icon} className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
    </div>
    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{revenue.title}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{revenue.description}</p>
  </div>
);

const ServiceDeliveryCard = ({ point }: { point: ServiceDeliveryPoint }) => (
  <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
    <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center flex-shrink-0 shadow-sm">
      <HugeiconsIcon icon={point.icon} className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
    </div>
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{point.title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{point.description}</p>
    </div>
  </div>
);

export const BusinessModelSection = ({ revenueStreams, serviceDeliveryPoints }: BusinessModelSectionProps) => (
  <section id="business-model" className="py-20 md:py-24">
    <div className="container mx-auto px-4">
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 uppercase tracking-wide font-bold">
            Sustainable Model
          </Badge>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            How We Stay in Business — While You Stay Free
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            We believe in alignment. Our revenue comes from organizers who need advanced features and high-volume capabilities. 
            For everyone else, we&apos;re completely free to use.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {revenueStreams.map((revenue, idx) => (
              <RevenueCard key={idx} revenue={revenue} />
            ))}
          </div>
        </div>
        <div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <HugeiconsIcon icon={SettingsIcon} className="h-5 w-5 text-indigo-600" />
                What We Deliver
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Our end-to-end service handles the heavy lifting so you can focus on your event
              </p>
            </div>
            <div className="p-6 space-y-3">
              {serviceDeliveryPoints.map((point, idx) => (
                <ServiceDeliveryCard key={idx} point={point} />
              ))}
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Ready to choose a plan?</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Find the perfect fit for your event needs</p>
                </div>
                <Button variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Link href="/pricing" className='flex items-center gap-3'>
                    View Pricing Plans
                    <HugeiconsIcon icon={ArrowRightIcon} className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);