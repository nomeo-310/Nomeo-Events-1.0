// app/api/user/profile/verify/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Profile } from "@/models/profile";
import { User } from "@/models/user";
import { Notification } from "@/models/notification";

// ─── Constants ──────────────────────────────────────────────────────────────────

const SYSTEM_USER_ID = new Types.ObjectId("000000000000000000000001");

const IDENTITY_DOC_TYPES = ['id_card', 'passport', 'drivers_license', 'voters_card'];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDocType(docType: string): string {
  return docType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter: string) => letter.toUpperCase());
}

function getAccountTypeLabel(profile: any): string {
  if (profile.accountType === 'organization') {
    return `${profile.organizationName || 'Organization'} (Organization)`;
  }
  return 'Individual';
}

// ─── POST ───────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Authentication ────────────────────────────────────────────────────────
    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    await connectDB();

    // ── Find profile ──────────────────────────────────────────────────────────
    const profile = await Profile.findOne({ 
      userId: new Types.ObjectId(loggedInUser.id) 
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    // ── Status checks ─────────────────────────────────────────────────────────
    if (profile.verificationStatus === 'verified') {
      return NextResponse.json(
        { success: false, error: "Profile is already verified" },
        { status: 400 }
      );
    }

    if (profile.verificationStatus === 'pending') {
      return NextResponse.json(
        { success: false, error: "Verification request is already pending" },
        { status: 400 }
      );
    }

    // ── Validate documents ────────────────────────────────────────────────────
    const { documents } = await req.json();

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { success: false, error: "No documents provided" },
        { status: 400 }
      );
    }

    // Check required document types
    const hasIdentityDoc = documents.some((doc: any) => 
      IDENTITY_DOC_TYPES.includes(doc.documentType)
    );
    
    const hasProofOfAddress = documents.some((doc: any) => 
      doc.documentType === 'proof_of_address'
    );
    
    if (!hasIdentityDoc) {
      return NextResponse.json(
        { success: false, error: "Identity document is required" },
        { status: 400 }
      );
    }
    
    if (!hasProofOfAddress) {
      return NextResponse.json(
        { success: false, error: "Proof of address is required" },
        { status: 400 }
      );
    }
    
    // For organizations, CAC document is required
    if (profile.accountType === 'organization') {
      const hasCacDoc = documents.some((doc: any) => 
        doc.documentType === 'cac_document'
      );
      if (!hasCacDoc) {
        return NextResponse.json(
          { success: false, error: "CAC registration document is required for organizations" },
          { status: 400 }
        );
      }
    }

    // Validate each document has required fields
    for (const doc of documents) {
      if (!doc.documentType || !doc.secure_url || !doc.public_id) {
        return NextResponse.json(
          { success: false, error: "Invalid document data. Each document must have documentType, secure_url, and public_id." },
          { status: 400 }
        );
      }
    }

    // ── Prepare verification documents ────────────────────────────────────────
    const verificationDocuments = documents.map((doc: any) => ({
      documentType: doc.documentType,
      secure_url: doc.secure_url,
      public_id: doc.public_id,
      verified: false,
    }));

    // ── Update profile ────────────────────────────────────────────────────────
    profile.verificationStatus = 'pending';
    profile.verificationDocuments = verificationDocuments;
    profile.verifiedAt = undefined;
    profile.verifiedBy = undefined;
    
    await profile.save();

    // ── Create notifications ──────────────────────────────────────────────────
    const docTypesList = documents.map((d: any) => formatDocType(d.documentType)).join(', ');
    const accountTypeLabel = getAccountTypeLabel(profile);
    const now = new Date();

    // 1. Notify the user
    await Notification.create({
      senderId: SYSTEM_USER_ID,
      receiverId: profile.userId,
      title: "Verification Request Submitted",
      message: `Your verification request has been received. We're reviewing your ${docTypesList}. This usually takes 1–2 business days. We'll notify you once the review is complete.`,
      message_type: "verification",
      createdAt: now,
      updatedAt: now,
    });

    // 2. Notify all admins
    const admins = await User.find({ role: { $in: ["admin", "superadmin"] } }).select('_id');

    if (admins.length > 0) {
      const adminNotifications = admins.map((admin) => ({
        senderId: SYSTEM_USER_ID,
        receiverId: admin._id,
        title: "New Verification Request",
        message: `${profile.fullName} (${profile.contact?.email || 'No email'}) has submitted verification documents for review.\n\nAccount type: ${accountTypeLabel}\nDocuments: ${docTypesList}\n\nReview this request in the admin dashboard.`,
        message_type: "verification",
        metadata: {
          profileId: profile._id.toString(),
          userId: profile.userId.toString(),
          verificationStatus: 'pending',
          documentCount: documents.length,
        },
        createdAt: now,
        updatedAt: now,
      }));

      await Notification.insertMany(adminNotifications);
    }

    // ── Return success ────────────────────────────────────────────────────────
    return NextResponse.json(
      { 
        success: true, 
        status: "pending",
        message: "Verification request submitted successfully. Our team will review your documents.",
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error("[POST /api/user/profile/verify/request]", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Failed to submit verification request" 
      },
      { status: 500 }
    );
  }
}