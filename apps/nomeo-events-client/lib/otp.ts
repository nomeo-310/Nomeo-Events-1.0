import crypto from "crypto";
import { OTPType, sendOTPEmail } from "./emails/send-otp-email";
import Otp from "@/models/otp";
import { connectDB } from "./mongoose";
import { User } from "@/models/user";

async function ensureDBConnection() {
  try {
    await connectDB();
  } catch (error) {
    console.error("Failed to connect to MongoDB for OTP:", error);
    throw new Error("Database connection failed");
  }
}

export async function generateAndStoreOTP( email: string,  type: OTPType = "email-verification" ) {
  await ensureDBConnection();

  // Rate limiting: Check if user requested OTP too frequently
  const recentOTP = await Otp.findOne({
    email: email.toLowerCase(),
    type,
    createdAt: { $gt: new Date(Date.now() - 60 * 1000) }
  });

  if (recentOTP) {
    throw new Error("Please wait 60 seconds before requesting another code");
  }

  const otp = crypto.randomInt(100000, 999999).toString();

  await Otp.deleteMany({ email, type });

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await Otp.create({
    email: email.toLowerCase(),
    otp,
    type,
    expiresAt,
    attempts: 0, // Initialize attempts
  });

  return otp;
}

export async function verifyOTP( email: string, otp: string,  type: OTPType = "email-verification" ): Promise<{ success: boolean; error?: string }> {
  await ensureDBConnection();

  // Find valid OTP
  const record = await Otp.findOne({ 
    email: email.toLowerCase(), 
    otp, 
    type, 
    expiresAt: { $gt: new Date() }
  });

  if (!record) {
    // Check if there's an expired OTP
    const expiredRecord = await Otp.findOne({ 
      email: email.toLowerCase(), 
      otp, 
      type, 
      expiresAt: { $lte: new Date() }
    });
    
    if (expiredRecord) {
      return { success: false, error: "Code has expired. Please request a new one." };
    }
    
    return { success: false, error: "Invalid code. Please try again." };
  }

  // Check if max attempts reached
  if (record.attempts >= 5) {
    await Otp.deleteOne({ _id: record._id });
    return { success: false, error: "Too many failed attempts. Please request a new code." };
  }

  // Increment attempts
  await Otp.findByIdAndUpdate(
    record._id,
    { $inc: { attempts: 1 } },
    { new: true }
  );

  // If this is a forget-password request, also verify the email
  if (type === 'forget-password') {
    const user = await User.findOne({ email: email.toLowerCase() }).lean();

    if (user && user.emailVerified === false) {
      await User.findOneAndUpdate(
        { email: email.toLowerCase() }, 
        { emailVerified: true, emailVerifiedAt: new Date() }
      );
    }
  }

  // For email verification, mark as verified
  if (type === 'email-verification') {
    await User.findOneAndUpdate(
      { email: email.toLowerCase() }, 
      { emailVerified: true, emailVerifiedAt: new Date() }
    );
  }

  await Otp.deleteOne({ _id: record._id });

  return { success: true };
};

export async function sendVerificationOTP( email: string,  name: string = "there", type: OTPType = "email-verification" ) {
  try {
    await ensureDBConnection();
    const otp = await generateAndStoreOTP(email, type);
    await sendOTPEmail({ email, otp, name, type });
    console.log(`OTP sent to ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to send OTP:", error);
    return { success: false, error: error.message || "Failed to send OTP" };
  }
}

export async function cleanExpiredOTPs() {
  await Otp.deleteMany({ expiresAt: { $lt: new Date() } });
}