// types/newsletter.ts
export interface NewsletterSubscriber {
  _id: string;
  email: string;
  userId?: string;
  name?: string;
  status: 'active' | 'unsubscribed';
  subscribedAt: string;
  unsubscribedAt?: string;
  unsubscribeToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  _id: string;
  title: string;
  subject: string;
  content: string;
  contentJson?: any;
  type: 'bulk_email' | 'newsletter' | 'announcement' | 'promotion';
  status: 'draft' | 'sending' | 'completed' | 'failed' | 'cancelled';
  scheduledFor?: string;
  sentAt?: string;
  recipients: {
    total: number;
    successful: number;
    failed: number;
    opened: number;
    clicked: number;
  };
  filters?: {
    status?: string[];
    subscribedAfter?: string;
    hasUserId?: boolean;
  };
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
    mimeType: string;
  }>;
  images?: Array<{
    filename: string;
    url: string;
    size: number;
    width?: number;
    height?: number;
  }>;
  externalRecipients?: Array<{
    email: string;
    name?: string;
  }>;
  hasExternalRecipients?: boolean;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CampaignStats {
  pending: number;
  sent: number;
  failed: number;
  opened: number;
  clicked: number;
}

export interface EmailLog {
  _id: string;
  campaignId: string;
  newsletterId: string;
  email: string;
  status: 'pending' | 'sent' | 'failed' | 'opened' | 'clicked' | 'bounced';
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  error?: string;
  metadata?: any;
  createdAt: string;
}

export interface NewsletterImage {
  _id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  width: number;
  height: number;
  mimeType: string;
  alt?: string;
  uploadedBy: string;
  campaignId?: string;
  usedInCampaigns: string[];
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  page?: number;
  totalPages?: number;
}