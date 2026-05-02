import { RocketIcon, Calendar03Icon, TicketIcon, WalletIcon, UserMultiple02Icon,ChartIcon, SettingsIcon, Message01Icon, CodeIcon, StarIcon, IdeaIcon as LightbulbIcon, BookOpenIcon,
  SmartPhone02Icon as Smartphone01Icon, Mail01Icon, Video01Icon as VideoIcon, WhatsappIcon, TelegramIcon , HeadphonesIcon, Clock01Icon as ClockIcon, CheckmarkCircle02Icon, SecurityCheckIcon} from '@hugeicons/core-free-icons';

import type { TopicItem, GuideItem, VideoTutorial, CommunityPost, ExpertTip, FaqItem, ApiEndpoint, TicketCategory } from '@/types/help-center-type';


export const popularTopics: TopicItem[] = [
  { id: 'getting-started', title: 'Getting Started', description: 'Learn the basics and set up your first event', icon: RocketIcon, articleCount: 24, color: 'indigo' },
  { id: 'event-creation', title: 'Event Creation', description: 'Create stunning event pages in minutes', icon: Calendar03Icon, articleCount: 18, color: 'emerald' },
  { id: 'ticketing', title: 'Ticketing & Registration', description: 'Manage tickets, discounts, and check-ins', icon: TicketIcon, articleCount: 32, color: 'blue' },
  { id: 'payments', title: 'Payments & Payouts', description: 'Payment processing and settlement guides', icon: WalletIcon, articleCount: 15, color: 'purple' },
  { id: 'attendees', title: 'Attendee Management', description: 'Communicate and engage with attendees', icon: UserMultiple02Icon, articleCount: 22, color: 'amber' },
  { id: 'analytics', title: 'Analytics & Reports', description: 'Track performance and gain insights', icon: ChartIcon, color: 'rose', articleCount: 12 },
];

// Combined guides with video flag
export const guidesAndVideos: (GuideItem | VideoTutorial)[] = [
  // Written Guides
  { id: '1', type: 'guide', title: 'How to Create Your First Event', description: 'Step-by-step guide to launching your first event on Nomeo', icon: RocketIcon, readTime: '5 min', difficulty: 'Beginner', category: 'getting-started', popularity: 98 },
  { id: '2', type: 'guide', title: 'Setting Up Ticket Types & Pricing', description: 'Master ticket configurations, early bird discounts, and group pricing', icon: TicketIcon, readTime: '8 min', difficulty: 'Beginner', category: 'ticketing', popularity: 95 },
  { id: '3', type: 'guide', title: 'Payment Gateway Integration Guide', description: 'Connect Paystack, Flutterwave, and Stripe to your events', icon: WalletIcon, readTime: '10 min', difficulty: 'Intermediate', category: 'payments', popularity: 92 },
  { id: '4', type: 'guide', title: 'QR Code Check-in System Setup', description: 'Implement seamless attendee check-in with QR codes', icon: Smartphone01Icon, readTime: '6 min', difficulty: 'Beginner', category: 'technical', popularity: 96 },
  { id: '5', type: 'guide', title: 'Email Marketing Best Practices', description: 'Drive ticket sales with effective email campaigns', icon: Mail01Icon, readTime: '12 min', difficulty: 'Intermediate', category: 'marketing', popularity: 89 },
  { id: '6', type: 'guide', title: 'API Integration for Developers', description: 'Connect your apps with Nomeo\'s REST API', icon: CodeIcon, readTime: '15 min', difficulty: 'Advanced', category: 'technical', popularity: 85 },
  // Video Tutorials
  { id: '7', type: 'video', title: 'Quick Start: Set Up Your First Event in 10 Minutes', description: 'Watch and learn how to create your first event', icon: VideoIcon, duration: '10:23', views: 15234, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail: '/videos/thumb-1.jpg' },
  { id: '8', type: 'video', title: 'Mastering Ticket Types and Discounts', description: 'Learn advanced ticketing strategies', icon: VideoIcon, duration: '15:47', views: 8921, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail: '/videos/thumb-2.jpg' },
  { id: '9', type: 'video', title: 'How to Use the QR Check-in App', description: 'Mobile check-in made simple', icon: VideoIcon, duration: '8:15', views: 12456, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail: '/videos/thumb-3.jpg' },
  { id: '10', type: 'video', title: 'Analytics Dashboard Deep Dive', description: 'Understand your event data', icon: VideoIcon, duration: '12:30', views: 6789, videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnail: '/videos/thumb-4.jpg' },
];

