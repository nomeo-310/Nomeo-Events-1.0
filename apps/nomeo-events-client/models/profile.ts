import { Schema, model, models, Types, Document, Model } from "mongoose";

export interface IProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  verificationStatus: "pending" | "verified" | "rejected" | "suspended" | "unverified";
  verifiedAt?: Date;
  verifiedBy?: Types.ObjectId;
  verificationDocuments?: {
    documentType: "id_card" | "passport" | "drivers_license" | "cac_document" | "proof_of_address";
    secure_url: string;
    public_id: string;
    verified?: boolean;
  }[];
  profilePicture?: { secure_url: string; public_id: string; };
  coverPicture?: { secure_url: string; public_id: string; };
  fullName: string;
  displayName?: string;
  location: {
    state: string;
    city: string;
    address: string;
    postalCode?: string;
    country?: string;
  };
  accountType: "individual" | "organization";
  organizationName?: string;
  organizationType?: "individual" | "company" | "nonprofit" | "agency" | "government";
  organizationRegistrationNumber?: string;
  taxId?: string;
  activeStatus: "active" | "deactivated" | "pending" | "suspended";
  suspendedAt?: Date;
  suspensionReason?: string;
  deactivatedAt?: Date;
  lastActiveAt?: Date;
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
  bio?: string;
  shortBio?: string;
  specialties?: string[];
  yearsOfExperience?: number;
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
  events: Types.ObjectId[];
  totalEvents?: number;
  totalAttendees?: number;
  totalRevenue?: number;
  averageRating?: number;
  totalReviews?: number;
  publicProfile: {
    slug: string;
    seoTitle?: string;
    seoDescription?: string;
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
  };
  analytics?: {
    profileViews: number;
    eventClicks: number;
    conversionRate: number;
    lastAnalyticsUpdate: Date;
  };
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    signupSource?: string;
    referrer?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  getCompletionPercentage(): number;
  getFullAddress(): string;
  incrementProfileViews(viewerId?: string): Promise<void>;
}

interface IProfileModel extends Model<IProfile> {
  findBySlug(slug: string): Promise<IProfile | null>;
  findVerifiedOrganizers(): Promise<IProfile[]>;
  getIncompleteProfiles(threshold?: number): Promise<IProfile[]>;
}

// ====================== SUBDOCUMENT SCHEMAS ======================
const ImageSchema = new Schema({
  secure_url: String,
  public_id: String,
}, { _id: false });

const VerificationDocumentSchema = new Schema({
  documentType: {
    type: String,
    enum: ["id_card", "passport", "drivers_license", "cac_document", "proof_of_address"],
    required: true,
  },
  secure_url: { type: String, required: true },
  public_id: { type: String, required: true },
  verified: { type: Boolean, default: false },
}, { _id: false });

const LocationSchema = new Schema({
  state: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  postalCode: String,
  country: { type: String, default: "Nigeria" },
}, { _id: false });

const SocialMediaSchema = new Schema({
  facebook: String,
  instagram: String,
  twitter: String,
  linkedin: String,
  youtube: String,
  tiktok: String,
  threads: String,
  whatsApp: String,
}, { _id: false });

const ContactSchema = new Schema({
  phoneNumber: { type: String, required: true },
  officeNumber: String,
  email: { type: String, required: true, lowercase: true },
  supportEmail: { type: String, lowercase: true },
  website: String,
  socialMedia: { type: SocialMediaSchema, default: () => ({}) },
}, { _id: false });

const AccountDetailsSchema = new Schema({
  bankName: String,
  accountName: String,
  accountNumber: String,
  bankCode: String,
  routingNumber: String,
  swiftCode: String,
  currency: { type: String, default: "NGN" },
}, { _id: false });

const PublicProfileSchema = new Schema({
  slug: { type: String, unique: true, sparse: true },
  seoTitle: String,
  seoDescription: String,
  showEmail: { type: Boolean, default: false },
  showPhone: { type: Boolean, default: false },
  showLocation: { type: Boolean, default: true },
}, { _id: false });

const AnalyticsSchema = new Schema({
  profileViews: { type: Number, default: 0 },
  eventClicks: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  lastAnalyticsUpdate: Date,
}, { _id: false });

const MetadataSchema = new Schema({
  ipAddress: String,
  userAgent: String,
  signupSource: String,
  referrer: String,
}, { _id: false });

