// plans-card-components.tsx
import { useState, useEffect, useRef } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  EditIcon,
  DeleteIcon,
  Tick02Icon,
  Cancel01Icon,
  MoreHorizontalIcon,
  ArrangeIcon as CategoryIcon,
  ClockIcon,
  HashtagIcon as HashIcon,
  KeyframesMultipleIcon as MultiplyIcon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { IPlanTier, IPlanInterval } from '@/hooks/use-plans';

interface TierCardProps {
  tier: IPlanTier;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  canManage: boolean;
}

export function TierCard({ tier, onEdit, onDelete, onToggleActive, canManage }: TierCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-none", tier.isActive ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-gray-800")}>
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

interface IntervalCardProps {
  interval: IPlanInterval;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  canManage: boolean;
}

export function IntervalCard({ interval, onEdit, onDelete, onToggleActive, canManage }: IntervalCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-none", interval.isActive ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-gray-100 dark:bg-gray-800")}>
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