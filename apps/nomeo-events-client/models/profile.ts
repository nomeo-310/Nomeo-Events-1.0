import { Schema, model, models, Types, Document, Model } from "mongoose";

export interface IProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  
  // Verification Status
  verificationStatus: "pending" | "verified" | "rejected" | "suspended";
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  verificationDocuments?: {
    documentType: "id_card" | "passport" | "drivers_license" | "cac_document";
    secure_url: string;
    public_id: string;
    verified?: boolean;
  }[];
  
  // Profile Images
  profilePicture?: {
    secure_url: string;
    public_id: string;
  };
  coverPicture?: {
    secure_url: string;
    public_id: string;
  };
  
  // Basic Information
  fullName: string;
  displayName?: string;
  
  // Location
  location: {
    state: string;
    city: string;
    address: string;
    postalCode?: string;
    country?: string;
  };
  
  // Account Type
  accountType: "individual" | "organization";
  organizationName?: string;
  organizationType?: "individual" | "company" | "nonprofit" | "agency" | "government";
  organizationRegistrationNumber?: string;
  taxId?: string;
  
  // Status
  activeStatus: "active" | "deactivated" | "pending" | "suspended";
  suspendedAt?: Date;
  suspensionReason?: string;
  deactivatedAt?: Date;
  lastActiveAt?: Date;
  
  // Contact Information
  contact: {
    phoneNumber: string;
    officeNumber?: string;
    email: string;
    supportEmail?: string;
    website?: string;
    socialMedia: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
      linkedin?: string;
      youtube?: string;
      tiktok?: string;
      threads?: string;
      whatsApp?: string;
    };
  };
  
  // Bio & Description
  bio?: string;
  shortBio?: string;
  specialties?: string[];
  yearsOfExperience?: number;
  
  // Payment & Bank Details
  paymentMethod: "manual" | "online" | "transfer" | "auto";
  accountDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    bankCode?: string;
    routingNumber?: string;
    swiftCode?: string;
    currency?: string;
  };
  
  // Events
  events: Types.ObjectId[];
  totalEvents?: number;
  totalAttendees?: number;
  totalRevenue?: number;
  
  // Ratings & Reviews
  averageRating?: number;
  totalReviews?: number;
  
  // Public Profile
  publicProfile: {
    slug: string;
    seoTitle?: string;
    seoDescription?: string;
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
  };
  
  // Analytics
  analytics?: {
    profileViews: number;
    eventClicks: number;
    conversionRate: number;
    lastAnalyticsUpdate: Date;
  };
  
  // Metadata
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    signupSource?: string;
    referrer?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  getCompletionPercentage(): number;
  getFullAddress(): string;
  incrementProfileViews(viewerId?: string): Promise<void>;
}

interface IProfileModel extends Model<IProfile> {
  findBySlug(slug: string): Promise<IProfile | null>;
  findVerifiedOrganizers(): Promise<IProfile[]>;
  getIncompleteProfiles(threshold?: number): Promise<IProfile[]>;
}

// ====================== SCHEMA ======================
const ProfileSchema = new Schema<IProfile, IProfileModel>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "user", 
      required: true, 
      unique: true,
      index: true 
    },
    
    verificationStatus: { 
      type: String, 
      enum: ["pending", "verified", "rejected", "suspended"], 
      default: "pending" 
    },
    verifiedAt: { type: Date },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verificationDocuments: [
      {
        documentType: {
          type: String,
          enum: ["id_card", "passport", "drivers_license", "cac_document"],
          required: true,
        },
        secure_url: { type: String, required: true },
        public_id: { type: String, required: true },
        verified: { type: Boolean, default: false },
      },
    ],
    
    profilePicture: {
      secure_url: { type: String },
      public_id: { type: String },
    },
    coverPicture: {
      secure_url: { type: String },
      public_id: { type: String },
    },
    
    fullName: { type: String, required: true },
    displayName: { type: String },
    
    location: {
      state: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, required: true },
      postalCode: { type: String },
      country: { type: String, default: "Nigeria" },
    },
    
    accountType: { 
      type: String, 
      enum: ["individual", "organization"], 
      required: true 
    },
    organizationName: { type: String },
    organizationType: { 
      type: String, 
      enum: ["individual", "company", "nonprofit", "agency", "government"] 
    },
    organizationRegistrationNumber: { type: String },
    taxId: { type: String },
    
    activeStatus: { 
      type: String, 
      enum: ["active", "deactivated", "pending", "suspended"], 
      default: "pending" 
    },
    suspendedAt: { type: Date },
    suspensionReason: { type: String },
    deactivatedAt: { type: Date },
    lastActiveAt: { type: Date, default: Date.now },
    
    contact: {
      phoneNumber: { type: String, required: true },
      officeNumber: { type: String },
      email: { type: String, required: true, lowercase: true },
      supportEmail: { type: String, lowercase: true },
      website: { type: String },
      socialMedia: {
        facebook: { type: String },
        instagram: { type: String },
        twitter: { type: String },
        linkedin: { type: String },
        youtube: { type: String },
        tiktok: { type: String },
        threads: { type: String },
        whatsApp: { type: String },
      },
    },
    
    bio: { type: String },
    shortBio: { type: String },
    specialties: [{ type: String }],
    yearsOfExperience: { type: Number },
    
    paymentMethod: { 
      type: String, 
      enum: ["manual", "online", "transfer", "auto"], 
      default: "manual" 
    },
    accountDetails: {
      bankName: { type: String },
      accountName: { type: String },
      accountNumber: { type: String },
      bankCode: { type: String },
      routingNumber: { type: String },
      swiftCode: { type: String },
      currency: { type: String, default: "NGN" },
    },
    
    events: [{ type: Schema.Types.ObjectId, ref: "Event" }],
    totalEvents: { type: Number, default: 0 },
    totalAttendees: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    totalReviews: { type: Number, default: 0 },
    
    publicProfile: {
      slug: { type: String, unique: true, sparse: true },
      seoTitle: { type: String },
      seoDescription: { type: String },
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      showLocation: { type: Boolean, default: true },
    },
    
    analytics: {
      profileViews: { type: Number, default: 0 },
      eventClicks: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 },
      lastAnalyticsUpdate: { type: Date },
    },
    
    metadata: {
      ipAddress: { type: String },
      userAgent: { type: String },
      signupSource: { type: String },
      referrer: { type: String },
    },
  },
  { 
    timestamps: true 
  }
);

