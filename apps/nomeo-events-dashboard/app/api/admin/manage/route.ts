// app/api/admin/manage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/models/user";
import { Admin } from "@/models/admin";
import { AdminLog, AdminAction, AdminLogSeverity, AdminRole } from "@/models/admin-log";
import { requireSuperAdmin, requireAdmin } from "@/lib/admin/authorization";
import { createAdminUser } from "@/lib/admin/create-admin";
import mongoose from "mongoose";
import { sendAdminActionEmail } from "@/lib/email/send-admin-action-email";
import { verifyPassword, hashPassword } from "better-auth/crypto";

// Role hierarchy for validation
const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 4,
  admin: 3,
  moderator: 2,
  support: 1
};

const VALID_ROLES = ["super_admin", "admin", "moderator", "support"] as const;
type ApiRole = typeof VALID_ROLES[number];

function normalizeRole(role: string): ApiRole | null {
  if (role === "superadmin") return "super_admin";
  if (VALID_ROLES.includes(role as ApiRole)) return role as ApiRole;
  return null;
}

function canModifyRole(adminRole: AdminRole, targetRole: AdminRole, action: "promote" | "demote"): boolean {
  const adminLevel = ROLE_HIERARCHY[adminRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];
  
  if (action === "promote") {
    return targetLevel < adminLevel;
  } else {
    return targetLevel < adminLevel;
  }
}

// ====================== GET - List all admins ======================
export async function GET(request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for") || "unknown";

  try {
    await connectDB();
    
    const loggedInUser = await requireSuperAdmin();
    
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    
    let query: any = {};
    
    if (status) {
      query.adminStatus = status;
    }
    
    if (role && VALID_ROLES.includes(role as ApiRole)) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [admins, total] = await Promise.all([
      Admin.find(query)
        .populate("userId", "name email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Admin.countDocuments(query)
    ]);
    
    const sanitizedAdmins = admins.map(admin => ({
      _id: admin._id,
      name: admin.name,
      displayName: admin.displayName,
      email: admin.email,
      role: admin.role,
      adminStatus: admin.adminStatus,
      isActive: admin.isActive,
      isOnboarded: admin.isOnboarded,
      lastLoginAt: admin.lastLoginAt,
      loginCount: admin.loginCount,
      createdAt: admin.createdAt,
      userId: admin.userId
    }));
    
    await AdminLog.logAction({
      adminId: loggedInUser.adminId,
      adminEmail: loggedInUser.email,
      adminName: loggedInUser.name,
      adminRole: loggedInUser.role as AdminRole,
      action: AdminAction.VIEW_ADMINS,
      severity: AdminLogSeverity.INFO,
      details: `Listed admins with filters: status=${status}, role=${role}, search=${search}`,
      ipAddress,
      metadata: {
        filters: { status, role, search },
        pagination: { page, limit, total }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: {
        admins: sanitizedAdmins,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error: any) {
    console.error("Error fetching admins:", error);
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
  }
}

// ====================== POST - Create new admin ======================
export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  try {
    await connectDB();
    
    const loggedInUser = await requireSuperAdmin();
    
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
    }
    
    if (loggedInUser.role !== 'super_admin') {
      await AdminLog.logAction({
        adminId: loggedInUser.id,
        adminEmail: loggedInUser.email,
        adminName: loggedInUser.name,
        adminRole: loggedInUser.role as AdminRole,
        action: AdminAction.CREATE_ADMIN,
        severity: AdminLogSeverity.WARNING,
        details: `Unauthorized attempt to create admin by ${loggedInUser.email}`,
        ipAddress,
        userAgent,
        status: "failed",
        errorMessage: "Insufficient permissions",
      });
      
      return NextResponse.json({ error: "Forbidden. Super admin access required." }, { status: 403 });
    }
    
    const { email, name, displayName, role: rawRole, sendEmail = true } = await request.json();
    
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: "Full name is required" }, { status: 400 });
    }
    if (!displayName?.trim()) {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 });
    }
    
    const normalizedRole = normalizeRole(rawRole);
    if (!normalizedRole) {
      return NextResponse.json(
        { error: "Valid role is required: super_admin, admin, moderator, support" },
        { status: 400 }
      );
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }
    
    await createAdminUser({
      email: normalizedEmail,
      name: name.trim(),
      displayName: displayName.trim(),
      role: normalizedRole,
      createdBy: loggedInUser.id,
      createdByName: loggedInUser.name,
    });
    
    return NextResponse.json({
      success: true,
      message: `Admin ${displayName.trim()} created successfully. ${sendEmail ? "Invitation email sent." : ""}`
    });
    
  } catch (error: any) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create admin user" },
      { status: 500 }
    );
  }
}

