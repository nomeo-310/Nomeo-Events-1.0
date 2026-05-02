// scripts/seed-plans.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env file');
  process.exit(1);
}

// ─── Enums (mirror plan.ts) ───────────────────────────────────────────────────

const PlanInterval = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  BIANNUAL: 'biannual',
  ANNUAL: 'annual',
  LIFETIME: 'lifetime'
};

const PlanTier = {
  FREE: 'free',
  STARTER: 'starter',
  BASIC: 'basic',
  PRO: 'pro',
  BUSINESS: 'business',
  ENTERPRISE: 'enterprise'
};

const DiscountType = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed'
};

const CouponStatus = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  DEPLETED: 'depleted',
  DISABLED: 'disabled'
};

// ─── Schema ───────────────────────────────────────────────────────────────────
// Inline schema so the script is self-contained and needs no compiled TS output

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    description: String,
    discountType: { type: String, enum: Object.values(DiscountType), required: true },
    discountValue: { type: Number, required: true, min: 0 },
    maxRedemptions: Number,
    redemptionCount: { type: Number, default: 0 },
    minAmountKobo: Number,
    applicableIntervals: [{ type: String, enum: Object.values(PlanInterval) }],
    status: { type: String, enum: Object.values(CouponStatus), default: CouponStatus.ACTIVE },
    expiresAt: Date
  },
  { timestamps: { createdAt: true, updatedAt: false }, _id: false }
);

const DiscountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    discountType: { type: String, enum: Object.values(DiscountType), required: true },
    discountValue: { type: Number, required: true, min: 0 },
    interval: { type: String, enum: Object.values(PlanInterval) },
    startsAt: Date,
    endsAt: Date,
    isActive: { type: Boolean, default: true }
  },
  { _id: false }
);

const PlanFeatureSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    included: { type: Boolean, default: true },
    limit: Number,
    unit: String
  },
  { _id: false }
);

const PlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    tier: { type: String, enum: Object.values(PlanTier), required: true },
    description: String,
    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
    priceKobo: { type: Number, required: true, min: 0, default: 0 },
    currency: { type: String, default: 'NGN' },
    interval: { type: String, enum: Object.values(PlanInterval), required: true },
    paystackPlanCode: String,
    isFree: { type: Boolean, default: false },
    trialDays: { type: Number, default: 0, min: 0 },
    maxEvents: Number,
    maxAttendeesPerEvent: Number,
    maxTeamMembers: Number,
    storageGb: Number,
    features: [PlanFeatureSchema],
    discounts: [DiscountSchema],
    coupons: [CouponSchema],
    sortOrder: { type: Number, default: 0 },
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed, default: new Map() }
  },
  { timestamps: true }
);

PlanSchema.pre('save', function () {
  if (this.priceKobo === 0) this.isFree = true;
  if (this.isFree) this.trialDays = 0;
});

const Plan = mongoose.models.Plan || mongoose.model('Plan', PlanSchema);

// ─── Seed data ────────────────────────────────────────────────────────────────
// Each plan/interval combo is a separate document.
// Slug format: "<tier>-<interval>" e.g. "starter-monthly", "pro-annual"