// ====================== INDEXES ======================
ProfileSchema.index({ "contact.email": 1 });
ProfileSchema.index({ activeStatus: 1 });
ProfileSchema.index({ verificationStatus: 1 });
ProfileSchema.index({ accountType: 1 });
ProfileSchema.index({ createdAt: -1 });

// ====================== PRE-SAVE MIDDLEWARE (FIXED) ======================
ProfileSchema.pre("save", async function (this: IProfile) {
  try {
    // Initialize publicProfile if it doesn't exist
    if (!this.publicProfile) {
      this.publicProfile = {
        slug: "",
        seoTitle: undefined,
        seoDescription: undefined,
        showEmail: false,
        showPhone: false,
        showLocation: true,
      };
    }

    // Generate unique slug
    if (!this.publicProfile.slug && this.fullName) {
      let baseSlug = this.fullName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (!baseSlug) baseSlug = "profile";

      let slug = baseSlug;
      let counter = 1;

      // Check for existing slug
      while (await models.Profile?.exists({ "publicProfile.slug": slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      this.publicProfile.slug = slug;
    }

    // Update last active timestamp
    this.lastActiveAt = new Date();
    
  } catch (error: any) {
    throw error; // Mongoose will handle this as a middleware error
  }
});

// ====================== INSTANCE METHODS ======================
ProfileSchema.methods.getCompletionPercentage = function (this: IProfile): number {
  let completed = 0;
  const total = 15;

  if (this.profilePicture?.secure_url) completed++;
  if (this.coverPicture?.secure_url) completed++;
  if (this.fullName) completed++;
  if (this.location?.address && this.location?.address !== 'Not provided') completed++;
  if (this.location?.city && this.location?.city !== 'Not provided') completed++;
  if (this.location?.state && this.location.state !== 'Not provided') completed++;
  if (this.contact?.phoneNumber && this.contact?.phoneNumber !== 'Not provided') completed++;
  if (this.contact?.email) completed++;
  if (this.bio) completed++;
  if (this.specialties?.length) completed++;
  if (this.accountDetails?.accountNumber) completed++;
  if (this.publicProfile?.slug) completed++;
  if (this.verificationStatus === "verified") completed++;
  if (this.contact?.socialMedia?.twitter || this.contact?.socialMedia?.instagram) completed++;
  if (this.contact?.website) completed++;

  return Math.floor((completed / total) * 100);
};

ProfileSchema.methods.getFullAddress = function (this: IProfile): string {
  const loc = this.location || {};
  return `${loc.address}, ${loc.city}, ${loc.state}, ${loc.country || "Nigeria"}`;
};

ProfileSchema.methods.incrementProfileViews = async function (this: IProfile, viewerId?: Types.ObjectId | string ): Promise<void> {
  
  if (viewerId && this.userId.toString() === viewerId.toString()) {
    return;
  }

  if (!this.analytics) {
    this.analytics = {
      profileViews: 0,
      eventClicks: 0,
      conversionRate: 0,
      lastAnalyticsUpdate: new Date(),
    };
  }

  this.analytics.profileViews += 1;
  this.analytics.lastAnalyticsUpdate = new Date();

  await this.save();
};

// ====================== STATIC METHODS ======================
ProfileSchema.statics.findBySlug = async function (slug: string): Promise<IProfile | null> {
  return this.findOne({ "publicProfile.slug": slug });
};

ProfileSchema.statics.findVerifiedOrganizers = async function (): Promise<IProfile[]> {
  return this.find({ 
    verificationStatus: "verified", 
    activeStatus: "active" 
  }).sort({ totalEvents: -1 });
};

ProfileSchema.statics.getIncompleteProfiles = async function (threshold = 50): Promise<IProfile[]> {
  const profiles = await this.find({
    activeStatus: "active",
    verificationStatus: { $ne: "verified" },
  });
  return profiles.filter(p => p.getCompletionPercentage() < threshold);
};

// ====================== MODEL EXPORT ======================
export const Profile = (models.Profile as IProfileModel) || 
  model<IProfile, IProfileModel>("Profile", ProfileSchema);