// ====================== PATCH - Update admin (role, status, etc) ======================
export async function PATCH(request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  try {
    await connectDB();
    
    const { adminId, action, data } = await request.json();
    
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return NextResponse.json({ error: "Valid adminId is required" }, { status: 400 });
    }
    
    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }
    
    const loggedInUser = await requireAdmin();
    
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const targetAdmin = await Admin.findById(adminId).populate("userId", "name email");
    
    if (!targetAdmin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }
    
    let updateData: any = {};
    let actionType = "";
    let actionDetails = ""; 
    let shouldSendEmail = data?.sendEmail !== false;
    let isSelfUpdate = targetAdmin._id.toString() === loggedInUser.adminId;
    
    // Handle profile update - allow self-update
    if (action === "update-profile") {
      if (!isSelfUpdate) {
        return NextResponse.json({ 
          error: "Forbidden. You can only update your own profile." 
        }, { status: 403 });
      }
      
      if (data.name) updateData.name = data.name;
      if (data.displayName) updateData.displayName = data.displayName;
      actionType = "update-profile";
      actionDetails = `Updated profile information`;
      
      Object.assign(targetAdmin, updateData);
      
      // Check if this is a first-time user (not onboarded yet)
      const isFirstTimeUser = !targetAdmin.isOnboarded && targetAdmin.loginCount <= 1;
      
      if (isFirstTimeUser) {
        targetAdmin.isOnboarded = true;
        targetAdmin.isActive = true;
        targetAdmin.adminStatus = "active";
        actionDetails = `Completed onboarding and updated profile information`;
      }
      
      await targetAdmin.save();
      
      const db = mongoose.connection.db!;
      await db.collection("user").updateOne(
        { _id: targetAdmin.userId },
        { 
          $set: { 
            name: targetAdmin.name,
            displayName: targetAdmin.displayName,
            isOnboarded: targetAdmin.isOnboarded,
            updatedAt: new Date()
          } 
        }
      );
      
      await AdminLog.logAction({
        adminId: loggedInUser.id,
        adminEmail: loggedInUser.email,
        adminName: loggedInUser.name,
        adminRole: loggedInUser.role as AdminRole,
        action: isFirstTimeUser ? AdminAction.ACTIVATE_ADMIN : AdminAction.UPDATE_ADMIN,
        severity: AdminLogSeverity.INFO,
        details: `${actionDetails} for ${targetAdmin.displayName || targetAdmin.name}`,
        targetType: "user",
        targetId: targetAdmin._id.toString(),
        targetName: targetAdmin.displayName || targetAdmin.name,
        changes: [{
          field: "profile",
          oldValue: "previous values",
          newValue: "updated values"
        }],
        ipAddress,
        userAgent,
        metadata: {
          action,
          isSelfUpdate,
          isFirstTimeUser,
          completedOnboarding: isFirstTimeUser
        }
      });
      
      return NextResponse.json({
        success: true,
        message: isFirstTimeUser ? "Profile updated successfully! Onboarding complete." : "Profile updated successfully",
        data: {
          admin: {
            _id: targetAdmin._id,
            name: targetAdmin.name,
            displayName: targetAdmin.displayName,
            email: targetAdmin.email,
            role: targetAdmin.role,
            adminStatus: targetAdmin.adminStatus,
            isActive: targetAdmin.isActive,
            isOnboarded: targetAdmin.isOnboarded
          }
        }
      });
    }
    
    // All other actions require super admin
    if (loggedInUser.role !== 'super_admin') {
      return NextResponse.json({ 
        error: "Forbidden. Super admin access required for this action." 
      }, { status: 403 });
    }
    
    if (targetAdmin._id.toString() === loggedInUser.id) {
      return NextResponse.json({ 
        error: "Cannot modify your own admin account via this endpoint for this action" 
      }, { status: 403 });
    }
    
    switch (action) {
      case "promote":
        const newRole = data?.newRole;
        if (!newRole || !VALID_ROLES.includes(newRole as ApiRole)) {
          return NextResponse.json({ error: "Valid newRole is required for promotion" }, { status: 400 });
        }
        
        if (!canModifyRole(loggedInUser.role as AdminRole, newRole as AdminRole, "promote")) {
          return NextResponse.json({ error: "Cannot promote to a role equal or higher than your own" }, { status: 403 });
        }
        
        if (ROLE_HIERARCHY[newRole as AdminRole] <= ROLE_HIERARCHY[targetAdmin.role as AdminRole]) {
          return NextResponse.json({ error: `Cannot promote to ${newRole} as it's not higher than current role ${targetAdmin.role}` }, { status: 400 });
        }
        
        updateData.role = newRole;
        actionType = "promote";
        actionDetails = `Promoted from ${targetAdmin.role} to ${newRole}`;
        break;
        
      case "demote":
        const targetRole = data?.targetRole;
        if (!targetRole || !VALID_ROLES.includes(targetRole as ApiRole)) {
          return NextResponse.json({ error: "Valid targetRole is required for demotion" }, { status: 400 });
        }
        
        if (!canModifyRole(loggedInUser.role as AdminRole, targetRole as AdminRole, "demote")) {
          return NextResponse.json({ error: "Cannot demote to a role equal or higher than your own" }, { status: 403 });
        }
        
        if (ROLE_HIERARCHY[targetRole as AdminRole] >= ROLE_HIERARCHY[targetAdmin.role as AdminRole]) {
          return NextResponse.json({ error: `Cannot demote to ${targetRole} as it's not lower than current role ${targetAdmin.role}` }, { status: 400 });
        }
        
        updateData.role = targetRole;
        actionType = "demote";
        actionDetails = `Demoted from ${targetAdmin.role} to ${targetRole}`;
        break;
        
      case "suspend":
        if (targetAdmin.role === "super_admin") {
          return NextResponse.json({ error: "Cannot suspend a super admin" }, { status: 403 });
        }
        
        updateData.adminStatus = "suspended";
        updateData.isActive = false;
        actionType = "suspend";
        actionDetails = `Suspended admin account`;
        break;
        
      case "activate":
        updateData.adminStatus = "active";
        updateData.isActive = true;
        actionType = "activate";
        actionDetails = `Activated admin account`;
        break;
        
      case "deactivate":
        if (targetAdmin.role === "super_admin") {
          return NextResponse.json({ error: "Cannot deactivate a super admin" }, { status: 403 });
        }
        
        updateData.adminStatus = "inactive";
        updateData.isActive = false;
        actionType = "deactivate";
        actionDetails = `Deactivated admin account`;
        break;
        
      default:
        return NextResponse.json({ error: "Invalid action. Allowed: promote, demote, suspend, activate, deactivate, update-profile" }, { status: 400 });
    }
    
    Object.assign(targetAdmin, updateData);
    await targetAdmin.save();
    
    if (shouldSendEmail && targetAdmin.email) {
      await sendAdminActionEmail({
        email: targetAdmin.email,
        name: targetAdmin.name || targetAdmin.displayName,
        action: actionType,
        details: actionDetails,
        performedBy: loggedInUser.name,
        performedByEmail: loggedInUser.email,
        newRole: updateData.role,
        oldRole: targetAdmin.role,
        reason: data?.reason
      }).catch(err => console.error("Failed to send admin action email:", err));
    }
    
    await AdminLog.logAction({
      adminId: loggedInUser.id,
      adminEmail: loggedInUser.email,
      adminName: loggedInUser.name,
      adminRole: loggedInUser.role as AdminRole,
      action: actionType === "promote" || actionType === "demote" ? AdminAction.UPDATE_ADMIN_ROLE : 
              actionType === "suspend" ? AdminAction.SUSPEND_ADMIN :
              actionType === "activate" ? AdminAction.ACTIVATE_ADMIN :
              AdminAction.UPDATE_ADMIN,
      severity: AdminLogSeverity.INFO,
      details: `${actionDetails} for ${targetAdmin.displayName || targetAdmin.name} (${targetAdmin.email})`,
      targetType: "user",
      targetId: targetAdmin._id.toString(),
      targetName: targetAdmin.displayName || targetAdmin.name,
      changes: [{
        field: actionType === "promote" || actionType === "demote" ? "role" : "adminStatus",
        oldValue: actionType === "promote" || actionType === "demote" ? targetAdmin.role : undefined,
        newValue: updateData.role || updateData.adminStatus
      }],
      ipAddress,
      userAgent,
      metadata: {
        action,
        reason: data?.reason,
        emailSent: shouldSendEmail
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Admin ${actionDetails} successfully`,
      data: {
        admin: {
          _id: targetAdmin._id,
          name: targetAdmin.name,
          displayName: targetAdmin.displayName,
          email: targetAdmin.email,
          role: targetAdmin.role,
          adminStatus: targetAdmin.adminStatus,
          isActive: targetAdmin.isActive,
          isOnboarded: targetAdmin.isOnboarded
        }
      }
    });
    
  } catch (error: any) {
    console.error("Error updating admin:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update admin" },
      { status: 500 }
    );
  }
}

// ====================== PUT - Update admin password ======================
export async function PUT(request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  try {
    await connectDB();
    
    const { adminId, currentPassword, newPassword, confirmPassword, action } = await request.json();
    
    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ 
        error: "New password and confirmation are required" 
      }, { status: 400 });
    }
    
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ 
        error: "Passwords do not match" 
      }, { status: 400 });
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: "Password must be at least 8 characters long" 
      }, { status: 400 });
    }
    
    const weakPasswords = ['password123', 'admin123', '12345678', 'qwerty123', 'Password123', 'Admin123'];
    if (weakPasswords.includes(newPassword.toLowerCase())) {
      return NextResponse.json({ 
        error: "Password is too weak. Please choose a stronger password" 
      }, { status: 400 });
    }
    
    const loggedInUser = await requireAdmin();
    
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    let targetAdmin;
    let targetUser;
    
    // Case 1: Super admin resetting another admin's password
    if (action === "admin-reset") {
      if (loggedInUser.role !== 'super_admin') {
        return NextResponse.json({ 
          error: "Forbidden. Only super admins can reset other admin passwords." 
        }, { status: 403 });
      }
      
      if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
        return NextResponse.json({ error: "Valid adminId is required for admin reset" }, { status: 400 });
      }
      
      targetAdmin = await Admin.findById(adminId);
      if (!targetAdmin) {
        return NextResponse.json({ error: "Admin not found" }, { status: 404 });
      }
      
      if (targetAdmin._id.toString() === loggedInUser.adminId) {
        return NextResponse.json({ 
          error: "Use 'change-password' action for your own account" 
        }, { status: 400 });
      }
      
      targetUser = await User.findById(targetAdmin.userId);
      
      if (!targetUser) {
        return NextResponse.json({ error: "User account not found" }, { status: 404 });
      }
      
      // Update password
      const hashedPassword = await hashPassword(newPassword);
      const db = mongoose.connection.db!;
      
      await db.collection("account").updateOne(
        { userId: targetUser._id, providerId: "credential" },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );
      
      // Log the action
      await AdminLog.logAction({
        adminId: loggedInUser.id,
        adminEmail: loggedInUser.email,
        adminName: loggedInUser.name,
        adminRole: loggedInUser.role as AdminRole,
        action: AdminAction.UPDATE_ADMIN,
        severity: AdminLogSeverity.WARNING,
        details: `Super admin reset password for ${targetAdmin.displayName || targetAdmin.name}`,
        ipAddress,
        userAgent,
        metadata: { action: "admin-reset" }
      });
      
      // Send email notification
      await sendAdminActionEmail({
        email: targetAdmin.email,
        name: targetAdmin.displayName || targetAdmin.name,
        action: "password_reset",
        details: `Your admin account password has been reset by ${loggedInUser.name}.`,
        performedBy: loggedInUser.name,
        performedByEmail: loggedInUser.email,
        newPassword: newPassword,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/login`,
        reason: 'Password reset by super admin based on admin request.'
      });
      
      return NextResponse.json({
        success: true,
        message: `Password reset successfully for ${targetAdmin.displayName || targetAdmin.name}`,
        data: {
          admin: {
            id: targetAdmin._id,
            name: targetAdmin.name,
            email: targetAdmin.email,
            role: targetAdmin.role
          }
        }
      });
    }
    
    // Case 2: Regular password change (requires current password)
    // This covers both:
    // - First-time login (onboarding) - user has temporary password
    // - Already onboarded admin changing password
    if (action === "change-password" || action === "first-time-setup") {
      // Both require current password
      if (!currentPassword) {
        return NextResponse.json({ 
          error: "Current password is required" 
        }, { status: 400 });
      }
      
      // Get the admin's own record
      targetAdmin = await Admin.findOne({ userId: loggedInUser.id });
      if (!targetAdmin) {
        return NextResponse.json({ error: "Admin record not found" }, { status: 404 });
      }
      
      targetUser = await User.findById(loggedInUser.id);
      if (!targetUser) {
        return NextResponse.json({ error: "User account not found" }, { status: 404 });
      }
      
      // Verify current password
      const db = mongoose.connection.db!;
      
      const accountRecord = await db.collection("account").findOne({ 
        userId: new mongoose.Types.ObjectId(loggedInUser.id), 
        providerId: "credential" 
      });
      
      if (!accountRecord?.password) {
        return NextResponse.json({ 
          error: "Account password record not found" 
        }, { status: 404 });
      }
      
      const isValidPassword = await verifyPassword({ hash: accountRecord.password,  password: currentPassword });
      
      if (!isValidPassword) {
        await AdminLog.logAction({
          adminId: targetAdmin._id.toString(),
          adminEmail: targetAdmin.email,
          adminName: targetAdmin.name,
          adminRole: targetAdmin.role as AdminRole,
          action: AdminAction.UPDATE_ADMIN,
          severity: AdminLogSeverity.WARNING,
          details: `Failed password change attempt - invalid current password`,
          ipAddress,
          userAgent,
          status: "failed",
          errorMessage: "Invalid current password"
        });
        
        return NextResponse.json({ 
          error: "Current password is incorrect" 
        }, { status: 401 });
      }
      
      // Update password
      const hashedPassword = await hashPassword(newPassword);
      
      await db.collection("account").updateOne(
        { userId: targetUser._id, providerId: "credential" },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );
      
      // If this is first-time setup (onboarding), activate the account
      let wasActivated = false;

      if (action === "first-time-setup" && !targetAdmin.isActive) {
        targetAdmin.isActive = true;
        targetAdmin.adminStatus = "active";
        // DO NOT set isOnboarded yet - that happens on profile update
        await targetAdmin.save();
        
        await db.collection("user").updateOne(
          { _id: targetUser._id },
          { $set: { updatedAt: new Date() } }
        );
      }

      if (!targetAdmin.isActive) {
        targetAdmin.isActive = true;
        targetAdmin.adminStatus = "active";
        await targetAdmin.save();
        
        await db.collection("user").updateOne(
          { _id: targetUser._id },
          { $set: { updatedAt: new Date() } }
        );
      }
      
      // Log the action
      await AdminLog.logAction({
        adminId: targetAdmin._id.toString(),
        adminEmail: targetAdmin.email,
        adminName: targetAdmin.name,
        adminRole: targetAdmin.role as AdminRole,
        action: action === "first-time-setup" ? AdminAction.ACTIVATE_ADMIN : AdminAction.UPDATE_ADMIN,
        severity: action === "first-time-setup" ? AdminLogSeverity.INFO : AdminLogSeverity.WARNING,
        details: action === "first-time-setup" 
          ? `First-time login: Password set and account activated for ${targetAdmin.displayName || targetAdmin.name}`
          : `Password changed for ${targetAdmin.displayName || targetAdmin.name}`,
        ipAddress,
        userAgent,
        metadata: { 
          action,
          wasActivated,
          isOnboarded: targetAdmin.isOnboarded
        }
      });
      
      // Send email notification for regular password changes (not first-time setup)
      if (action !== "first-time-setup" && targetAdmin.email) {
        await sendAdminActionEmail({
          email: targetAdmin.email,
          name: targetAdmin.name || targetAdmin.displayName,
          action: "password_change",
          details: "Your password has been changed successfully",
          performedBy: targetAdmin.name,
          performedByEmail: targetAdmin.email,
        }).catch(err => console.error("Failed to send email:", err));
      }
      
      const message = action === "first-time-setup" 
        ? "Password set successfully! Please complete your profile to finish onboarding."
        : "Password updated successfully";
      
      return NextResponse.json({
        success: true,
        message,
        data: {
          isOnboarded: targetAdmin.isOnboarded,
          isActive: targetAdmin.isActive
        }
      });
    }
    
    return NextResponse.json({ 
      error: "Invalid action. Allowed: change-password, first-time-setup, admin-reset" 
    }, { status: 400 });
    
  } catch (error: any) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update password" },
      { status: 500 }
    );
  }
}

