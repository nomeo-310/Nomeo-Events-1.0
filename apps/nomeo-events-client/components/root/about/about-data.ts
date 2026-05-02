import {
  RocketIcon, MedalIcon, Calendar03Icon, Building04Icon, SparklesIcon,
  CheckmarkCircle02Icon, Mail01Icon, Message01Icon, Location01Icon,
  GlobeIcon, SecurityCheckIcon, FavouriteIcon, StarIcon, ArrowRightIcon,
  PlayIcon, UserMultiple02Icon, MoneyBag01Icon, Clock01Icon, TicketIcon,
  CheckmarkBadge02Icon, HeadphonesIcon, TelephoneIcon as PhoneIcon,
  HelpCircleIcon as HelpIcon, UserIcon, UserGroup03Icon as UsersIcon,
  ChartIcon, WalletIcon, SmartPhone01Icon as MobileIcon,
  SecurityCheckIcon as ShieldCheckIcon, CustomerService02Icon as SupportIcon,
  ChatIcon, SettingsIcon, File01Icon, PuzzleIcon, FlashIcon,
  ChampionIcon as TrophyIcon, ConnectIcon, VideoIcon, CrownIcon
} from '@hugeicons/core-free-icons';

import type { 
  StatItem, FeatureItem, ValueItem, TeamMember, TestimonialItem,
  MilestoneItem, IntegrationItem, HowItWorksStep, RevenueStream,
  ServiceDeliveryPoint, FaqItem, FaqCategory, InquiryType
} from '@/types/about-type';

export const stats: StatItem[] = [
  { value: '300+', label: 'Events Hosted', icon: Calendar03Icon, description: 'Successfully organized events across various categories' },
  { value: '1000+', label: 'Happy Attendees', icon: UserMultiple02Icon, description: 'Satisfied participants who loved their experience' },
  { value: '50+', label: 'Corporate Partners', icon: Building04Icon, description: 'Trusted by leading organizations worldwide' },
  { value: '98%', label: 'Satisfaction Rate', icon: MedalIcon, description: 'Based on post-event surveys and feedback' },
];

export const features: FeatureItem[] = [
  { title: 'Effortless Event Creation', description: 'Create and publish events in minutes with our intuitive dashboard. No technical skills required.', icon: RocketIcon, color: 'indigo' },
  { title: 'Smart Registration System', description: 'Powerful registration management with group booking, corporate packages, and automated confirmations.', icon: UserMultiple02Icon, color: 'emerald' },
  { title: 'Secure Payment Processing', description: 'Multiple payment gateways including Paystack, with automatic invoice generation and receipts.', icon: MoneyBag01Icon, color: 'blue' },
  { title: 'Real-time Analytics', description: 'Track ticket sales, attendance, and revenue with comprehensive dashboards and reports.', icon: ChartIcon, color: 'purple' },
  { title: 'Digital Ticketing', description: 'QR code-based check-in system with automated ticket delivery and event reminders.', icon: TicketIcon, color: 'amber' },
  { title: '24/7 Support', description: 'Dedicated support team available round-the-clock to help with any issues or questions.', icon: HeadphonesIcon, color: 'rose' },
  { title: 'Mobile-Friendly Experience', description: 'Fully responsive design that works perfectly on all devices, from desktop to smartphone.', icon: MobileIcon, color: 'teal' },
  { title: 'Advanced Security', description: 'Bank-grade encryption and security protocols to protect your data and transactions.', icon: ShieldCheckIcon, color: 'cyan' },
  { title: 'Custom Branding', description: 'Personalize your event pages with your own branding, colors, and domain.', icon: SettingsIcon, color: 'orange' },
];

export const values: ValueItem[] = [
  { title: 'Innovation First', description: 'We continuously evolve our platform with cutting-edge features to make event management seamless.', icon: SparklesIcon },
  { title: 'Customer Success', description: 'Your success is our success. We go above and beyond to ensure your events are unforgettable.', icon: FavouriteIcon },
  { title: 'Transparency', description: 'Clear pricing, honest communication, and no hidden fees. What you see is what you get.', icon: CheckmarkBadge02Icon },
  { title: 'Security & Trust', description: 'Bank-grade security for all transactions and data protection with regular audits.', icon: SecurityCheckIcon },
  { title: 'Community Focus', description: 'Building a strong community of event organizers who share knowledge and best practices.', icon: UsersIcon },
  { title: 'Continuous Improvement', description: 'Regular updates and new features based on user feedback and industry trends.', icon: FlashIcon },
];

