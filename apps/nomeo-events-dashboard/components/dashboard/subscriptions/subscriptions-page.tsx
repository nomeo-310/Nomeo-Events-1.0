"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Search01Icon, 
  RefreshIcon, 
  File01Icon, 
  FileSpreadsheetIcon,
  MoreHorizontalCircle01Icon,
  ViewIcon,
  UnavailableIcon as BanIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  CalendarIcon,
  CancelCircleIcon as XCircleIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  DollarIcon,
  CreditCardIcon,
  LayersIcon,
  PauseIcon,
  PlayIcon,
  TimerIcon,
  StarIcon,
  CrownIcon,
  ZapIcon,
  Building02Icon,
  TradeUpIcon as TrendingUpIcon,
  TradeDownIcon as TrendingDownIcon,
  UserMultiple02Icon as UsersIcon,
  ActivityIcon,
  Alert02Icon as AlertTriangleIcon,
  SecurityCheckIcon as ShieldCheckIcon,
  PieChartIcon,
  BarChartHorizontalIcon as ChartLineIcon,
  CoinsIcon,
  AwardIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationWithInfo } from "@/components/ui/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReusableModal, ActionModal, ConfirmModal } from '@/components/ui/reusable-modal';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { 
  useGetSubscriptions, 
  useGetSubscription,
  useSubscriptionManagement,
  useGetSubscriptionStats,
  type ISubscription,
  type GetSubscriptionsParams,
  type SubscriptionStatus,
  type PlanTier,
  type PlanInterval,
} from '@/hooks/use-subscriptions';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth/auth-client';

// ============================================
// CONSTANTS
// ============================================

const STATUS_ICONS: Record<SubscriptionStatus, any> = {
  active: CheckCircleIcon,
  trialing: TimerIcon,
  past_due: AlertCircleIcon,
  cancelled: XCircleIcon,
  expired: ClockIcon,
  paused: PauseIcon,
};

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  trialing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  past_due: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
  expired: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
};

const TIER_ICONS: Record<PlanTier, any> = {
  free: ZapIcon,
  starter: StarIcon,
  basic: LayersIcon,
  pro: CrownIcon,
  business: Building02Icon,
  enterprise: Building02Icon,
};

const TIER_COLORS: Record<PlanTier, string> = {
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  basic: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  business: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

// ============================================
// HELPERS
// ============================================

const getInitials = (name: string) => {
  if (!name) return '??';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
};

const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy');
};

const formatDateTime = (date: Date | string | undefined) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy, HH:mm');
};

const formatCurrency = (kobo: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(kobo / 100);
};

const getStatusLabel = (status: SubscriptionStatus): string => {
  const labels: Record<SubscriptionStatus, string> = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past Due',
    cancelled: 'Cancelled',
    expired: 'Expired',
    paused: 'Paused',
  };
  return labels[status] || status;
};

// ============================================
// CUSTOM PROGRESS BAR COMPONENT
// ============================================

const CustomProgress = ({ value, className }: { value: number; className?: string }) => {
  return (
    <div className={cn("h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden", className)}>
      <div 
        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
};

// ============================================
// TAB BUTTON COMPONENT (Consistent with Payments page)
// ============================================

const StatsTabButton = ({ label, icon, isActive, onClick }: { label: string; icon?: any; isActive: boolean; onClick: () => void }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 lg:py-3 text-sm font-medium rounded-md transition-all inline-flex items-center gap-2",
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      )}
    >
      {icon && <HugeiconsIcon icon={icon} className="h-4 w-4" />}
      {label}
    </button>
  );
};

// ============================================
// SUB-COMPONENTS
// ============================================

function SkeletonLine({ className }: { className?: string }) {
  return <div className={`rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] ${className ?? ''}`} />;
}

const SubscriptionsSkeleton = () => (
  <div className="space-y-3">
    <div className="flex gap-3 mb-6">
      <SkeletonLine className="h-10 flex-1" />
      <SkeletonLine className="h-10 w-36" />
      <SkeletonLine className="h-10 w-36" />
    </div>
    <div className="flex gap-4 px-4 pb-3 border-b border-gray-100 dark:border-gray-800">
      <SkeletonLine className="h-3 w-3" />
      <SkeletonLine className="h-3 w-40" />
      <SkeletonLine className="h-3 w-28" />
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="h-3 w-20 ml-auto" />
    </div>
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800" style={{ opacity: 1 - i * 0.1 }}>
        <SkeletonLine className="h-4 w-4 rounded" />
        <div className="flex items-center gap-3 flex-1">
          <SkeletonLine className="h-9 w-9 rounded-full" />
          <div className="space-y-1 flex-1">
            <SkeletonLine className="h-3 w-32" />
            <SkeletonLine className="h-2 w-24" />
          </div>
        </div>
        <SkeletonLine className="h-3 w-24" />
        <SkeletonLine className="h-5 w-20 rounded-full" />
        <SkeletonLine className="h-5 w-20 rounded-full" />
        <SkeletonLine className="h-5 w-24 rounded-full" />
        <SkeletonLine className="h-7 w-7 rounded-lg" />
      </div>
    ))}
  </div>
);

const SubscriptionDetailsSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
      <SkeletonLine className="h-16 w-16 rounded-full ring-4 ring-white dark:ring-gray-900 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine className="h-7 w-48" />
        <SkeletonLine className="h-4 w-64" />
        <div className="flex gap-2 mt-2">
          <SkeletonLine className="h-6 w-20 rounded-full" />
          <SkeletonLine className="h-6 w-24 rounded-full" />
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SkeletonLine className="h-24 rounded-lg" />
      <SkeletonLine className="h-24 rounded-lg" />
      <SkeletonLine className="h-24 rounded-lg" />
      <SkeletonLine className="h-24 rounded-lg" />
    </div>
    <div className="space-y-3">
      <SkeletonLine className="h-20 rounded-lg" />
      <SkeletonLine className="h-20 rounded-lg" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <SkeletonLine className="h-16 rounded-lg" />
      <SkeletonLine className="h-16 rounded-lg" />
    </div>
    <div className="space-y-3">
      <SkeletonLine className="h-6 w-40" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonLine className="h-24 rounded-lg" />
        <SkeletonLine className="h-24 rounded-lg" />
        <SkeletonLine className="h-24 rounded-lg" />
        <SkeletonLine className="h-24 rounded-lg" />
      </div>
    </div>
  </div>
);