// ====================== DELETE - Permanently delete admin ======================
export async function DELETE(request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  try {
    await connectDB();
    
    const loggedInUser = await requireSuperAdmin();
    
    if (!loggedInUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (loggedInUser.role !== 'super_admin') {
      return NextResponse.json({ error: "Forbidden. Super admin access required." }, { status: 403 });
    }
    
    const { adminId, hardDelete = false, reason, transferToEmail } = await request.json();
    
    if (!adminId || !mongoose.Types.ObjectId.isValid(adminId)) {
      return NextResponse.json({ error: "Valid adminId is required" }, { status: 400 });
    }
    
    const targetAdmin = await Admin.findById(adminId).populate("userId", "name email");
    
    if (!targetAdmin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }
    
    if (targetAdmin._id.toString() === loggedInUser.id) {
      return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 403 });
    }
    
    if (targetAdmin.role === "super_admin") {
      const superAdminCount = await Admin.countDocuments({ role: "super_admin", isActive: true });
      if (superAdminCount <= 1) {
        return NextResponse.json({ error: "Cannot delete the last super admin" }, { status: 403 });
      }
    }
    
    let transferToAdmin = null;
    if (transferToEmail && targetAdmin.role === "super_admin") {
      transferToAdmin = await Admin.findOne({ email: transferToEmail, role: "super_admin" });
      if (!transferToAdmin) {
        return NextResponse.json({ error: "Transfer target super admin not found" }, { status: 404 });
      }
    }
    
    if (hardDelete) {
      const userId = targetAdmin.userId;
      await Admin.findByIdAndDelete(adminId);
      
      if (userId) {
        await User.findByIdAndDelete(userId);
      }
      
      await AdminLog.logAction({
        adminId: loggedInUser.id,
        adminEmail: loggedInUser.email,
        adminName: loggedInUser.name,
        adminRole: loggedInUser.role as AdminRole,
        action: AdminAction.DELETE_ADMIN,
        severity: AdminLogSeverity.CRITICAL,
        details: `Permanently deleted admin ${targetAdmin.displayName || targetAdmin.name} (${targetAdmin.email})`,
        targetType: "user",
        targetId: targetAdmin._id.toString(),
        targetName: targetAdmin.displayName || targetAdmin.name,
        reason: reason,
        ipAddress,
        userAgent,
        metadata: {
          hardDelete: true,
          transferTo: transferToEmail,
          userIdDeleted: !!userId
        }
      });
      
      return NextResponse.json({
        success: true,
        message: `Admin ${targetAdmin.displayName || targetAdmin.name} has been permanently deleted`
      });
      
    } else {
      targetAdmin.adminStatus = "inactive";
      targetAdmin.isActive = false;
      await targetAdmin.save();
      
      await AdminLog.logAction({
        adminId: loggedInUser.id,
        adminEmail: loggedInUser.email,
        adminName: loggedInUser.name,
        adminRole: loggedInUser.role as AdminRole,
        action: AdminAction.DELETE_ADMIN,
        severity: AdminLogSeverity.CRITICAL,
        details: `Soft deleted (deactivated) admin ${targetAdmin.displayName || targetAdmin.name} (${targetAdmin.email})`,
        targetType: "user",
        targetId: targetAdmin._id.toString(),
        targetName: targetAdmin.displayName || targetAdmin.name,
        reason: reason,
        ipAddress,
        userAgent,
        metadata: {
          hardDelete: false,
          canBeRestored: true
        }
      });
      
      return NextResponse.json({
        success: true,
        message: `Admin ${targetAdmin.displayName || targetAdmin.name} has been deactivated. They can be restored later.`
      });
    }
    
  } catch (error: any) {
    console.error("Error deleting admin:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete admin" },
      { status: 500 }
    );
  }
}