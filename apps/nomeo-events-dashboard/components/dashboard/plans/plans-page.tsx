'use client';

import React, { useState, useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  PlusSignIcon as PlusIcon,
  RefreshIcon,
  Search01Icon,
  EditIcon,
  DeleteIcon,
  Tick02Icon,
  Cancel01Icon,
  MoreHorizontalIcon,
  TagIcon,
  CalendarIcon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  LayersIcon,
  Money01Icon,
  ArrangeIcon as CategoryIcon,
  ClockIcon,
  HashtagIcon as HashIcon,
  KeyframesMultipleIcon as MultiplyIcon,
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReusableModal, ConfirmModal, ActionModal } from '@/components/ui/reusable-modal';
import {
  useGetPlans,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
  useGetTiers,
  useCreateTier,
  useUpdateTier,
  useDeleteTier,
  useGetIntervals,
  useCreateInterval,
  useUpdateInterval,
  useDeleteInterval,
  useBulkAction,
  useBulkDelete,
  type IPlan,
  type IPlanTier,
  type IPlanInterval,
  type CreatePlanParams,
  type CreateTierParams,
  type CreateIntervalParams,
} from '@/hooks/use-plans';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth/auth-client';

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────

const CURRENCY_OPTIONS = ['NGN', 'USD', 'EUR', 'GBP'];

type ManagementTab = 'plans' | 'tiers' | 'intervals';

// ─────────────────────────────────────────────────────────
// FORMAT HELPERS
// ─────────────────────────────────────────────────────────

const formatPrice = (priceKobo: number, currency: string = 'NGN') => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceKobo / 100);
};

const formatDate = (date: string | Date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy');
};

