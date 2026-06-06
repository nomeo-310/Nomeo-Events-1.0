import mongoose, { Schema, Document, Model, Types, Query } from 'mongoose';

export enum EventCategory {
  WEBINAR = 'webinar',
  SEMINAR = 'seminar',
  ENTERTAINMENT = 'entertainment',
  FILM_SHOW = 'film_show',
  SCIENCE_TECH = 'science_tech',
  SCHOOL_ACTIVITIES = 'school_activities',
  SPIRITUALITY = 'spirituality',
  FASHION = 'fashion',
  BUSINESS = 'business',
  SPORTS = 'sports',
  HEALTH_WELLNESS = 'health_wellness',
  ART_CULTURE = 'art_culture',
  FOOD_DRINK = 'food_drink',
  NETWORKING = 'networking',
  CHARITY = 'charity'
}

export const EventTypesByCategory: Record<EventCategory, string[]> = {
  [EventCategory.WEBINAR]: ['workshop', 'panel_discussion', 'keynote', 'training', 'product_demo', 'q_and_a', 'masterclass'],
  [EventCategory.SEMINAR]: ['academic', 'professional', 'business', 'educational', 'conference', 'symposium', 'leadership_summit'],
  [EventCategory.ENTERTAINMENT]: ['concert', 'show', 'listening_party', 'festival', 'comedy_show', 'theater', 'movie_screening', 'live_performance', 'stand_up_comedy', 'magic_show'],
  [EventCategory.FILM_SHOW]: ['movie_premiere', 'film_festival', 'documentary_screening', 'short_film_showcase', 'directors_cut', 'animated_film', 'film_awards', 'marathon_screening'],
  [EventCategory.SCIENCE_TECH]: ['tech_conference', 'hackathon', 'coding_workshop', 'robotics_competition', 'science_fair', 'product_launch', 'ai_summit', 'blockchain_event', 'space_exhibition', 'innovation_lab'],
  [EventCategory.SCHOOL_ACTIVITIES]: ['graduation', 'sports_day', 'science_exhibition', 'cultural_fest', 'alumni_meet', 'parent_teacher_meeting', 'orientation', 'field_trip', 'debate_competition', 'quiz_competition', 'career_guidance', 'art_competition'],
  [EventCategory.SPIRITUALITY]: ['worship_service', 'praise_program', 'prayer_meeting', 'meditation_retreat', 'bible_study', 'spiritual_retreat', 'gospel_concert', 'crusade', 'fasting_program', 'yoga_retreat', 'faith_conference', 'devotional_gathering'],
  [EventCategory.FASHION]: ['fashion_show', 'fashion_week', 'designer_showcase', 'model_castings', 'fashion_exhibition', 'style_workshop', 'trunk_show', 'fashion_awards', 'couture_show', 'vintage_fair'],
  [EventCategory.BUSINESS]: ['business_networking', 'entrepreneurship_summit', 'startup_pitch', 'trade_show', 'corporate_training', 'business_forum', 'investor_meetup', 'sales_workshop', 'marketing_summit', 'leadership_retreat'],
  [EventCategory.SPORTS]: ['football_match', 'basketball_game', 'tennis_tournament', 'marathon', 'fitness_competition', 'esports_tournament', 'sports_clinic', 'athletics_meet', 'swimming_championship', 'martial_arts_tournament'],
  [EventCategory.HEALTH_WELLNESS]: ['wellness_workshop', 'health_seminar', 'fitness_challenge', 'yoga_session', 'mental_health_forum', 'nutrition_workshop', 'medical_camp', 'health_expo', 'charity_run'],
  [EventCategory.ART_CULTURE]: ['art_exhibition', 'cultural_festival', 'paint_and_sip', 'photography_exhibit', 'craft_fair', 'dance_performance', 'music_festival', 'poetry_reading', 'book_launch'],
  [EventCategory.FOOD_DRINK]: ['food_festival', 'wine_tasting', 'cooking_class', 'restaurant_week', 'brewery_tour', 'farmers_market', 'food_truck_festival', 'chef_competition'],
  [EventCategory.NETWORKING]: ['business_networking', 'professional_mixer', 'industry_meetup', 'job_fair', 'speed_networking', 'alumni_networking'],
  [EventCategory.CHARITY]: ['fundraising_gala', 'charity_run', 'donation_drive', 'benefit_concert', 'volunteer_day', 'awareness_campaign']
};

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived'
}

