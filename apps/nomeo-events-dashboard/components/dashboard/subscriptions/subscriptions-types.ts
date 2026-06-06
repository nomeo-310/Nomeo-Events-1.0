// subscriptions-types.ts
import {
  CheckmarkCircle02Icon as CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  CancelCircleIcon as XCircleIcon,
  LayersIcon,
  PauseIcon,
  TimerIcon,
  StarIcon,
  CrownIcon,
  ZapIcon,
  Building02Icon,
} from "@hugeicons/core-free-icons";
import type { SubscriptionStatus, PlanTier, PlanInterval } from '@/hooks/use-subscriptions';

export const STATUS_ICONS: Record<SubscriptionStatus, any> = {
  active: CheckCircleIcon,
  trialing: TimerIcon,
  past_due: AlertCircleIcon,
  cancelled: XCircleIcon,
  expired: ClockIcon,
  paused: PauseIcon,
};

export const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  trialing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  past_due: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800',
  expired: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  paused: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
};

export const TIER_ICONS: Record<PlanTier, any> = {
  free: ZapIcon,
  starter: StarIcon,
  basic: LayersIcon,
  pro: CrownIcon,
  business: Building02Icon,
  enterprise: Building02Icon,
};

export const TIER_COLORS: Record<PlanTier, string> = {
  free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  basic: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pro: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  business: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export interface DropdownItem {
  label: string;
  icon: any;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface ExpiryPreviewData {
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

export const getInitials = (name: string) => {
  if (!name) return '??';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
};

export const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date: Date | string | undefined) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (kobo: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(kobo / 100);
};

export const getStatusLabel = (status: SubscriptionStatus): string => {
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