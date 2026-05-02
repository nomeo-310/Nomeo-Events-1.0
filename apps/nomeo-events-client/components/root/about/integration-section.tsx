import { Badge } from '@/components/ui/badge';
import { HugeiconsIcon } from '@hugeicons/react';
import { SectionHeader } from './section-header';
import type { IntegrationItem } from '@/types/about-type';

interface IntegrationsSectionProps {
  integrations: IntegrationItem[];
}

const IntegrationCard = ({ integration }: { integration: IntegrationItem }) => (
  <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
    <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0">
      <HugeiconsIcon icon={integration.icon} className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-gray-900 dark:text-white">{integration.name}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">{integration.description}</p>
    </div>
    <Badge variant="outline" className="text-xs">Available</Badge>
  </div>
);

export const IntegrationsSection = ({ integrations }: IntegrationsSectionProps) => (
  <section id="integrations" className="py-20 md:py-24 bg-gray-50/50 dark:bg-gray-900/50">
    <div className="container mx-auto px-4">
      <SectionHeader 
        badge="Integrations"
        title="Connect With Your Favorite Tools"
        description="Seamlessly integrate with platforms you already use"
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mx-auto">
        {integrations.map((integration) => (
          <IntegrationCard key={integration.name} integration={integration} />
        ))}
      </div>
    </div>
  </section>
);