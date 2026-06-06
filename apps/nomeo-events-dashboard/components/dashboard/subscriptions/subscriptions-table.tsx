// subscriptions-table.tsx
import { cn } from '@/lib/utils';
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ViewIcon,
  MoreHorizontalCircle01Icon,
  RefreshIcon,
  CreditCardIcon 
} from "@hugeicons/core-free-icons";
import { SubscriptionsSkeleton } from './subscriptions-skeletons';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { ActionDropdown } from './subscriptions-components';
import { getInitials, getStatusLabel, STATUS_ICONS, STATUS_COLORS, TIER_ICONS, TIER_COLORS, formatCurrency, formatDate, type DropdownItem } from './subscriptions-types';
import type { ISubscription } from '@/hooks/use-subscriptions';

interface SubscriptionsTableProps {
  subscriptions: ISubscription[];
  selected: Set<string>;
  isSuperAdmin: boolean;
  isFetching: boolean;
  isLoading: boolean;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onView: (id: string) => void;
  getDropdownItems: (sub: ISubscription) => (DropdownItem | { divider: true; section?: string })[];
}

export const SubscriptionsTable = ({
  subscriptions,
  selected,
  isSuperAdmin,
  isFetching,
  isLoading,
  onToggleSelect,
  onSelectAll,
  onView,
  getDropdownItems,
}: SubscriptionsTableProps) => {
  if (isLoading && subscriptions.length === 0) {
    return <div className="p-6"><SubscriptionsSkeleton /></div>;
  }

  if (subscriptions.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="w-12">
          {isSuperAdmin && <Checkbox checked={selected.size === subscriptions.length && subscriptions.length > 0} onCheckedChange={onSelectAll} />}
          {!isSuperAdmin && <div className="w-4" />}
        </div>
        <div className="flex-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">User / Plan</div>
        <div className="w-24 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tier</div>
        <div className="w-28 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</div>
        <div className="w-28 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Interval</div>
        <div className="w-32 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Price</div>
        <div className="w-32 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Period End</div>
        <div className="w-16 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800 relative">
        {isFetching && !isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-10 flex items-start justify-center pt-20">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border">
              <HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" />
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        )}
        {subscriptions.map(sub => {
          const name = typeof sub.userId === 'object' ? sub.userId?.name : 'Unknown';
          const email = typeof sub.userId === 'object' ? sub.userId?.email : 'Unknown';
          const avatar = typeof sub.userId === 'object' ? sub.userId?.avatar : undefined;
          return (
            <div key={sub._id} className={cn("flex items-center px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors", sub.status === 'past_due' && "bg-red-50/30 dark:bg-red-900/10")}>
              <div className="w-12">
                {isSuperAdmin && <Checkbox checked={selected.has(sub._id)} onCheckedChange={() => onToggleSelect(sub._id)} />}
              </div>
              <div className="flex-1 flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-full flex-shrink-0">
                  {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
                  <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{email}</p>
                </div>
              </div>
              <div className="w-24">
                <Badge className={cn("gap-1", TIER_COLORS[sub.planTier])}>
                  <HugeiconsIcon icon={TIER_ICONS[sub.planTier]} className="h-3 w-3" />
                  {sub.planTier}
                </Badge>
              </div>
              <div className="w-28">
                <Badge className={cn("gap-1 border", STATUS_COLORS[sub.status])}>
                  <HugeiconsIcon icon={STATUS_ICONS[sub.status]} className="h-3 w-3" />
                  {getStatusLabel(sub.status)}
                </Badge>
              </div>
              <div className="w-28">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">{sub.interval}</span>
              </div>
              <div className="w-32">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(sub.finalPriceKobo)}</p>
              </div>
              <div className="w-32">
                <p className="text-xs text-gray-700 dark:text-gray-300">{formatDate(sub.currentPeriodEnd)}</p>
              </div>
              <div className="w-16 flex items-center justify-center gap-1">
                <button onClick={() => onView(sub._id)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="View">
                  <HugeiconsIcon icon={ViewIcon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
                <ActionDropdown 
                  trigger={
                    <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  }
                  items={getDropdownItems(sub)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

const EmptyState = () => (
  <div className="py-20 text-center">
    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
      <HugeiconsIcon icon={CreditCardIcon} className="h-6 w-6 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No subscriptions found</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">No records found</p>
  </div>
);