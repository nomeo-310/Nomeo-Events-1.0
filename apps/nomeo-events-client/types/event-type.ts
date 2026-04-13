import { HugeiconsIconProps } from "@hugeicons/react";

export interface EventType {
  name: string;
  icon: any;
  color: string;
}

export interface Feature {
  title: string;
  description: string;
  icon: any;
}

export interface Stat {
  number: string;
  label: string;
}

export interface BaseEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  price: string;
  category: string;
  categoryIcon: any;
  icon: any;
  gradient: string;
  slug: string;
  featured?: boolean;
  speaker?: string;
  attendees?: number;
  capacity?: number;
}

export interface WebinarEvent extends BaseEvent {
  platform: string;
}

export interface InPersonEvent extends BaseEvent {
  location: string;
  venue?: string;
}

export type UpcomingEvent = WebinarEvent | InPersonEvent;

export type ActiveTab = 'webinars' | 'seminars' | 'entertainment';

export interface EventCardProps {
  event: UpcomingEvent;
  activeTab: ActiveTab;
  router: any;
}

export interface EventAccordionProps extends EventCardProps {
  isOpen: boolean;
  onToggle: () => void;
}

export interface EventsHeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  onTabChange?: () => void;
}

export interface HeroProps {
  onGetStarted: () => void;
  onSeeHowItWorks: () => void;
}

export interface CTAProps {
  onGetStarted: () => void;
}