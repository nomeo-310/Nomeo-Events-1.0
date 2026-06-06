// types/plan-type.ts
import { Types } from 'mongoose';

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
  interval?: string;
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
  applicableIntervals?: string[];
  status: CouponStatus;
  expiresAt?: Date;
}

// NEW: Plan Tier Type
export interface PlanTierDocument {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// NEW: Plan Interval Type
export interface PlanIntervalDocument {
  _id: string;
  name: string;
  slug: string;
  value: string;
  monthsCount: number;
  multiplier: number;
  discount: number;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mongoose Document Type
export interface IPlanDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  tier: string;
  description?: string;
  isActive: boolean;
  isPublic: boolean;
  priceKobo: number;
  currency: string;
  interval: string;
  tierId?: Types.ObjectId;
  intervalId?: Types.ObjectId;
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
  tier: string;
  description?: string;
  isActive: boolean;
  isPublic: boolean;
  priceKobo: number;
  currency: string;
  interval: string;
  tierId?: string;
  intervalId?: string;
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
  interval: string;
  priceKobo: number;
  priceDisplay: string;
  pricePerMonthKobo: number;
  pricePerMonthDisplay: string;
  savings?: {
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
  tier: string;
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
  value: string;
  label: string;
  discount: string | null;
  isPopular?: boolean;
  sortOrder: number;
}

export interface PricingResponse {
  tiers: TierPricing[];
  defaultInterval: string;
  supportedIntervals: SupportedInterval[];
  availableOptions?: {
    tiers: PlanTierDocument[];
    intervals: PlanIntervalDocument[];
  };
}

export interface PlansListResponse {
  plans: PlanDocument[];
  total: number;
  filters: {
    tiers?: string[];
    intervals?: string[];
    isActive?: boolean;
    isPublic?: boolean;
  };
  availableOptions?: {
    tiers: PlanTierDocument[];
    intervals: PlanIntervalDocument[];
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}