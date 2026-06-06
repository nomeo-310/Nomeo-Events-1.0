// users-types.ts
import {
  UnavailableIcon as BanIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  UserRemove01Icon,
} from "@hugeicons/core-free-icons";
import type { Profile } from '@/hooks/use-profiles';

export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getStatusBadge = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    deactivated: "secondary",
    suspended: "destructive",
    pending: "outline",
  };
  return variants[status] || "secondary";
};

export const getVerificationBadge = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    verified: "default",
    pending: "secondary",
    rejected: "destructive",
    unverified: "outline",
    suspended: "destructive",
  };
  return variants[status] || "secondary";
};

export const getStatusIcon = (status: string) => {
  const icons: Record<string, any> = {
    active: CheckCircleIcon,
    deactivated: UserRemove01Icon,
    suspended: BanIcon,
    pending: ClockIcon,
  };
  return icons[status] || AlertCircleIcon;
};

export const formatDate = (date: Date | string) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date: Date | string) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const isScheduledForDeletion = (profile: Profile) => !!profile.metadata?.deletionScheduled;

export type UserTab = 'active' | 'suspended' | 'deactivated' | 'scheduled';

export interface DropdownItem {
  label: string;
  icon: any;
  onClick: () => void;
  danger?: boolean;
}