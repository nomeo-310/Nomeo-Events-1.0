// app/api/user/profile/verify/request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Profile } from "@/models/profile";

export async function POST(req: NextRequest) {
  try {
    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    await connectDB();

    const profile = await Profile.findOne({ userId: new Types.ObjectId(loggedInUser.id) });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found" },
        { status: 404 }
      );
    }

    // Check if already verified or pending
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

    // Get documents from request body
    const { documents } = await req.json();

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { success: false, error: "No documents provided" },
        { status: 400 }
      );
    }

    // Validate required documents based on account type
    const hasIdentityDoc = documents.some((doc: any) => 
      ['id_card', 'passport', 'drivers_license', 'voters_card'].includes(doc.documentType)
    );
    
    const hasProofOfAddress = documents.some((doc: any) => doc.documentType === 'proof_of_address');
    
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
      const hasCacDoc = documents.some((doc: any) => doc.documentType === 'cac_document');
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
          { success: false, error: "Invalid document data" },
          { status: 400 }
        );
      }
    }

    // Add verified: false to each document and update profile
    const verificationDocuments = documents.map(doc => ({
      documentType: doc.documentType,
      secure_url: doc.secure_url,
      public_id: doc.public_id,
      verified: false
    }));

    // Update profile with verification documents and status
    profile.verificationStatus = 'pending';
    profile.verificationDocuments = verificationDocuments;
    profile.verifiedAt = undefined;
    profile.verifiedBy = undefined;
    
    await profile.save();

    return NextResponse.json(
      { 
        success: true, 
        status: "pending",
        message: "Verification request submitted successfully. Our team will review your documents."
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[POST /api/user/profile/verify/request]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit verification request" },
      { status: 500 }
    );
  }
}