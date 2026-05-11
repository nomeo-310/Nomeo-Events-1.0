//api/settings/send-otp/route.ts
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import mongoose from "mongoose";
import { sendVerificationOTP } from "@/lib/otp";
import { getCurrentUser } from "@/lib/session";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    if (email === loggedInUser.email) {
      return Response.json({ error: "This is your current email, no need for change" }, { status: 400 });
    }

    await connectDB();

    const accountCollection = mongoose.connection.db!.collection("account");
    const account = await accountCollection.findOne({userId: new ObjectId(loggedInUser.id)});

    if (account && account.providerId === 'google') {
      return Response.json({ error: "This account is authenticated by Google, you cannot change the email." }, { status: 400 });
    };

    const userCollection = mongoose.connection.db!.collection("user");
    const user = await userCollection.findOne({ email: email.toLowerCase() });

    if (user) {
      return Response.json({ error: "An account exists with this email, use another one." }, { status: 403 });
    }

    // Send password reset OTP (type: "forget-password")
    const result = await sendVerificationOTP(email, loggedInUser.name || "there", "change-email");

    if (result.success) {
      return Response.json({ 
        success: true, 
        message: "Email verification code has been sent to your new email" 
      });
    } else {
      return Response.json({ 
        error: result.error || "Failed to send verification code" 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Change Email Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}