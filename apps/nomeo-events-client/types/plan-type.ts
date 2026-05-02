import { Types } from 'mongoose';

export enum PlanInterval {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  BIANNUAL = 'biannual',
  ANNUAL = 'annual',
  LIFETIME = 'lifetime'
}

export enum PlanTier {
  FREE = 'free',
  STARTER = 'starter',
  BASIC = 'basic',
  PRO = 'pro',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise'
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

export enum CouponStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DEPLETED = 'depleted',
  DISABLED = 'disabled'
}

export interface PlanFeature {
  name: string;
  description?: string;
  included: boolean;
  limit?: number;
  unit?: string;
}

export interface Discount {
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  interval?: PlanInterval;
  startsAt?: Date;
  endsAt?: Date;
  isActive: boolean;
}

export interface Coupon {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxRedemptions?: number;
  redemptionCount: number;
  minAmountKobo?: number;
  applicableIntervals?: PlanInterval[];
  status: CouponStatus;
  expiresAt?: Date;
}

// Mongoose Document Type
export interface IPlanDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  tier: PlanTier;
  description?: string;
  isActive: boolean;
  isPublic: boolean;
  priceKobo: number;
  currency: string;
  interval: PlanInterval;
  paystackPlanCode?: string;
  isFree: boolean;
  trialDays: number;
  maxEvents?: number;
  maxAttendeesPerEvent?: number;
  maxTeamMembers?: number;
  storageGb?: number;
  features: PlanFeature[];
  discounts: Discount[];
  coupons: Coupon[];
  sortOrder: number;
  metadata: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Type
export interface PlanDocument {
  _id: string;
  name: string;
  slug: string;
  tier: PlanTier;
  description?: string;
  isActive: boolean;
  isPublic: boolean;
  priceKobo: number;
  currency: string;
  interval: PlanInterval;
  paystackPlanCode?: string;
  isFree: boolean;
  trialDays: number;
  maxEvents?: number;
  maxAttendeesPerEvent?: number;
  maxTeamMembers?: number;
  storageGb?: number;
  features: PlanFeature[];
  discounts: Discount[];
  coupons: Coupon[];
  sortOrder: number;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface IntervalPricing {
  interval: PlanInterval;
  priceKobo: number;
  priceDisplay: string;
  pricePerMonthKobo: number;
  pricePerMonthDisplay: string;
  savings: {
    amount: number;
    percent: number;
    text: string;
    detailedText: string;
  } | null;
  badge: string | null;
  isBestValue: boolean;
  isPopular: boolean;
  trialDays: number;
  paystackPlanCode?: string;
  isAvailable: boolean;
  sortOrder: number;
}

export interface TierPricing {
  tier: PlanTier;
  name: string;
  description: string;
  tagline: string;
  sortOrder: number;
  isActive: boolean;
  isPopular: boolean;
  features: PlanFeature[];
  limits: {
    maxEvents?: number;
    maxAttendeesPerEvent?: number;
    maxTeamMembers?: number;
    storageGb?: number;
  };
  intervals: IntervalPricing[];
  ctaText: string;
  metadata: Record<string, any>;
}

export interface SupportedInterval {
  value: PlanInterval;
  label: string;
  discount: string | null;
  isPopular?: boolean;
  sortOrder: number;
}

export interface PricingResponse {
  tiers: TierPricing[];
  defaultInterval: PlanInterval;
  supportedIntervals: SupportedInterval[];
}

export interface PlansListResponse {
  plans: PlanDocument[];
  total: number;
  filters: {
    tiers?: PlanTier[];
    intervals?: PlanInterval[];
    isActive?: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}