// ─────────────────────────────────────────────────────────
// SKELETON COMPONENT
// ─────────────────────────────────────────────────────────

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] ${className ?? ''}`}
    />
  );
}

function PlansSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <div className="flex items-center gap-3 mb-4">
            <SkeletonLine className="h-6 w-32" />
            <SkeletonLine className="h-5 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <SkeletonLine className="h-6 w-24 rounded-full" />
                    <SkeletonLine className="h-8 w-8 rounded-lg" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    <SkeletonLine className="h-5 w-40" />
                    <SkeletonLine className="h-8 w-32" />
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <SkeletonLine className="h-10 w-full" />
                      <SkeletonLine className="h-10 w-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TiersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <SkeletonLine className="h-8 w-8 rounded-full" />
            <div>
              <SkeletonLine className="h-5 w-32 mb-1" />
              <SkeletonLine className="h-3 w-48" />
            </div>
          </div>
          <SkeletonLine className="h-8 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function IntervalsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <SkeletonLine className="h-8 w-8 rounded-full" />
            <div>
              <SkeletonLine className="h-5 w-32 mb-1" />
              <SkeletonLine className="h-3 w-48" />
            </div>
          </div>
          <SkeletonLine className="h-8 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB BUTTON COMPONENT
// ─────────────────────────────────────────────────────────

interface TabButtonProps {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ label, count, isActive, onClick }: TabButtonProps) {
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

// ─────────────────────────────────────────────────────────
// STAT CARD COMPONENT
// ─────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  icon: any;
  color?: string;
}

function StatCard({ label, value, icon, color = 'blue' }: StatCardProps) {
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

// ─────────────────────────────────────────────────────────
// PLAN CARD COMPONENT
// ─────────────────────────────────────────────────────────

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

function PlanCard({ 
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
  const menuRef = React.useRef<HTMLDivElement>(null);

  const tierInfo = tiers.find(t => t.slug === plan.tier);
  const intervalInfo = intervals.find(i => i.slug === plan.interval);

  React.useEffect(() => {
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

// ─────────────────────────────────────────────────────────
// TIER CARD COMPONENT
// ─────────────────────────────────────────────────────────

interface TierCardProps {
  tier: IPlanTier;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  canManage: boolean;
}

function TierCard({ tier, onEdit, onDelete, onToggleActive, canManage }: TierCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", tier.isActive ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-gray-800")}>
          <HugeiconsIcon icon={CategoryIcon} className={cn("h-5 w-5", tier.isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400")} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{tier.name}</h3>
            <Badge variant={tier.isActive ? "default" : "secondary"} className="text-[10px]">
              {tier.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {tier.planCount !== undefined && tier.planCount > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {tier.planCount} {tier.planCount === 1 ? 'plan' : 'plans'}
              </Badge>
            )}
          </div>
          {tier.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{tier.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">Slug: {tier.slug}</p>
        </div>
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
                Edit Tier
              </button>
              <button
                onClick={() => { onToggleActive(); setShowMenu(false); }}
                className={`rounded-lg w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                  tier.isActive
                    ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                }`}
              >
                <HugeiconsIcon icon={tier.isActive ? Cancel01Icon : Tick02Icon} className="h-3.5 w-3.5" />
                {tier.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
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
  );
}

// ─────────────────────────────────────────────────────────
// INTERVAL CARD COMPONENT
// ─────────────────────────────────────────────────────────

interface IntervalCardProps {
  interval: IPlanInterval;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  canManage: boolean;
}

function IntervalCard({ interval, onEdit, onDelete, onToggleActive, canManage }: IntervalCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", interval.isActive ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-gray-100 dark:bg-gray-800")}>
          <HugeiconsIcon icon={ClockIcon} className={cn("h-5 w-5", interval.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400")} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">{interval.name}</h3>
            <Badge variant={interval.isActive ? "default" : "secondary"} className="text-[10px]">
              {interval.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {interval.planCount !== undefined && interval.planCount > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {interval.planCount} {interval.planCount === 1 ? 'plan' : 'plans'}
              </Badge>
            )}
          </div>
          <div className="flex gap-3 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <HugeiconsIcon icon={HashIcon} className="h-3 w-3" />
              Months: {interval.monthsCount}
            </span>
            <span className="flex items-center gap-1">
              <HugeiconsIcon icon={MultiplyIcon} className="h-3 w-3" />
              Multiplier: {interval.multiplier}x
            </span>
          </div>
          <p className="text-xs text-gray-400">Slug: {interval.slug}</p>
        </div>
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
                Edit Interval
              </button>
              <button
                onClick={() => { onToggleActive(); setShowMenu(false); }}
                className={`rounded-lg w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                  interval.isActive
                    ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                }`}
              >
                <HugeiconsIcon icon={interval.isActive ? Cancel01Icon : Tick02Icon} className="h-3.5 w-3.5" />
                {interval.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
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
  );
}

// ─────────────────────────────────────────────────────────
// CREATE/EDIT PLAN MODAL
// ─────────────────────────────────────────────────────────

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: IPlan | null;
  tiers: IPlanTier[];
  intervals: IPlanInterval[];
  onSubmit: (data: CreatePlanParams) => Promise<void>;
  isLoading: boolean;
}

function PlanFormModal({ isOpen, onClose, plan, tiers, intervals, onSubmit, isLoading }: PlanFormModalProps) {
  const isEdit = !!plan;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [selectedTierId, setSelectedTierId] = useState('');
  const [selectedIntervalId, setSelectedIntervalId] = useState('');
  const [priceKobo, setPriceKobo] = useState('0');
  const [currency, setCurrency] = useState('NGN');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [trialDays, setTrialDays] = useState('0');

  useEffect(() => {
    if (!isOpen) return;

    if (plan) {
      setName(plan.name);
      setSlug(plan.slug);
      setSelectedTierId(plan.tierId || '');
      setSelectedIntervalId(plan.intervalId || '');
      setPriceKobo(String(plan.priceKobo));
      setCurrency(plan.currency || 'NGN');
      setDescription(plan.description || '');
      setIsActive(plan.isActive);
      setIsPublic(plan.isPublic);
      setTrialDays(String(plan.trialDays || 0));
    } else {
      setName('');
      setSlug('');
      setSelectedTierId(tiers[0]?._id || '');
      setSelectedIntervalId(intervals[0]?._id || '');
      setPriceKobo('0');
      setCurrency('NGN');
      setDescription('');
      setIsActive(true);
      setIsPublic(true);
      setTrialDays('0');
    }
  }, [isOpen, plan, tiers, intervals]);

  const generateSlug = (n: string) =>
    n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleNameChange = (n: string) => {
    setName(n);
    if (!isEdit) setSlug(generateSlug(n));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }
    if (!selectedTierId) {
      toast.error('Please select a tier');
      return;
    }
    if (!selectedIntervalId) {
      toast.error('Please select an interval');
      return;
    }

    const payload: CreatePlanParams = {
      name: name.trim(),
      slug: slug.trim(),
      tierId: selectedTierId,
      intervalId: selectedIntervalId,
      priceKobo: Math.max(0, parseInt(priceKobo) || 0),
      currency: currency || 'NGN',
      description: description || undefined,
      isActive,
      isPublic,
      trialDays: Math.max(0, parseInt(trialDays) || 0),
    };

    await onSubmit(payload);
    onClose();
  };

  const selectedTier = tiers.find(t => t._id === selectedTierId);
  const selectedInterval = intervals.find(i => i._id === selectedIntervalId);

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit — ${plan!.name}` : 'Create New Plan'}
      description={isEdit ? 'Update plan details' : 'Configure a new subscription plan'}
      size="lg"
      maxHeight="85vh"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outline', disabled: isLoading },
        { label: isEdit ? 'Save Changes' : 'Create Plan', onClick: handleSubmit, variant: 'primary', loading: isLoading },
      ]}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold">Plan Name *</Label>
            <Input value={name} onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. Pro Monthly" className="mt-1.5" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Slug *</Label>
            <Input value={slug}
              onChange={e => setSlug(generateSlug(e.target.value))}
              placeholder="e.g. pro-monthly" className="mt-1.5"
              disabled={isEdit} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold">Tier *</Label>
            <Select value={selectedTierId} onValueChange={(v) => setSelectedTierId(v ?? "")}>
              <SelectTrigger className="mt-1.5 w-full h-10 lg:h-11">
                <SelectValue placeholder="Select tier">
                  {selectedTier && selectedTier.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="p-1">
                {tiers.filter(t => t.isActive).map(tier => (
                  <SelectItem key={tier._id} value={tier._id}>
                    {tier.name} {tier.planCount !== undefined && tier.planCount > 0 ? `(${tier.planCount} plans)` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Billing Interval *</Label>
            <Select value={selectedIntervalId} onValueChange={(v) => setSelectedIntervalId(v ?? "")}>
              <SelectTrigger className="mt-1.5 w-full h-10 lg:h-11">
                <SelectValue placeholder="Select interval">
                  {selectedInterval && selectedInterval.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="p-1">
                {intervals.filter(i => i.isActive).map(interval => (
                  <SelectItem key={interval._id} value={interval._id}>
                    {interval.name} ({interval.monthsCount} months, {interval.multiplier}x)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold">Price (Kobo / smallest unit)</Label>
            <Input type="number" min={0} value={priceKobo}
              onChange={e => setPriceKobo(e.target.value)} className="mt-1.5" />
            <p className="text-[10px] text-gray-400 mt-1">
              = {formatPrice(parseInt(priceKobo) || 0, currency)}
            </p>
          </div>
          <div>
            <Label className="text-xs font-semibold">Currency</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v ?? "NGN")}>
              <SelectTrigger className="mt-1.5 w-full h-10 lg:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="p-1">
                <SelectItem value="NGN">NGN — Nigerian Naira</SelectItem>
                <SelectItem value="USD">USD — US Dollar</SelectItem>
                <SelectItem value="GBP">GBP — British Pound</SelectItem>
                <SelectItem value="EUR">EUR — Euro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold">Description</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe the plan's value proposition…" className="mt-1.5" rows={2} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold">Trial Days</Label>
            <Input type="number" min={0} value={trialDays}
              onChange={e => setTrialDays(e.target.value)} className="mt-1.5" />
            <p className="text-[10px] text-gray-400 mt-1">0 = no trial period</p>
          </div>
        </div>

        <div className="flex items-center gap-8 pt-2">
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} id="isActive" />
            <Label htmlFor="isActive" className="text-sm cursor-pointer">Active</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isPublic} onCheckedChange={setIsPublic} id="isPublic" />
            <Label htmlFor="isPublic" className="text-sm cursor-pointer">Public</Label>
          </div>
        </div>
      </div>
    </ReusableModal>
  );
}

// ─────────────────────────────────────────────────────────
// TIER FORM MODAL
// ─────────────────────────────────────────────────────────

interface TierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier?: IPlanTier | null;
  onSubmit: (data: CreateTierParams) => Promise<void>;
  isLoading: boolean;
}

function TierFormModal({ isOpen, onClose, tier, onSubmit, isLoading }: TierFormModalProps) {
  const isEdit = !!tier;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    if (tier) {
      setName(tier.name);
      setDescription(tier.description || '');
      setSortOrder(String(tier.sortOrder));
      setIsActive(tier.isActive);
    } else {
      setName('');
      setDescription('');
      setSortOrder('0');
      setIsActive(true);
    }
  }, [isOpen, tier]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Tier name is required');
      return;
    }
    await onSubmit({
      name: name.trim(),
      description: description || undefined,
      sortOrder: parseInt(sortOrder) || 0,
      isActive,
    });
    onClose();
  };

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Tier — ${tier!.name}` : 'Create New Tier'}
      description="Tiers represent different plan levels (Free, Pro, Enterprise, etc.)"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outline', disabled: isLoading },
        { label: isEdit ? 'Save Changes' : 'Create Tier', onClick: handleSubmit, variant: 'primary', loading: isLoading },
      ]}
    >
      <div className="space-y-4">
        <div>
          <Label className="text-xs font-semibold">Tier Name *</Label>
          <Input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Premium, Ultimate, Gold" className="mt-1.5" />
        </div>
        <div>
          <Label className="text-xs font-semibold">Description</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Describe this tier..." className="mt-1.5" rows={2} />
        </div>
        <div>
          <Label className="text-xs font-semibold">Sort Order</Label>
          <Input type="number" min={0} value={sortOrder} onChange={e => setSortOrder(e.target.value)}
            placeholder="0" className="mt-1.5" />
          <p className="text-[10px] text-gray-400 mt-1">Lower numbers appear first</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} id="tier-active" />
          <Label htmlFor="tier-active" className="text-sm cursor-pointer">Active</Label>
        </div>
      </div>
    </ReusableModal>
  );
}

// ─────────────────────────────────────────────────────────
// INTERVAL FORM MODAL
// ─────────────────────────────────────────────────────────

interface IntervalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  interval?: IPlanInterval | null;
  onSubmit: (data: CreateIntervalParams) => Promise<void>;
  isLoading: boolean;
}

function IntervalFormModal({ isOpen, onClose, interval, onSubmit, isLoading }: IntervalFormModalProps) {
  const isEdit = !!interval;
  const [name, setName] = useState('');
  const [monthsCount, setMonthsCount] = useState('1');
  const [multiplier, setMultiplier] = useState('1');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    if (interval) {
      setName(interval.name);
      setMonthsCount(String(interval.monthsCount));
      setMultiplier(String(interval.multiplier));
      setSortOrder(String(interval.sortOrder));
      setIsActive(interval.isActive);
    } else {
      setName('');
      setMonthsCount('1');
      setMultiplier('1');
      setSortOrder('0');
      setIsActive(true);
    }
  }, [isOpen, interval]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Interval name is required');
      return;
    }
    const months = parseFloat(monthsCount);
    const mult = parseFloat(multiplier);
    if (isNaN(months) || months < 0) {
      toast.error('Months count must be a valid number');
      return;
    }
    if (isNaN(mult) || mult < 0) {
      toast.error('Multiplier must be a valid number');
      return;
    }
    await onSubmit({
      name: name.trim(),
      monthsCount: months,
      multiplier: mult,
      sortOrder: parseInt(sortOrder) || 0,
      isActive,
    });
    onClose();
  };

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Interval — ${interval!.name}` : 'Create New Interval'}
      description="Intervals represent billing cycles (Monthly, Quarterly, Annual, etc.)"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outline', disabled: isLoading },
        { label: isEdit ? 'Save Changes' : 'Create Interval', onClick: handleSubmit, variant: 'primary', loading: isLoading },
      ]}
    >
      <div className="space-y-4">
        <div>
          <Label className="text-xs font-semibold">Interval Name *</Label>
          <Input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Weekly, Monthly, Quarterly, Annual" className="mt-1.5" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold">Months Count *</Label>
            <Input type="number" step="0.01" min={0} value={monthsCount} onChange={e => setMonthsCount(e.target.value)}
              placeholder="1" className="mt-1.5" />
            <p className="text-[10px] text-gray-400 mt-1">e.g., 1 for monthly, 3 for quarterly</p>
          </div>
          <div>
            <Label className="text-xs font-semibold">Price Multiplier *</Label>
            <Input type="number" step="0.01" min={0} value={multiplier} onChange={e => setMultiplier(e.target.value)}
              placeholder="1" className="mt-1.5" />
            <p className="text-[10px] text-gray-400 mt-1">Price relative to monthly</p>
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold">Sort Order</Label>
          <Input type="number" min={0} value={sortOrder} onChange={e => setSortOrder(e.target.value)}
            placeholder="0" className="mt-1.5" />
          <p className="text-[10px] text-gray-400 mt-1">Lower numbers appear first</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={isActive} onCheckedChange={setIsActive} id="interval-active" />
          <Label htmlFor="interval-active" className="text-sm cursor-pointer">Active</Label>
        </div>
      </div>
    </ReusableModal>
  );
}