export const team: TeamMember[] = [
  { name: 'Salomi Onome', role: 'Founder & CEO', bio: 'Former event planner with 10+ years of experience, building tools that event organizers actually need.' },
  { name: 'Sarah Johnson', role: 'Head of Product', bio: 'Product leader passionate about creating intuitive experiences that delight users.' },
  { name: 'David Chen', role: 'CTO', bio: 'Tech veteran focused on building scalable, secure, and reliable event infrastructure.' },
  { name: 'Amara Okonkwo', role: 'Customer Success', bio: 'Dedicated to ensuring every event organizer gets the support they need to succeed.' },
];

export const testimonials: TestimonialItem[] = [
  { quote: "Nomeo Events transformed how we manage our conferences. The check-in system alone saved us hours of manual work!", author: "Ada Eze", role: "Conference Organizer", rating: 5, eventType: "Corporate Conference" },
  { quote: "The group registration feature is a game-changer for our corporate training sessions. So easy to use!", author: "Chidi Okafor", role: "HR Manager", rating: 5, eventType: "Training Workshop" },
  { quote: "Excellent customer support and a platform that actually works. Highly recommended for any event organizer.", author: "Folake Adeleke", role: "Event Planner", rating: 5, eventType: "Weddings & Parties" },
  { quote: "The analytics dashboard gives us real insights into our event performance. Absolutely invaluable!", author: "Tunde Bakare", role: "Marketing Director", rating: 5, eventType: "Product Launch" },
  { quote: "Best decision we made was switching to Nomeo Events. The payment integration is seamless.", author: "Ngozi Eze", role: "Finance Manager", rating: 5, eventType: "Fundraising Gala" },
  { quote: "Our ticket sales increased by 40% after using their marketing tools. Incredible platform!", author: "Kunle Adeyemi", role: "Event Coordinator", rating: 5, eventType: "Music Festival" },
];

export const milestones: MilestoneItem[] = [
  { year: '2020', title: 'Company Founded', description: 'Nomeo Events launched with a vision to transform event management in Africa.', icon: RocketIcon },
  { year: '2021', title: 'First 100 Events', description: 'Reached milestone of hosting 100 successful events across Nigeria.', icon: TrophyIcon },
  { year: '2022', title: 'Paystack Integration', description: 'Integrated leading payment gateway for seamless transactions.', icon: WalletIcon },
  { year: '2023', title: '10,000+ Attendees', description: 'Surpassed 10,000 happy attendees across various events.', icon: UsersIcon },
  { year: '2024', title: 'Global Expansion', description: 'Expanded services to support international events and currencies.', icon: GlobeIcon },
];

export const integrations: IntegrationItem[] = [
  { name: 'Paystack', icon: WalletIcon, description: 'Secure payment processing for African merchants' },
  { name: 'Flutterwave', icon: MoneyBag01Icon, description: 'Multi-currency payment gateway' },
  { name: 'Google Calendar', icon: Calendar03Icon, description: 'Auto-sync events to attendees calendars' },
  { name: 'Mailchimp', icon: Mail01Icon, description: 'Email marketing automation' },
  { name: 'Slack', icon: ChatIcon, description: 'Team collaboration and notifications' },
  { name: 'Zoom', icon: VideoIcon, description: 'Virtual event integration' },
];

export const howItWorksSteps: HowItWorksStep[] = [
  { step: 1, title: "Create Your Account", description: "Sign up in minutes and set up your organizer profile", icon: UserIcon, details: ["Free account registration with no upfront fees", "Complete your organizer profile with branding", "Access your personalized event dashboard", "Invite team members and set permissions"] },
  { step: 2, title: "Build Your Event", description: "Create stunning event pages with our no-code builder", icon: SettingsIcon, details: ["Drag-and-drop event page builder", "Customize with your branding and colors", "Set up ticket types, pricing, and discounts", "Add speakers, agenda, and venue details"] },
  { step: 3, title: "Launch & Promote", description: "Publish your event and start selling tickets", icon: RocketIcon, details: ["Go live with one click", "Built-in email marketing tools", "Social media promotion and sharing", "Custom discount codes and affiliate tracking"] },
  { step: 4, title: "Manage & Execute", description: "Run your event smoothly with real-time tools", icon: CheckmarkCircle02Icon, details: ["QR code check-in system", "Real-time attendance tracking", "Attendee communication tools", "On-site support and assistance"] },
  { step: 5, title: "Analyze & Grow", description: "Get insights to improve your next event", icon: ChartIcon, details: ["Comprehensive sales and attendance reports", "Attendee demographics and feedback", "Revenue analytics and ROI tracking", "Export data for further analysis"] },
];

