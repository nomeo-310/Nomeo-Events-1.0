export interface TopicItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  articleCount: number;
  color: string;
}

export interface GuideItem {
  id: string;
  type: 'guide';
  title: string;
  description: string;
  icon: any;
  readTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  popularity: number;
}

export interface VideoTutorial {
  id: string;
  type: 'video';
  title: string;
  description: string;
  icon: any;
  duration: string;
  views: number;
  videoUrl: string;
  thumbnail: string;
}

export type GuideOrVideo = GuideItem | VideoTutorial;

export interface CommunityPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    badge?: string;
  };
  title: string;
  content: string;
  tags: string[];
  likes: number;
  replies: number;
  timestamp: string;
  isPinned?: boolean;
  isSolved?: boolean;
}

export interface ExpertTip {
  id: string;
  author: string;
  role: string;
  tip: string;
  likes: number;
  category: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  icon: any;
  category: 'getting-started' | 'events' | 'ticketing' | 'payments' | 'attendees' | 'analytics' | 'support' | 'technical';
}

export interface ApiEndpoint {
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  category: string;
}

export interface TicketCategory {
  id: string;
  title: string;
  description: string;
  icon: any;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  responseTime: string;
}

export interface CommunityGroup {
  name: string;
  platform: string;
  icon: any;
  link: string;
  members: string;
  color: string;
}