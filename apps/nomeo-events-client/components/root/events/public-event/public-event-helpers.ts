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

// Check if event starts within 24 hours (less than or equal to 24 hours from now)
export const isEventWithin24Hours = (startDate: string | Date): boolean => {
  const now = new Date();
  const eventStart = new Date(startDate);
  const hoursUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilEvent <= 24;
};

// Check if event starts more than 24 hours from now
export const isEventMoreThan24HoursAway = (startDate: string | Date): boolean => {
  const now = new Date();
  const eventStart = new Date(startDate);
  const hoursUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilEvent > 24;
};

// Get hours until event starts
export const getHoursUntilEvent = (startDate: string | Date): number => {
  const now = new Date();
  const eventStart = new Date(startDate);
  const hoursUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
  return Math.max(0, hoursUntilEvent);
};

// Check if cancellation is allowed (event more than 24 hours away)
export const isCancellationAllowed = (startDate: string | Date, cutoffHours: number = 24): boolean => {
  const now = new Date();
  const eventStart = new Date(startDate);
  const hoursUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilEvent > cutoffHours;
};