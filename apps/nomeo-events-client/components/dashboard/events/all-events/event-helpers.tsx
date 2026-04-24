import { format } from "date-fns";
import { Event } from "@/hooks/use-events";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StatusTab = "all" | "published" | "draft" | "archived" | "deleted";
export type ViewMode  = "grid" | "list";

export const STATUS_TABS: Array<{ id: StatusTab; label: string }> = [
  { id: "all",       label: "All Events" },
  { id: "published", label: "Published"  },
  { id: "draft",     label: "Drafts"     },
  { id: "archived",  label: "Archived"   },
  { id: "deleted",   label: "Trash"      },
];

export const ITEMS_PER_PAGE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getGroupingLabel(grouping?: string) {
  if (grouping === "ongoing")   return { label: "Ongoing",   color: "text-green-600 dark:text-green-400"   };
  if (grouping === "completed") return { label: "Completed", color: "text-gray-500 dark:text-gray-400"     };
  return                               { label: "Upcoming",  color: "text-indigo-600 dark:text-indigo-400" };
}

export function formatEventDate(dateStr: string) {
  try { return format(new Date(dateStr), "MMM d, yyyy"); }
  catch { return dateStr; }
}

export function formatEventTime(dateStr: string) {
  try { return format(new Date(dateStr), "h:mm a"); }
  catch { return ""; }
}

export function getLowestPrice(plans: Event["plans"]) {
  if (!plans?.length) return "Free";
  const prices = plans.map((p) => p.price).filter((p) => p >= 0);
  const min = Math.min(...prices);
  if (min === 0) return "Free";
  const currency = plans[0]?.currency || "USD";
  return `${currency} ${min.toLocaleString()}`;
}