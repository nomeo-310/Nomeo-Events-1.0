import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Profile } from "@/models/profile";
import { NextRequest, NextResponse } from "next/server";

// ─── POST /api/profile/[slug]/view ────────────────────────────────────────
// Manually triggers a profile view increment.
// Useful for client-side single-page navigations that don't re-hit the GET route.
export async function POST( req: NextRequest, { params }: { params: Promise<{ slug: string; }>; }) {
  try {
    const { slug } = await params;
    await connectDB();

    const profile = await Profile.findBySlug(slug);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated. Please log in to continue." },
        { status: 401 }
      );
    }
    
    await profile.incrementProfileViews(loggedInUser.id);

    return NextResponse.json(
      {
        success: true,
        profileViews: profile.analytics?.profileViews ?? 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/profile/[slug]/view]", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}