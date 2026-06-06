// admin-types.ts
import { format } from "date-fns";
import { 
  UnavailableIcon as BanIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  ClockIcon, 
  AlertCircleIcon 
} from "@hugeicons/core-free-icons";

export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const getRoleColor = (role: string) => {
  const colors: Record<string, string> = {
    super_admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    moderator: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    support: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };
  return colors[role] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
};

export const getStatusBadge = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    suspended: "destructive",
    inactive: "secondary",
  };
  return variants[status] || "secondary";
};

export const getStatusIcon = (status: string) => {
  const icons: Record<string, any> = {
    active: CheckCircleIcon,
    suspended: BanIcon,
    inactive: ClockIcon,
  };
  return icons[status] || AlertCircleIcon;
};

export const formatDate = (date: Date | string) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy');
};

export const formatDateTime = (date: Date | string) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy, HH:mm');
};