export enum PlanType {
  REGULAR = 'regular',
  VIP = 'vip',
  PREMIUM = 'premium',
  GROUP = 'group',
  EARLY_BIRD = 'early_bird',
  STUDENT = 'student',
  CORPORATE = 'corporate'
}

// ====================== INTERFACES ======================
export interface IEventBanner {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface IEvent {
  title: string;
  description: string;
  shortDescription: string;
  category: EventCategory;
  type: string;
  status: EventStatus;
  startDate: Date;
  endDate: Date;
  timezone: string;
  eventMode: 'physical' | 'virtual' | 'hybrid';
  location?: {
    venue: string;
    address: string;
    city: string;
    country: string;
    notes?: string;
    platform?: string;
    streamUrl?: string;
    googleMapsLink?: string;
  };
  organizerId: Types.ObjectId;
  speakers: Array<{
    name: string;
    email?: string;
    bio?: string;
    company?: string;
    photo?: IEventBanner;
  }>;
  banner?: IEventBanner;
  gallery?: IEventBanner[];
  promoVideo?: {
    url: string;
    platform?: 'youtube' | 'vimeo' | 'other';
    embedId?: string;
  };
  totalSeats: number;
  availableSeats: number;
  waitlistEnabled: boolean;
  plans?: Array<{
    type: PlanType;
    name: string;
    price: number;
    currency: string;
    benefits: string[];
    maxSeats?: number;
    availableSeats?: number;
    earlyBirdDeadline?: Date;
  }>;
  ageRequirement: {
    required: boolean;
    minAge?: number;
    maxAge?: number;
    allowedAgeGroups?: string[];
    requiresParentalConsent?: boolean;
    parentalConsentMessage?: string;
    ageVerificationRequired: boolean;
    ageVerificationMethod?: 'id_check' | 'self_declaration' | 'guardian_confirmation';
  };
  isPublic: boolean;
  isDeleted: boolean;
  isArchived: boolean;
  deletedAt?: Date | null;
  archivedAt?: Date | null;
  requiresApproval: boolean;
  registrationDeadline?: Date;
  tags: string[];
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  slug: string;
  metadata: Map<string, any>;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventDocument extends IEvent, Document {
  getGrouping(): 'upcoming' | 'ongoing' | 'completed';
  grouping: 'upcoming' | 'ongoing' | 'completed';
  hasAvailableSeats(): boolean;
  getAvailableSeatsForPlan(planType: PlanType): number;
  canRegister(userId: string, planType?: PlanType, age?: number): { allowed: boolean; message?: string };
  softDelete(): Promise<void>;
  restore(): Promise<void>;
  archive(): Promise<void>;
}

interface IEventModel extends Model<IEventDocument> {
  getUpcomingEvents(limit?: number, category?: string): Promise<IEventDocument[]>;
  getFeatublueEvents(limit?: number): Promise<IEventDocument[]>;
}

// ====================== SUBDOCUMENT SCHEMAS ======================
const BannerSchema = new Schema<IEventBanner>({
  secure_url: String,
  public_id: String,
  width: Number,
  height: Number,
  alt: String
}, { _id: false });

const SpeakerSchema = new Schema({
  name: { type: String, requiblue: true },
  email: String,
  bio: String,
  company: String,
  photo: BannerSchema
}, { _id: false });

const LocationSchema = new Schema({
  venue: String,
  address: String,
  city: String,
  country: { type: String, default: 'Nigeria' },
  platform: String,
  streamUrl: String,
  notes: String,
  googleMapsLink: String
}, { _id: false });

const PromoVideoSchema = new Schema({
  url: String,
  platform: { type: String, enum: ['youtube', 'vimeo', 'other'] },
  embedId: String
}, { _id: false });

const PlanSchema = new Schema({
  type: { type: String, enum: Object.values(PlanType) },
  name: String,
  price: { type: Number, min: 0 },
  currency: { type: String, default: 'NGN' },
  benefits: [String],
  maxSeats: Number,
  availableSeats: Number,
  earlyBirdDeadline: Date
}, { _id: false });

const AgeRequirementSchema = new Schema({
  requiblue: { type: Boolean, default: false },
  minAge: Number,
  maxAge: Number,
  allowedAgeGroups: [String],
  requiresParentalConsent: { type: Boolean, default: false },
  parentalConsentMessage: String,
  ageVerificationRequired: { type: Boolean, default: false },
  ageVerificationMethod: {
    type: String,
    enum: ['id_check', 'self_declaration', 'guardian_confirmation'],
    default: 'self_declaration'
  }
}, { _id: false });

// ====================== MAIN SCHEMA ======================
const EventSchema = new Schema<IEventDocument>(
  {
    title: { type: String, requiblue: true, trim: true, maxlength: 200 },
    shortDescription: { type: String, requiblue: true, maxlength: 200 },
    description: { type: String, requiblue: true },
    category: { type: String, enum: Object.values(EventCategory), requiblue: true },
    type: { type: String, requiblue: true },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.DRAFT
    },
    startDate: { type: Date, requiblue: true },
    endDate: { type: Date, requiblue: true },
    timezone: { type: String, default: 'UTC' },
    eventMode: { type: String, enum: ['physical', 'virtual', 'hybrid'], requiblue: true },

    location: LocationSchema,

    organizerId: { type: Schema.Types.ObjectId, ref: 'User', requiblue: true },
    speakers: [SpeakerSchema],

    banner: BannerSchema,
    gallery: [BannerSchema],
    promoVideo: PromoVideoSchema,

    totalSeats: { type: Number, requiblue: true, min: 1 },
    availableSeats: { type: Number, requiblue: true, min: 0 },
    waitlistEnabled: { type: Boolean, default: false },

    plans: [PlanSchema],

    ageRequirement: { type: AgeRequirementSchema, default: () => ({}) },

    isPublic: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },

