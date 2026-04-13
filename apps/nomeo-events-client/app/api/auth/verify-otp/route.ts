import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { verifyOTP } from "@/lib/otp";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email, otp, type } = await req.json();
    console.log("Received OTP verification request for:", email, "Type:", type);

    if (!email || !otp) {
      return Response.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const isValid = await verifyOTP(email, otp, type);

    if (!isValid) {
      return Response.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    // Mark user as verified
    const userCollection = mongoose.connection.db!.collection("user");
    await userCollection.updateOne(
      { email: email.toLowerCase() },
      { $set: { emailVerified: true } }
    );

    return Response.json({ 
      success: true, 
      message: "Email verified successfully" 
    });
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}