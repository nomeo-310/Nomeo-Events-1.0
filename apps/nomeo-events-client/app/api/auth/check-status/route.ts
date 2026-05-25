// app/api/auth/check-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { Profile } from "@/models/profile";
import { ObjectId } from "mongodb";

export async function getSession() {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    const userId = new ObjectId(session.user.id);
    
    // Get profile
    const profile = await Profile.findOne({ userId }, { projection: { activeStatus: 1, metadata: 1 } });
    
    if (!profile) {
      return NextResponse.json({
        authenticated: true,
        hasProfile: false,
        activeStatus: null,
      });
    }
    
    return NextResponse.json({
      authenticated: true,
      hasProfile: true,
      activeStatus: profile.activeStatus,
      metadata: profile.metadata,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}