export const communityPosts: CommunityPost[] = [
  {
    id: '1',
    author: { name: 'Sarah Chen', avatar: '/avatars/sarah.jpg', role: 'Event Organizer', badge: 'Top Contributor' },
    title: 'Best practices for virtual conference engagement?',
    content: 'I\'m organizing my first virtual conference and want to keep attendees engaged. Any tips on using polls, Q&A sessions, or breakout rooms effectively?',
    tags: ['virtual-events', 'engagement', 'tips'],
    likes: 45,
    replies: 23,
    timestamp: '2 hours ago',
    isPinned: true
  },
  {
    id: '2',
    author: { name: 'Michael Okonkwo', avatar: '/avatars/michael.jpg', role: 'Tech Conference Organizer' },
    title: 'Success story: How we sold 2000 tickets in 3 days',
    content: 'Just wanted to share our experience using the early bird discounts and referral system. We managed to sell out our tech conference faster than ever before!',
    tags: ['success-story', 'ticketing', 'marketing'],
    likes: 128,
    replies: 34,
    timestamp: '5 hours ago'
  },
  {
    id: '3',
    author: { name: 'Emma Rodriguez', avatar: '/avatars/emma.jpg', role: 'Community Manager', badge: 'Expert' },
    title: 'Solved: Issue with group registration emails',
    content: 'For anyone facing issues with group registration confirmation emails, here\'s the fix I found...',
    tags: ['troubleshooting', 'email', 'solution'],
    likes: 67,
    replies: 12,
    timestamp: '1 day ago',
    isSolved: true
  },
  {
    id: '4',
    author: { name: 'James Wilson', avatar: '/avatars/james.jpg', role: 'Event Planner' },
    title: 'Looking for feedback on hybrid event setup',
    content: 'Planning a hybrid event with 500 in-person and 1000 virtual attendees. Any recommendations on AV setup and streaming platforms that work well with Nomeo?',
    tags: ['hybrid-events', 'technical', 'advice'],
    likes: 34,
    replies: 18,
    timestamp: '2 days ago'
  }
];

export const expertTips: ExpertTip[] = [
  { id: '1', author: 'Dr. Amina Olu', role: 'Event Marketing Specialist', tip: 'Start your email campaign 6-8 weeks before your event for best results. Segment your audience based on past attendance.', likes: 234, category: 'marketing' },
  { id: '2', author: 'David Park', role: 'Ticketing Strategist', tip: 'Use early bird pricing with limited quantities to create urgency. We see 40% more sales in the first week using this strategy.', likes: 189, category: 'ticketing' },
  { id: '3', author: 'Lisa Thompson', role: 'Customer Success Lead', tip: 'Set up automated reminder emails 24 hours before your event to reduce no-shows by up to 30%.', likes: 267, category: 'attendees' },
  { id: '4', author: 'Richard Mensah', role: 'Technical Director', tip: 'Always test your QR check-in system with a few test tickets before event day to ensure smooth scanning.', likes: 156, category: 'technical' },
  { id: '5', author: 'Chioma Nwachukwu', role: 'Event ROI Expert', tip: 'Track your ticket sales sources using UTM parameters to know which marketing channels perform best.', likes: 178, category: 'analytics' },
  { id: '6', author: 'Tunde Bakare', role: 'Community Builder', tip: 'Create a WhatsApp group for your event attendees a week before - it builds excitement and reduces last-minute questions.', likes: 245, category: 'community' },
];

