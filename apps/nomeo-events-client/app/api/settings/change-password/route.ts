// api/settings/change-password/route.ts
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongoose";
import mongoose from "mongoose";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { getCurrentUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { currentPassword, newPassword } = await req.json();

    // ── Validate inputs ────────────────────────────────────────────────────────
    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return Response.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return Response.json(
        { error: "New password must be different from your current password" },
        { status: 400 }
      );
    }

    const userCollection    = mongoose.connection.db!.collection("user");
    const accountCollection = mongoose.connection.db!.collection("account");

    // ── Find user ──────────────────────────────────────────────────────────────
    const user = await userCollection.findOne({
      email: loggedInUser.email.toLowerCase(),
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // ── Find the credential account (better-auth stores passwords here) ────────
    const credentialAccount = await accountCollection.findOne({
      userId:     user._id,
      providerId: "credential",
    });

    if (!credentialAccount) {
      return Response.json(
        {
          error:
            "No password-based login found for this account. " +
            "If you signed up with Google or another provider, " +
            "password change is not available.",
        },
        { status: 404 }
      );
    }

    // ── Verify current password before allowing the change ────────────────────
    // verifyPassword compares a plaintext password against a better-auth hash.
    // This is the same function better-auth uses internally during sign-in.
    const isCurrentPasswordValid = await verifyPassword({
      hash:     credentialAccount.password,
      password: currentPassword,
    });

    if (!isCurrentPasswordValid) {
      // Use a 401 rather than 400 so the client can show a specific "wrong password" message
      return Response.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // ── Hash and store the new password ───────────────────────────────────────
    const hashedPassword = await hashPassword(newPassword);

    await accountCollection.updateOne(
      { userId: user._id, providerId: "credential" },
      {
        $set: {
          password:  hashedPassword,
          updatedAt: new Date(),
        },
      }
    );

    // ── Invalidate all other sessions (force re-login everywhere) ─────────────

    await mongoose.connection.db!.collection("session").deleteMany({ userId: user._id.toString() });

    return Response.json({
      success: true,
      message: "Password changed successfully.",
    });

  } catch (error) {
    console.error("[POST /api/settings/change-password]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}