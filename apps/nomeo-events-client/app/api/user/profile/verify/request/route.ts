// app/api/profile/verify/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Profile } from "@/models/profile";

export async function POST(req: NextRequest) {
  try {
    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    await connectDB();

    const profile = await Profile.findOne({ userId: new Types.ObjectId(loggedInUser.id) });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    // Check if already verified or pending
    if (profile.verificationStatus === 'verified') {
      return NextResponse.json(
        { success: false, error: "Profile is already verified" },
        { status: 400 }
      );
    }

    if (profile.verificationStatus === 'pending') {
      return NextResponse.json(
        { success: false, error: "Verification request is already pending" },
        { status: 400 }
      );
    }

    // Update status to pending
    profile.verificationStatus = 'pending';
    await profile.save();

    return NextResponse.json(
      { success: true, status: "pending" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/profile/verify/request]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}