export const revenueStreams: RevenueStream[] = [
  { title: "Subscription Plans", description: "Monthly and annual subscriptions provide sustainable revenue that funds continuous platform development, security updates, and 24/7 customer support.", icon: CrownIcon },
  { title: "Transaction Fees", description: "For paid events on certain plans, a small transparent fee applies per ticket sold — only when you succeed.", icon: MoneyBag01Icon },
  { title: "Enterprise Solutions", description: "Custom solutions for large organizations with dedicated infrastructure, SLAs, and premium features at tailored pricing.", icon: Building04Icon },
  { title: "Value-Added Services", description: "Optional services like advanced marketing campaigns, custom development, and priority support for organizers needing extra assistance.", icon: SparklesIcon },
];

export const serviceDeliveryPoints: ServiceDeliveryPoint[] = [
  { title: "Platform Access", description: "You get full access to our event management dashboard, ticketing system, and analytics tools as soon as you sign up.", icon: SettingsIcon },
  { title: "Payment Processing", description: "We handle all payment gateways, ticket delivery, and automated receipts so you can focus on your event.", icon: WalletIcon },
  { title: "Attendee Management", description: "We manage check-in systems, email communications, and attendee support throughout your event lifecycle.", icon: UsersIcon },
  { title: "Ongoing Support", description: "Our team provides technical assistance, platform updates, and feature enhancements continuously.", icon: SupportIcon },
];

