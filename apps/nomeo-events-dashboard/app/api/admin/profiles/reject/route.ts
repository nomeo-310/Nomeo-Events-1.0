import { requireAdmin } from "@/lib/admin/authorization";
import { connectDB } from "@/lib/mongoose";
import { Profile } from "@/models/profile";
import { Notification } from "@/models/notification";
import { NextResponse } from "next/server";
import { sendVerificationRejectionEmail } from "@/lib/email/send-verification-rejection-email";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import { AdminLogger } from "@/services/admin-logger-services";
import { AdminAction, AdminRole } from "@/models/admin-log";

interface RejectionRequest {
  profileIds: string[];
  reason: string;
  sendEmail?: boolean;
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
  metadata?: any;
  [key: string]: any;
}

const systemId = new ObjectId('000000000000000000000001');

async function createRejectionNotification( userId: mongoose.Types.ObjectId, profileName: string, rejectedBy: string, reason: string ) {
  try {
    const notification = new Notification({
      senderId: systemId,
      recieverId: new ObjectId(userId),
      title: "Verification Request Needs Review",
      message: `Hello ${profileName}, your account verification needs attention. ${rejectedBy} has requested changes. Reason: ${reason}. Please log in to review and resubmit your documents.`,
      message_type: 'verification',
      sender_type: 'admin',
      metadata: {
        rejectedAt: new Date(),
        rejectedBy,
        reason,
        action: "verification_rejected",
        canResubmit: true
      },
      read: false,
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating rejection notification:", error);
    return null;
  }
}

export async function PATCH(req: Request) {
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
    const body: RejectionRequest = await req.json();
    const { profileIds, reason, sendEmail = true, sendNotification = true } = body;

    if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
      return NextResponse.json(
        { error: "profileIds array is required" },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
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
      verificationStatus: "pending"
    }).populate("userId", "email name") as unknown as PopulatedProfile[];

    if (profiles.length === 0) {
      return NextResponse.json(
        { error: "No pending verification profiles found with the provided IDs" },
        { status: 404 }
      );
    }

    const rejectedBy = loggedInUser.name || loggedInUser.email || "Admin";
    const results = {
      rejected: [] as any[],
      failed: [] as any[],
      notificationsSent: 0,
      emailsSent: 0
    };

    for (const profile of profiles) {
      try {
        const populatedUser = profile.userId as PopulatedUser;

        profile.verificationStatus = "rejected";
        profile.metadata = {
          ...profile.metadata,
          rejectionReason: reason,
          rejectedAt: new Date(),
          rejectedBy: rejectedBy,
          canResubmit: true,
          previousVerificationStatus: "pending",
          rejectionCount: (profile.metadata?.rejectionCount || 0) + 1
        };

        if (profile.verificationDocuments && profile.verificationDocuments.length > 0) {
          profile.verificationDocuments.forEach((doc: any) => {
            doc.verified = false;
            doc.rejectionReason = reason;
            doc.rejectedAt = new Date();
            doc.rejectedBy = rejectedBy;
          });
        }

        await profile.save();

        if (sendNotification && populatedUser?._id) {
          await createRejectionNotification(
            populatedUser._id,
            profile.fullName,
            rejectedBy,
            reason
          );
          results.notificationsSent++;
        }

        if (sendEmail && populatedUser?.email) {
          await sendVerificationRejectionEmail({
            email: populatedUser.email,
            name: profile.fullName,
            rejectedBy,
            reason,
            rejectedAt: new Date(),
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
          AdminAction.REJECT_VERIFICATION,
          profile._id.toString(),
          profile.fullName,
          `Rejected ${profile.accountType} account verification. Reason: ${reason.substring(0, 100)}`,
          {
            changes: [
              { field: "verificationStatus", oldValue: "pending", newValue: "rejected" },
              { field: "rejectionReason", oldValue: null, newValue: reason }
            ],
            reason: reason,
            affectedCount: 1,
            duration: Date.now() - startTime,
            metadata: {
              accountType: profile.accountType,
              documentCount: profile.verificationDocuments?.length || 0,
              emailSent: sendEmail,
              notificationSent: sendNotification
            }
          }
        );

        results.rejected.push({
          id: profile._id,
          name: profile.fullName,
          email: populatedUser?.email,
          status: profile.verificationStatus,
          reason: reason
        });

      } catch (error) {
        console.error(`Failed to reject profile ${profile._id}:`, error);
        results.failed.push({
          id: profile._id,
          name: profile.fullName,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    if (results.rejected.length > 0) {
      await AdminLogger.logProfileAction(
        {
          id: loggedInUser.id,
          email: loggedInUser.email,
          name: loggedInUser.name,
          role: loggedInUser.role as AdminRole
        },
        AdminAction.REJECT_VERIFICATION,
        "bulk",
        `${results.rejected.length} Profiles`,
        `Bulk rejected ${results.rejected.length} profile(s) (${results.failed.length} failed)`,
        {
          affectedCount: results.rejected.length,
          duration: Date.now() - startTime,
          reason: reason,
          metadata: {
            totalProcessed: profiles.length,
            successCount: results.rejected.length,
            failedCount: results.failed.length,
            emailsSent: results.emailsSent,
            notificationsSent: results.notificationsSent
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully rejected ${results.rejected.length} out of ${profiles.length} profiles`,
      data: {
        totalProcessed: profiles.length,
        rejectedCount: results.rejected.length,
        failedCount: results.failed.length,
        notificationsSent: results.notificationsSent,
        emailsSent: results.emailsSent,
        rejected: results.rejected,
        failed: results.failed,
      }
    });

  } catch (error: any) {
    console.error("Error rejecting verification requests:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject verification requests" },
      { status: 500 }
    );
  }
};