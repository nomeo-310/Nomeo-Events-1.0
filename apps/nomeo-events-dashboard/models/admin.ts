// models/admin.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IAdmin extends Document {
  name: string;
  displayName?: string;
  userId: mongoose.Types.ObjectId;
  email: string;
  role: "super_admin" | "admin" | "moderator" | "support";
  adminStatus: 'active' | 'suspended' | 'inactive';
  isActive: boolean;
  isOnboarded: boolean;
  useSeedPhrase: boolean;
  lastLoginAt: Date;
  lastLoginIP?: string;
  loginCount: number;
  createdAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: {
     type: String,
    },
    displayName: {
     type: String,
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true 
    },
    role: { 
      type: String, 
      enum: ["super_admin", "admin", "moderator", "support"], 
      default: "admin" 
    },
    adminStatus: { 
      type: String, 
      enum: ["active", "suspended", "inactive"], 
      default: "active" 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    isOnboarded: {
      type: Boolean, 
      default: false
    },
    useSeedPhrase: { 
      type: Boolean, 
      default: true 
    },
    lastLoginAt: { 
      type: Date 
    },
    lastLoginIP: {
      type: String,
    },
    loginCount: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

export const Admin = mongoose.models.Admin ??  mongoose.model<IAdmin>("Admin", AdminSchema);