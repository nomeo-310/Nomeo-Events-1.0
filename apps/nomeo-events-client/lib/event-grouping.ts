// lib/event-grouping.ts

export type EventGrouping = 'upcoming' | 'ongoing' | 'completed';

interface EventWithDates {
  startDate: Date | string;
  endDate: Date | string;
  [key: string]: any;
}

/**
 * Get grouping for a single event
 */
export function getEventGrouping(event: EventWithDates): EventGrouping {
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  if (now < startDate) return 'upcoming';
  if (now >= startDate && now <= endDate) return 'ongoing';
  return 'completed';
}

/**
 * Add grouping to a single event
 */
export function withGrouping<T extends EventWithDates>(event: T): T & { grouping: EventGrouping } {
  return {
    ...event,
    grouping: getEventGrouping(event)
  };
}

/**
 * Add grouping to multiple events
 */
export function withGroupingBatch<T extends EventWithDates>(events: T[]): (T & { grouping: EventGrouping })[] {
  return events.map(event => withGrouping(event));
}