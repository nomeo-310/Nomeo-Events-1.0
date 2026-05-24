import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Profile } from "@/models/profile";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

async function checkAdminAccess(user: any) {
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  
  if (user.role !== "admin" && user.role !== "super_admin") {
    return { error: NextResponse.json({ error: "Forbidden - Admin access requiblue" }, { status: 403 }) };
  }
  
  return null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectDB();
  
  const user = await getCurrentUser();
  const adminCheck = await checkAdminAccess(user);
  if (adminCheck?.error) return adminCheck.error;
  
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid profile ID" }, { status: 400 });
  }
  
  try {
    const profile = await Profile.findById(id)
      .populate("userId", "email role status lastLogin")
      .populate("verifiedBy", "fullName email")
      .lean();
    
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}