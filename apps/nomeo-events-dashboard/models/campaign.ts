// models/newsletter-campaign.ts
import mongoose, { Schema, Document } from 'mongoose';

export enum CampaignStatus {
  DRAFT = 'draft',
  SENDING = 'sending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum CampaignType {
  BULK_EMAIL = 'bulk_email',
  NEWSLETTER = 'newsletter',
  ANNOUNCEMENT = 'announcement',
  PROMOTION = 'promotion'
}

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced'
}

export interface ICampaign {
  title: string;
  subject: string;
  content: string;
  type: CampaignType;
  status: CampaignStatus;
  scheduledFor?: Date;
  sentAt?: Date;
  recipients: {
    total: number;
    successful: number;
    failed: number;
    opened: number;
    clicked: number;
  };
  filters?: {
    status?: string[];
    subscribedAfter?: Date;
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
  recipientIds?: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICampaignDocument extends ICampaign, Document {}

const CampaignSchema = new Schema<ICampaignDocument>(
  {
    title: { 
      type: String, 
      required: true 
    },
    subject: { 
      type: String, 
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    type: { 
      type: String, 
      enum: Object.values(CampaignType), 
      required: true,
      default: CampaignType.NEWSLETTER
    },
    status: { 
      type: String, 
      enum: Object.values(CampaignStatus), 
      default: CampaignStatus.DRAFT 
    },
    scheduledFor: Date,
    sentAt: Date,
    recipients: {
      total: { type: Number, default: 0 },
      successful: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 }
    },
    filters: {
      status: [String],
      subscribedAfter: Date,
      hasUserId: Boolean
    },
    attachments: [{
      filename: String,
      url: String,
      size: Number,
      mimeType: String
    }],
    images: [{
      filename: String,
      url: String,
      size: Number,
      width: Number,
      height: Number
    }],
    externalRecipients: [{
      email: { type: String, required: true },
      name: { type: String }
    }],
    hasExternalRecipients: { type: Boolean, default: false },
    recipientIds: [{ type: Schema.Types.ObjectId, ref: 'Newsletter' }],
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    }
  },
  { timestamps: true }
);

CampaignSchema.index({ status: 1 });
CampaignSchema.index({ createdAt: -1 });
CampaignSchema.index({ type: 1, status: 1 });

export const Campaign = mongoose.models.Campaign ||  mongoose.model<ICampaignDocument>('Campaign', CampaignSchema);