// FAQ in grid form like About page
export const faqs: FaqItem[] = [
  // Getting Started
  { question: 'How do I create my first event?', answer: 'Getting started is easy! Simply sign up for an account, click "Create Event", fill in your event details, set up ticket types, and publish. Our guided setup will walk you through each step. You can have your event live in under 10 minutes!', icon: RocketIcon, category: 'getting-started' },
  { question: 'Do I need technical skills to use Nomeo Events?', answer: 'Not at all! Nomeo Events is designed for everyone. Our drag-and-drop interface requires zero coding knowledge. We\'ve built the platform to be intuitive and user-friendly.', icon: UserMultiple02Icon, category: 'getting-started' },
  { question: 'Can I host free events on the platform?', answer: 'Absolutely! Free events are completely free to host on our platform. You only pay transaction fees when selling paid tickets.', icon: TicketIcon, category: 'getting-started' },
  // Events & Ticketing
  { question: 'How does attendee check-in work?', answer: 'Our QR code-based check-in system makes entry seamless. Attendees receive unique QR codes via email, and you can scan them using our mobile app or web dashboard.', icon: Smartphone01Icon, category: 'ticketing' },
  { question: 'Can I sell merchandise alongside tickets?', answer: 'Yes! Our platform supports add-ons and merchandise sales. You can sell event merchandise, food vouchers, workshop materials, or any other products.', icon: TicketIcon, category: 'ticketing' },
  { question: 'Can I host hybrid events?', answer: 'Absolutely! Nomeo Events fully supports hybrid events. You can sell separate tickets for in-person attendance and virtual access.', icon: VideoIcon, category: 'events' },
  // Payments
  { question: 'What payment methods do you support?', answer: 'We support multiple payment gateways including Paystack, Flutterwave, and Stripe. This allows your attendees to pay via credit/debit cards, bank transfers, USSD, and mobile money.', icon: WalletIcon, category: 'payments' },
  { question: 'When do I get paid for ticket sales?', answer: 'Payouts are processed automatically to your registered bank account within 3-5 business days after the event ends.', icon: ClockIcon, category: 'payments' },
  { question: 'Can I offer refunds to attendees?', answer: 'Yes! You can set your own refund policy. Our system allows you to process full or partial refunds directly from the dashboard.', icon: CheckmarkCircle02Icon, category: 'payments' },
  // Support
  { question: 'Is there customer support available?', answer: 'Yes! We offer 24/7 customer support via email, live chat, and phone. Premium plans include dedicated account managers.', icon: HeadphonesIcon, category: 'support' },
  { question: 'Is my data secure?', answer: 'Security is our top priority. We use bank-grade 256-bit SSL encryption and comply with GDPR and local data protection laws.', icon: SecurityCheckIcon, category: 'support' },
  { question: 'Do you have an API for developers?', answer: 'Yes! We offer a comprehensive REST API that allows developers to create custom integrations and automate event creation.', icon: CodeIcon, category: 'technical' },
];

export const apiEndpoints: ApiEndpoint[] = [
  { name: 'Create Event', description: 'Create a new event programmatically', method: 'POST', endpoint: '/api/v1/events', category: 'events' },
  { name: 'List Tickets', description: 'Retrieve all tickets for an event', method: 'GET', endpoint: '/api/v1/events/{id}/tickets', category: 'ticketing' },
  { name: 'Process Refund', description: 'Issue a refund for a ticket', method: 'POST', endpoint: '/api/v1/orders/{id}/refund', category: 'payments' },
  { name: 'Get Analytics', description: 'Fetch event performance metrics', method: 'GET', endpoint: '/api/v1/events/{id}/analytics', category: 'analytics' },
];

export const ticketCategories: TicketCategory[] = [
  { id: 'technical', title: 'Technical Support', description: 'Platform issues, bugs, and technical questions', icon: SettingsIcon, priority: 'High', responseTime: '< 2 hours' },
  { id: 'billing', title: 'Billing & Payments', description: 'Payment issues, refunds, and invoice questions', icon: WalletIcon, priority: 'High', responseTime: '< 4 hours' },
  { id: 'account', title: 'Account Management', description: 'Profile updates, team access, and settings', icon: UserMultiple02Icon, priority: 'Medium', responseTime: '< 8 hours' },
  { id: 'feature', title: 'Feature Request', description: 'Suggest new features or improvements', icon: LightbulbIcon, priority: 'Low', responseTime: '< 24 hours' },
];

// WhatsApp and Telegram groups
export const communityGroups = [
  { name: 'Nomeo Events Community', platform: 'WhatsApp', icon: WhatsappIcon, link: 'https://chat.whatsapp.com/example', members: '2.5k+', color: 'bg-green-500' },
  { name: 'Nomeo Events Channel', platform: 'Telegram', icon: TelegramIcon, link: 'https://t.me/nomeoevents', members: '1.2k+', color: 'bg-blue-500' },
];