// app/api/auth/admin-logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { AdminLog, AdminAction, AdminLogSeverity, AdminRole } from "@/models/admin-log";
import { User } from "@/models/user";
import { getAuth } from "@/lib/auth/auth";

function getAdminRole(role: string): AdminRole | null {
  switch (role) {
    case "super_admin": return AdminRole.SUPER_ADMIN;
    case "admin":       return AdminRole.ADMIN;
    case "moderator":   return AdminRole.MODERATOR;
    case "support":     return AdminRole.SUPPORT;
    default:            return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });

    // Best-effort audit log — never blocks the actual logout
    if (session?.user) {
      try {
        const user = await User.findOne({ email: session.user.email });
        const adminRole = user ? getAdminRole(user.role) : null;

        if (user && adminRole) {
          await AdminLog.logAction({
            adminId: user._id.toString(),
            adminEmail: user.email,
            adminName: user.name || session.user.name || "Admin",
            adminRole,
            action: AdminAction.LOGOUT,
            severity: AdminLogSeverity.INFO,
            details: `Admin ${user.name || session.user.name} logged out`,
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
            userAgent: request.headers.get("user-agent") || "unknown",
            endpoint: "/api/auth/admin-logout",
            method: "POST",
            status: "success",
            metadata: { sessionId: session.session?.id ?? null },
          });
        }
      } catch (logError) {
        console.error("Failed to write logout audit log:", logError);
      }
    }

    // BETTER_AUTH_URL is already the full base path e.g. "http://localhost:3000/api/auth"
    // so /sign-out is the correct suffix — handled by your [...all]/route.ts
    const betterAuthURL = process.env.BETTER_AUTH_URL;
    if (!betterAuthURL) {
      throw new Error("BETTER_AUTH_URL is not defined");
    }

    const signOutResponse = await auth.handler(
      new Request(`${betterAuthURL}/api/auth/sign-out`, {
        method: "POST",
        headers: request.headers,
      })
    );

    // Forward all Better Auth response headers onto our response.
    // This is what actually clears the browser cookies — Better Auth's
    // deleteSessionCookie() expires sessionToken, sessionData,
    // dontRememberToken etc. via set-cookie headers on this response.
    const response = NextResponse.json(
      { success: true },
      { status: signOutResponse.status }
    );

    signOutResponse.headers.forEach((value, key) => {
      response.headers.append(key, value);
    });

    return response;

  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}