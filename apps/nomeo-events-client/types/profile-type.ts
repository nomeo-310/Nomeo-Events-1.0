// types/profile-type.ts

export interface ProfilePicture {
  secure_url: string;
  public_id: string;
}

export interface ProfileLocation {
  state: string;
  city: string;
  address: string;
  postalCode?: string;
  country?: string;
}

export interface ProfileContact {
  phoneNumber: string;
  officeNumber?: string;
  email: string;
  supportEmail?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
    threads?: string;
    whatsApp?: string;
  };
}

export interface ProfilePublicSettings {
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
}

export interface ProfileAnalytics {
  profileViews: number;
  eventClicks: number;
  conversionRate: number;
  lastAnalyticsUpdate: string;
}

export interface ProfileAccountDetails {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  bankCode?: string;
  routingNumber?: string;
  swiftCode?: string;
  currency?: string;
}

export interface VerificationDocument {
  documentType: "id_card" | "passport" | "drivers_license" | "cac_document";
  secure_url: string;
  public_id: string;
  verified?: boolean;
}

export interface ProfileMetadata {
  ipAddress?: string;
  userAgent?: string;
  signupSource?: string;
  referrer?: string;
}

// Base profile (fields always present)
export interface BaseProfile {
  _id: string;
  userId?: string;
  fullName: string;
  displayName?: string;
  accountType: "individual" | "organization";
  organizationName?: string;
  organizationType?: "individual" | "company" | "nonprofit" | "agency" | "government";
  organizationRegistrationNumber?: string;
  taxId?: string;
  verificationStatus: "pending" | "verified" | "rejected" | "suspended";
  verifiedAt?: string;
  activeStatus: "active" | "deactivated" | "pending" | "suspended";
  profilePicture?: ProfilePicture;
  coverPicture?: ProfilePicture;
  contact: ProfileContact;
  location: ProfileLocation;
  bio?: string;
  shortBio?: string;
  specialties?: string[];
  yearsOfExperience?: number;
  events: string[];
  totalEvents: number;
  totalAttendees: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  publicProfile: ProfilePublicSettings;
  paymentMethod?: "manual" | "online" | "transfer" | "auto";
  accountDetails?: ProfileAccountDetails;
  createdAt: string;
  updatedAt: string;
  lastActiveAt?: string;
  suspendedAt?: string;
  suspensionReason?: string;
  deactivatedAt?: string;
  
  // Computed by API
  completionPercentage: number;
  fullAddress?: string;
}

// Private profile (own user, full data)
export interface PrivateProfile extends BaseProfile {
  userId: string;
  verificationDocuments?: VerificationDocument[];
  analytics?: ProfileAnalytics;
  metadata?: ProfileMetadata;
}

// Public profile (other users, privacy-filtered)
export type PublicProfile = Omit<
  BaseProfile,
  "totalRevenue" | "paymentMethod" | "accountDetails"
> & {
  location?: ProfileLocation;
};

// API response wrappers
export interface ProfileApiResponse<T> {
  success: boolean;
  data: T;
}