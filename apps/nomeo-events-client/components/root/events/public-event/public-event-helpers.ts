import { format } from "date-fns";

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