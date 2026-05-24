import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Profile } from "@/models/profile";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { AdminAccountManagementService } from "@/services/admin-account-management-services";

async function checkAdminAccess(user: any) {
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  
  if (user.role !== "admin" && user.role !== "super_admin") {
    return { error: NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 }) };
  }
  
  return null;
}

export async function POST( req: Request, { params }: { params: Promise<{ id: string }> }) {
  
  const { id } = await params;
  await connectDB();
  
  const admin = await getCurrentUser();
  const adminCheck = await checkAdminAccess(admin);
  if (adminCheck?.error) return adminCheck.error;
  
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid profile ID" }, { status: 400 });
  }
  
  const profile = await Profile.findById(id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const body = await req.json();
    
    switch (action) {
      case "deactivate":
        return await adminDeactivateAccount(profile, body, admin);
      case "reactivate":
        return await adminReactivateAccount(profile, admin);
      case "suspend":
        return await adminSuspendAccount(profile, body, admin);
      case "lift-suspension":
        return await adminLiftSuspension(profile, body, admin);
      case "delete":
        return await adminDeleteAccount(profile, body, admin);
      default:
        return NextResponse.json(
          { error: "Invalid action. Allowed: deactivate, reactivate, suspend, lift-suspension, delete" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error(`Error performing profile action:`, error);
    return NextResponse.json(
      { error: error.message || "Failed to perform action" },
      { status: 500 }
    );
  }
}

async function adminDeactivateAccount(profile: any, body: any, admin: any) {
  const { reason, sendEmail = true } = body;
  
  try {
    const result = await AdminAccountManagementService.adminDeactivateAccount(
      profile.userId.toString(),
      admin.id,
      admin.email || admin.id,
      reason,
      sendEmail
    );
    
    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        profileId: profile._id,
        userId: profile.userId,
        action: "deactivate",
        actionedBy: admin.email || admin.id,
        stats: result.stats
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to deactivate account" },
      { status: 500 }
    );
  }
}

async function adminReactivateAccount(profile: any, admin: any) {
  try {
    const result = await AdminAccountManagementService.adminReactivateAccount(
      profile.userId.toString(),
      admin.id,
      admin.email || admin.id
    );
    
    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        profileId: profile._id,
        userId: profile.userId,
        action: "reactivate",
        actionedBy: admin.email || admin.id,
        eventsRestored: result.stats.eventsUnpublished
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to reactivate account" },
      { status: 500 }
    );
  }
}

async function adminSuspendAccount(profile: any, body: any, admin: any) {
  const { reason, duration, sendEmail = true } = body;
  
  if (!reason) {
    return NextResponse.json(
      { error: "Reason is required for suspension" },
      { status: 400 }
    );
  }
  
  try {
    const result = await AdminAccountManagementService.adminSuspendAccount(
      profile.userId.toString(),
      admin.id,
      admin.email || admin.id,
      reason,
      duration,
      sendEmail
    );
    
    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        profileId: profile._id,
        userId: profile.userId,
        action: "suspend",
        actionedBy: admin.email || admin.id,
        duration,
        stats: result.stats
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to suspend account" },
      { status: 500 }
    );
  }
}

async function adminLiftSuspension(profile: any, body: any, admin: any) {
  const { sendEmail = true } = body;
  
  try {
    const result = await AdminAccountManagementService.adminLiftSuspension(
      profile.userId.toString(),
      admin.id,
      admin.email || admin.id,
      sendEmail
    );
    
    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        profileId: profile._id,
        userId: profile.userId,
        action: "lift-suspension",
        actionedBy: admin.email || admin.id,
        eventsRestored: result.stats.eventsUnpublished,
        stats: result.stats
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to lift suspension" },
      { status: 500 }
    );
  }
}

async function adminDeleteAccount(profile: any, body: any, admin: any) {
  const { reason, hardDelete = false, sendEmail = true } = body;
  
  try {
    const result = await AdminAccountManagementService.adminDeleteAccount(
      profile.userId.toString(),
      admin.id,
      admin.email || admin.id,
      reason,
      hardDelete,
      sendEmail
    );
    
    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        profileId: profile._id,
        userId: profile.userId,
        action: "delete",
        deletionType: hardDelete ? "hard" : "soft",
        actionedBy: admin.email || admin.id,
        stats: result.stats
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete account" },
      { status: 500 }
    );
  }
}