// ─────────────────────────────────────────────────────────
// BULK ACTIONS MODAL
// ─────────────────────────────────────────────────────────

interface BulkActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: (action: 'activate' | 'deactivate' | 'delete') => void;
  isLoading: boolean;
}

function BulkActionsModal({ isOpen, onClose, selectedCount, onConfirm, isLoading }: BulkActionsModalProps) {
  const [action, setAction] = useState<'activate' | 'deactivate' | 'delete'>('activate');
  const { data: session } = authClient.useSession();
  const isSuperAdmin = session?.user?.role === 'superadmin';

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      onAction={() => onConfirm(action)}
      title={`Bulk ${action === 'activate' ? 'Activate' : action === 'deactivate' ? 'Deactivate' : 'Delete'} Plans`}
      description={`You are about to ${action} ${selectedCount} plan${selectedCount !== 1 ? 's' : ''}.`}
      actionLabel={`${action === 'activate' ? 'Activate' : action === 'deactivate' ? 'Deactivate' : 'Delete'} ${selectedCount} Plan${selectedCount !== 1 ? 's' : ''}`}
      actionVariant={action === 'delete' ? 'danger' : 'primary'}
      isLoading={isLoading}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <Label className="text-xs font-semibold">Select Action</Label>
          <Select value={action} onValueChange={(v) => setAction(v as any)}>
            <SelectTrigger className="mt-1.5 w-full h-10 lg:h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="p-1">
              <SelectItem value="activate">Activate Plans</SelectItem>
              <SelectItem value="deactivate">Deactivate Plans</SelectItem>
              {isSuperAdmin && (
                <SelectItem value="delete">Delete Plans (Superadmin only)</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {action === 'delete' && (
          <div className="flex gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg">
            <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400">
              Deleting plans is permanent and cannot be undone. This action requires superadmin privileges.
            </p>
          </div>
        )}
      </div>
    </ActionModal>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────

export default function PlansManagementPage() {
  const { data: session } = authClient.useSession();
  const userRole = session?.user?.role;
  const canManage = userRole === 'admin' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';

  const [activeTab, setActiveTab] = useState<ManagementTab>('plans');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedInterval, setSelectedInterval] = useState<string>('all');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());

  // Modal states
  const [isCreatePlanModalOpen, setIsCreatePlanModalOpen] = useState(false);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [isCreateTierModalOpen, setIsCreateTierModalOpen] = useState(false);
  const [isEditTierModalOpen, setIsEditTierModalOpen] = useState(false);
  const [isCreateIntervalModalOpen, setIsCreateIntervalModalOpen] = useState(false);
  const [isEditIntervalModalOpen, setIsEditIntervalModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isBulkActionsModalOpen, setIsBulkActionsModalOpen] = useState(false);
  
  const [selectedPlan, setSelectedPlan] = useState<IPlan | null>(null);
  const [selectedTier, setSelectedTier] = useState<IPlanTier | null>(null);
  const [selectedIntervalItem, setSelectedIntervalItem] = useState<IPlanInterval | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'plan' | 'tier' | 'interval'; id: string; name: string } | null>(null);

  // Query hooks
  const { data: plansData, isLoading: plansLoading, isFetching, refetch: refetchPlans } = useGetPlans({
    ...(showActiveOnly && { isActive: true }),
    includeInactive: !showActiveOnly,
  });
  
  const { data: tiersData, isLoading: tiersLoading, refetch: refetchTiers } = useGetTiers();
  const { data: intervalsData, isLoading: intervalsLoading, refetch: refetchIntervals } = useGetIntervals();
  
  // Mutation hooks
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const createTier = useCreateTier();
  const updateTier = useUpdateTier();
  const deleteTier = useDeleteTier();
  const createInterval = useCreateInterval();
  const updateInterval = useUpdateInterval();
  const deleteInterval = useDeleteInterval();
  const bulkAction = useBulkAction();
  const bulkDelete = useBulkDelete();

  const plans = plansData?.plans || [];
  const tiers = tiersData || [];
  const intervals = intervalsData || [];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filter plans by search
  const filteredPlans = plans.filter((plan : IPlan) =>
    debouncedSearch
      ? plan.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        plan.slug.toLowerCase().includes(debouncedSearch.toLowerCase())
      : true
  );

  // Filter by interval
  const displayPlans = selectedInterval === 'all' 
    ? filteredPlans 
    : filteredPlans.filter((p : IPlan) => p.interval === selectedInterval);

  const handleSelectPlan = (planId: string, checked: boolean) => {
    const newSet = new Set(selectedPlans);
    if (checked) newSet.add(planId);
    else newSet.delete(planId);
    setSelectedPlans(newSet);
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    const planIds = Array.from(selectedPlans);
    const slugs = displayPlans.filter((p : IPlan) => planIds.includes(p._id)).map((p:IPlan) => p.slug);

    if (action === 'delete') {
      if (!isSuperAdmin) {
        toast.error('Only superadmins can delete plans');
        return;
      }
      await bulkDelete.mutateAsync({ slugs });
    } else {
      await bulkAction.mutateAsync({ action, slugs });
    }

    setSelectedPlans(new Set());
    setIsBulkActionsModalOpen(false);
    refetchPlans();
  };

  const handleTogglePlanActive = async (plan: IPlan) => {
    if (plan.isActive) {
      await updatePlan.mutateAsync({ id: plan._id, updates: { isActive: false } });
    } else {
      await updatePlan.mutateAsync({ id: plan._id, updates: { isActive: true } });
    }
    refetchPlans();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'plan') {
      await deletePlan.mutateAsync(deleteTarget.id);
      refetchPlans();
    } else if (deleteTarget.type === 'tier') {
      await deleteTier.mutateAsync(deleteTarget.id);
      refetchTiers();
      refetchPlans();
    } else if (deleteTarget.type === 'interval') {
      await deleteInterval.mutateAsync(deleteTarget.id);
      refetchIntervals();
      refetchPlans();
    }
    
    setIsDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const handleToggleTierActive = async (tier: IPlanTier) => {
    await updateTier.mutateAsync({ id: tier._id, isActive: !tier.isActive });
    refetchTiers();
    refetchPlans();
  };

  const handleToggleIntervalActive = async (interval: IPlanInterval) => {
    await updateInterval.mutateAsync({ id: interval._id, isActive: !interval.isActive });
    refetchIntervals();
    refetchPlans();
  };

  const selectedCount = selectedPlans.size;
  const showPlansSkeleton = plansLoading || (isFetching && plans.length === 0);
  const showTiersSkeleton = tiersLoading;
  const showIntervalsSkeleton = intervalsLoading;

  // Get unique intervals for filter
  const uniqueIntervals = [...new Set(plans.map((p : IPlan) => p.interval))];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      <div className="px-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Plans Management</h1>
              {plans.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                  {plans.length} plans
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage subscription plans, tiers, billing intervals, and pricing
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                refetchPlans();
                refetchTiers();
                refetchIntervals();
              }}
              disabled={isFetching}
              className="dark:border-gray-700 h-10 lg:h-11"
            >
              <HugeiconsIcon icon={RefreshIcon} className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
              Refresh
            </Button>
            {canManage && activeTab === 'plans' && (
              <Button onClick={() => setIsCreatePlanModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 h-10 lg:h-11 px-4">
                <HugeiconsIcon icon={PlusIcon} className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            )}
            {canManage && activeTab === 'tiers' && (
              <Button onClick={() => setIsCreateTierModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 h-10 lg:h-11 px-4">
                <HugeiconsIcon icon={PlusIcon} className="h-4 w-4 mr-2" />
                Create Tier
              </Button>
            )}
            {canManage && activeTab === 'intervals' && (
              <Button onClick={() => setIsCreateIntervalModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 h-10 lg:h-11 px-4">
                <HugeiconsIcon icon={PlusIcon} className="h-4 w-4 mr-2" />
                Create Interval
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards - Only for Plans Tab */}
        {activeTab === 'plans' && plans.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatCard label="Total Plans" value={plans.length} icon={LayersIcon} color="blue" />
            <StatCard label="Active Plans" value={plans.filter((p:IPlan) => p.isActive).length} icon={CheckmarkCircle02Icon} color="green" />
            <StatCard label="Free Plans" value={plans.filter((p:IPlan) => p.isFree).length} icon={Money01Icon} color="emerald" />
            <StatCard label="Paid Plans" value={plans.filter((p:IPlan) => !p.isFree).length} icon={Money01Icon} color="purple" />
            <StatCard label="Tiers" value={tiers.length} icon={CategoryIcon} color="orange" />
            <StatCard label="Intervals" value={intervals.length} icon={ClockIcon} color="teal" />
          </div>
        )}

        {/* Main Tabs */}
        <div className="flex flex-wrap gap-3 items-center">
          <TabButton
            label="Plans"
            count={plans.length}
            isActive={activeTab === 'plans'}
            onClick={() => setActiveTab('plans')}
          />
          <TabButton
            label="Tiers"
            count={tiers.length}
            isActive={activeTab === 'tiers'}
            onClick={() => setActiveTab('tiers')}
          />
          <TabButton
            label="Intervals"
            count={intervals.length}
            isActive={activeTab === 'intervals'}
            onClick={() => setActiveTab('intervals')}
          />
        </div>

        {/* ==================== PLANS TAB ==================== */}
        {activeTab === 'plans' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Search plans by name or slug..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 dark:bg-gray-900 dark:border-gray-800"
                />
              </div>

              {uniqueIntervals.length > 0 && (
                <Select value={selectedInterval} onValueChange={(value) => setSelectedInterval(value || 'all')}>
                  <SelectTrigger className="w-36 h-10 lg:h-11">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5" />
                      <SelectValue placeholder="Interval" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="p-1">
                    <SelectItem value="all">All Intervals</SelectItem>
                    {uniqueIntervals.map((interval) => (
                      <SelectItem key={interval as string} value={interval}>
                        {intervals.find((i: IPlanInterval) => i.slug === interval)?.name || interval}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  checked={showActiveOnly}
                  onCheckedChange={setShowActiveOnly}
                  id="show-active"
                />
                <Label htmlFor="show-active" className="text-sm cursor-pointer">
                  Active only
                </Label>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedCount > 0 && !showPlansSkeleton && canManage && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                    {selectedCount}
                  </span>
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    plan{selectedCount !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPlans(new Set())}
                    className="border-blue-200 dark:border-blue-800"
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsBulkActionsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Bulk Actions
                  </Button>
                </div>
              </div>
            )}

            {/* Plans Grid */}
            <div className="relative">
              {showPlansSkeleton ? (
                <PlansSkeleton />
              ) : displayPlans.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <HugeiconsIcon icon={LayersIcon} className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No plans found</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {search || selectedInterval !== 'all'
                      ? 'Try adjusting your filters'
                      : 'No plans available'}
                  </p>
                  {canManage && (
                    <Button onClick={() => setIsCreatePlanModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                      <HugeiconsIcon icon={PlusIcon} className="h-4 w-4 mr-2" />
                      Create Plan
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {isFetching && plans.length > 0 && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Loading plans...</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {displayPlans.map((plan: IPlan) => (
                      <PlanCard
                        key={plan._id}
                        plan={plan}
                        tiers={tiers}
                        intervals={intervals}
                        isSelected={selectedPlans.has(plan._id)}
                        onSelect={(checked) => handleSelectPlan(plan._id, checked)}
                        onEdit={() => {
                          setSelectedPlan(plan);
                          setIsEditPlanModalOpen(true);
                        }}
                        onDelete={() => {
                          setDeleteTarget({ type: 'plan', id: plan._id, name: plan.name });
                          setIsDeleteConfirmOpen(true);
                        }}
                        onToggleActive={() => handleTogglePlanActive(plan)}
                        onManageCoupons={() => {
                          // TODO: Implement coupon management modal
                          toast.info('Coupon management coming soon');
                        }}
                        canManage={canManage}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ==================== TIERS TAB ==================== */}
        {activeTab === 'tiers' && (
          <div className="relative">
            {showTiersSkeleton ? (
              <TiersSkeleton />
            ) : tiers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <HugeiconsIcon icon={CategoryIcon} className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No tiers found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create your first plan tier</p>
                {canManage && (
                  <Button onClick={() => setIsCreateTierModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <HugeiconsIcon icon={PlusIcon} className="h-4 w-4 mr-2" />
                    Create Tier
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {tiers.map((tier: IPlanTier) => (
                  <TierCard
                    key={tier._id}
                    tier={tier}
                    onEdit={() => {
                      setSelectedTier(tier);
                      setIsEditTierModalOpen(true);
                    }}
                    onDelete={() => {
                      setDeleteTarget({ type: 'tier', id: tier._id, name: tier.name });
                      setIsDeleteConfirmOpen(true);
                    }}
                    onToggleActive={() => handleToggleTierActive(tier)}
                    canManage={canManage}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== INTERVALS TAB ==================== */}
        {activeTab === 'intervals' && (
          <div className="relative">
            {showIntervalsSkeleton ? (
              <IntervalsSkeleton />
            ) : intervals.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <HugeiconsIcon icon={ClockIcon} className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No intervals found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create your first billing interval</p>
                {canManage && (
                  <Button onClick={() => setIsCreateIntervalModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <HugeiconsIcon icon={PlusIcon} className="h-4 w-4 mr-2" />
                    Create Interval
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {intervals.map((interval: IPlanInterval) => (
                  <IntervalCard
                    key={interval._id}
                    interval={interval}
                    onEdit={() => {
                      setSelectedIntervalItem(interval);
                      setIsEditIntervalModalOpen(true);
                    }}
                    onDelete={() => {
                      setDeleteTarget({ type: 'interval', id: interval._id, name: interval.name });
                      setIsDeleteConfirmOpen(true);
                    }}
                    onToggleActive={() => handleToggleIntervalActive(interval)}
                    canManage={canManage}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Plan Modals */}
      <PlanFormModal
        isOpen={isCreatePlanModalOpen}
        onClose={() => setIsCreatePlanModalOpen(false)}
        tiers={tiers.filter((t: IPlanTier) => t.isActive)}
        intervals={intervals.filter((i: IPlanInterval) => i.isActive)}
        onSubmit={createPlan.mutateAsync}
        isLoading={createPlan.isPending}
      />

      <PlanFormModal
        isOpen={isEditPlanModalOpen}
        onClose={() => {
          setIsEditPlanModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        tiers={tiers.filter((t: IPlanTier) => t.isActive)}
        intervals={intervals.filter((i: IPlanInterval) => i.isActive)}
        onSubmit={async (data) => {
          if (selectedPlan) {
            await updatePlan.mutateAsync({ id: selectedPlan._id, updates: data });
            refetchPlans();
          }
        }}
        isLoading={updatePlan.isPending}
      />

      {/* Tier Modals */}
      <TierFormModal
        isOpen={isCreateTierModalOpen}
        onClose={() => setIsCreateTierModalOpen(false)}
        onSubmit={createTier.mutateAsync}
        isLoading={createTier.isPending}
      />

      <TierFormModal
        isOpen={isEditTierModalOpen}
        onClose={() => {
          setIsEditTierModalOpen(false);
          setSelectedTier(null);
        }}
        tier={selectedTier}
        onSubmit={async (data) => {
          if (selectedTier) {
            await updateTier.mutateAsync({ id: selectedTier._id, ...data });
            refetchTiers();
            refetchPlans();
          }
        }}
        isLoading={updateTier.isPending}
      />

      {/* Interval Modals */}
      <IntervalFormModal
        isOpen={isCreateIntervalModalOpen}
        onClose={() => setIsCreateIntervalModalOpen(false)}
        onSubmit={createInterval.mutateAsync}
        isLoading={createInterval.isPending}
      />

      <IntervalFormModal
        isOpen={isEditIntervalModalOpen}
        onClose={() => {
          setIsEditIntervalModalOpen(false);
          setSelectedIntervalItem(null);
        }}
        interval={selectedIntervalItem}
        onSubmit={async (data) => {
          if (selectedIntervalItem) {
            await updateInterval.mutateAsync({ id: selectedIntervalItem._id, ...data });
            refetchIntervals();
            refetchPlans();
          }
        }}
        isLoading={updateInterval.isPending}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.type === 'plan' ? 'Plan' : deleteTarget?.type === 'tier' ? 'Tier' : 'Interval'}`}
        description={`Are you sure you want to delete "${deleteTarget?.name}"? ${deleteTarget?.type !== 'plan' ? 'This will not affect existing plans using this item.' : 'This action cannot be undone.'}`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={deletePlan.isPending || deleteTier.isPending || deleteInterval.isPending}
      />

      {/* Bulk Actions Modal */}
      <BulkActionsModal
        isOpen={isBulkActionsModalOpen}
        onClose={() => setIsBulkActionsModalOpen(false)}
        selectedCount={selectedCount}
        onConfirm={handleBulkAction}
        isLoading={bulkAction.isPending || bulkDelete.isPending}
      />
    </div>
  );
}