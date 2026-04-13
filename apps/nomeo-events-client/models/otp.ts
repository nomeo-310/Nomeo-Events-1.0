import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  email: string;
  otp: string;
  type: "email-verification" | "sign-in" | "password-reset";
  expiresAt: Date;
  createdAt: Date;
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
      enum: ["email-verification", "sign-in", "password-reset"],
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,        
    },
  },
  {
    timestamps: true, 
  }
);

OtpSchema.index({ email: 1, type: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Otp = mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);

export default Otp;