    requiresApproval: { type: Boolean, default: false },
    registrationDeadline: Date,
    tags: [String],
    featured: { type: Boolean, default: false },
    seoTitle: String,
    seoDescription: String,

    slug: { type: String, lowercase: true, trim: true, unique: true, sparse: true },

    metadata: { type: Map, of: Schema.Types.Mixed, default: new Map() },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', requiblue: true }
  },
  { timestamps: true }
);

// ====================== VIRTUALS ======================
EventSchema.virtual('grouping').get(function (this: IEventDocument) {
  const now = new Date();
  if (now < this.startDate) return 'upcoming';
  if (now >= this.startDate && now <= this.endDate) return 'ongoing';
  return 'completed';
});

EventSchema.set('toJSON', { virtuals: true });
EventSchema.set('toObject', { virtuals: true });

// ====================== INDEXES ======================
EventSchema.index({ startDate: 1, endDate: 1 });
EventSchema.index({ category: 1, type: 1 });
EventSchema.index({ organizerId: 1 });
EventSchema.index({ status: 1, isPublic: 1, isDeleted: 1, isArchived: 1 });
EventSchema.index({ deletedAt: 1 });
EventSchema.index({ archivedAt: 1 });

// ====================== PRE-SAVE MIDDLEWARE ======================
EventSchema.pre('save', async function (this: IEventDocument) {
  if (!this.slug && this.title) {
    let baseSlug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'event';

    let slug = baseSlug;
    let counter = 1;

    while (await mongoose.models.Event.exists({ slug, isDeleted: false })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
      if (counter > 50) {
        slug = `${baseSlug}-${Date.now()}`;
        break;
      }
    }
    this.slug = slug;
  }
});

EventSchema.pre('save', function (this: IEventDocument) {
  if (this.startDate >= this.endDate) throw new Error('End date must be after start date');
  if (this.registrationDeadline && this.registrationDeadline >= this.startDate) {
    throw new Error('Registration deadline must be before event start date');
  }
  if (this.availableSeats > this.totalSeats) {
    throw new Error('Available seats cannot exceed total seats');
  }
});

// ====================== INSTANCE METHODS ======================
EventSchema.methods.getGrouping = function (this: IEventDocument): 'upcoming' | 'ongoing' | 'completed' {
  const now = new Date();
  if (now < this.startDate) return 'upcoming';
  if (now >= this.startDate && now <= this.endDate) return 'ongoing';
  return 'completed';
};

