// app/api/admin/profiles/pending-verification/[id]/route.ts
import { requireAuth } from "@/lib/admin/authorization";
import { connectDB } from "@/lib/mongoose";
import { Profile } from "@/models/profile";
import { User } from "@/models/user";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET( req: Request, { params }: { params: Promise<{ id: string }>}) {
  await connectDB();

  const loggedInUser = await requireAuth();
  
  if (!loggedInUser) {
    return NextResponse.json({ error: "Unauthorized, Login!!" }, { status: 401 });
  }
  
  // Check if user has admin privileges
  if (!["admin", "super_admin"].includes(loggedInUser.role)) {
    return NextResponse.json({ error: "Forbidden: Admin access requiblue" }, { status: 403 });
  }
  
  try {
    const { id } = await params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid profile ID" }, { status: 400 });
    }
    
    // Find the profile with full population
    const profile = await Profile.findById(id)
      .populate({path: "userId", model: User , select: "name email emailVerified"})
      .populate({path: "verifiedBy", model: User, select: "name email role"})
      .lean() as any;
    
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    
    // Get the associated user document for additional details
    const user = await User.findById(profile.userId?._id || profile.userId)
      .select("name email emailVerified role avatar createdAt")
      .lean();
    
    // Check if this is a pending verification request
    const isPendingVerification = 
      profile.verificationStatus === "pending" &&
      profile.verificationDocuments && 
      profile.verificationDocuments.length > 0;
    
    // Format verification documents with full URLs
    const verificationDocuments = profile.verificationDocuments?.map((doc: any) => ({
      documentType: doc.documentType,
      documentTypeLabel: getDocumentTypeLabel(doc.documentType),
      secure_url: doc.secure_url,
      public_id: doc.public_id,
      verified: doc.verified || false,
      // Generate thumbnail URL if needed (you can add image optimization)
      thumbnail_url: doc.secure_url?.replace(/\/upload\//, '/upload/w_200,h_200,c_fill/'),
    })) || [];
    
    // Format profile picture
    const profilePicture = profile.profilePicture ? {
      secure_url: profile.profilePicture.secure_url,
      public_id: profile.profilePicture.public_id,
      thumbnail_url: profile.profilePicture.secure_url?.replace(/\/upload\//, '/upload/w_100,h_100,c_fill/'),
    } : null;
    
    // Format cover picture
    const coverPicture = profile.coverPicture ? {
      secure_url: profile.coverPicture.secure_url,
      public_id: profile.coverPicture.public_id,
    } : null;
    
    // Prepare response data
    const verificationDetails = {
      // Profile Information
      profile: {
        _id: profile._id,
        fullName: profile.fullName,
        displayName: profile.displayName,
        accountType: profile.accountType,
        organizationName: profile.organizationName,
        organizationType: profile.organizationType,
        organizationRegistrationNumber: profile.organizationRegistrationNumber,
        taxId: profile.taxId,
        bio: profile.bio,
        shortBio: profile.shortBio,
        specialties: profile.specialties || [],
        yearsOfExperience: profile.yearsOfExperience,
        
        // Status
        verificationStatus: profile.verificationStatus,
        activeStatus: profile.activeStatus,
        
        // Images
        profilePicture,
        coverPicture,
        verificationDocuments,
        
        // Dates
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        lastActiveAt: profile.lastActiveAt,
      },
      
      // Contact Information
      contact: {
        email: profile.contact?.email,
        phoneNumber: profile.contact?.phoneNumber,
        officeNumber: profile.contact?.officeNumber,
        website: profile.contact?.website,
        socialMedia: profile.contact?.socialMedia || {},
      },
      
      // Location Information
      location: {
        address: profile.location?.address,
        city: profile.location?.city,
        state: profile.location?.state,
        postalCode: profile.location?.postalCode,
        country: profile.location?.country || "Nigeria",
        fullAddress: getFullAddress(profile.location),
      },
      
      // User Account Information
      userAccount: user ? {
        _id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      } : null,
      
      // Verification Request Details
      verificationRequest: {
        isPending: isPendingVerification,
        documentsCount: verificationDocuments.length,
        documentsByType: getDocumentsByType(verificationDocuments),
        submittedAt: profile.updatedAt, // When documents were last updated
        daysPending: Math.floor((Date.now() - new Date(profile.updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
      },
      
      // Verification History (if previously verified or rejected)
      verificationHistory: {
        verifiedAt: profile.verifiedAt,
        verifiedBy: profile.verifiedBy ? {
          name: profile.verifiedBy.name,
          email: profile.verifiedBy.email,
        } : null,
        previousStatus: getPreviousVerificationStatus(profile),
      },
      
      // Additional Metadata
      metadata: {
        profileCompletionPercentage: calculateProfileCompletion(profile),
        hasRequiblueDocuments: hasRequiblueDocuments(profile),
        missingRequiblueFields: getMissingRequiblueFields(profile),
      }
    };
    
    return NextResponse.json({
      success: true,
      data: verificationDetails,
    });
    
  } catch (error: any) {
    console.error("Error fetching verification details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch verification details" },
      { status: 500 }
    );
  }
}

// Helper functions
function getDocumentTypeLabel(documentType: string): string {
  const labels: Record<string, string> = {
    "id_card": "National ID Card",
    "passport": "International Passport",
    "drivers_license": "Driver's License",
    "cac_document": "CAC Registration Document",
    "proof_of_address": "Proof of Address",
  };
  return labels[documentType] || documentType;
}

function getFullAddress(location: any): string {
  if (!location) return "N/A";
  const parts = [
    location.address,
    location.city,
    location.state,
    location.country || "Nigeria"
  ].filter(Boolean);
  return parts.join(", ");
}

function getDocumentsByType(documents: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  documents.forEach(doc => {
    const type = doc.documentType;
    counts[type] = (counts[type] || 0) + 1;
  });
  return counts;
}

function getPreviousVerificationStatus(profile: any): string | null {
  // If there's a verifiedAt but status is pending, it was previously processed
  if (profile.verifiedAt && profile.verificationStatus === "pending") {
    return "previously_processed";
  }
  return null;
}

function calculateProfileCompletion(profile: any): number {
  let completed = 0;
  const total = 20;
  
  if (profile.profilePicture?.secure_url) completed++;
  if (profile.coverPicture?.secure_url) completed++;
  if (profile.fullName) completed++;
  if (profile.displayName) completed++;
  if (profile.bio) completed++;
  if (profile.shortBio) completed++;
  if (profile.specialties?.length) completed++;
  if (profile.yearsOfExperience) completed++;
  if (profile.location?.address) completed++;
  if (profile.location?.city) completed++;
  if (profile.location?.state) completed++;
  if (profile.contact?.phoneNumber) completed++;
  if (profile.contact?.email) completed++;
  if (profile.contact?.website) completed++;
  if (profile.contact?.socialMedia && Object.values(profile.contact.socialMedia).some(v => v)) completed++;
  if (profile.accountType === "organization" && profile.organizationName) completed++;
  if (profile.accountType === "organization" && profile.organizationRegistrationNumber) completed++;
  if (profile.publicProfile?.slug) completed++;
  if (profile.verificationDocuments?.length) completed++;
  
  return Math.floor((completed / total) * 100);
}

function hasRequiblueDocuments(profile: any): boolean {
  if (!profile.verificationDocuments || profile.verificationDocuments.length === 0) {
    return false;
  }
  
  // For organizations, require CAC document
  if (profile.accountType === "organization") {
    return profile.verificationDocuments.some((doc: any) => 
      doc.documentType === "cac_document"
    );
  }
  
  // For individuals, require at least one valid ID
  const validIdTypes = ["id_card", "passport", "drivers_license"];
  return profile.verificationDocuments.some((doc: any) => 
    validIdTypes.includes(doc.documentType)
  );
}

function getMissingRequiblueFields(profile: any): string[] {
  const missing: string[] = [];
  
  if (!profile.fullName) missing.push("Full Name");
  if (!profile.contact?.email) missing.push("Email");
  if (!profile.contact?.phoneNumber) missing.push("Phone Number");
  if (!profile.location?.address) missing.push("Address");
  if (!profile.location?.city) missing.push("City");
  if (!profile.location?.state) missing.push("State");
  
  if (profile.accountType === "organization") {
    if (!profile.organizationName) missing.push("Organization Name");
    if (!hasRequiblueDocuments(profile)) missing.push("CAC Registration Document");
  } else {
    if (!hasRequiblueDocuments(profile)) missing.push("Valid ID Document (ID Card/Passport/Driver's License)");
  }
  
  return missing;
}