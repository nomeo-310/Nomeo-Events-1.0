// app/api/admin/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/models/user";
import { createAdminUser } from "@/lib/admin/create-admin";
import { AdminLog, AdminAction, AdminLogSeverity, AdminRole } from "@/models/admin-log";

// Valid roles accepted from the API and their mapped DB values
const VALID_ROLES = ["admin", "super_admin", "moderator", "support"] as const;
type ApiRole = (typeof VALID_ROLES)[number];

// Normalize "superadmin" (common typo/alias) to the DB value "super_admin"
function normalizeRole(role: string): ApiRole | null {
  if (role === "superadmin") return "super_admin";
  if (VALID_ROLES.includes(role as ApiRole)) return role as ApiRole;
  return null;
}

export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Capture session once — reused in both success and error paths
  let sessionEmail: string | null = null;
  let sessionName: string | null = null;

  try {
    await connectDB();

    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 });
    }

    sessionEmail = session.user.email;
    sessionName = session.user.name || null;

    // Find requesting user
    const requestingUser = await User.findOne({ email: sessionEmail });
    const requesterName = requestingUser?.name || sessionName || "Unknown";
    const requesterRole = requestingUser?.role;

    // Only super_admin can create admins
    if (!requestingUser || requesterRole !== "super_admin") {
      await AdminLog.logAction({
        adminId: requestingUser?._id?.toString() || "unknown",
        adminEmail: sessionEmail,
        adminName: requesterName,
        adminRole: requesterRole ?? AdminRole.ADMIN, // use actual role, not hardcoded
        action: AdminAction.CREATE_USER,
        severity: AdminLogSeverity.WARNING,
        details: `Unauthorized attempt to create admin by ${sessionEmail} (role: ${requesterRole ?? "none"})`,
        ipAddress,
        userAgent,
        endpoint: "/api/admin/create",
        method: "POST",
        status: "failed",
        errorMessage: "Insufficient permissions",
        metadata: {
          attemptedAction: "admin_creation",
          requesterRole,
        },
      });

      return NextResponse.json(
        { error: "Forbidden. Super admin access required." },
        { status: 403 }
      );
    }

    // Parse and validate body
    const { email, name, displayName, role: rawRole } = await request.json();

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
        { error: "Valid role is required: admin, super_admin, moderator, support" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Create the admin user
    const result = await createAdminUser({
      email: normalizedEmail,
      name: name.trim(),
      displayName: displayName.trim(),
      role: normalizedRole,
      createdBy: requestingUser._id.toString(),
      createdByName: requesterName,
    });

    // Log success
    await AdminLog.logAction({
      adminId: requestingUser._id.toString(),
      adminEmail: requestingUser.email,
      adminName: requesterName,
      adminRole: AdminRole.SUPER_ADMIN,
      action: AdminAction.CREATE_USER,
      severity: AdminLogSeverity.INFO,
      details: `Admin user created: ${displayName.trim()} (${normalizedEmail}) with role ${normalizedRole}`,
      ipAddress,
      userAgent,
      endpoint: "/api/admin/create",
      method: "POST",
      targetType: "user",
      targetId: result.userId,
      targetName: displayName.trim(),
      status: "success",
      reversible: true,
      metadata: {
        createdBy: requestingUser.email,
        createdByRole: "super_admin",
        assignedRole: normalizedRole,
        invitationSent: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Admin ${displayName.trim()} created successfully. Invitation email sent.`,
      data: {
        email: result.email,
        name: result.name,
        displayName: result.displayName,
        role: normalizedRole,
        // Credentials only in dev — should be sent via email in production
        ...(process.env.NODE_ENV === "development" && {
          tempPassword: result.tempPassword,
          seedPhrase: result.seedPhrase,
        }),
      },
    });
  } catch (error: any) {
    console.error("Error creating admin:", error);

    // Best-effort error log using already-captured session data
    // No second getAuth()/getSession() call — avoids throwing again on auth failure
    if (sessionEmail) {
      try {
        const requestingUser = await User.findOne({ email: sessionEmail });

        await AdminLog.logAction({
          adminId: requestingUser?._id?.toString() || "unknown",
          adminEmail: sessionEmail,
          adminName: requestingUser?.name || sessionName || "Unknown",
          adminRole: requestingUser?.role ?? AdminRole.SUPER_ADMIN,
          action: AdminAction.CREATE_USER,
          severity: AdminLogSeverity.ERROR,
          details: `Failed to create admin: ${error.message}`,
          ipAddress,
          userAgent,
          endpoint: "/api/admin/create",
          method: "POST",
          status: "failed",
          errorMessage: error.message,
          metadata: {
            errorStack: process.env.NODE_ENV === "development" ? error.stack : undefined,
          },
        });
      } catch (logError) {
        console.error("Failed to log error:", logError);
      }
    }

    return NextResponse.json(
      { error: error.message || "Failed to create admin user" },
      { status: 500 }
    );
  }
}