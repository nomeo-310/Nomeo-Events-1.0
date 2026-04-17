// app/api/profile/me/slug/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Profile } from "@/models/profile";

export async function PATCH(req: NextRequest) {
  try {
    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { slug } = await req.json();
    
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { success: false, error: "Slug is required" },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const existingProfile = await Profile.findOne({ "publicProfile.slug": slug });
    if (existingProfile && existingProfile.userId.toString() !== loggedInUser.id) {
      return NextResponse.json(
        { success: false, error: "This URL is already taken" },
        { status: 409 }
      );
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: new Types.ObjectId(loggedInUser.id) },
      { $set: { "publicProfile.slug": slug } },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    const completionPercentage = profile.getCompletionPercentage();
    const fullAddress = profile.getFullAddress();
    const profileObj = profile.toObject({ virtuals: true });

    return NextResponse.json(
      {
        success: true,
        data: { ...profileObj, completionPercentage, fullAddress },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[PATCH /api/profile/me/slug]", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}