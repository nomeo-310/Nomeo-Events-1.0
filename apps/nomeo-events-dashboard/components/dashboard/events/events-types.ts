// events-types.ts
import { format } from "date-fns";
import {
  CheckmarkCircle02Icon as CheckCircleIcon,
  ClockIcon,
  CancelCircleIcon as XCircleIcon,
  UnavailableIcon as BanIcon,
} from "@hugeicons/core-free-icons";

export type HugeIcon = typeof CheckCircleIcon;
export type ViewTab = "upcoming" | "ongoing" | "completed";
export type ConfirmAction =
  | "cancel"
  | "archive"
  | "soft-delete"
  | "confirm-all"
  | "cancel-all"
  | "issue-certs"
  | null;

export interface DropdownItem {
  label: string;
  icon: HugeIcon;
  onClick: () => void;
  danger?: boolean;
}

export function formatMoney(amount: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date?: string | Date) {
  if (!date) return "N/A";
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date?: string | Date) {
  if (!date) return "N/A";
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

export function getInitials(name?: string, fallback = "E") {
  const trimmed = name?.trim();
  if (!trimmed) return fallback;
  return (
    trimmed
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || fallback
  );
}

export function getGroupingLabel(startDate: string, endDate: string) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "completed";
}

export const statusTone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  published: "default",
  draft: "secondary",
  cancelled: "destructive",
  archived: "outline",
};

export const statusIcon: Record<string, HugeIcon> = {
  published: CheckCircleIcon,
  draft: ClockIcon,
  cancelled: XCircleIcon,
  archived: BanIcon,
};

export const groupingTone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  upcoming: "default",
  ongoing: "secondary",
  completed: "outline",
};

export const modeTone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  physical: "default",
  virtual: "secondary",
  hybrid: "outline",
};

export const categoryColors: Record<string, string> = {
  webinar: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  seminar: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  entertainment: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  film_show: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  science_tech: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  school_activities: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  spirituality: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  fashion: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  business: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  sports: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  health_wellness: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  art_culture: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  food_drink: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  networking: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  charity: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export const confirmConfig: Record<NonNullable<ConfirmAction>, { title: string; description: string; label: string; variant: "primary" | "danger" }> = {
  cancel:         { title: "Cancel Event",               description: "This will cancel the event and all active registrations. This cannot be easily undone.",                             label: "Cancel Event & Registrations", variant: "danger"  },
  archive:        { title: "Archive Event",              description: "The event will be archived and hidden from public listings. You can restore it later.",                              label: "Archive Event",                variant: "danger"  },
  "soft-delete":  { title: "Delete Event",               description: "The event will be soft-deleted and removed from all listings.",                                                      label: "Delete Event",                 variant: "danger"  },
  "confirm-all":  { title: "Confirm All Registrations",  description: "All pending registrations will be moved to confirmed status.",                                                       label: "Confirm All",                  variant: "primary" },
  "cancel-all":   { title: "Cancel All Registrations",   description: "All active registrations will be cancelled, seats restored, and payments reversed where applicable.",               label: "Cancel All Registrations",     variant: "danger"  },
  "issue-certs":  { title: "Issue All Certificates",     description: "Certificates will be marked as issued for all attended registrations.",                                             label: "Issue Certificates",           variant: "primary" },
};