export const faqs: FaqItem[] = [
  // Getting Started
  { question: "How do I create my first event?", answer: "Getting started is easy! Simply sign up for an account, click 'Create Event', fill in your event details, set up ticket types, and publish. Our guided setup will walk you through each step. You can have your event live in under 10 minutes!", icon: RocketIcon, category: 'getting-started' },
  { question: "Do I need technical skills to use Nomeo Events?", answer: "Not at all! Nomeo Events is designed for everyone. Our drag-and-drop interface requires zero coding knowledge. We've built the platform to be intuitive and user-friendly, so you can focus on organizing great events instead of dealing with technical complexities.", icon: UserIcon, category: 'getting-started' },
  { question: "Can I host free events on the platform?", answer: "Absolutely! Free events are completely free to host on our platform. You only pay transaction fees when selling paid tickets. This makes it perfect for community gatherings, meetups, and promotional events.", icon: TicketIcon, category: 'getting-started' },
  // Payments & Pricing
  { question: "What payment methods do you support?", answer: "We support multiple payment gateways including Paystack, Flutterwave, and Stripe. This allows your attendees to pay via credit/debit cards, bank transfers, USSD, mobile money, and even installment payments for high-value events.", icon: WalletIcon, category: 'payments' },
  { question: "What are your transaction fees?", answer: "Our pricing is transparent with no hidden fees. For paid events, we charge a small platform fee of 3% + payment gateway charges. Free events have zero platform fees. We also offer enterprise plans with custom pricing for high-volume organizers.", icon: MoneyBag01Icon, category: 'payments' },
  { question: "When do I get paid for ticket sales?", answer: "Payouts are processed automatically to your registered bank account within 3-5 business days after the event ends. For recurring events, you can request early payouts. Enterprise clients may qualify for same-day settlements.", icon: Clock01Icon, category: 'payments' },
  { question: "Can I offer refunds to attendees?", answer: "Yes! You can set your own refund policy. Our system allows you to process full or partial refunds directly from the dashboard. Attendees can also request refunds, which you can approve or decline based on your event's policy.", icon: CheckmarkCircle02Icon, category: 'payments' },
  // Technical Features
  { question: "How does attendee check-in work?", answer: "Our QR code-based check-in system makes entry seamless. Attendees receive unique QR codes via email, and you can scan them using our mobile app or web dashboard. The system supports offline check-in and can handle thousands of attendees simultaneously.", icon: MobileIcon, category: 'technical' },
  { question: "Can I customize my event page?", answer: "Definitely! You can add your logo, brand colors, custom images, videos, and even use your own domain name for a professional look. Our page builder includes customizable sections for speakers, schedules, sponsors, and more.", icon: SettingsIcon, category: 'technical' },
  { question: "Does the platform support recurring events?", answer: "Yes! You can create recurring events with daily, weekly, monthly, or custom schedules. This is perfect for workshops, classes, meetups, and corporate training sessions. Attendees can register for single sessions or the entire series.", icon: Calendar03Icon, category: 'technical' },
  { question: "Can I export attendee data?", answer: "Absolutely! You can export attendee lists, ticket sales reports, and analytics in CSV, Excel, or PDF formats. This makes it easy to integrate with your CRM, email marketing tools, or for internal reporting.", icon: File01Icon, category: 'technical' },
  { question: "Is there a mobile app for organizers?", answer: "Yes! We have dedicated mobile apps for iOS and Android that let you manage events on the go. You can check in attendees, monitor ticket sales, send push notifications, and chat with your team in real-time.", icon: MobileIcon, category: 'technical' },
  // Event Management
  { question: "How do I promote my event?", answer: "We provide built-in marketing tools including email campaigns, social media sharing, discount codes, affiliate tracking, and waiting lists. You can embed our ticketing widget on your own website and use our SEO-optimized event pages.", icon: Message01Icon, category: 'events' },
  { question: "Can I sell merchandise alongside tickets?", answer: "Yes! Our platform supports add-ons and merchandise sales. You can sell event merchandise, food vouchers, workshop materials, or any other products. Inventory tracking and separate fulfillment management are included.", icon: TicketIcon, category: 'events' },
  { question: "What happens if my event is postponed or cancelled?", answer: "We've got you covered. You can easily reschedule events and notify all attendees via email and SMS. Our system automatically transfers tickets to the new date or processes refunds based on your policy. Communication templates are available to handle these situations professionally.", icon: Calendar03Icon, category: 'events' },
  { question: "Can I host hybrid events (both in-person and virtual)?", answer: "Absolutely! Nomeo Events fully supports hybrid events. You can sell separate tickets for in-person attendance and virtual access. We integrate with streaming platforms like Zoom, YouTube Live, and Vimeo to deliver seamless virtual experiences alongside physical events.", icon: VideoIcon, category: 'events' },
  { question: "How do I manage VIP guests or speakers?", answer: "Our platform includes a VIP management system. You can create special invitation-only ticket types, provide complimentary tickets, assign dedicated check-in lanes, and manage guest lists for exclusive areas or backstage access.", icon: CrownIcon, category: 'events' },
  // Support & Security
  { question: "Is there customer support available?", answer: "Yes! We offer 24/7 customer support via email, live chat, and phone. Our dedicated support team is always ready to help you. Premium plans include dedicated account managers and priority support with SLAs.", icon: SupportIcon, category: 'support' },
  { question: "Is my data secure on Nomeo Events?", answer: "Security is our top priority. We use bank-grade 256-bit SSL encryption, regular security audits, and comply with GDPR and local data protection laws. Your attendees' payment information is never stored on our servers—it goes directly to our PCI-compliant payment partners.", icon: SecurityCheckIcon, category: 'support' },
  { question: "Do you offer training for large organizations?", answer: "Yes! For enterprise clients, we provide personalized onboarding, training sessions for your team, and detailed documentation. We can also create custom workflows and integrations based on your specific needs.", icon: UsersIcon, category: 'support' },
  { question: "Do you have an API for developers?", answer: "Yes! We offer a comprehensive REST API that allows developers to create custom integrations, automate event creation, sync data with external systems, and build custom check-in solutions. Complete API documentation is available in our developer portal.", icon: PuzzleIcon, category: 'technical' },
  { question: "Can I integrate Nomeo Events with my website?", answer: "Absolutely! You can embed our ticketing widget directly into your existing website. We provide iframe embeds, JavaScript widgets, and WordPress plugins. Your attendees never have to leave your site to complete their purchase.", icon: ConnectIcon, category: 'technical' },
  { question: "What analytics are available?", answer: "Our comprehensive analytics dashboard shows ticket sales trends, attendance rates, revenue reports, customer demographics, marketing campaign performance, and ROI calculations. You can create custom reports and schedule automatic email deliveries.", icon: ChartIcon, category: 'technical' },
];

export const faqCategories: FaqCategory[] = [
  { name: 'Getting Started', key: 'getting-started', icon: RocketIcon },
  { name: 'Payments & Pricing', key: 'payments', icon: WalletIcon },
  { name: 'Technical Features', key: 'technical', icon: SettingsIcon },
  { name: 'Event Management', key: 'events', icon: Calendar03Icon },
  { name: 'Support & Security', key: 'support', icon: SupportIcon },
];

export const inquiryTypes: InquiryType[] = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'support', label: 'Technical Support' },
  { value: 'sales', label: 'Sales & Pricing' },
  { value: 'partnership', label: 'Partnership Opportunity' },
  { value: 'feedback', label: 'Feedback' },
];