import { format } from "date-fns";
import type { Event } from "@/hooks/use-events";

export const categoryLabels: Record<string, string> = {
  WEBINAR: 'Webinar',
  SEMINAR: 'Seminar',
  ENTERTAINMENT: 'Entertainment',
  FILM_SHOW: 'Film Show',
  SCIENCE_TECH: 'Science & Tech',
  SCHOOL_ACTIVITIES: 'School Activities',
  SPIRITUALITY: 'Spirituality',
  FASHION: 'Fashion',
  BUSINESS: 'Business',
  SPORTS: 'Sports',
  HEALTH_WELLNESS: 'Health & Wellness',
  ART_CULTURE: 'Art & Culture',
  FOOD_DRINK: 'Food & Drink',
  NETWORKING: 'Networking',
  CHARITY: 'Charity',
};

export function formatCardDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try { return format(new Date(dateStr), "MMM d, yyyy"); }
  catch { return dateStr; }
}

export function formatCardTime(dateStr?: string): string {
  if (!dateStr) return "—";
  try { return format(new Date(dateStr), "h:mm a"); }
  catch { return dateStr; }
}

export function getCardPrice(plans: Event["plans"]): string {
  if (!plans?.length) return "Free";
  const prices = plans.map((p) => p.price).filter((p) => p >= 0);
  const min = Math.min(...prices);
  if (min === 0) return "Free";
  return `${plans[0]?.currency ?? "USD"} ${min.toLocaleString()}`;
}

export function getCardLocation(event: Event): { isVirtual: boolean; label: string } {
  const venue    = event.location?.venue;
  const city     = event.location?.city;
  const country  = event.location?.country;
  if (!venue) return { isVirtual: true,  label: "Online Event" };
  return           { isVirtual: false, label: [city, country].filter(Boolean).join(", ") || venue };
}