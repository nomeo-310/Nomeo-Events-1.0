

export interface StatItem {
  value: string;
  label: string;
  icon: any;
  description: string;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon: any;
  color: 'indigo' | 'emerald' | 'blue' | 'purple' | 'amber' | 'rose' | 'teal' | 'cyan' | 'orange';
}

export interface ValueItem {
  title: string;
  description: string;
  icon: any;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image?: string;
  social?: { platform: string; url: string }[];
}

export interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
  rating: number;
  eventType: string;
}

export interface MilestoneItem {
  year: string;
  title: string;
  description: string;
  icon: any;
}

export interface IntegrationItem {
  name: string;
  icon: any;
  description: string;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
  icon: any;
  details: string[];
}

export interface RevenueStream {
  title: string;
  description: string;
  icon: any;
}

export interface ServiceDeliveryPoint {
  title: string;
  description: string;
  icon: any;
}

export interface FaqItem {
  question: string;
  answer: string;
  icon: any;
  category: 'getting-started' | 'payments' | 'technical' | 'events' | 'support' | 'pricing';
}

export interface FaqCategory {
  name: string;
  key: string;
  icon: any;
}

export interface InquiryType {
  value: string;
  label: string;
}