//api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { verifyOTP } from "@/lib/otp";
import { getCurrentUser } from "@/lib/session";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import { User } from "@/models/user";

export async function POST(req: NextRequest) {
  const { newEmail, otp} = await req.json();

  try {
    const loggedInUser = await getCurrentUser();
    
    if (!newEmail|| !otp) {
      return Response.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const result = await verifyOTP(newEmail, otp, 'change-email');

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    await User.findByIdAndUpdate(new ObjectId(loggedInUser.id), {email: newEmail})


    await mongoose.connection.db!.collection("session").deleteMany({ userId: loggedInUser.id });

    return Response.json({
      success: true,
      message: "Email changed successfully. Please login with your new email.",
    });

  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}