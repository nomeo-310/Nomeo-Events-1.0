// app/api/admin/list-admin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/models/user";
import { Admin } from "@/models/admin";

// Optional: GET endpoint to list admins (for super admin dashboard)
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const requestingUser = await User.findOne({ email: session.user.email });
    
    // Only super admins can list all admins
    if (!requestingUser || requestingUser.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Get all admin users with their details
    const adminUsers = await Admin.find({})
      .populate('userId', 'email role createdAt')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      admins: adminUsers.map(admin => ({
        id: admin._id,
        userId: admin.userId,
        email: admin.email,
        name: admin.name,
        displayName: admin.displayName,
        role: admin.role,
        isActive: admin.isActive,
        lastLoginAt: admin.lastLoginAt,
        loginCount: admin.loginCount,
        createdAt: admin.createdAt,
      }))
    });
    
  } catch (error: any) {
    console.error("Error fetching admins:", error);
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
  }
}