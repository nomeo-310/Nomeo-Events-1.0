// plans-empty-state.tsx
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AlertCircleIcon,
  PlusSignIcon as PlusIcon,
  ArrangeIcon as CategoryIcon,
  ClockIcon,
  LayersIcon,
} from '@hugeicons/core-free-icons';
import { Button } from '@/components/ui/button';

import type { ManagementTab, EmptyStateGuidance } from './plans-types';

export const getEmptyStateGuidance = (
  activeTab: ManagementTab,
  plansCount: number,
  tiersCount: number,
  intervalsCount: number,
  canManage: boolean
): EmptyStateGuidance => {
  if (activeTab === 'plans' && plansCount === 0) {
    if (tiersCount === 0 && intervalsCount === 0) {
      return {
        title: 'No plans, tiers, or intervals found',
        description: 'Before creating a plan, you need to set up at least one tier and one billing interval.',
        steps: [
          'First, create a Tier (e.g., "Free", "Pro", "Enterprise")',
          'Then, create an Interval (e.g., "Monthly", "Annual")',
          'Finally, create your Plan by combining a tier and an interval'
        ],
        actionLabel: 'Create Tier First',
        actionTab: 'tiers'
      };
    } else if (tiersCount === 0) {
      return {
        title: 'No tiers found',
        description: 'You need at least one tier before creating a plan.',
        steps: [
          'Tiers represent different plan levels (Free, Pro, Enterprise, etc.)',
          'Create a tier first, then you can create plans under that tier'
        ],
        actionLabel: 'Create Tier',
        actionTab: 'tiers'
      };
    } else if (intervalsCount === 0) {
      return {
        title: 'No intervals found',
        description: 'You need at least one billing interval before creating a plan.',
        steps: [
          'Intervals represent billing cycles (Monthly, Quarterly, Annual, etc.)',
          'Create an interval first, then you can create plans with that billing period'
        ],
        actionLabel: 'Create Interval',
        actionTab: 'intervals'
      };
    } else {
      return {
        title: 'No plans found',
        description: 'Start by creating your first subscription plan.',
        steps: [
          'Choose a tier (e.g., "Pro") and interval (e.g., "Monthly")',
          'Set the price and features for the plan',
          'Activate the plan to make it available to users'
        ],
        actionLabel: 'Create Plan',
        actionTab: 'plans'
      };
    }
  }
  
  if (activeTab === 'tiers' && tiersCount === 0) {
    return {
      title: 'No tiers found',
      description: 'Tiers are the foundation of your pricing structure.',
      examples: [
        'Free — Basic features for getting started',
        'Starter — Perfect for small businesses',
        'Pro — Advanced features for professionals',
        'Enterprise — Custom solutions for large organizations'
      ],
      actionLabel: 'Create Tier',
      actionTab: 'tiers'
    };
  }
  
  if (activeTab === 'intervals' && intervalsCount === 0) {
    return {
      title: 'No intervals found',
      description: 'Intervals define how often customers are billed.',
      examples: [
        'Monthly — 1 month cycle, multiplier: 1.0',
        'Quarterly — 3 months cycle, multiplier: 2.7 (10% savings)',
        'Annual — 12 months cycle, multiplier: 9.6 (20% savings)',
        'Lifetime — One-time payment'
      ],
      actionLabel: 'Create Interval',
      actionTab: 'intervals'
    };
  }
  
  return null as any;
};

interface PlansEmptyStateProps {
  tab: ManagementTab;
  guidance: EmptyStateGuidance;
  canManage: boolean;
  onAction: () => void;
  onOpenTiersModal: () => void;
  onOpenIntervalsModal: () => void;
}

export function PlansEmptyState({ tab, guidance, canManage, onAction, onOpenIntervalsModal, onOpenTiersModal }: PlansEmptyStateProps) {
  const getIcon = () => {
    if (tab === 'plans') return LayersIcon;
    if (tab === 'tiers') return CategoryIcon;
    return ClockIcon;
  };

  const Icon = getIcon();

  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
        <HugeiconsIcon icon={Icon} className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{guidance.title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
        {guidance.description}
      </p>
      
      {guidance.steps && (
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 max-w-md mx-auto mb-6 text-left">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
            <HugeiconsIcon icon={AlertCircleIcon} className="h-3.5 w-3.5" />
            Recommended workflow:
          </p>
          <ol className="space-y-1.5">
            {guidance.steps.map((step, idx) => (
              <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                <span className="text-blue-500 font-medium text-xs mt-0.5">{idx + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      
      {guidance.examples && (
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 max-w-md mx-auto mb-6 text-left">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
            <HugeiconsIcon icon={AlertCircleIcon} className="h-3.5 w-3.5" />
            Examples:
          </p>
          <ul className="space-y-1">
            {guidance.examples.map((example, idx) => (
              <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">• {example}</li>
            ))}
          </ul>
        </div>
      )}
      
      {canManage && (
        <div className="flex gap-3 justify-center">
          {guidance.actionTab === 'tiers' && (
            <Button onClick={onOpenTiersModal} className="bg-blue-600 hover:bg-blue-700 h-11 px-5">
              <HugeiconsIcon icon={CategoryIcon} className="h-4 w-4 mr-2" />
              Create Tiers
            </Button>
          )}
          {guidance.actionTab === 'intervals' && (
            <Button onClick={onOpenIntervalsModal} className="bg-blue-600 hover:bg-blue-700 h-11 px-5">
              <HugeiconsIcon icon={ClockIcon} className="h-4 w-4 mr-2" />
              Create Intervals
            </Button>
          )}
          {guidance.actionTab === 'plans' && (
            <Button onClick={onAction} className="bg-blue-600 hover:bg-blue-700 h-11 px-5">
              <HugeiconsIcon icon={PlusIcon} className="h-4 w-4 mr-2" />
              {guidance.actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}