// ====================== MAIN SCHEMA ======================
const ProfileSchema = new Schema<IProfile, IProfileModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected", "suspended", "unverified"],
      default: "unverified"
    },
    verifiedAt: Date,
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verificationDocuments: [VerificationDocumentSchema],

    profilePicture: ImageSchema,
    coverPicture: ImageSchema,

    fullName: { type: String, required: true },
    displayName: String,

    location: { type: LocationSchema, required: true },

    accountType: {
      type: String,
      enum: ["individual", "organization"],
      required: true
    },
    organizationName: String,
    organizationType: {
      type: String,
      enum: ["individual", "company", "nonprofit", "agency", "government"]
    },
    organizationRegistrationNumber: String,
    taxId: String,

    activeStatus: {
      type: String,
      enum: ["active", "deactivated", "pending", "suspended"],
      default: "pending"
    },
    suspendedAt: Date,
    suspensionReason: String,
    deactivatedAt: Date,
    lastActiveAt: { type: Date, default: Date.now },

    contact: { type: ContactSchema, required: true },

    bio: String,
    shortBio: String,
    specialties: [String],
    yearsOfExperience: Number,

    paymentMethod: {
      type: String,
      enum: ["manual", "online", "transfer", "auto"],
      default: "manual"
    },
    accountDetails: AccountDetailsSchema,

    events: [{ type: Schema.Types.ObjectId, ref: "Event" }],
    totalEvents: { type: Number, default: 0 },
    totalAttendees: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },

    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    totalReviews: { type: Number, default: 0 },

    publicProfile: { type: PublicProfileSchema, default: () => ({}) },

    analytics: { type: AnalyticsSchema, default: () => ({}) },

    metadata: MetadataSchema,
  },
  { timestamps: true }
);

// ====================== INDEXES ======================
ProfileSchema.index({ "contact.email": 1 });
ProfileSchema.index({ activeStatus: 1 });
ProfileSchema.index({ verificationStatus: 1 });
ProfileSchema.index({ accountType: 1 });
ProfileSchema.index({ createdAt: -1 });

// ====================== PRE-SAVE MIDDLEWARE ======================
ProfileSchema.pre("save", async function (this: IProfile) {
  try {
    if (!this.publicProfile) {
      this.publicProfile = {
        slug: "",
        showEmail: false,
        showPhone: false,
        showLocation: true,
      };
    }

    if (this.fullName && (!this.publicProfile.slug || this.isNew)) {
      let baseSlug = this.fullName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (!baseSlug) baseSlug = "profile";

      let slug = baseSlug;
      let counter = 1;
      const maxAttempts = 30;

      while (await models.Profile?.exists({ "publicProfile.slug": slug })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
        if (counter > maxAttempts) {
          slug = `${baseSlug}-${Math.floor(100000 + Math.random() * 900000)}`;
          break;
        }
      }

      this.publicProfile.slug = slug;
    }

    this.lastActiveAt = new Date();
  } catch (error: any) {
    console.error("Profile pre-save error:", error);
    throw error;
  }
});

// ====================== INSTANCE METHODS ======================
ProfileSchema.methods.getCompletionPercentage = function (this: IProfile): number {
  let completed = 0;
  const total = 15;

  if (this.profilePicture?.secure_url) completed++;
  if (this.coverPicture?.secure_url) completed++;
  if (this.fullName) completed++;
  if (this.location?.address) completed++;
  if (this.location?.city) completed++;
  if (this.location?.state) completed++;
  if (this.contact?.phoneNumber) completed++;
  if (this.contact?.email) completed++;
  if (this.bio) completed++;
  if (this.specialties?.length) completed++;
  if (this.accountDetails?.accountNumber) completed++;
  if (this.publicProfile?.slug) completed++;
  if (this.verificationStatus === "verified") completed++;
  if (this.contact?.socialMedia &&
    (this.contact.socialMedia.twitter || this.contact.socialMedia.instagram)) completed++;
  if (this.contact?.website) completed++;

  return Math.floor((completed / total) * 100);
};

ProfileSchema.methods.getFullAddress = function (this: IProfile): string {
  const loc = this.location || {};
  return `${loc.address || ''}, ${loc.city || ''}, ${loc.state || ''}, ${loc.country || "Nigeria"}`.replace(/, ,/g, ',');
};

ProfileSchema.methods.incrementProfileViews = async function (
  this: IProfile,
  viewerId?: string
): Promise<void> {
  if (viewerId && this.userId.toString() === viewerId.toString()) return;

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
export const Profile = (models.Profile as IProfileModel) || model<IProfile, IProfileModel>("Profile", ProfileSchema);