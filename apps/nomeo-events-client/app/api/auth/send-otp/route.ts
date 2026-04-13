import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import mongoose from "mongoose";
import { sendVerificationOTP } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, type } = await req.json();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user exists using Mongoose (or raw collection)
    const userCollection = mongoose.connection.db!.collection("user");
    const user = await userCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Send OTP
    const sent = await sendVerificationOTP(email, user.name || "there", type);

    if (sent) {
      return Response.json({ 
        success: true, 
        message: "Verification code sent to your email" 
      });
    } else {
      return Response.json({ error: "Failed to send OTP" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}