const plans = [
  // ── FREE ──────────────────────────────────────────────────────────────────
  {
    name: 'Free',
    slug: 'free-monthly',
    tier: PlanTier.FREE,
    interval: PlanInterval.MONTHLY,
    description: 'Perfect for getting started. 14-day full-access trial included.',
    isActive: true,
    isPublic: true,
    priceKobo: 0,
    isFree: true,
    trialDays: 14,
    maxEvents: 3,
    maxAttendeesPerEvent: 50,
    maxTeamMembers: 1,
    storageGb: 0.5,
    features: [
      { name: 'Event Creation', description: 'Create and manage events', included: true, limit: 3, unit: 'events' },
      { name: 'Event Capacity', description: 'Max attendees per event', included: true, limit: 50, unit: 'attendees' },
      { name: 'Team Members', description: 'Members who can manage events', included: true, limit: 1, unit: 'members' },
      { name: 'Storage Space', description: 'Storage for images and files', included: true, limit: 0.5, unit: 'GB' },
      { name: 'Basic Analytics', description: 'Basic event statistics', included: true },
      { name: 'Email Support', description: 'Standard email support', included: true },
      { name: 'Ticket Types', description: 'Basic ticket types', included: true, limit: 2, unit: 'types' },
      { name: 'Custom Branding', description: 'Remove Nomeo branding', included: false },
      { name: 'API Access', description: 'REST API for integrations', included: false },
      { name: 'Priority Support', description: '24/7 priority support', included: false }
    ],
    discounts: [],
    coupons: [],
    sortOrder: 0,
    metadata: new Map([
      ['trial_period', '14-day free trial with full features'],
      ['setup_fee', 0],
      ['cancellation_policy', 'Cancel anytime']
    ])
  },

  // ── STARTER ───────────────────────────────────────────────────────────────
  {
    name: 'Starter Monthly',
    slug: 'starter-monthly',
    tier: PlanTier.STARTER,
    interval: PlanInterval.MONTHLY,
    description: 'Ideal for growing event organizers.',
    isActive: true,
    isPublic: true,
    priceKobo: 1500000, // ₦15,000
    trialDays: 0,
    maxEvents: 20,
    maxAttendeesPerEvent: 200,
    maxTeamMembers: 3,
    storageGb: 5,
    features: [
      { name: 'Event Creation', included: true, limit: 20, unit: 'events' },
      { name: 'Event Capacity', included: true, limit: 200, unit: 'attendees' },
      { name: 'Team Members', included: true, limit: 3, unit: 'members' },
      { name: 'Storage Space', included: true, limit: 5, unit: 'GB' },
      { name: 'Advanced Analytics', description: 'Detailed insights and reports', included: true },
      { name: 'Priority Email Support', included: true },
      { name: 'Ticket Types', included: true, limit: 5, unit: 'types' },
      { name: 'Discount Codes', included: true, limit: 20, unit: 'codes' },
      { name: 'Custom Branding', included: false },
      { name: 'API Access', included: false }
    ],
    discounts: [
      {
        name: 'Launch Promo',
        description: 'First 3 months 30% off',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 30,
        interval: PlanInterval.MONTHLY,
        startsAt: new Date('2024-01-01'),
        endsAt: new Date('2024-12-31'),
        isActive: false // expired — set true to re-enable
      }
    ],
    coupons: [
      {
        code: 'STARTER10',
        description: '10% off first month',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        maxRedemptions: 100,
        redemptionCount: 0,
        minAmountKobo: 100000,
        applicableIntervals: [PlanInterval.MONTHLY],
        status: CouponStatus.ACTIVE,
        expiresAt: new Date('2025-12-31')
      }
    ],
    sortOrder: 1,
    metadata: new Map([['recommended_for', 'Small businesses and growing organizers']])
  },
  {
    name: 'Starter Quarterly',
    slug: 'starter-quarterly',
    tier: PlanTier.STARTER,
    interval: PlanInterval.QUARTERLY,
    description: 'Ideal for growing event organizers. Save ~11% vs monthly.',
    isActive: true,
    isPublic: true,
    priceKobo: 4000000, // ₦40,000/quarter
    trialDays: 0,
    maxEvents: 20,
    maxAttendeesPerEvent: 200,
    maxTeamMembers: 3,
    storageGb: 5,
    features: [
      { name: 'Event Creation', included: true, limit: 20, unit: 'events' },
      { name: 'Event Capacity', included: true, limit: 200, unit: 'attendees' },
      { name: 'Team Members', included: true, limit: 3, unit: 'members' },
      { name: 'Storage Space', included: true, limit: 5, unit: 'GB' },
      { name: 'Advanced Analytics', included: true },
      { name: 'Priority Email Support', included: true },
      { name: 'Ticket Types', included: true, limit: 5, unit: 'types' },
      { name: 'Discount Codes', included: true, limit: 20, unit: 'codes' },
      { name: 'Custom Branding', included: false },
      { name: 'API Access', included: false }
    ],
    discounts: [],
    coupons: [],
    sortOrder: 2,
    metadata: new Map([['savings', 'Save ~11% vs monthly billing']])
  },
  {
    name: 'Starter Biannual',
    slug: 'starter-biannual',
    tier: PlanTier.STARTER,
    interval: PlanInterval.BIANNUAL,
    description: 'Ideal for growing event organizers. Save ~17% vs monthly.',
    isActive: true,
    isPublic: true,
    priceKobo: 7500000, // ₦75,000/6 months
    trialDays: 0,
    maxEvents: 20,
    maxAttendeesPerEvent: 200,
    maxTeamMembers: 3,
    storageGb: 5,
    features: [
      { name: 'Event Creation', included: true, limit: 20, unit: 'events' },
      { name: 'Event Capacity', included: true, limit: 200, unit: 'attendees' },
      { name: 'Team Members', included: true, limit: 3, unit: 'members' },
      { name: 'Storage Space', included: true, limit: 5, unit: 'GB' },
      { name: 'Advanced Analytics', included: true },
      { name: 'Priority Email Support', included: true },
      { name: 'Ticket Types', included: true, limit: 5, unit: 'types' },
      { name: 'Discount Codes', included: true, limit: 20, unit: 'codes' },
      { name: 'Custom Branding', included: false },
      { name: 'API Access', included: false }
    ],
    discounts: [],
    coupons: [],
    sortOrder: 3,
    metadata: new Map([['savings', 'Save ~17% vs monthly billing']])
  },
  {
    name: 'Starter Annual',
    slug: 'starter-annual',
    tier: PlanTier.STARTER,
    interval: PlanInterval.ANNUAL,
    description: 'Ideal for growing event organizers. Save 20% vs monthly.',
    isActive: true,
    isPublic: true,
    priceKobo: 14400000, // ₦144,000/year
    trialDays: 0,
    maxEvents: 20,
    maxAttendeesPerEvent: 200,
    maxTeamMembers: 3,
    storageGb: 5,
    features: [
      { name: 'Event Creation', included: true, limit: 20, unit: 'events' },
      { name: 'Event Capacity', included: true, limit: 200, unit: 'attendees' },
      { name: 'Team Members', included: true, limit: 3, unit: 'members' },
      { name: 'Storage Space', included: true, limit: 5, unit: 'GB' },
      { name: 'Advanced Analytics', included: true },
      { name: 'Priority Email Support', included: true },
      { name: 'Ticket Types', included: true, limit: 5, unit: 'types' },
      { name: 'Discount Codes', included: true, limit: 20, unit: 'codes' },
      { name: 'Custom Branding', included: false },
      { name: 'API Access', included: false }
    ],
    discounts: [],
    coupons: [],
    sortOrder: 4,
    metadata: new Map([['savings', 'Save 20% vs monthly billing']])
  },

  // ── BASIC ─────────────────────────────────────────────────────────────────
  {
    name: 'Basic Monthly',
    slug: 'basic-monthly',
    tier: PlanTier.BASIC,
    interval: PlanInterval.MONTHLY,
    description: 'Professional features for serious organizers.',
    isActive: true,
    isPublic: true,
    priceKobo: 3500000, // ₦35,000
    trialDays: 0,
    maxEvents: 100,
    maxAttendeesPerEvent: 500,
    maxTeamMembers: 10,
    storageGb: 20,
    features: [
      { name: 'Event Creation', included: true, limit: 100, unit: 'events' },
      { name: 'Event Capacity', included: true, limit: 500, unit: 'attendees' },
      { name: 'Team Members', included: true, limit: 10, unit: 'members' },
      { name: 'Storage Space', included: true, limit: 20, unit: 'GB' },
      { name: 'Advanced Analytics', included: true },
      { name: 'Priority Email Support', included: true },
      { name: 'Ticket Types', included: true, limit: 10, unit: 'types' },
      { name: 'Discount Codes', included: true, limit: 100, unit: 'codes' },
      { name: 'Custom Branding', included: true },
      { name: 'API Access', included: true },
      { name: 'Checkout Customization', included: true }
    ],
    discounts: [],
    coupons: [
      {
        code: 'BASIC20',
        description: '20% off first 3 months',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        maxRedemptions: 50,
        redemptionCount: 0,
        minAmountKobo: 200000,
        applicableIntervals: [PlanInterval.MONTHLY, PlanInterval.QUARTERLY],
        status: CouponStatus.ACTIVE,
        expiresAt: new Date('2025-06-30')
      }
    ],
    sortOrder: 5,
    metadata: new Map([
      ['popular', 'Most popular for professional organizers'],
      ['api_rate_limit', '1000 requests/min']
    ])
  },
  {
    name: 'Basic Quarterly',
    slug: 'basic-quarterly',
    tier: PlanTier.BASIC,
    interval: PlanInterval.QUARTERLY,
    description: 'Professional features for serious organizers. Save 10% vs monthly.',
    isActive: true,
    isPublic: true,
    priceKobo: 9450000, // ₦94,500/quarter
    trialDays: 0,
    maxEvents: 100,
    maxAttendeesPerEvent: 500,
    maxTeamMembers: 10,
    storageGb: 20,
    features: [
      { name: 'Event Creation', included: true, limit: 100, unit: 'events' },
      { name: 'Event Capacity', included: true, limit: 500, unit: 'attendees' },
      { name: 'Team Members', included: true, limit: 10, unit: 'members' },
      { name: 'Storage Space', included: true, limit: 20, unit: 'GB' },
      { name: 'Advanced Analytics', included: true },
      { name: 'Priority Email Support', included: true },
      { name: 'Ticket Types', included: true, limit: 10, unit: 'types' },
      { name: 'Discount Codes', included: true, limit: 100, unit: 'codes' },
      { name: 'Custom Branding', included: true },
      { name: 'API Access', included: true },
      { name: 'Checkout Customization', included: true }
    ],
    discounts: [],
    coupons: [],
    sortOrder: 6,
    metadata: new Map([['savings', 'Save 10% vs monthly billing']])
  },
  {
    name: 'Basic Biannual',
    slug: 'basic-biannual',
    tier: PlanTier.BASIC,
    interval: PlanInterval.BIANNUAL,
    description: 'Professional features for serious organizers. Save 15% vs monthly.',
    isActive: true,
    isPublic: true,
    priceKobo: 17850000, // ₦178,500/6 months
    trialDays: 0,
    maxEvents: 100,
    maxAttendeesPerEvent: 500,
    maxTeamMembers: 10,
    storageGb: 20,
    features: [
      { name: 'Event Creation', included: true, limit: 100, unit: 'events' },
      { name: 'Event Capacity', included: true, limit: 500, unit: 'attendees' },
      { name: 'Team Members', included: true, limit: 10, unit: 'members' },
      { name: 'Storage Space', included: true, limit: 20, unit: 'GB' },
      { name: 'Advanced Analytics', included: true },
      { name: 'Priority Email Support', included: true },
      { name: 'Ticket Types', included: true, limit: 10, unit: 'types' },
      { name: 'Discount Codes', included: true, limit: 100, unit: 'codes' },
      { name: 'Custom Branding', included: true },
      { name: 'API Access', included: true },
      { name: 'Checkout Customization', included: true }
    ],
    discounts: [],
    coupons: [],
    sortOrder: 7,
    metadata: new Map([['savings', 'Save 15% vs monthly billing']])
  },
  {
    name: 'Basic Annual',
    slug: 'basic-annual',
    tier: PlanTier.BASIC,
    interval: PlanInterval.ANNUAL,
    description: 'Professional features for serious organizers. Save 20% vs monthly.',
    isActive: true,
    isPublic: true,
    priceKobo: 33600000, // ₦336,000/year
    trialDays: 0,
    maxEvents: 100,
    maxAttendeesPerEvent: 500,
    maxTeamMembers: 10,
    storageGb: 20,
    features: [
      { name: 'Event Creation', included: true, limit: 100, unit: 'events' },
      { name: 'Event Capacity', included: true, limit: 500, unit: 'attendees' },
      { name: 'Team Members', included: true, limit: 10, unit: 'members' },
      { name: 'Storage Space', included: true, limit: 20, unit: 'GB' },
      { name: 'Advanced Analytics', included: true },
      { name: 'Priority Email Support', included: true },
      { name: 'Ticket Types', included: true, limit: 10, unit: 'types' },
      { name: 'Discount Codes', included: true, limit: 100, unit: 'codes' },
      { name: 'Custom Branding', included: true },
      { name: 'API Access', included: true },
      { name: 'Checkout Customization', included: true }
    ],
    discounts: [],
    coupons: [],
    sortOrder: 8,
    metadata: new Map([['savings', 'Save 20% vs monthly billing']])
  },

  // ── PRO ───────────────────────────────────────────────────────────────────
  {
    name: 'Pro Monthly',
    slug: 'pro-monthly',
    tier: PlanTier.PRO,
    interval: PlanInterval.MONTHLY,
    description: 'Advanced features for large events.',
    isActive: true,
    isPublic: true,
    priceKobo: 7500000, // ₦75,000
    trialDays: 0,
    maxEvents: 500,
    maxAttendeesPerEvent: 2000,
    maxTeamMembers: 25,
    storageGb: 100,
    features: [
      { name: 'Event Creation', included: true, limit: 500, unit: 'events' },
      { name: 'Event Capacity', included: true, limit: 2000, unit: 'attendees' },
      { name: 'Team Members', included: true, limit: 25, unit: 'members' },
      { name: 'Storage Space', included: true, limit: 100, unit: 'GB' },
      { name: 'Advanced Analytics', included: true },
      { name: '24/7 Priority Support', included: true },
      { name: 'Ticket Types', included: true, limit: 20, unit: 'types' },
      { name: 'Discount Codes', included: true, limit: 500, unit: 'codes' },
      { name: 'Custom Branding', included: true },
      { name: 'API Access', included: true },
      { name: 'Webhooks', included: true },
      { name: 'White Label', included: true }
    ],
    discounts: [],
    coupons: [
      {
        code: 'PRO25',
        description: '25% off first 3 months',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 25,
        maxRedemptions: 30,
        redemptionCount: 0,
        minAmountKobo: 500000,
        applicableIntervals: [PlanInterval.MONTHLY, PlanInterval.QUARTERLY],
        status: CouponStatus.ACTIVE,
        expiresAt: new Date('2025-12-31')
      }
    ],
    sortOrder: 9,
    metadata: new Map([['api_rate_limit', '5000 requests/min']])
  },
  {
    name: 'Pro Quarterly',
    slug: 'pro-quarterly',
    tier: PlanTier.PRO,
    interval: PlanInterval.QUARTERLY,
    priceKobo: 20250000, // ₦202,500/quarter — save 10%
    isActive: true, isPublic: true, trialDays: 0,
    maxEvents: 500, maxAttendeesPerEvent: 2000, maxTeamMembers: 25, storageGb: 100,
    features: [
      { name: 'Event Creation', included: true, limit: 500, unit: 'events' },
      { name: 'Event Capacity', included: true, limit: 2000, unit: 'attendees' },
      { name: 'Team Members', included: true, limit: 25, unit: 'members' },
      { name: 'Storage Space', included: true, limit: 100, unit: 'GB' },
      { name: 'Advanced Analytics', included: true }, { name: '24/7 Priority Support', included: true },
      { name: 'Ticket Types', included: true, limit: 20, unit: 'types' },
      { name: 'Discount Codes', included: true, limit: 500, unit: 'codes' },
      { name: 'Custom Branding', included: true }, { name: 'API Access', included: true },
      { name: 'Webhooks', included: true }, { name: 'White Label', included: true }
    ],
    discounts: [], coupons: [], sortOrder: 10,
    metadata: new Map([['savings', 'Save 10% vs monthly']])
  },
  {
    name: 'Pro Biannual',
    slug: 'pro-biannual',
    tier: PlanTier.PRO,
    interval: PlanInterval.BIANNUAL,
    priceKobo: 38250000, // ₦382,500/6 months — save 15%
    isActive: true, isPublic: true, trialDays: 0,
    maxEvents: 500, maxAttendeesPerEvent: 2000, maxTeamMembers: 25, storageGb: 100,
    features: [
      { name: 'Event Creation', included: true, limit: 500, unit: 'events' },
      { name: 'Event Capacity', included: true, limit: 2000, unit: 'attendees' },
      { name: 'Team Members', included: true, limit: 25, unit: 'members' },
      { name: 'Storage Space', included: true, limit: 100, unit: 'GB' },
      { name: 'Advanced Analytics', included: true }, { name: '24/7 Priority Support', included: true },
      { name: 'Ticket Types', included: true, limit: 20, unit: 'types' },
      { name: 'Discount Codes', included: true, limit: 500, unit: 'codes' },
      { name: 'Custom Branding', included: true }, { name: 'API Access', included: true },
      { name: 'Webhooks', included: true }, { name: 'White Label', included: true }
    ],
    discounts: [], coupons: [], sortOrder: 11,
    metadata: new Map([['savings', 'Save 15% vs monthly']])
  },
  {
    name: 'Pro Annual',
    slug: 'pro-annual',
    tier: PlanTier.PRO,
    interval: PlanInterval.ANNUAL,
    priceKobo: 72000000, // ₦720,000/year — save 20%
    isActive: true, isPublic: true, trialDays: 0,
    maxEvents: 500, maxAttendeesPerEvent: 2000, maxTeamMembers: 25, storageGb: 100,
    features: [
      { name: 'Event Creation', included: true, limit: 500, unit: 'events' },
      { name: 'Event Capacity', included: true, limit: 2000, unit: 'attendees' },
      { name: 'Team Members', included: true, limit: 25, unit: 'members' },
      { name: 'Storage Space', included: true, limit: 100, unit: 'GB' },
      { name: 'Advanced Analytics', included: true }, { name: '24/7 Priority Support', included: true },
      { name: 'Ticket Types', included: true, limit: 20, unit: 'types' },
      { name: 'Discount Codes', included: true, limit: 500, unit: 'codes' },
      { name: 'Custom Branding', included: true }, { name: 'API Access', included: true },
      { name: 'Webhooks', included: true }, { name: 'White Label', included: true }
    ],
    discounts: [], coupons: [], sortOrder: 12,
    metadata: new Map([['savings', 'Save 20% vs monthly']])
  },

  // ── BUSINESS ──────────────────────────────────────────────────────────────
  {
    name: 'Business Monthly',
    slug: 'business-monthly',
    tier: PlanTier.BUSINESS,
    interval: PlanInterval.MONTHLY,
    description: 'Enterprise-grade features for large organizations.',
    isActive: true,
    isPublic: true,
    priceKobo: 20000000, // ₦200,000
    trialDays: 0,
    maxAttendeesPerEvent: 10000,
    maxTeamMembers: 100,
    storageGb: 500,
    features: [
      { name: 'Event Creation', description: 'Unlimited events', included: true },
      { name: 'Event Capacity', included: true, limit: 10000, unit: 'attendees' },
      { name: 'Team Members', included: true, limit: 100, unit: 'members' },
      { name: 'Storage Space', included: true, limit: 500, unit: 'GB' },
      { name: 'Advanced Analytics', included: true },
      { name: '24/7 Priority Support', included: true },
      { name: 'Ticket Types', description: 'Unlimited ticket types', included: true },
      { name: 'Discount Codes', description: 'Unlimited discount codes', included: true },
      { name: 'Custom Branding', included: true },
      { name: 'API Access', included: true },
      { name: 'Webhooks', included: true },
      { name: 'White Label', included: true },
      { name: 'Dedicated Account Manager', included: true },
      { name: 'Custom SLA', included: true }
    ],
    discounts: [],
    coupons: [
      {
        code: 'BUSINESS50',
        description: '₦50,000 off first month',
        discountType: DiscountType.FIXED,
        discountValue: 5000000, // ₦50,000 in kobo
        maxRedemptions: 10,
        redemptionCount: 0,
        minAmountKobo: 1500000,
        applicableIntervals: [PlanInterval.MONTHLY],
        status: CouponStatus.ACTIVE,
        expiresAt: new Date('2025-12-31')
      }
    ],
    sortOrder: 13,
    metadata: new Map([['api_rate_limit', '10000 requests/min']])
  },
  {
    name: 'Business Quarterly',
    slug: 'business-quarterly',
    tier: PlanTier.BUSINESS,
    interval: PlanInterval.QUARTERLY,
    priceKobo: 54000000, // ₦540,000/quarter — save 10%
    isActive: true, isPublic: true, trialDays: 0,
    maxAttendeesPerEvent: 10000, maxTeamMembers: 100, storageGb: 500,
    features: [
      { name: 'Event Creation', description: 'Unlimited events', included: true },
      { name: 'Event Capacity', included: true, limit: 10000, unit: 'attendees' },
      { name: 'Team Members', included: true, limit: 100, unit: 'members' },
      { name: 'Storage Space', included: true, limit: 500, unit: 'GB' },
      { name: 'Advanced Analytics', included: true }, { name: '24/7 Priority Support', included: true },
      { name: 'Custom Branding', included: true }, { name: 'API Access', included: true },
      { name: 'Webhooks', included: true }, { name: 'White Label', included: true },
      { name: 'Dedicated Account Manager', included: true }, { name: 'Custom SLA', included: true }
    ],
    discounts: [], coupons: [], sortOrder: 14,
    metadata: new Map([['savings', 'Save 10% vs monthly']])
  },
  {
    name: 'Business Biannual',
    slug: 'business-biannual',
    tier: PlanTier.BUSINESS,
    interval: PlanInterval.BIANNUAL,
    priceKobo: 102000000, // ₦1,020,000/6 months — save 15%
    isActive: true, isPublic: true, trialDays: 0,
    maxAttendeesPerEvent: 10000, maxTeamMembers: 100, storageGb: 500,
    features: [
      { name: 'Event Creation', description: 'Unlimited events', included: true },
      { name: 'Event Capacity', included: true, limit: 10000, unit: 'attendees' },
      { name: 'Team Members', included: true, limit: 100, unit: 'members' },
      { name: 'Storage Space', included: true, limit: 500, unit: 'GB' },
      { name: 'Advanced Analytics', included: true }, { name: '24/7 Priority Support', included: true },
      { name: 'Custom Branding', included: true }, { name: 'API Access', included: true },
      { name: 'Webhooks', included: true }, { name: 'White Label', included: true },
      { name: 'Dedicated Account Manager', included: true }, { name: 'Custom SLA', included: true }
    ],
    discounts: [], coupons: [], sortOrder: 15,
    metadata: new Map([['savings', 'Save 15% vs monthly']])
  },
  {
    name: 'Business Annual',
    slug: 'business-annual',
    tier: PlanTier.BUSINESS,
    interval: PlanInterval.ANNUAL,
    priceKobo: 192000000, // ₦1,920,000/year — save 20%
    isActive: true, isPublic: true, trialDays: 0,
    maxAttendeesPerEvent: 10000, maxTeamMembers: 100, storageGb: 500,
    features: [
      { name: 'Event Creation', description: 'Unlimited events', included: true },
      { name: 'Event Capacity', included: true, limit: 10000, unit: 'attendees' },
      { name: 'Team Members', included: true, limit: 100, unit: 'members' },
      { name: 'Storage Space', included: true, limit: 500, unit: 'GB' },
      { name: 'Advanced Analytics', included: true }, { name: '24/7 Priority Support', included: true },
      { name: 'Custom Branding', included: true }, { name: 'API Access', included: true },
      { name: 'Webhooks', included: true }, { name: 'White Label', included: true },
      { name: 'Dedicated Account Manager', included: true }, { name: 'Custom SLA', included: true }
    ],
    discounts: [], coupons: [], sortOrder: 16,
    metadata: new Map([['savings', 'Save 20% vs monthly']])
  },

  // ── ENTERPRISE ────────────────────────────────────────────────────────────
  {
    name: 'Enterprise Monthly',
    slug: 'enterprise-monthly',
    tier: PlanTier.ENTERPRISE,
    interval: PlanInterval.MONTHLY,
    description: 'Custom solutions for large-scale operations.',
    isActive: true,
    isPublic: true,
    priceKobo: 50000000, // ₦500,000
    trialDays: 0,
    maxAttendeesPerEvent: 50000,
    storageGb: 2000,
    features: [
      { name: 'Event Creation', description: 'Unlimited events', included: true },
      { name: 'Event Capacity', included: true, limit: 50000, unit: 'attendees' },
      { name: 'Team Members', description: 'Unlimited team members', included: true },
      { name: 'Storage Space', description: '2TB storage', included: true, limit: 2000, unit: 'GB' },
      { name: 'Custom Analytics', included: true },
      { name: '24/7 Dedicated Support', included: true },
      { name: 'Custom Development', included: true },
      { name: 'On-premise Deployment', included: true },
      { name: 'SSO Integration', included: true },
      { name: 'SLA Guarantee', description: '99.99% uptime SLA', included: true }
    ],
    discounts: [],
    coupons: [],
    sortOrder: 17,
    metadata: new Map([
      ['custom_contract', 'Custom contracts available'],
      ['compliance', 'GDPR, SOC2 compliant']
    ])
  },
  {
    name: 'Enterprise Quarterly',
    slug: 'enterprise-quarterly',
    tier: PlanTier.ENTERPRISE,
    interval: PlanInterval.QUARTERLY,
    priceKobo: 135000000, // ₦1,350,000/quarter — save 10%
    isActive: true, isPublic: true, trialDays: 0,
    maxAttendeesPerEvent: 50000, storageGb: 2000,
    features: [
      { name: 'Event Creation', description: 'Unlimited events', included: true },
      { name: 'Event Capacity', included: true, limit: 50000, unit: 'attendees' },
      { name: 'Team Members', description: 'Unlimited team members', included: true },
      { name: 'Storage Space', included: true, limit: 2000, unit: 'GB' },
      { name: 'Custom Analytics', included: true }, { name: '24/7 Dedicated Support', included: true },
      { name: 'Custom Development', included: true }, { name: 'On-premise Deployment', included: true },
      { name: 'SSO Integration', included: true }, { name: 'SLA Guarantee', included: true }
    ],
    discounts: [], coupons: [], sortOrder: 18,
    metadata: new Map([['savings', 'Save 10% vs monthly']])
  },
  {
    name: 'Enterprise Biannual',
    slug: 'enterprise-biannual',
    tier: PlanTier.ENTERPRISE,
    interval: PlanInterval.BIANNUAL,
    priceKobo: 255000000, // ₦2,550,000/6 months — save 15%
    isActive: true, isPublic: true, trialDays: 0,
    maxAttendeesPerEvent: 50000, storageGb: 2000,
    features: [
      { name: 'Event Creation', description: 'Unlimited events', included: true },
      { name: 'Event Capacity', included: true, limit: 50000, unit: 'attendees' },
      { name: 'Team Members', description: 'Unlimited team members', included: true },
      { name: 'Storage Space', included: true, limit: 2000, unit: 'GB' },
      { name: 'Custom Analytics', included: true }, { name: '24/7 Dedicated Support', included: true },
      { name: 'Custom Development', included: true }, { name: 'On-premise Deployment', included: true },
      { name: 'SSO Integration', included: true }, { name: 'SLA Guarantee', included: true }
    ],
    discounts: [], coupons: [], sortOrder: 19,
    metadata: new Map([['savings', 'Save 15% vs monthly']])
  },
  {
    name: 'Enterprise Annual',
    slug: 'enterprise-annual',
    tier: PlanTier.ENTERPRISE,
    interval: PlanInterval.ANNUAL,
    priceKobo: 480000000, // ₦4,800,000/year — save 20%
    isActive: true, isPublic: true, trialDays: 0,
    maxAttendeesPerEvent: 50000, storageGb: 2000,
    features: [
      { name: 'Event Creation', description: 'Unlimited events', included: true },
      { name: 'Event Capacity', included: true, limit: 50000, unit: 'attendees' },
      { name: 'Team Members', description: 'Unlimited team members', included: true },
      { name: 'Storage Space', included: true, limit: 2000, unit: 'GB' },
      { name: 'Custom Analytics', included: true }, { name: '24/7 Dedicated Support', included: true },
      { name: 'Custom Development', included: true }, { name: 'On-premise Deployment', included: true },
      { name: 'SSO Integration', included: true }, { name: 'SLA Guarantee', included: true }
    ],
    discounts: [], coupons: [], sortOrder: 20,
    metadata: new Map([['savings', 'Save 20% vs monthly']])
  },
  {
    name: 'Enterprise Lifetime',
    slug: 'enterprise-lifetime',
    tier: PlanTier.ENTERPRISE,
    interval: PlanInterval.LIFETIME,
    description: 'One-time purchase. Unlimited access forever.',
    isActive: true,
    isPublic: true,
    priceKobo: 1500000000, // ₦15,000,000 one-time
    trialDays: 0,
    maxAttendeesPerEvent: 50000,
    storageGb: 2000,
    features: [
      { name: 'Event Creation', description: 'Unlimited events', included: true },
      { name: 'Event Capacity', included: true, limit: 50000, unit: 'attendees' },
      { name: 'Team Members', description: 'Unlimited team members', included: true },
      { name: 'Storage Space', included: true, limit: 2000, unit: 'GB' },
      { name: 'Custom Analytics', included: true }, { name: '24/7 Dedicated Support', included: true },
      { name: 'Custom Development', included: true }, { name: 'On-premise Deployment', included: true },
      { name: 'SSO Integration', included: true }, { name: 'SLA Guarantee', included: true }
    ],
    discounts: [],
    coupons: [],
    sortOrder: 21,
    metadata: new Map([['type', 'One-time purchase, no recurring charges']])
  }
];

