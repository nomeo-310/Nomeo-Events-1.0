// models/otp.ts
import mongoose, { Schema, Document } from "mongoose";

export type OTPType = "sign-in" | "email-verification" | "forget-password" | "change-email";

export interface IOtp extends Document {
  email: string;
  otp: string;
  type: OTPType;
  expiresAt: Date;
  createdAt: Date;
  attempts: number;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
      length: 6,
    },
    type: {
      type: String,
      required: true,
      enum: ["sign-in", "email-verification", "forget-password", "change-email"],
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,        
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true, 
  }
);

// Indexes
OtpSchema.index({ email: 1, type: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);

export default Otp;