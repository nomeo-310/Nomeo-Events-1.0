
import crypto from "crypto";
import { OTPType, sendOTPEmail } from "./mailer";
import Otp from "@/models/otp";
import { connectDB } from "./mongoose";

async function ensureDBConnection() {
  try {
    await connectDB();
  } catch (error) {
    console.error("Failed to connect to MongoDB for OTP:", error);
    throw new Error("Database connection failed");
  }
}

export async function generateAndStoreOTP( email: string, type: OTPType = "email-verification" ) {
  await ensureDBConnection();

  const otp = crypto.randomInt(100000, 999999).toString();

  await Otp.deleteMany({ email, type });

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await Otp.create({
    email: email.toLowerCase(),
    otp,
    type,
    expiresAt,
  });

  return otp;
}

export async function verifyOTP( email: string, otp: string, type: OTPType = "email-verification" ) {
  await ensureDBConnection();

  const record = await Otp.findOne({
    email: email.toLowerCase(),
    otp,
    type,
    expiresAt: { $gt: new Date() },
  });

  if (!record) return false;

  await Otp.deleteOne({ _id: record._id });

  return true;
}

export async function sendVerificationOTP(email: string, name: string = "there", type: OTPType = "email-verification") {
  try {
    await ensureDBConnection();
    const otp = await generateAndStoreOTP(email, type);
    await sendOTPEmail({ email, otp, name, type});
    console.log(`OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Failed to send OTP:", error);
    return false;
  }
}

export async function cleanExpiredOTPs() {
  await Otp.deleteMany({ expiresAt: { $lt: new Date() } });
}