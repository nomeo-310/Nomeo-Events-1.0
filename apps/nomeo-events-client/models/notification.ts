import { Schema, model, models, Types, Model, Document } from "mongoose";

export interface INotification {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  title: string;
  message: string;
  message_type: "info" | "success" | "warning" | "error" | "update" | "verification";
  sender_type: "system" | "user" | "admin";
  link?: string;
  metadata?: {
    eventId?: Types.ObjectId;
    registrationId?: Types.ObjectId;
    action?: string;
    profileId?: string;
    userId?: string;
    verificationStatus?: string;
    documentCount?: number;
    documentTypes?: string[];
    accountType?: string;
    submittedAt?: string;
    [key: string]: any; // Allow any additional metadata fields
  };
  status: "read" | "unread" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

// Separate interface for instance methods
export interface INotificationMethods {
  getTimeAgo(): string;
}

type NotificationModel = Model<INotification, {}, INotificationMethods>;

const NotificationSchema = new Schema<INotification, NotificationModel, INotificationMethods>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    message_type: {
      type: String,
      enum: ["info", "success", "warning", "error", "update", "verification"],
      default: "info",
    },
    sender_type: {
      type: String,
      enum: ["system", "user", "admin"],
      default: "system",
    },
    link: { type: String },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["read", "unread", "archived"],
      default: "unread",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
NotificationSchema.index({ receiverId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ "metadata.profileId": 1 }); // For querying verification notifications
NotificationSchema.index({ message_type: 1, createdAt: -1 }); // For filtering by type

// Instance method
NotificationSchema.methods.getTimeAgo = function (): string {
  const now = new Date();
  const diff = now.getTime() - this.createdAt.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
};

export const Notification = (models.Notification || model<INotification, NotificationModel>( "Notification",  NotificationSchema )) as NotificationModel;