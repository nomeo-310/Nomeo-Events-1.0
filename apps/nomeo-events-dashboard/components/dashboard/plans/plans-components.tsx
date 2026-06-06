// plans-components.tsx
import { useState, useEffect, useRef } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  EditIcon,
  DeleteIcon,
  Tick02Icon,
  Cancel01Icon,
  MoreHorizontalIcon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import { formatPrice } from './plans-types';
import type { IPlan, IPlanTier, IPlanInterval } from '@/hooks/use-plans';

// ─── Tab Button ──────────────────────────────────────────────────────────────
interface TabButtonProps {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}

export function TabButton({ label, count, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-5 py-2 text-sm font-medium rounded-md transition-all h-10 lg:h-11",
        isActive 
          ? "bg-blue-600 text-white shadow-sm" 
          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn(
          "ml-2 px-2 py-0.5 text-xs rounded-full",
          isActive 
            ? "bg-blue-500 text-white" 
            : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number;
  icon: any;
  color?: string;
}

export function StatCard({ label, value, icon, color = 'blue' }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        </div>
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", `bg-${color}-100 dark:bg-${color}-900/30`)}>
          <HugeiconsIcon icon={icon} className={cn("h-4 w-4", `text-${color}-600 dark:text-${color}-400`)} />
        </div>
      </div>
    </div>
  );
}

// ─── Plan Card ──────────────────────────────────────────────────────────────
interface PlanCardProps {
  plan: IPlan;
  tiers: IPlanTier[];
  intervals: IPlanInterval[];
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onManageCoupons: () => void;
  canManage: boolean;
}

export function PlanCard({ 
  plan, 
  tiers, 
  intervals, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  onManageCoupons, 
  canManage 
}: PlanCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const tierInfo = tiers.find(t => t.slug === plan.tier);
  const intervalInfo = intervals.find(i => i.slug === plan.interval);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow relative">
      {canManage && (
        <div className="absolute left-3 top-3 z-10">
          <Checkbox checked={isSelected} onCheckedChange={onSelect} />
        </div>
      )}

      <div className="p-4 pt-12 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("capitalize", tierInfo?.isActive === false && "opacity-50")}>
              {tierInfo?.name || plan.tier}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {intervalInfo?.name || plan.interval}
            </Badge>
            {plan.isFree && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                Free
              </Badge>
            )}
            {plan.trialDays > 0 && (
              <Badge variant="outline" className="text-amber-600 border-amber-200 dark:border-amber-800">
                {plan.trialDays}-day trial
              </Badge>
            )}
          </div>
          
          {canManage && (
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowMenu(!showMenu)}
              >
                <HugeiconsIcon icon={MoreHorizontalIcon} className="h-4 w-4" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 top-full p-1 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-10 py-1">
                  <button
                    onClick={() => { onEdit(); setShowMenu(false); }}
                    className="rounded-lg w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <HugeiconsIcon icon={EditIcon} className="h-3.5 w-3.5" />
                    Edit Plan
                  </button>
                  <button
                    onClick={() => { onManageCoupons(); setShowMenu(false); }}
                    className="rounded-lg w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <HugeiconsIcon icon={TagIcon} className="h-3.5 w-3.5" />
                    Manage Coupons
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                  <button
                    onClick={() => { onToggleActive(); setShowMenu(false); }}
                    className={`rounded-lg w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                      plan.isActive
                        ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    <HugeiconsIcon icon={plan.isActive ? Cancel01Icon : Tick02Icon} className="h-3.5 w-3.5" />
                    {plan.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => { onDelete(); setShowMenu(false); }}
                    className="rounded-lg w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <HugeiconsIcon icon={DeleteIcon} className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Slug: {plan.slug}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatPrice(plan.priceKobo, plan.currency)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              per {intervalInfo?.name || plan.interval}
            </p>
          </div>
        </div>

        {plan.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {plan.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Events</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {plan.maxEvents ? `${plan.maxEvents.toLocaleString()}+` : 'Unlimited'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Attendees</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {plan.maxAttendeesPerEvent ? `${plan.maxAttendeesPerEvent.toLocaleString()}+` : 'Unlimited'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Team Members</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {plan.maxTeamMembers ? `${plan.maxTeamMembers}+` : 'Unlimited'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Storage</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {plan.storageGb ? `${plan.storageGb} GB` : 'Unlimited'}
            </p>
          </div>
        </div>

        {plan.features.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-wrap gap-1.5">
              {plan.features.slice(0, 3).map((feature, idx) => (
                <Badge key={idx} variant="secondary" className="text-[10px]">
                  {feature.name}
                </Badge>
              ))}
              {plan.features.length > 3 && (
                <Badge variant="outline" className="text-[10px]">
                  +{plan.features.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { TagIcon } from '@hugeicons/core-free-icons';