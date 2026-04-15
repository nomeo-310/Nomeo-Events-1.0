import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { IProfile, Profile } from "@/models/profile";
import { NextRequest, NextResponse } from "next/server";

// ─── GET /api/profile/[slug] ───────────────────────────────────────────────
// Returns a PUBLIC view of a profile identified by its slug.
// - Sensitive fields are stripped based on the profile owner's privacy settings.
// - Profile views are incremented (self-views are excluded).
// - Only active + verified profiles are exposed to non-owners.

export async function GET( req: NextRequest, { params }: { params: Promise<{ slug: string; }> }) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    await connectDB();

    // Use the static method defined on the model
    const profile = await Profile.findBySlug(slug);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Determine the viewer
    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated. Please log in to continue." },
        { status: 401 }
      );
    }

    const viewerId = loggedInUser.id;
    const isOwner = viewerId && profile.userId.toString() === viewerId;

    // Non-owners only see active + verified profiles
    if (!isOwner) {
      if (
        profile.activeStatus !== "active" ||
        profile.verificationStatus === "suspended"
      ) {
        return NextResponse.json(
          { error: "Profile is not publicly available" },
          { status: 403 }
        );
      }

      // Increment profile views asynchronously (fire-and-forget, non-blocking)
      profile.incrementProfileViews(viewerId).catch((err) =>
        console.error("[incrementProfileViews]", err)
      );
    }

    // Build public-safe payload
    const publicData = buildPublicProfile(profile, !!isOwner);

    return NextResponse.json({ success: true, data: publicData }, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/profile/[slug]]", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Strips private fields from the profile based on the owner's
 * publicProfile privacy settings and whether the viewer is the owner.
 */
function buildPublicProfile(profile: IProfile, isOwner: boolean) {
  const obj = profile.toObject({ virtuals: true }) as Record<string, any>;

  // Always-public computed values
  obj.completionPercentage = profile.getCompletionPercentage();
  obj.fullAddress = profile.getFullAddress();

  if (isOwner) {
    // Owners get everything
    return obj;
  }

  // ── Strip sensitive / private fields for external viewers ──
  const alwaysStrip = [
    "verificationDocuments",
    "accountDetails",
    "paymentMethod",
    "metadata",
    "taxId",
    "organizationRegistrationNumber",
    "suspensionReason",
    "suspendedAt",
    "deactivatedAt",
    "analytics",        // keep profileViews private
    "userId",
    "__v",
  ];
  alwaysStrip.forEach((f) => delete obj[f]);

  // Respect showEmail toggle
  if (!profile.publicProfile?.showEmail) {
    if (obj.contact) {
      delete obj.contact.email;
      delete obj.contact.supportEmail;
    }
  }

  // Respect showPhone toggle
  if (!profile.publicProfile?.showPhone) {
    if (obj.contact) {
      delete obj.contact.phoneNumber;
      delete obj.contact.officeNumber;
    }
  }

  // Respect showLocation toggle
  if (!profile.publicProfile?.showLocation) {
    delete obj.location;
    delete obj.fullAddress;
  }

  return obj;
}