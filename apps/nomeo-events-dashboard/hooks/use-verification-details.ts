// hooks/use-verification-details.ts
import { useQuery } from "@tanstack/react-query";

interface VerificationDocument {
  documentType: string;
  documentTypeLabel: string;
  secure_url: string;
  public_id: string;
  verified: boolean;
  thumbnail_url?: string;
}

interface VerificationDetailsResponse {
  success: boolean;
  data: {
    profile: {
      _id: string;
      fullName: string;
      displayName?: string;
      accountType: string;
      organizationName?: string;
      organizationType?: string;
      organizationRegistrationNumber?: string;
      taxId?: string;
      bio?: string;
      shortBio?: string;
      specialties: string[];
      yearsOfExperience?: number;
      verificationStatus: string;
      activeStatus: string;
      profilePicture?: {
        secure_url: string;
        public_id: string;
        thumbnail_url?: string;
      };
      coverPicture?: {
        secure_url: string;
        public_id: string;
      };
      verificationDocuments: VerificationDocument[];
      createdAt: string;
      updatedAt: string;
      lastActiveAt?: string;
    };
    contact: {
      email: string;
      phoneNumber: string;
      officeNumber?: string;
      website?: string;
      socialMedia: Record<string, string>;
    };
    location: {
      address: string;
      city: string;
      state: string;
      postalCode?: string;
      country: string;
      fullAddress: string;
    };
    userAccount: {
      _id: string;
      name: string;
      email: string;
      emailVerified: boolean;
      role: string;
      avatar?: string;
      createdAt: string;
      lastLogin?: string;
    } | null;
    verificationRequest: {
      isPending: boolean;
      documentsCount: number;
      documentsByType: Record<string, number>;
      submittedAt: string;
      daysPending: number;
    };
    verificationHistory: {
      verifiedAt?: string;
      verifiedBy?: {
        name: string;
        email: string;
      };
      previousStatus: string | null;
    };
    metadata: {
      profileCompletionPercentage: number;
      hasRequiblueDocuments: boolean;
      missingRequiblueFields: string[];
    };
  };
}

async function fetchVerificationDetails(id: string): Promise<VerificationDetailsResponse> {
  const response = await fetch(`/api/admin/profiles/pending-verification/${id}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch verification details");
  }
  
  return response.json();
}

export function useVerificationDetails(id: string | null) {
  return useQuery({
    queryKey: ["verification-details", id],
    queryFn: () => fetchVerificationDetails(id!),
    enabled: !!id && id !== "",
    staleTime: 0, // Always fetch fresh data for verification details
  });
}