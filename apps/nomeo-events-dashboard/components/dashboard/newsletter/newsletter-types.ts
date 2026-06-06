// newsletter-types.ts
import { format } from "date-fns";

export type HugeIcon = typeof ViewIcon;
import { ViewIcon } from "@hugeicons/core-free-icons";

export interface DropdownItem {
  label: string;
  icon: HugeIcon;
  onClick: () => void;
  danger?: boolean;
}

export interface BulkEmailRecipient {
  email: string;
  name?: string;
}

export type MainTab = "subscribers" | "bulk-email" | "campaigns" | "analytics";
export type SubscriberTab = "active" | "unsubscribed";

export function formatDate(date?: string | Date) {
  if (!date) return "N/A";
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date?: string | Date) {
  if (!date) return "N/A";
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

export function getInitials(name?: string, fallback = "S") {
  if (!name) return fallback;
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

export const statusTone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  unsubscribed: "secondary",
  bounced: "destructive",
  complained: "outline",
};

export const campaignStatusTone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  scheduled: "outline",
  sending: "default",
  completed: "default",
  failed: "destructive",
  cancelled: "secondary",
};