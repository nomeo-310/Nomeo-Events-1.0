//api/auth/forgot-password/route.ts
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import mongoose from "mongoose";
import { sendVerificationOTP } from "@/lib/otp";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const userCollection = mongoose.connection.db!.collection("user");
    const user = await userCollection.findOne({ email: email.toLowerCase() });

    const accountCollection = mongoose.connection.db!.collection("account");
    const account = await accountCollection.findOne({userId: new ObjectId(user?.id)});

    if (account && account.providerId === 'google') {
      return Response.json({ error: "This account is authenticated by Google, you cannot change it password" }, { status: 400 });
    }; 

    // For security, don't reveal if user exists or not
    if (!user) {
      return Response.json({ 
        message: "If an account exists with this email, you will receive a password reset code." 
      });
    }

    // Send password reset OTP (type: "forget-password")
    const result = await sendVerificationOTP(email, user.name || "there", "forget-password");

    if (result.success) {
      return Response.json({ 
        success: true, 
        message: "Password reset code sent to your email" 
      });
    } else {
      return Response.json({ 
        error: result.error || "Failed to send reset code" 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}