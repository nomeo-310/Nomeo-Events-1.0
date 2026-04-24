import { format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SectionProps {
  icon: any;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export interface InfoRowProps {
  label: string;
  value?: React.ReactNode;
}

export interface SettingRowProps {
  label: string;
  value: string;
  active: boolean;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try { return format(new Date(dateStr), "EEEE, MMMM d, yyyy"); }
  catch { return dateStr; }
}

export function formatTime(dateStr?: string): string {
  if (!dateStr) return "—";
  try { return format(new Date(dateStr), "h:mm a"); }
  catch { return dateStr; }
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "—";
  try { return format(new Date(dateStr), "MMM d, yyyy · h:mm a"); }
  catch { return dateStr; }
}

// ─── Misc helpers ─────────────────────────────────────────────────────────────

export function getStatusConfig(ev: any) {
  if (ev.isDeleted)  return { label: "Deleted",  bg: "bg-red-100 dark:bg-red-900/30",   text: "text-red-700 dark:text-red-400"   };
  if (ev.isArchived) return { label: "Archived", bg: "bg-gray-100 dark:bg-gray-800",    text: "text-gray-600 dark:text-gray-400" };
  const map: Record<string, { label: string; bg: string; text: string }> = {
    published: { label: "Published", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
    draft:     { label: "Draft",     bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
    cancelled: { label: "Cancelled", bg: "bg-red-100 dark:bg-red-900/30",     text: "text-red-700 dark:text-red-400"    },
  };
  return map[ev.status] ?? map.draft;
}

export function getLowestPrice(plans: any[]): string {
  if (!plans?.length) return "Free";
  const prices = plans.map((p) => p.price).filter((p) => typeof p === "number" && p >= 0);
  if (!prices.length) return "Free";
  const min = Math.min(...prices);
  if (min === 0) return "Free";
  return `${plans[0]?.currency ?? "USD"} ${min.toLocaleString()}`;
}

export function toTitleCase(str: string): string {
  return str.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}