const TabButton = ({ label, count, isActive, onClick }: { label: string; count: number; isActive: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2 lg:py-3 text-sm font-medium rounded-md transition-all",
      isActive ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
    )}
  >
    {label}
    {count > 0 && (
      <span className={cn("ml-2 px-2 py-0.5 text-xs rounded-full", isActive ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400")}>
        {count}
      </span>
    )}
  </button>
);

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange, onClear }: {
  startDate: string; endDate: string;
  onStartDateChange: (d: string) => void; onEndDateChange: (d: string) => void; onClear: () => void;
}) => {
  const [startObj, setStartObj] = useState<Date | undefined>(startDate ? new Date(startDate) : undefined);
  const [endObj, setEndObj] = useState<Date | undefined>(endDate ? new Date(endDate) : undefined);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const btn = "flex h-10 lg:h-11 w-[160px] items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm font-normal shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none cursor-pointer dark:border-gray-800 dark:bg-gray-900 dark:text-white";
  return (
    <div className="flex items-center gap-2">
      <Popover open={startOpen} onOpenChange={setStartOpen}>
        <PopoverTrigger><div className={cn(btn, !startObj && "text-muted-foreground")}><HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5 shrink-0" />{startObj ? format(startObj, "dd MMM yyyy") : "Start date"}</div></PopoverTrigger>
        <PopoverContent className="w-auto p-0 dark:bg-gray-900 dark:border-gray-800" align="start">
          <Calendar mode="single" selected={startObj} onSelect={(d) => { setStartObj(d); onStartDateChange(d ? format(d, 'yyyy-MM-dd') : ""); setStartOpen(false); }} className="dark:bg-gray-900" disabled={(d) => endObj ? d > endObj : false} captionLayout="dropdown" />
        </PopoverContent>
      </Popover>
      <span className="text-gray-400 text-xs">to</span>
      <Popover open={endOpen} onOpenChange={setEndOpen}>
        <PopoverTrigger><div className={cn(btn, !endObj && "text-muted-foreground")}><HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5 shrink-0" />{endObj ? format(endObj, "dd MMM yyyy") : "End date"}</div></PopoverTrigger>
        <PopoverContent className="w-auto p-0 dark:bg-gray-900 dark:border-gray-800" align="start">
          <Calendar mode="single" selected={endObj} onSelect={(d) => { setEndObj(d); onEndDateChange(d ? format(d, 'yyyy-MM-dd') : ""); setEndOpen(false); }} className="dark:bg-gray-900" disabled={(d) => startObj ? d < startObj : false} captionLayout="dropdown" />
        </PopoverContent>
      </Popover>
      {(startDate || endDate) && <Button type="button" variant="ghost" size="sm" onClick={onClear} className="h-8 px-2 text-gray-500"><HugeiconsIcon icon={XCircleIcon} className="h-3.5 w-3.5" /></Button>}
    </div>
  );
};

interface DropdownItem { label: string; icon: any; onClick: () => void; danger?: boolean; disabled?: boolean; }
const ActionDropdown = ({ items, trigger }: { items: (DropdownItem | { divider: true; section?: string })[]; trigger: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const W = 224;
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!triggerRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  const update = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    let l = r.right - W; if (l < 8) l = 8; if (l + W > window.innerWidth - 8) l = window.innerWidth - W - 8;
    const t = window.innerHeight - r.bottom >= 320 || window.innerHeight - r.bottom >= r.top ? r.bottom + 6 : r.top - 320 - 6;
    setCoords({ top: t, left: l });
  };
  return (
    <>
      <div ref={triggerRef} onClick={(e) => { e.stopPropagation(); if (!open) update(); setOpen(p => !p); }}>{trigger}</div>
      {open && typeof window !== 'undefined' && createPortal(
        <div ref={menuRef} className="fixed bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden z-[9999] p-1" style={{ top: coords.top, left: coords.left, width: W, boxShadow: '0 4px 24px -4px rgba(0,0,0,0.12)' }} onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
          {items.map((item, i) => {
            if ('divider' in item && item.divider) return item.section ? <p key={i} className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{item.section}</p> : <div key={i} className="my-1 border-t border-gray-100 dark:border-gray-800" />;
            const { label, icon: Icon, onClick, danger, disabled } = item as DropdownItem;
            return (
              <button 
                key={i} 
                type="button" 
                onClick={onClick} 
                disabled={disabled}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors rounded-lg ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  danger ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <HugeiconsIcon icon={Icon} className={`h-3.5 w-3.5 flex-shrink-0 ${danger ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`} />
                {label}
              </button>
            );
          })}
        </div>, document.body
      )}
    </>
  );
};

// ============================================
// STAT CARD
// ============================================

