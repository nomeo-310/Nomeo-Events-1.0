import { requireAdmin } from "@/lib/admin/authorization";
import { connectDB } from "@/lib/mongoose";
import { Profile } from "@/models/profile";
import { Notification } from "@/models/notification";
import { NextResponse } from "next/server";
import { sendAccountVerificationEmail } from "@/lib/email/send-account-verification-email";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { AdminLogger } from "@/services/admin-logger-services";
import { AdminAction, AdminRole } from "@/models/admin-log";

interface VerificationRequest {
  profileIds: string[];
  sendEmail?: boolean;
  sendNotification?: boolean;
}

interface ResetRequest {
  profileIds: string[];
  hardReset?: boolean;
  resetReason?: string;
  sendNotification?: boolean;
}

interface PopulatedUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
}

interface PopulatedProfile extends mongoose.Document {
  userId: PopulatedUser;
  fullName: string;
  accountType: string;
  verificationStatus: string;
  verificationDocuments: any[];
  verifiedAt: Date;
  verifiedBy: any;
  metadata?: any;
  [key: string]: any;
}

const systemId = new ObjectId('000000000000000000000001');

async function createVerificationNotification(userId: mongoose.Types.ObjectId, profileName: string, verifiedBy: string ) {
  try {
    const notification = new Notification({
      senderId: systemId,
      recieverId: new ObjectId(userId),
      title: "Account Verified!",
      message: `Congratulations ${profileName}! Your account has been verified by ${verifiedBy}. You can now create and publish events.`,
      message_type: 'verification',
      sender_type: 'admin',
      metadata: {
        verifiedAt: new Date(),
        verifiedBy,
        action: "verification_approved"
      },
      read: false,
    });

    await notification.save();
    console.log(`✅ Verification notification created for user ${userId}`);
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

// ====================== POST - VERIFY PROFILES ======================
export async function POST(req: Request) {
  const startTime = Date.now();
  await connectDB();

  const loggedInUser = await requireAdmin();

  if (!loggedInUser) {
    return NextResponse.json({ error: "Unauthorized, Login!!" }, { status: 401 });
  }

  if (!["admin", "super_admin"].includes(loggedInUser.role)) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body: VerificationRequest = await req.json();
    const { profileIds, sendEmail = true, sendNotification = true } = body;

    if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
      return NextResponse.json(
        { error: "profileIds array is required" },
        { status: 400 }
      );
    }

    const validIds = profileIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return NextResponse.json(
        { error: "No valid profile IDs provided" },
        { status: 400 }
      );
    }

    const profiles = await Profile.find({
      _id: { $in: validIds },
      verificationStatus: "pending",
      verificationDocuments: { $exists: true, $not: { $size: 0 } }
    }).populate("userId", "email name") as unknown as PopulatedProfile[];

    if (profiles.length === 0) {
      return NextResponse.json(
        { error: "No pending verification profiles found with the provided IDs" },
        { status: 404 }
      );
    }

    const now = new Date();
    const verifiedBy = loggedInUser.name || loggedInUser.email || "Admin";
    const results = {
      verified: [] as any[],
      failed: [] as any[],
      notificationsSent: 0,
      emailsSent: 0
    };

    for (const profile of profiles) {
      try {
        const populatedUser = profile.userId as PopulatedUser;

        profile.verificationStatus = "verified";
        profile.verifiedAt = now;
        profile.verifiedBy = new ObjectId(loggedInUser.id);
        profile.metadata = {
          ...profile.metadata,
          verifiedAt: now,
          verifiedBy: verifiedBy,
          verificationMethod: "admin_approval"
        };

        if (profile.verificationDocuments && profile.verificationDocuments.length > 0) {
          profile.verificationDocuments.forEach((doc: any) => {
            doc.verified = true;
            doc.verifiedAt = now;
            doc.verifiedBy = loggedInUser.id;
          });
        }

        await profile.save();

        if (sendNotification && populatedUser?._id) {
          await createVerificationNotification(
            populatedUser._id,
            profile.fullName,
            verifiedBy
          );
          results.notificationsSent++;
        }

        if (sendEmail && populatedUser?.email) {
          await sendAccountVerificationEmail({
            email: populatedUser.email,
            name: profile.fullName,
            verifiedBy,
            verifiedAt: now,
            accountType: profile.accountType,
          });
          results.emailsSent++;
        }

        await AdminLogger.logProfileAction(
          {
            id: loggedInUser.id,
            email: loggedInUser.email,
            name: loggedInUser.name,
            role: loggedInUser.role as AdminRole
          },
          AdminAction.VERIFY_USER,
          profile._id.toString(),
          profile.fullName,
          `Verified ${profile.accountType} account with ${profile.verificationDocuments.length} document(s)`,
          {
            changes: [
              { field: "verificationStatus", oldValue: "pending", newValue: "verified" },
              { field: "verifiedAt", oldValue: null, newValue: now }
            ],
            affectedCount: 1,
            duration: Date.now() - startTime,
            metadata: {
              accountType: profile.accountType,
              documentCount: profile.verificationDocuments.length,
              emailSent: sendEmail,
              notificationSent: sendNotification
            }
          }
        );

        results.verified.push({
          id: profile._id,
          name: profile.fullName,
          email: populatedUser?.email,
          status: profile.verificationStatus,
        });

      } catch (error) {
        console.error(`Failed to verify profile ${profile._id}:`, error);
        results.failed.push({
          id: profile._id,
          name: profile.fullName,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    if (results.verified.length > 0) {
      await AdminLogger.logProfileAction(
        {
          id: loggedInUser.id,
          email: loggedInUser.email,
          name: loggedInUser.name,
          role: loggedInUser.role as AdminRole
        },
        AdminAction.VERIFY_USER,
        "bulk",
        `${results.verified.length} Users`,
        `Bulk verified ${results.verified.length} user(s) (${results.failed.length} failed)`,
        {
          affectedCount: results.verified.length,
          duration: Date.now() - startTime,
          metadata: {
            totalProcessed: profiles.length,
            successCount: results.verified.length,
            failedCount: results.failed.length,
            emailsSent: results.emailsSent,
            notificationsSent: results.notificationsSent
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully verified ${results.verified.length} out of ${profiles.length} profiles`,
      data: {
        totalProcessed: profiles.length,
        verifiedCount: results.verified.length,
        failedCount: results.failed.length,
        notificationsSent: results.notificationsSent,
        emailsSent: results.emailsSent,
        verified: results.verified,
        failed: results.failed,
      }
    });

  } catch (error: any) {
    console.error("Error verifying profiles:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify profiles" },
      { status: 500 }
    );
  }
}

// ====================== DELETE - RESET PROFILES ======================
export async function DELETE(req: Request) {
  const startTime = Date.now();
  await connectDB();

  const loggedInUser = await requireAdmin();

  if (!loggedInUser) {
    return NextResponse.json({ error: "Unauthorized, Login!!" }, { status: 401 });
  }

  if (!["admin", "super_admin"].includes(loggedInUser.role)) {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body: ResetRequest = await req.json();
    const { profileIds, hardReset = false, resetReason = "Admin requested profile reset", sendNotification = true } = body;

    if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
      return NextResponse.json(
        { error: "profileIds array is required" },
        { status: 400 }
      );
    }

    const validIds = profileIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return NextResponse.json(
        { error: "No valid profile IDs provided" },
        { status: 400 }
      );
    }

    const profiles = await Profile.find({
      _id: { $in: validIds }
    }).populate("userId", "email name") as unknown as PopulatedProfile[];

    if (profiles.length === 0) {
      return NextResponse.json(
        { error: "No profiles found with the provided IDs" },
        { status: 404 }
      );
    }

    const resetBy = loggedInUser.name || loggedInUser.email || "Admin";
    const results = {
      reset: [] as any[],
      failed: [] as any[],
      notificationsSent: 0
    };

    for (const profile of profiles) {
      try {
        const populatedUser = profile.userId as PopulatedUser;

        const resetData: any = {
          verificationStatus: "pending",
          verificationDocuments: [],
          verifiedAt: null,
          verifiedBy: null,
          metadata: {
            ...profile.metadata,
            resetAt: new Date(),
            resetBy: resetBy,
            resetReason: resetReason,
            previousVerificationStatus: profile.verificationStatus,
            wasReset: true,
            hardReset: hardReset
          }
        };

        await Profile.updateOne({ _id: profile._id }, { $set: resetData });

        if (sendNotification && populatedUser?._id) {
          const notification = new Notification({
            senderId: systemId,
            recieverId: new ObjectId(populatedUser._id),
            type: "profile_reset",
            title: hardReset ? "Profile Reset" : "Verification Reset",
            message: hardReset
              ? `Your profile has been reset by admin. All verification documents have been cleared. Please submit new documents for verification.`
              : `Your verification request has been reset by admin. Please review and resubmit your documents.`,
            priority: "high",
            message_type: 'verification',
            sender_type: 'admin',
            metadata: {
              resetAt: new Date(),
              resetBy,
              resetReason,
              hardReset
            },
            read: false,
          });
          await notification.save();
          results.notificationsSent++;
        }

        await AdminLogger.logProfileAction(
          {
            id: loggedInUser.id,
            email: loggedInUser.email,
            name: loggedInUser.name,
            role: loggedInUser.role as AdminRole
          },
          AdminAction.DELETE_USER_PROFILE,
          profile._id.toString(),
          profile.fullName,
          hardReset ? `Hard reset profile (cleared all documents)` : `Reset verification status to pending`,
          {
            changes: [
              { field: "verificationStatus", oldValue: profile.verificationStatus, newValue: "pending" },
              { field: "documentsCount", oldValue: profile.verificationDocuments?.length || 0, newValue: 0 }
            ],
            affectedCount: 1,
            duration: Date.now() - startTime,
            metadata: {
              hardReset,
              resetReason,
              previousDocumentsCount: profile.verificationDocuments?.length || 0
            }
          }
        );

        results.reset.push({
          id: profile._id,
          name: profile.fullName,
          email: populatedUser?.email,
          previousStatus: profile.verificationStatus,
          newStatus: "pending",
          hardReset
        });

      } catch (error) {
        console.error(`Failed to reset profile ${profile._id}:`, error);
        results.failed.push({
          id: profile._id,
          name: profile.fullName,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully reset ${results.reset.length} out of ${profiles.length} profiles`,
      data: {
        totalProcessed: profiles.length,
        resetCount: results.reset.length,
        failedCount: results.failed.length,
        notificationsSent: results.notificationsSent,
        reset: results.reset,
        failed: results.failed,
      }
    });

  } catch (error: any) {
    console.error("Error resetting profiles:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset profiles" },
      { status: 500 }
    );
  }
}