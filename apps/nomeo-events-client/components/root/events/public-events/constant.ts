import { EventCategory } from '@/types/create-event-type';

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  [EventCategory.WEBINAR]:           'Webinar',
  [EventCategory.SEMINAR]:           'Seminar',
  [EventCategory.ENTERTAINMENT]:     'Entertainment',
  [EventCategory.FILM_SHOW]:         'Film & Show',
  [EventCategory.SCIENCE_TECH]:      'Science & Tech',
  [EventCategory.SCHOOL_ACTIVITIES]: 'School Activities',
  [EventCategory.SPIRITUALITY]:      'Spirituality',
  [EventCategory.FASHION]:           'Fashion',
  [EventCategory.BUSINESS]:          'Business',
  [EventCategory.SPORTS]:            'Sports',
  [EventCategory.HEALTH_WELLNESS]:   'Health & Wellness',
  [EventCategory.ART_CULTURE]:       'Art & Culture',
  [EventCategory.FOOD_DRINK]:        'Food & Drink',
  [EventCategory.NETWORKING]:        'Networking',
  [EventCategory.CHARITY]:           'Charity',
};

export const ALL_CATEGORIES = Object.values(EventCategory);

export const EVENTS_PAGE_SIZE = 12;

export const formatTypeLabel = (t: string) =>
  t.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

export type EventStatus = 'upcoming' | 'ongoing' | 'completed';
export type ViewMode    = 'grid' | 'list';