const StatCard = ({ title, value, subtitle, icon, valueColor = 'gray' }: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon?: any;
  valueColor?: 'gray' | 'green' | 'red' | 'blue' | 'purple' | 'orange';
}) => {
  const colorClasses = {
    gray: 'text-gray-900 dark:text-white',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
          <p className={`text-2xl font-bold ${colorClasses[valueColor]}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
            <HugeiconsIcon icon={icon} className={`h-4 w-4 ${colorClasses[valueColor]}`} />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// STATS SECTION WITH TAB BUTTONS (Consistent with Payments page)
// ============================================

const StatsSection = ({ stats, isLoading }: { stats: any; isLoading: boolean }) => {
  const [activeStatTab, setActiveStatTab] = useState('overview');

  const statTabs = [
    { id: 'overview', label: 'Overview', icon: PieChartIcon },
    { id: 'tiers', label: 'By Tier', icon: LayersIcon },
    { id: 'intervals', label: 'By Interval', icon: ClockIcon },
    { id: 'plans', label: 'Top Plans', icon: CrownIcon },
    { id: 'acquisition', label: 'Acquisition', icon: UsersIcon },
  ];

  const safeStats = {
    overview: stats?.overview || { totalSubscriptions: 0, activeSubscriptions: 0, statusBreakdown: [] },
    revenue: stats?.revenue || { mrr: 0, arr: 0, totalRevenue: 0, averageSubscription: 0, subscriptionRange: { min: 0, max: 0 } },
    tiers: stats?.tiers || [],
    intervals: stats?.intervals || [],
    trials: stats?.trials || { active: 0, endingThisWeek: 0, converted: 0, expired: 0, conversionRate: "0" },
    churn: stats?.churn || { thisPeriod: 0, cancelled: 0, expired: 0, churnRate: "0" },
    payments: stats?.payments || { total: 0, successful: 0, failed: 0, successRate: "0", totalAmount: 0 },
    topPlans: stats?.topPlans || [],
    acquisition: stats?.acquisition || [],
    growth: stats?.growth || [],
    upcomingRenewals: stats?.upcomingRenewals || [],
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonLine key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <SkeletonLine className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard 
          title="Monthly Recurring Revenue" 
          value={formatCurrency(safeStats.revenue.mrr * 100)} 
          subtitle="MRR"
          icon={DollarIcon}
          valueColor="green" 
        />
        <StatCard 
          title="Annual Run Rate" 
          value={formatCurrency(safeStats.revenue.arr * 100)} 
          subtitle="ARR"
          icon={TrendingUpIcon}
          valueColor="blue" 
        />
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(safeStats.revenue.totalRevenue * 100)} 
          subtitle="All time"
          icon={CoinsIcon}
          valueColor="purple" 
        />
        <StatCard 
          title="Active Subscriptions" 
          value={safeStats.overview.activeSubscriptions} 
          subtitle={`${safeStats.trials.active} trials active`}
          icon={UsersIcon}
          valueColor="green" 
        />
        <StatCard 
          title="Avg Subscription Value" 
          value={formatCurrency(safeStats.revenue.averageSubscription * 100)} 
          subtitle={`Range: ${formatCurrency(safeStats.revenue.subscriptionRange.min * 100)} - ${formatCurrency(safeStats.revenue.subscriptionRange.max * 100)}`}
          icon={AwardIcon}
          valueColor="blue" 
        />
        <StatCard 
          title="Churn Rate" 
          value={`${safeStats.churn.churnRate}%`} 
          subtitle={`${safeStats.churn.thisPeriod} churned this period`}
          icon={TrendingDownIcon}
          valueColor="red" 
        />
      </div>

      {/* Stats Tab Buttons - Consistent with Payments page */}
      {safeStats.overview.totalSubscriptions > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {statTabs.map((tab) => (
              <StatsTabButton
                key={tab.id}
                label={tab.label}
                icon={tab.icon}
                isActive={activeStatTab === tab.id}
                onClick={() => setActiveStatTab(tab.id)}
              />
            ))}
          </div>

          {/* Overview Content */}
          {activeStatTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status Breakdown */}
                <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <HugeiconsIcon icon={PieChartIcon} className="h-4 w-4" />
                    Status Breakdown
                  </h4>
                  <div className="space-y-3">
                    {safeStats.overview.statusBreakdown.length > 0 ? (
                      safeStats.overview.statusBreakdown.map((item: any) => (
                        <div key={item.status}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="capitalize text-gray-600 dark:text-gray-400">{item.status}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{item.count} ({item.percentage}%)</span>
                          </div>
                          <CustomProgress value={parseFloat(item.percentage)} />
                          {item.revenue > 0 && (
                            <p className="text-[10px] text-gray-500 mt-1">{formatCurrency(item.revenue * 100)} revenue</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No status data available</p>
                    )}
                  </div>
                </div>

                {/* Trial & Renewals */}
                <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <HugeiconsIcon icon={TimerIcon} className="h-4 w-4" />
                    Trial & Renewals
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Active Trials</span>
                      <span className="font-semibold">{safeStats.trials.active}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Trial Conversion Rate</span>
                      <span className="font-semibold text-green-600">{safeStats.trials.conversionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Trials Converted</span>
                      <span className="font-semibold">{safeStats.trials.converted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Trials Expired</span>
                      <span className="font-semibold text-red-600">{safeStats.trials.expired}</span>
                    </div>
                    {safeStats.upcomingRenewals.length > 0 && (
                      <>
                        <div className="border-t border-gray-100 dark:border-gray-800 my-2" />
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Upcoming Renewals</span>
                          <span className="font-semibold">{safeStats.upcomingRenewals[0]?.count || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Expected Revenue</span>
                          <span className="font-semibold text-blue-600">{formatCurrency((safeStats.upcomingRenewals[0]?.expectedRevenue || 0) * 100)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Payments Summary */}
              <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <HugeiconsIcon icon={CreditCardIcon} className="h-4 w-4" />
                  Payment Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Payments</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{safeStats.payments.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Successful</p>
                    <p className="text-lg font-bold text-green-600">{safeStats.payments.successful}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Failed</p>
                    <p className="text-lg font-bold text-red-600">{safeStats.payments.failed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Success Rate</p>
                    <p className="text-lg font-bold text-blue-600">{safeStats.payments.successRate}%</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Total Payment Amount</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(safeStats.payments.totalAmount * 100)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tiers Content */}
          {activeStatTab === 'tiers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeStats.tiers.length > 0 ? (
                safeStats.tiers.map((tier: any) => (
                  <div key={tier.name} className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <HugeiconsIcon icon={TIER_ICONS[tier.name as PlanTier] || StarIcon} className="h-5 w-5 text-blue-500" />
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{tier.name}</h4>
                      <Badge className="ml-auto">{tier.percentage}% of total</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Subscriptions</span>
                        <span className="font-semibold">{tier.total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Active</span>
                        <span className="font-semibold text-green-600">{tier.active}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Revenue</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(tier.revenue * 100)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Avg Revenue/Sub</span>
                        <span className="font-semibold">{formatCurrency(tier.averageRevenue * 100)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-gray-500">No tier data available</div>
              )}
            </div>
          )}

          {/* Intervals Content */}
          {activeStatTab === 'intervals' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeStats.intervals.length > 0 ? (
                safeStats.intervals.map((interval: any) => (
                  <div key={interval.name} className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 capitalize">{interval.name}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subscriptions</span>
                        <span className="font-semibold">{interval.count}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Percentage</span>
                        <span className="font-semibold">{interval.percentage}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Revenue</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(interval.revenue * 100)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-gray-500">No interval data available</div>
              )}
            </div>
          )}

          {/* Top Plans Content */}
          {activeStatTab === 'plans' && (
            <div className="space-y-3">
              {safeStats.topPlans.length > 0 ? (
                safeStats.topPlans.map((plan: any, idx: number) => (
                  <div key={idx} className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{plan.name}</h4>
                        <p className="text-xs text-gray-500 capitalize">{plan.tier} • {plan.interval}</p>
                      </div>
                      <Badge variant="secondary">{plan.subscribers} subscribers</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Revenue</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(plan.revenue * 100)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">Average Price</span>
                      <span className="text-xs font-semibold">{formatCurrency(plan.avgPrice * 100)}</span>
                    </div>
                    {safeStats.revenue.totalRevenue > 0 && (
                      <div className="mt-2">
                        <CustomProgress value={(plan.revenue / safeStats.revenue.totalRevenue) * 100} />
                        <p className="text-[10px] text-gray-500 mt-1">{((plan.revenue / safeStats.revenue.totalRevenue) * 100).toFixed(1)}% of total revenue</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">No plan data available</div>
              )}
            </div>
          )}

          {/* Acquisition Content */}
          {activeStatTab === 'acquisition' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <HugeiconsIcon icon={UsersIcon} className="h-4 w-4" />
                  New Users by Tier
                </h4>
                <div className="space-y-3">
                  {safeStats.acquisition.length > 0 ? (
                    safeStats.acquisition.map((item: any) => {
                      const totalNewUsers = safeStats.acquisition.reduce((sum: number, i: any) => sum + i.newUsers, 0);
                      return (
                        <div key={item.tier}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="capitalize text-gray-600 dark:text-gray-400">{item.tier}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{item.newUsers} users</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Revenue</span>
                            <span>{formatCurrency(item.revenue * 100)}</span>
                          </div>
                          <CustomProgress value={totalNewUsers > 0 ? (item.newUsers / totalNewUsers) * 100 : 0} />
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No acquisition data available</p>
                  )}
                </div>
              </div>

              <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <HugeiconsIcon icon={ChartLineIcon} className="h-4 w-4" />
                  Growth Timeline
                </h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {safeStats.growth.length > 0 ? (
                    safeStats.growth.slice().reverse().map((period: any) => (
                      <div key={period._id} className="border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium text-gray-600">{format(new Date(period._id), 'dd MMM yyyy')}</span>
                          <div className="flex gap-3">
                            <span className="text-xs text-green-600">+{period.newSubscriptions} new</span>
                            <span className="text-xs text-blue-600">{period.activeCount} active</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <CustomProgress value={Math.min((period.newSubscriptions / 20) * 100, 100)} />
                          </div>
                          <div className="flex-1">
                            <div className="h-2 bg-blue-100 dark:bg-blue-900/20 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${Math.min((period.activeCount / 20) * 100, 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No growth data available</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// MANUAL EXPIRY MODAL (Super Admin Only)
// ============================================

interface ExpiryPreviewData {
  total: number;
  affectedCount: number;
  byType: {
    trial: number;
    pastDue: number;
    free: number;
    pendingCancel: number;
  };
  byPlan: Record<string, number>;
  sampleSubscriptions: Array<{
    id: string;
    user: string;
    email: string;
    plan: string;
    type: string;
    endDate: Date;
    status: string;
  }>;
}

const ManualExpiryModal = ({ 
  isOpen, 
  onClose, 
  onRefresh 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onRefresh: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [preview, setPreview] = useState<ExpiryPreviewData | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>('all');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState<'preview' | 'confirm'>('preview');

  const handlePreview = async () => {
    setLoading(true);
    setPreview(null);
    try {
      const response = await fetch(`/api/admin/subscriptions/expire-manual?type=${selectedType ?? 'all'}`);
      const data = await response.json();
      if (data.success) {
        setPreview(data);
        toast.success(`Found ${data.affectedCount} subscriptions ready for expiry`);
      } else {
        toast.error(data.error || 'Failed to fetch preview');
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to fetch preview');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const response = await fetch('/api/admin/subscriptions/expire-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dryRun: false, 
          type: selectedType ?? 'all', 
          sendNotifications: true 
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setShowConfirm(false);
        setPreview(null);
        setConfirmationStep('preview');
        onClose();
        onRefresh();
      } else {
        toast.error(data.error || 'Failed to execute expiry');
      }
    } catch (error) {
      toast.error('Failed to execute expiry');
    } finally {
      setExecuting(false);
    }
  };

  const handleExpiryClick = () => {
    if (preview && preview.affectedCount > 0) {
      setConfirmationStep('confirm');
    }
  };

  return (
    <>
      <ReusableModal
        isOpen={isOpen && confirmationStep === 'preview'}
        onClose={() => {
          onClose();
          setConfirmationStep('preview');
          setPreview(null);
        }}
        title="Manual Expiry Tool"
        description="Emergency backup tool for expiring subscriptions when automated cron job fails"
        size="xl"
        className="!max-w-5xl"
        actions={[
          {
            label: 'Close',
            onClick: () => {
              onClose();
              setConfirmationStep('preview');
              setPreview(null);
            },
            variant: 'outline',
            disabled: loading || executing,
          }
        ]}
      >
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <HugeiconsIcon icon={AlertTriangleIcon} className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Emergency Action Required</h4>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Use this only when the automated cron job has failed. All actions are logged and users will receive notification emails.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                Subscription Type
              </Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full dark:bg-gray-900 dark:border-gray-700 dark:text-white">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={AlertTriangleIcon} className="h-4 w-4 text-amber-500" />
                    <SelectValue placeholder="Select subscription type" />
                  </div>
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-900 dark:border-gray-700 p-1">
                  <SelectItem value="all">All Expirable Subscriptions</SelectItem>
                  <SelectItem value="trial">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={TimerIcon} className="h-3.5 w-3.5 text-blue-500" />
                      Expired Trials Only
                    </div>
                  </SelectItem>
                  <SelectItem value="past_due">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={AlertCircleIcon} className="h-3.5 w-3.5 text-red-500" />
                      Past Due Only
                    </div>
                  </SelectItem>
                  <SelectItem value="free">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={ZapIcon} className="h-3.5 w-3.5 text-green-500" />
                      Free Plans Only
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled_pending">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={ClockIcon} className="h-3.5 w-3.5 text-orange-500" />
                      Pending Cancellations
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 items-end">
              <Button 
                onClick={handlePreview} 
                disabled={loading || executing}
                variant="outline"
                className="dark:border-gray-700"
              >
                <HugeiconsIcon icon={RefreshIcon} className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Preview
              </Button>
              
              {preview && preview.affectedCount > 0 && (
                <Button 
                  onClick={handleExpiryClick} 
                  disabled={executing}
                  variant="destructive"
                >
                  <HugeiconsIcon icon={AlertTriangleIcon} className="h-4 w-4 mr-2" />
                  Expire {preview.affectedCount} Subscription{preview.affectedCount !== 1 ? 's' : ''}
                </Button>
              )}
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" />
                <span className="text-sm text-gray-600">Loading subscriptions...</span>
              </div>
            </div>
          )}

          {preview && preview.affectedCount > 0 && !loading && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <HugeiconsIcon icon={TimerIcon} className="h-4 w-4 text-blue-500" />
                    <p className="text-xs text-gray-500">Expired Trials</p>
                  </div>
                  <p className="text-xl font-bold text-blue-600">{preview.byType?.trial || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-red-500" />
                    <p className="text-xs text-gray-500">Past Due</p>
                  </div>
                  <p className="text-xl font-bold text-red-600">{preview.byType?.pastDue || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <HugeiconsIcon icon={ZapIcon} className="h-4 w-4 text-green-500" />
                    <p className="text-xs text-gray-500">Free Plans</p>
                  </div>
                  <p className="text-xl font-bold text-green-600">{preview.byType?.free || 0}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <HugeiconsIcon icon={ClockIcon} className="h-4 w-4 text-orange-500" />
                    <p className="text-xs text-gray-500">Pending Cancel</p>
                  </div>
                  <p className="text-xl font-bold text-orange-600">{preview.byType?.pendingCancel || 0}</p>
                </div>
              </div>

              {preview.sampleSubscriptions && preview.sampleSubscriptions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <p className="font-medium text-sm flex items-center gap-2">
                      <HugeiconsIcon icon={ViewIcon} className="h-3.5 w-3.5" />
                      Subscriptions to Expire ({preview.sampleSubscriptions.length} of {preview.affectedCount})
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                      className="h-6 text-xs"
                    >
                      {showDetails ? 'Hide Details' : 'Show Details'}
                    </Button>
                  </div>
                  
                  {showDetails && (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
                      {preview.sampleSubscriptions.map((sub) => (
                        <div key={sub.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm text-gray-900 dark:text-white">{sub.user}</p>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-[10px]",
                                    sub.type === 'trial' && "border-blue-200 text-blue-600",
                                    sub.type === 'past_due' && "border-red-200 text-red-600",
                                    sub.type === 'free' && "border-green-200 text-green-600",
                                    sub.type === 'pending_cancel' && "border-orange-200 text-orange-600"
                                  )}
                                >
                                  {sub.type === 'trial' && 'Expired Trial'}
                                  {sub.type === 'past_due' && 'Past Due'}
                                  {sub.type === 'free' && 'Free Plan'}
                                  {sub.type === 'pending_cancel' && 'Pending Cancel'}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{sub.email}</p>
                              <div className="flex gap-3 mt-1 text-xs text-gray-400">
                                <span>Plan: {sub.plan}</span>
                                <span>Ends: {new Date(sub.endDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!showDetails && (
                    <div className="p-3 text-sm text-gray-500">
                      {preview.sampleSubscriptions.slice(0, 3).map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between py-1">
                          <span>{sub.user}</span>
                          <span className="text-xs text-gray-400">{sub.plan}</span>
                        </div>
                      ))}
                      {preview.sampleSubscriptions.length > 3 && (
                        <p className="text-xs text-gray-400 mt-2 text-center">
                          +{preview.sampleSubscriptions.length - 3} more subscriptions. Click "Show Details" to view all.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {preview.byPlan && Object.keys(preview.byPlan).length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                  <p className="font-medium text-sm mb-2 flex items-center gap-2">
                    <HugeiconsIcon icon={LayersIcon} className="h-3.5 w-3.5" />
                    Breakdown by Plan:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(preview.byPlan).map(([plan, count]) => (
                      <Badge key={plan} variant="secondary" className="text-xs">
                        {plan}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {preview && preview.affectedCount === 0 && !loading && (
            <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
              <HugeiconsIcon icon={CheckCircleIcon} className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">No subscriptions found matching the selected criteria.</p>
              <p className="text-xs text-gray-500 mt-1">All subscriptions are up to date.</p>
            </div>
          )}
        </div>
      </ReusableModal>

      <ConfirmModal
        isOpen={isOpen && confirmationStep === 'confirm'}
        onClose={() => {
          setShowConfirm(false);
          setConfirmationStep('preview');
        }}
        onConfirm={handleExecute}
        title="Emergency Expiry Confirmation"
        description={`Are you sure you want to expire ${preview?.affectedCount} subscription${preview?.affectedCount !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmLabel={`Expire ${preview?.affectedCount} Subscription${preview?.affectedCount !== 1 ? 's' : ''}`}
        cancelLabel="Back"
        confirmVariant="danger"
        isLoading={executing}
      >
        <div className="mt-4 space-y-3">
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-300 flex items-start gap-2">
              <HugeiconsIcon icon={AlertTriangleIcon} className="h-4 w-4 mt-0.5 flex-shrink-0" />
              This is an emergency action. Only proceed if the automated cron job has failed to expire these subscriptions.
            </p>
          </div>
          
          {preview?.sampleSubscriptions && preview.sampleSubscriptions.length > 0 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-medium mb-2">Affected users (first 5):</p>
              <div className="space-y-1">
                {preview.sampleSubscriptions.slice(0, 5).map(sub => (
                  <div key={sub.id} className="text-xs flex justify-between">
                    <span>{sub.user}</span>
                    <span className="text-gray-500">{sub.plan}</span>
                  </div>
                ))}
                {preview.sampleSubscriptions.length > 5 && (
                  <p className="text-xs text-gray-500">+{preview.sampleSubscriptions.length - 5} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      </ConfirmModal>
    </>
  );
};

// ============================================
// SUBSCRIPTION DETAILS CONTENT (for modal)
// ============================================

const SubscriptionDetailsContent = ({ subscriptionId }: { subscriptionId: string }) => {
  const { data: detail, isLoading } = useGetSubscription(subscriptionId);
  
  if (isLoading) {
    return <SubscriptionDetailsSkeleton />;
  }
  
  if (!detail) {
    return (
      <div className="py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
          <HugeiconsIcon icon={AlertCircleIcon} className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Failed to load subscription details</p>
      </div>
    );
  }
  
  const sub = detail.subscription;
  const userName = typeof sub.userId === 'object' ? sub.userId.name : 'Unknown';
  const userEmail = typeof sub.userId === 'object' ? sub.userId.email : 'Unknown';
  const userAvatar = typeof sub.userId === 'object' ? sub.userId.avatar : undefined;
  
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <Avatar className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg ring-4 ring-white dark:ring-gray-900 flex-shrink-0">
          {userAvatar ? <AvatarImage src={userAvatar} alt={userName} /> : null}
          <AvatarFallback className="bg-transparent text-white text-lg font-bold">{getInitials(userName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{userName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{userEmail}</p>
          <div className="flex gap-2 mt-2">
            <Badge className={cn("gap-1 border", STATUS_COLORS[sub.status])}>
              <HugeiconsIcon icon={STATUS_ICONS[sub.status]} className="h-3 w-3" />
              {getStatusLabel(sub.status)}
            </Badge>
            <Badge className={cn("gap-1", TIER_COLORS[sub.planTier])}>
              <HugeiconsIcon icon={TIER_ICONS[sub.planTier]} className="h-3 w-3" />
              {sub.planName}
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Plan</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{sub.planName} ({sub.planTier})</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Interval</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{sub.interval}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(sub.finalPriceKobo)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Period End</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(sub.currentPeriodEnd)}</p>
        </div>
      </div>
      
      {sub.discountKobo > 0 && (
        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Discount</p>
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            -{formatCurrency(sub.discountKobo)} {sub.couponCode && `(${sub.couponCode})`}
          </p>
        </div>
      )}
      
      {sub.trialEnd && (
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Trial Ends</p>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatDate(sub.trialEnd)}</p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(sub.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Updated</p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(sub.updatedAt)}</p>
        </div>
      </div>
      
      {detail.analytics && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Payment Analytics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500">Payments</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{detail.analytics.totalPayments}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500">Revenue</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(detail.analytics.totalRevenue * 100)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500">Avg Payment</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(detail.analytics.averagePaymentAmount * 100)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xs text-gray-500">LTV</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatCurrency(detail.analytics.lifetimeValue * 100)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN PAGE
// ============================================

const SubscriptionsPage = () => {
  const { data: session } = authClient.useSession();
  const isSuperAdmin = session?.user?.role === 'super_admin';
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<SubscriptionStatus>('active');
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<PlanTier | 'all'>('all');
  const [intervalFilter, setIntervalFilter] = useState<PlanInterval | 'all'>('all');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [manualExpiryOpen, setManualExpiryOpen] = useState(false);

  const [viewId, setViewId] = useState<string | null>(null);
  const [cancelSub, setCancelSub] = useState<ISubscription | null>(null);
  const [pauseSub, setPauseSub] = useState<ISubscription | null>(null);
  const [extendSub, setExtendSub] = useState<ISubscription | null>(null);
  const [reason, setReason] = useState("");
  const [cancelNow, setCancelNow] = useState(false);
  const [extendDays, setExtendDays] = useState("30");
  const [actionLoading, setActionLoading] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState(30);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); setSelected(new Set()); }, [tab, tierFilter, intervalFilter, startDate, endDate]);

  const params: GetSubscriptionsParams = { page, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' };
  if (debouncedSearch) params.search = debouncedSearch;
  params.status = tab;
  if (tierFilter !== 'all') params.planTier = tierFilter;
  if (intervalFilter !== 'all') params.interval = intervalFilter;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const { data, isLoading, isFetching, refetch } = useGetSubscriptions(params);
  const { data: stats, isLoading: statsLoading } = useGetSubscriptionStats(statsPeriod);
  const { cancelSubscription, pauseSubscription, resumeSubscription, extendSubscription, markSubscriptionActive, markSubscriptionPastDue, bulkAction, exportSubscriptions } = useSubscriptionManagement();

  const subscriptions = data?.subscriptions || [];
  const pagination = data?.pagination;
  const showSkeleton = isLoading || (isFetching && subscriptions.length === 0);
  const hasFilters = debouncedSearch || tierFilter !== 'all' || intervalFilter !== 'all' || startDate || endDate;

  const toggleSelect = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  const selectAll = () => setSelected(selected.size === subscriptions.length && subscriptions.length > 0 ? new Set() : new Set(subscriptions.map(s => s._id)));
  const clearFilters = () => { setSearch(""); setDebouncedSearch(""); setTab("active"); setTierFilter("all"); setIntervalFilter("all"); setStartDate(""); setEndDate(""); setPage(1); setSelected(new Set()); };

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['subscriptions', 'stats'] });
    toast.success("Data refreshed");
  };

  const doCancel = async () => { 
    if (!cancelSub) return; 
    setActionLoading(true); 
    try { 
      await cancelSubscription(cancelSub._id, reason, cancelNow); 
      toast.success("Cancelled"); 
      setCancelSub(null); 
      setReason(""); 
      setCancelNow(false); 
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); 
    } catch { 
      toast.error("Failed"); 
    } finally { 
      setActionLoading(false); 
    } 
  };
  
  const doPause = async () => { 
    if (!pauseSub) return; 
    setActionLoading(true); 
    try { 
      await pauseSubscription(pauseSub._id, reason); 
      toast.success("Paused"); 
      setPauseSub(null); 
      setReason(""); 
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); 
    } catch { 
      toast.error("Failed"); 
    } finally { 
      setActionLoading(false); 
    } 
  };
  
  const doExtend = async () => { 
    if (!extendSub) return; 
    setActionLoading(true); 
    try { 
      await extendSubscription(extendSub._id, parseInt(extendDays), reason); 
      toast.success(`Extended ${extendDays} days`); 
      setExtendSub(null); 
      setReason(""); 
      setExtendDays("30"); 
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); 
    } catch { 
      toast.error("Failed"); 
    } finally { 
      setActionLoading(false); 
    } 
  };

  const tabConfigs: Array<{ key: SubscriptionStatus; label: string }> = [
    { key: 'active', label: 'Active' },
    { key: 'trialing', label: 'Trialing' },
    { key: 'past_due', label: 'Past Due' },
    { key: 'paused', label: 'Paused' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'expired', label: 'Expired' },
  ];

  const getTabCount = (k: SubscriptionStatus) => {
    if (!stats?.overview?.statusBreakdown) return 0;
    return stats.overview.statusBreakdown.find(s => s.status === k)?.count || 0;
  };

  const getSubscriptionDropdownItems = (sub: ISubscription): (DropdownItem | { divider: true; section?: string })[] => {
    const items: (DropdownItem | { divider: true; section?: string })[] = [
      { label: 'View Details', icon: ViewIcon, onClick: () => setViewId(sub._id) }
    ];
    
    if (isSuperAdmin) {
      items.push({ divider: true, section: 'Actions' });
      
      if (sub.status === 'active' || sub.status === 'trialing') {
        items.push({ label: 'Cancel', icon: BanIcon, onClick: () => setCancelSub(sub) });
        items.push({ label: 'Pause', icon: PauseIcon, onClick: () => setPauseSub(sub) });
        items.push({ label: 'Extend', icon: TimerIcon, onClick: () => setExtendSub(sub) });
      }
      
      if (sub.status === 'paused') {
        items.push({ 
          label: 'Resume', 
          icon: PlayIcon, 
          onClick: () => resumeSubscription(sub._id).then(() => { 
            toast.success("Resumed"); 
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); 
          }).catch(() => toast.error("Failed")) 
        });
      }
      
      if (sub.status === 'past_due') {
        items.push({ 
          label: 'Mark Active', 
          icon: CheckCircleIcon, 
          onClick: () => markSubscriptionActive(sub._id).then(() => { 
            toast.success("Marked active"); 
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); 
          }).catch(() => toast.error("Failed")) 
        });
      }
      
      if (sub.status === 'active') {
        items.push({ 
          label: 'Mark Past Due', 
          icon: AlertCircleIcon, 
          onClick: () => markSubscriptionPastDue(sub._id).then(() => { 
            toast.success("Marked past due"); 
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); 
          }).catch(() => toast.error("Failed")) 
        });
      }
    } else {
      items.push({ 
        divider: true, 
        section: 'Actions' 
      } as const);
      items.push({ 
        label: 'Actions Restricted', 
        icon: ShieldCheckIcon, 
        onClick: () => toast.error("Only super admins can perform actions on subscriptions"),
        disabled: true
      });
    }
    
    return items;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div className="px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Subscription Management</h1>
              {stats && stats.overview?.activeSubscriptions > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                  {stats.overview.activeSubscriptions} active
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Monitor and manage all subscriptions. View details, handle cancellations, pauses, extensions, and track revenue metrics.</p>
        </div>

        {/* Stats Section with Tab Buttons */}
        <StatsSection stats={stats} isLoading={statsLoading} />

        {/* Toolbar */}
        <div className="flex justify-end mb-4 gap-2">
          <Select value={String(statsPeriod)} onValueChange={v => setStatsPeriod(parseInt(v || '30'))}>
            <SelectTrigger className="w-32 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
            </SelectContent>
          </Select>
          <ActionDropdown trigger={<Button type="button" variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 px-4 h-10"><HugeiconsIcon icon={FileSpreadsheetIcon} className="h-3.5 w-3.5 mr-2" />Export</Button>}
            items={[
              { label: 'Export CSV', icon: FileSpreadsheetIcon, onClick: () => exportSubscriptions({ format: 'csv', status: tab }) },
              { label: 'Export JSON', icon: File01Icon, onClick: () => exportSubscriptions({ format: 'json' }) },
            ]}
          />
          <Button type="button" onClick={handleRefresh} variant="outline" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 px-4 h-10" disabled={isFetching}>
            <HugeiconsIcon icon={RefreshIcon} className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {tabConfigs.map(({ key, label }) => (
              <TabButton key={key} label={label} count={getTabCount(key)} isActive={tab === key} onClick={() => setTab(key)} />
            ))}
            {isFetching && !isLoading && <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4 animate-spin text-blue-500" />}
          </div>
          
          {isSuperAdmin && (
            <div className="hidden lg:block">
              <Button 
                onClick={() => setManualExpiryOpen(true)}
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30"
              >
                <HugeiconsIcon icon={AlertTriangleIcon} className="h-4 w-4 mr-2" />
                Manual Expiry
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-2.5 items-center">
          <div className="flex-1 relative h-10 lg:h-11 min-w-[200px]">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
            <Input placeholder="Search by plan name, user email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:placeholder-gray-500" />
          </div>
          <Select value={tierFilter} onValueChange={v => setTierFilter((v as PlanTier) ?? 'all')}>
            <SelectTrigger className="w-full sm:w-36 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10 lg:h-11 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={LayersIcon} className="h-4 w-4" />
                <SelectValue placeholder="Tier" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Select value={intervalFilter} onValueChange={v => setIntervalFilter((v as PlanInterval) ?? 'all')}>
            <SelectTrigger className="w-full sm:w-36 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10 lg:h-11 rounded-lg"><div className="flex items-center gap-2 text-gray-500 dark:text-gray-400"><HugeiconsIcon icon={ClockIcon} className="h-4 w-4" /><SelectValue placeholder="Interval" /></div></SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1"><SelectItem value="all">All</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="biannual">Biannual</SelectItem><SelectItem value="annual">Annual</SelectItem><SelectItem value="lifetime">Lifetime</SelectItem></SelectContent>
          </Select>
          <DateRangePicker startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} onClear={() => { setStartDate(""); setEndDate(""); }} />
        </div>

        {/* Bulk bar */}
        {selected.size > 0 && !showSkeleton && isSuperAdmin && (
          <div className="mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 rounded-xl">
            <div className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center">{selected.size}</span><span className="text-sm font-medium text-blue-900 dark:text-blue-200">selected</span></div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300" onClick={() => { bulkAction({ action: 'cancel', subscriptionIds: Array.from(selected), reason: 'Bulk cancellation' }); setSelected(new Set()); }}><HugeiconsIcon icon={BanIcon} className="h-3.5 w-3.5 mr-1.5" />Bulk Cancel</Button>
              <Button type="button" variant="outline" size="sm" className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300" onClick={() => { bulkAction({ action: 'pause', subscriptionIds: Array.from(selected), reason: 'Bulk pause' }); setSelected(new Set()); }}><HugeiconsIcon icon={PauseIcon} className="h-3.5 w-3.5 mr-1.5" />Bulk Pause</Button>
            </div>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden md:block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {showSkeleton ? <div className="p-6"><SubscriptionsSkeleton /></div> : subscriptions.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4"><HugeiconsIcon icon={CreditCardIcon} className="h-6 w-6 text-gray-400 dark:text-gray-600" /></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No subscriptions found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{hasFilters ? 'No subscriptions match your filters' : 'No records found'}</p>
              {hasFilters && <button onClick={clearFilters} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">Clear Filters</button>}
            </div>
          ) : (
            <>
              <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <div className="w-12">
                  {isSuperAdmin && <Checkbox checked={selected.size === subscriptions.length && subscriptions.length > 0} onCheckedChange={selectAll} />}
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
                {isFetching && !isLoading && <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-10 flex items-start justify-center pt-20"><div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"><HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" /><span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span></div></div>}
                {subscriptions.map(sub => {
                  const name = typeof sub.userId === 'object' ? sub.userId?.name : 'Unknown';
                  const email = typeof sub.userId === 'object' ? sub.userId?.email : 'Unknown';
                  const avatar = typeof sub.userId === 'object' ? sub.userId?.avatar : undefined;
                  return (
                    <div key={sub._id} className={cn("flex items-center px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors", sub.status === 'past_due' && "bg-red-50/30 dark:bg-red-900/10")}>
                      <div className="w-12">
                        {isSuperAdmin && <Checkbox checked={selected.has(sub._id)} onCheckedChange={() => toggleSelect(sub._id)} />}
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-full flex-shrink-0">{avatar ? <AvatarImage src={avatar} alt={name} /> : null}<AvatarFallback className="bg-blue-500 text-white text-xs font-bold">{getInitials(name)}</AvatarFallback></Avatar>
                        <div><p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{email}</p><div className="flex items-center gap-1 mt-0.5"><HugeiconsIcon icon={TIER_ICONS[sub.planTier]} className="h-3 w-3 text-gray-400" /><span className="text-xs text-gray-500 dark:text-gray-400">{sub.planName}</span></div></div>
                      </div>
                      <div className="w-24"><Badge className={cn("gap-1", TIER_COLORS[sub.planTier])}><HugeiconsIcon icon={TIER_ICONS[sub.planTier]} className="h-3 w-3" />{sub.planTier}</Badge></div>
                      <div className="w-28"><Badge className={cn("gap-1 border", STATUS_COLORS[sub.status])}><HugeiconsIcon icon={STATUS_ICONS[sub.status]} className="h-3 w-3" />{getStatusLabel(sub.status)}</Badge>{sub.cancelAtPeriodEnd && sub.status === 'active' && <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Cancels at period end</p>}</div>
                      <div className="w-28"><span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">{sub.interval}</span></div>
                      <div className="w-32"><p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(sub.finalPriceKobo)}</p>{sub.discountKobo > 0 && <p className="text-[10px] text-green-600 dark:text-green-400">{formatCurrency(sub.priceKobo)} - {formatCurrency(sub.discountKobo)} off</p>}</div>
                      <div className="w-32"><p className="text-xs text-gray-700 dark:text-gray-300">{formatDate(sub.currentPeriodEnd)}</p>{sub.trialEnd && sub.status === 'trialing' && <p className="text-[10px] text-blue-600 dark:text-blue-400">Trial ends {formatDate(sub.trialEnd)}</p>}</div>
                      <div className="w-16 flex items-center justify-center gap-1">
                        <button onClick={() => setViewId(sub._id)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="View"><HugeiconsIcon icon={ViewIcon} className="h-4 w-4 text-gray-500 dark:text-gray-400" /></button>
                        <ActionDropdown 
                          trigger={
                            <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                              <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </button>
                          }
                          items={getSubscriptionDropdownItems(sub)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {pagination && pagination.totalPages > 1 && (
                <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4">
                  <PaginationWithInfo currentPage={page} totalPages={pagination.totalPages} totalItems={pagination.totalCount} itemsPerPage={pagination.limit} onPageChange={setPage} showInfo showPageNumbers maxVisiblePages={5} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="md:hidden space-y-3">
          {showSkeleton ? <SubscriptionsSkeleton /> : subscriptions.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-10 text-center"><div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4"><HugeiconsIcon icon={CreditCardIcon} className="h-6 w-6 text-gray-400 dark:text-gray-600" /></div><h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No subscriptions found</h3></div>
          ) : (
            subscriptions.map(sub => {
              const name = typeof sub.userId === 'object' ? sub.userId?.name : 'Unknown';
              const email = typeof sub.userId === 'object' ? sub.userId?.email : 'Unknown';
              const avatar = typeof sub.userId === 'object' ? sub.userId?.avatar : undefined;
              const isExpanded = expandedMobile === sub._id;
              return (
                <div key={sub._id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    {isSuperAdmin && <Checkbox checked={selected.has(sub._id)} onCheckedChange={() => toggleSelect(sub._id)} />}
                    <Avatar className="h-9 w-9 rounded-full flex-shrink-0">{avatar ? <AvatarImage src={avatar} alt={name} /> : null}<AvatarFallback className="bg-blue-500 text-white text-xs font-bold">{getInitials(name)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p><p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sub.planName}</p></div>
                    <Badge className={cn("gap-1 border", STATUS_COLORS[sub.status])}><HugeiconsIcon icon={STATUS_ICONS[sub.status]} className="h-3 w-3" />{getStatusLabel(sub.status)}</Badge>
                    <button onClick={() => setExpandedMobile(p => p === sub._id ? null : sub._id)} className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><HugeiconsIcon icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon} className="h-4 w-4" /></button>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2"><p className="text-[10px] text-gray-400 uppercase">Plan</p><div className="flex items-center gap-1 mt-0.5"><HugeiconsIcon icon={TIER_ICONS[sub.planTier]} className="h-3 w-3 text-blue-500" /><p className="text-xs font-medium text-gray-700 dark:text-gray-300">{sub.planName}</p></div></div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2"><p className="text-[10px] text-gray-400 uppercase">Interval</p><p className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">{sub.interval}</p></div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2"><p className="text-[10px] text-gray-400 uppercase">Price</p><p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatCurrency(sub.finalPriceKobo)}</p></div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2"><p className="text-[10px] text-gray-400 uppercase">Period End</p><p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatDate(sub.currentPeriodEnd)}</p></div>
                      </div>
                      <Button size="sm" variant="outline" className="w-full h-8 text-xs dark:border-gray-700" onClick={() => setViewId(sub._id)}><HugeiconsIcon icon={ViewIcon} className="h-3 w-3 mr-1" />View Details</Button>
                      {isSuperAdmin && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => setCancelSub(sub)}><HugeiconsIcon icon={BanIcon} className="h-3 w-3 mr-1" />Cancel</Button>
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => setPauseSub(sub)}><HugeiconsIcon icon={PauseIcon} className="h-3 w-3 mr-1" />Pause</Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          {pagination && pagination.totalPages > 1 && <div className="mt-4"><PaginationWithInfo currentPage={page} totalPages={pagination.totalPages} totalItems={pagination.totalCount} itemsPerPage={pagination.limit} onPageChange={setPage} showInfo maxVisiblePages={3} /></div>}
        </div>
      </div>

      {/* Modals */}
      <ReusableModal 
        isOpen={!!viewId} 
        onClose={() => setViewId(null)} 
        title="Subscription Details" 
        description="Complete subscription information" 
        size="full" 
        className="!max-w-4xl" 
        actions={[{ label: 'Close', onClick: () => setViewId(null), variant: 'outline' }]}
      >
        {viewId && <SubscriptionDetailsContent subscriptionId={viewId} />}
      </ReusableModal>

      <ActionModal isOpen={!!cancelSub} onClose={() => { setCancelSub(null); setReason(""); setCancelNow(false); }} onAction={doCancel} title="Cancel Subscription" description="Cancel the user's subscription" actionLabel="Cancel Subscription" cancelLabel="Keep Active" actionVariant="danger" isLoading={actionLoading} disabled={!reason} size="md">
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-lg"><HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" /><div><p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1.5">Cancelling: {cancelSub?.planName} ({cancelSub?.planTier})</p><p className="text-xs text-red-700 dark:text-red-400">Period ends: {formatDate(cancelSub?.currentPeriodEnd)}</p></div></div>
          <div><Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason</Label><Textarea placeholder="Reason for cancellation..." value={reason} onChange={e => setReason(e.target.value)} className="mt-1.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white" rows={3} /></div>
          <div className="flex items-center gap-2"><Checkbox id="cancelNow" checked={cancelNow} onCheckedChange={c => setCancelNow(!!c)} /><Label htmlFor="cancelNow" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">Cancel immediately</Label></div>
        </div>
      </ActionModal>

      <ActionModal isOpen={!!pauseSub} onClose={() => { setPauseSub(null); setReason(""); }} onAction={doPause} title="Pause Subscription" description="Temporarily pause the subscription" actionLabel="Pause" cancelLabel="Cancel" actionVariant="secondary" isLoading={actionLoading} disabled={!reason} size="md">
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-lg"><HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" /><div><p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1.5">Pausing: {pauseSub?.planName}</p><p className="text-xs text-amber-700 dark:text-amber-400">Access will be suspended immediately</p></div></div>
          <div><Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason</Label><Textarea placeholder="Reason for pausing..." value={reason} onChange={e => setReason(e.target.value)} className="mt-1.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white" rows={3} /></div>
        </div>
      </ActionModal>

      <ActionModal isOpen={!!extendSub} onClose={() => { setExtendSub(null); setReason(""); setExtendDays("30"); }} onAction={doExtend} title="Extend Subscription" description="Extend the subscription period" actionLabel="Extend" cancelLabel="Cancel" isLoading={actionLoading} size="md">
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-lg"><HugeiconsIcon icon={TimerIcon} className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" /><div><p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Current period ends: {formatDate(extendSub?.currentPeriodEnd)}</p></div></div>
          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Extension Days</Label>
            <Select value={extendDays} onValueChange={value => setExtendDays(value || '30')}>
              <SelectTrigger className="mt-1.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700 p-1">
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason</Label><Textarea placeholder="Reason for extension..." value={reason} onChange={e => setReason(e.target.value)} className="mt-1.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white" rows={2} /></div>
        </div>
      </ActionModal>

      {/* Manual Expiry Modal */}
      <ManualExpiryModal 
        isOpen={manualExpiryOpen} 
        onClose={() => setManualExpiryOpen(false)} 
        onRefresh={handleRefresh} 
      />
    </div>
  );
};

export default SubscriptionsPage;