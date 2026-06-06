// models/newsletter-image.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface INewsletterImage {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  width: number;
  height: number;
  mimeType: string;
  alt?: string;
  uploadedBy: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  usedInCampaigns: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface INewsletterImageDocument extends INewsletterImage, Document {}

const NewsletterImageSchema = new Schema<INewsletterImageDocument>(
  {
    filename: { 
      type: String, 
      required: true, 
      unique: true 
    },
    originalName: { 
      type: String, 
      required: true 
    },
    url: { 
      type: String, 
      required: true 
    },
    size: { 
      type: Number, 
      required: true 
    },
    width: { 
      type: Number 
    },
    height: { 
      type: Number 
    },
    mimeType: { 
      type: String, 
      required: true 
    },
    alt: String,
    uploadedBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    campaignId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Campaign' 
    },
    usedInCampaigns: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Campaign' 
    }]
  },
  { timestamps: true }
);

NewsletterImageSchema.index({ uploadedBy: 1 });
NewsletterImageSchema.index({ campaignId: 1 });
NewsletterImageSchema.index({ createdAt: -1 });

export const NewsletterImage = mongoose.models.NewsletterImage || 
  mongoose.model<INewsletterImageDocument>('NewsletterImage', NewsletterImageSchema);