// ─── DB connection ─────────────────────────────────────────────────────────────

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
}

async function disconnectDB() {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

// ─── CRUD helpers ─────────────────────────────────────────────────────────────

async function seedPlans() {
  await connectDB();
  try {
    const deleted = await Plan.deleteMany({});
    console.log(`Cleared ${deleted.deletedCount} existing plans`);

    const inserted = await Plan.insertMany(plans);
    console.log(`Seeded ${inserted.length} plans\n`);

    console.log('Seeded plans:');
    plans.forEach(p => {
      const naira = (p.priceKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
      console.log(`   [${p.tier.toUpperCase()}] ${p.name} (${p.slug}) — ${naira}/${p.interval}`);
    });
  } finally {
    await disconnectDB();
  }
}

async function addPlan(planData) {
  await connectDB();
  try {
    const existing = await Plan.findOne({ slug: planData.slug });
    if (existing) {
      console.log(`Plan with slug '${planData.slug}' already exists`);
      return null;
    }
    const result = await Plan.create(planData);
    console.log(`Added plan: ${result.name} (${result.slug})`);
    return result;
  } finally {
    await disconnectDB();
  }
}

async function updatePlan(slug, updateData) {
  await connectDB();
  try {
    const result = await Plan.findOneAndUpdate(
      { slug },
      { $set: updateData },
      { new: true }
    );
    if (!result) {
      console.log(`No plan found with slug: ${slug}`);
    } else {
      console.log(`Updated plan: ${result.name} (${slug})`);
    }
    return result;
  } finally {
    await disconnectDB();
  }
}

async function deletePlan(slug) {
  await connectDB();
  try {
    const result = await Plan.findOneAndDelete({ slug });
    if (!result) {
      console.log(`No plan found with slug: ${slug}`);
    } else {
      console.log(`Deleted plan: ${result.name} (${slug})`);
    }
    return result;
  } finally {
    await disconnectDB();
  }
}

async function listPlans(tier) {
  await connectDB();
  try {
    const query = tier ? { tier } : {};
    const results = await Plan.find(query).sort({ sortOrder: 1 });
    console.log(`\n📋 ${results.length} plan(s) found:\n`);
    results.forEach(p => {
      const naira = (p.priceKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
      console.log(`   [${p.tier.toUpperCase()}] ${p.name} (${p.slug}) — ${naira}/${p.interval} | active: ${p.isActive}`);
    });
    return results;
  } finally {
    await disconnectDB();
  }
}

async function deactivatePlan(slug) {
  return updatePlan(slug, { isActive: false });
}

async function activatePlan(slug) {
  return updatePlan(slug, { isActive: true });
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

async function main() {
  const [command, ...args] = process.argv.slice(2);

  try {
    switch (command) {
      case 'seed':
        await seedPlans();
        break;

      case 'add':
        if (!args[0]) { console.log('Usage: seed-plans add \'{"slug":"...","name":"...",...}\''); break; }
        await addPlan(JSON.parse(args[0]));
        break;

      case 'update':
        if (!args[0] || !args[1]) { console.log('Usage: seed-plans update <slug> \'{"field":"value"}\''); break; }
        await updatePlan(args[0], JSON.parse(args[1]));
        break;

      case 'delete':
        if (!args[0]) { console.log('Usage: seed-plans delete <slug>'); break; }
        await deletePlan(args[0]);
        break;

      case 'list':
        await listPlans(args[0]); // optional tier filter
        break;

      case 'deactivate':
        if (!args[0]) { console.log('Usage: seed-plans deactivate <slug>'); break; }
        await deactivatePlan(args[0]);
        break;

      case 'activate':
        if (!args[0]) { console.log('Usage: seed-plans activate <slug>'); break; }
        await activatePlan(args[0]);
        break;

      default:
        console.log(`
📋 seed-plans — Plan management CLI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Commands:
  seed                         Wipe and re-seed all plans
  list [tier]                  List plans (optional tier filter)
  add <json>                   Add a single new plan
  update <slug> <json>         Update fields on an existing plan
  delete <slug>                Permanently delete a plan
  activate <slug>              Set isActive = true
  deactivate <slug>            Set isActive = false

Examples:
  node scripts/seed-plans.js seed
  node scripts/seed-plans.js list starter
  node scripts/seed-plans.js update starter-monthly '{"maxEvents":30}'
  node scripts/seed-plans.js add '{"slug":"pro-weekly","tier":"pro","interval":"monthly","priceKobo":2000000,...}'
  node scripts/seed-plans.js delete pro-weekly
  node scripts/seed-plans.js deactivate starter-quarterly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedPlans, addPlan, updatePlan, deletePlan, listPlans, deactivatePlan, activatePlan };