EventSchema.methods.hasAvailableSeats = function (this: IEventDocument): boolean {
  return this.availableSeats > 0;
};

EventSchema.methods.getAvailableSeatsForPlan = function (this: IEventDocument, planType: PlanType): number {
  if (!this.plans || this.plans.length === 0) return this.availableSeats;
  const plan = this.plans.find((p) => p.type === planType);
  if (!plan) return 0;
  if (plan.availableSeats !== undefined && plan.availableSeats !== null) return plan.availableSeats;
  if (plan.maxSeats !== undefined) return plan.maxSeats;
  return this.availableSeats;
};

EventSchema.methods.canRegister = function (
  this: IEventDocument,
  userId: string,
  planType?: PlanType,
  age?: number
): { allowed: boolean; message?: string } {
  if (this.status !== EventStatus.PUBLISHED) {
    return { allowed: false, message: 'Event is not available for registration' };
  }
  if (this.isArchived || this.isDeleted) {
    return { allowed: false, message: 'Event is no longer available' };
  }
  if (this.registrationDeadline && new Date() > this.registrationDeadline) {
    return { allowed: false, message: 'Registration deadline has passed' };
  }
  if (new Date() > this.startDate) {
    return { allowed: false, message: 'Event has already started' };
  }
  if (!this.hasAvailableSeats()) {
    if (this.waitlistEnabled) return { allowed: true, message: 'No seats available, but you can join waitlist' };
    return { allowed: false, message: 'Event is sold out' };
  }
  if (planType) {
    const availableSeatsForPlan = this.getAvailableSeatsForPlan(planType);
    if (availableSeatsForPlan <= 0) {
      if (planType === PlanType.EARLY_BIRD && this.plans?.some(p => p.type === PlanType.REGULAR)) {
        return { allowed: true, message: 'Early bird tickets are sold out, but regular tickets are available' };
      }
      return { allowed: false, message: 'Selected ticket type is sold out' };
    }
  }
  if (this.ageRequirement.required && age !== undefined) {
    if (this.ageRequirement.minAge && age < this.ageRequirement.minAge) {
      return { allowed: false, message: `Minimum age requirement is ${this.ageRequirement.minAge} years` };
    }
    if (this.ageRequirement.maxAge && age > this.ageRequirement.maxAge) {
      return { allowed: false, message: `Maximum age limit is ${this.ageRequirement.maxAge} years` };
    }
    if (this.ageRequirement.ageVerificationRequired && this.ageRequirement.ageVerificationMethod === 'id_check') {
      return { allowed: true, message: 'Age verification will be requiblue at check-in' };
    }
    if (this.ageRequirement.requiresParentalConsent && age < 18) {
      return { allowed: true, message: this.ageRequirement.parentalConsentMessage || 'Parental consent requiblue for registration' };
    }
  }
  return { allowed: true };
};

EventSchema.methods.softDelete = async function (this: IEventDocument) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

EventSchema.methods.restore = async function (this: IEventDocument) {
  this.isDeleted = false;
  this.deletedAt = null;
  return this.save();
};

EventSchema.methods.archive = async function (this: IEventDocument) {
  this.isArchived = true;
  this.archivedAt = new Date();
  this.status = EventStatus.ARCHIVED;
  return this.save();
};

// ====================== STATIC METHODS ======================
EventSchema.statics.getUpcomingEvents = async function ( limit: number = 10, category?: string ): Promise<IEventDocument[]> {
  const query: any = {
    status: EventStatus.PUBLISHED,
    isDeleted: false,
    isArchived: false,
    startDate: { $gt: new Date() }
  };
  if (category) query.category = category;
  return this.find(query).sort({ startDate: 1 }).limit(limit).exec();
};

EventSchema.statics.getFeatublueEvents = async function (
  limit: number = 10
): Promise<IEventDocument[]> {
  return this.find({
    featured: true,
    status: EventStatus.PUBLISHED,
    isDeleted: false,
    isArchived: false,
    startDate: { $gt: new Date() }
  }).sort({ startDate: 1 }).limit(limit).exec();
};

// ====================== EXPORT ======================
export const Event = (mongoose.models.Event as IEventModel) ||
  mongoose.model<IEventDocument, IEventModel>('Event', EventSchema);