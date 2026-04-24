import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Profile } from "@/models/profile";
import { User } from "@/models/user";

// ─── GET /api/profile/me ───────────────────────────────────────────────────
// Returns the full private profile of the currently authenticated user,
// including computed fields like completionPercentage and fullAddress.
export async function GET(req: NextRequest) {
  try {
    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated. Please log in to continue." },
        { status: 401 }
      );
    }

    await connectDB();

    const profile = await Profile.findOne({ userId: new Types.ObjectId(loggedInUser.id),})
    .populate({path: "userId", model: User, select: "email createdAt"})
    .lean(false); // lean(false) to keep instance methods

    if (!profile) {
      return NextResponse.json({success: false, error: "Profile not found" }, { status: 404 });
    }

    // Invoke instance methods before serializing
    const completionPercentage = profile.getCompletionPercentage();
    const fullAddress = profile.getFullAddress();

    // Serialize to plain object
    const profileObj = profile.toObject({ virtuals: true });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...profileObj,
          completionPercentage,
          fullAddress,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[GET /api/profile/me]", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/profile/me ─────────────────────────────────────────────────
// Partially updates the authenticated user's profile.
// Sensitive fields (userId, verificationStatus, verifiedAt, verifiedBy,
// totalRevenue, totalAttendees, totalEvents) are stripped from the payload.
export async function PATCH(req: NextRequest) {
  try {
    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated. Please log in to continue." },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();

    // Strip fields users must never update directly
    const PROTECTED_FIELDS = [
      "userId",
      "verificationStatus",
      "verifiedAt",
      "verifiedBy",
      "verificationDocuments",
      "totalRevenue",
      "totalAttendees",
      "totalEvents",
      "activeStatus",
      "suspendedAt",
      "suspensionReason",
      "analytics",
    ];
    PROTECTED_FIELDS.forEach((f) => delete body[f]);

    const profile = await Profile.findOneAndUpdate(
      { userId: new Types.ObjectId(loggedInUser.id) },
      { $set: body },
      { new: true, runValidators: true }
    ).lean(false);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

      if (profile && profile.profilePicture?.secure_url) {
        await User.findByIdAndUpdate(
        profile.userId,
        { image: profile.profilePicture.secure_url, avatar: profile.profilePicture.secure_url },
        { new: true }
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
    console.error("[PATCH /api/profile/me]", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/profile/me ────────────────────────────────────────────────
// Soft-deletes (deactivates) the authenticated user's profile.
export async function DELETE(req: NextRequest) {
  try {
    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated. Please log in to continue." },
        { status: 401 }
      );
    }

    await connectDB();

    const profile = await Profile.findOneAndUpdate(
      { userId: new Types.ObjectId(loggedInUser.id) },
      {
        $set: {
          activeStatus: "deactivated",
          deactivatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: "Profile deactivated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[DELETE /api/profile/me]", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}