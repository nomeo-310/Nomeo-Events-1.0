// models/newsletter.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export enum NewsletterStatus {
  ACTIVE = 'active',
  UNSUBSCRIBED = 'unsubscribed'
}

export interface INewsletter {
  email: string;
  userId?: mongoose.Types.ObjectId;
  name?: string;
  status: NewsletterStatus;
  subscribedAt: Date;
  unsubscribedAt?: Date;
  unsubscribeToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INewsletterDocument extends INewsletter, Document {
  unsubscribe(): Promise<INewsletterDocument>;
}

interface INewsletterModel extends Model<INewsletterDocument> {}

const NewsletterSchema = new Schema<INewsletterDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(NewsletterStatus),
      default: NewsletterStatus.ACTIVE
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    },
    unsubscribedAt: Date,
    unsubscribeToken: {
      type: String,
      unique: true
    }
  },
  { timestamps: true }
);

// Generate unsubscribe token before first save
NewsletterSchema.pre('save', function () {
  if (!this.unsubscribeToken) {
    const rand = () => Math.random().toString(36).substring(2);
    this.unsubscribeToken = `${rand()}${rand()}${Date.now().toString(36)}`;
  }
});

NewsletterSchema.methods.unsubscribe = async function (): Promise<INewsletterDocument> {
  this.status = NewsletterStatus.UNSUBSCRIBED;
  this.unsubscribedAt = new Date();
  return this.save();
};

NewsletterSchema.index({ userId: 1 });
NewsletterSchema.index({ status: 1 });

export const Newsletter =
  (mongoose.models.Newsletter as INewsletterModel) ||
  mongoose.model<INewsletterDocument, INewsletterModel>('Newsletter', NewsletterSchema);