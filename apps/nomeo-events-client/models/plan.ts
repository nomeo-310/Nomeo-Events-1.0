// models/plan.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── Enums ────────────────────────────────────────────────────────────────────

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

// ─── Sub-interfaces ───────────────────────────────────────────────────────────

export interface ICoupon {
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
  createdAt: Date;
}

export interface IDiscount {
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  interval?: PlanInterval;
  startsAt?: Date;
  endsAt?: Date;
  isActive: boolean;
}

export interface IPlanFeature {
  name: string;
  description?: string;
  included: boolean;
  limit?: number;
  unit?: string;
}

// ─── Main interface ───────────────────────────────────────────────────────────

export interface IPlan {
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

  // isFree = true when priceKobo === 0.
  // Free plans CAN have trialDays — the Free tier uses a 14-day trial
  // to give users full access before they decide to upgrade.
  isFree: boolean;

  // trialDays > 0 on any plan (free or paid) means the user gets
  // that many days of access before their first charge (paid) or
  // before limits kick in (free). Set to 0 for no trial.
  trialDays: number;

  maxEvents?: number;
  maxAttendeesPerEvent?: number;
  maxTeamMembers?: number;
  storageGb?: number;

  features: IPlanFeature[];
  discounts: IDiscount[];
  coupons: ICoupon[];

  sortOrder: number;
  metadata: Map<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export interface IPlanDocument extends IPlan, Document {
  calculatePrice(interval: PlanInterval, couponCode?: string): {
    originalKobo: number;
    discountKobo: number;
    finalKobo: number;
    couponApplied?: ICoupon;
    discountApplied?: IDiscount;
  };
  redeemCoupon(code: string): Promise<ICoupon | null>;
}

interface IPlanModel extends Model<IPlanDocument> {
  findActive(): Promise<IPlanDocument[]>;
  findPublic(): Promise<IPlanDocument[]>;
}

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const CouponSchema = new Schema<ICoupon>(
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

const DiscountSchema = new Schema<IDiscount>(
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

const PlanFeatureSchema = new Schema<IPlanFeature>(
  {
    name: { type: String, required: true },
    description: String,
    included: { type: Boolean, default: true },
    limit: Number,
    unit: String
  },
  { _id: false }
);

// ─── Main schema ──────────────────────────────────────────────────────────────

const PlanSchema = new Schema<IPlanDocument>(
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

    // trialDays is valid on both free and paid plans.
    // Free plan example: 14-day full-access trial, then limits apply.
    // Paid plan example: 7-day trial before first charge.
    trialDays: { type: Number, default: 0, min: 0 },

    maxEvents: Number,
    maxAttendeesPerEvent: Number,
    maxTeamMembers: Number,
    storageGb: Number,

    features: [PlanFeatureSchema],
    discounts: [DiscountSchema],
    coupons: [CouponSchema],

    sortOrder: { type: Number, default: 0 },
    metadata: { type: Map, of: Schema.Types.Mixed, default: new Map() }
  },
  { timestamps: true }
);

// ─── Pre-save ─────────────────────────────────────────────────────────────────

PlanSchema.pre('save', function () {
  // Sync isFree with priceKobo — free means no charge, nothing more.
  // trialDays is intentionally NOT zeroed out here: the Free tier uses
  // trialDays to give users full-feature access before plan limits kick in.
  if (this.priceKobo === 0) {
    this.isFree = true;
  } else {
    this.isFree = false;
  }
});

// ─── Instance methods ─────────────────────────────────────────────────────────

PlanSchema.methods.calculatePrice = function ( interval: PlanInterval, couponCode?: string ): {
  originalKobo: number;
  discountKobo: number;
  finalKobo: number;
  couponApplied?: ICoupon;
  discountApplied?: IDiscount;
} {
  const now = new Date();
  let discountKobo = 0;
  let couponApplied: ICoupon | undefined;
  let discountApplied: IDiscount | undefined;

  // 1. Best active automatic discount for this interval
  const activeDiscounts: IDiscount[] = this.discounts.filter((d: IDiscount) => {
    if (!d.isActive) return false;
    if (d.startsAt && now < d.startsAt) return false;
    if (d.endsAt && now > d.endsAt) return false;
    if (d.interval && d.interval !== interval) return false;
    return true;
  });

  if (activeDiscounts.length > 0) {
    discountApplied = activeDiscounts.reduce((best: IDiscount, d: IDiscount) => {
      const bestVal = best.discountType === DiscountType.PERCENTAGE
        ? (best.discountValue / 100) * this.priceKobo
        : best.discountValue;
      const dVal = d.discountType === DiscountType.PERCENTAGE
        ? (d.discountValue / 100) * this.priceKobo
        : d.discountValue;
      return dVal > bestVal ? d : best;
    });

    discountKobo = discountApplied.discountType === DiscountType.PERCENTAGE
      ? Math.round((discountApplied.discountValue / 100) * this.priceKobo)
      : discountApplied.discountValue;
  }

  // 2. Coupon stacks on top of automatic discount
  if (couponCode) {
    const coupon: ICoupon | undefined = this.coupons.find(
      (c: ICoupon) =>
        c.code === couponCode.toUpperCase() &&
        c.status === CouponStatus.ACTIVE &&
        (!c.expiresAt || c.expiresAt > now) &&
        (!c.maxRedemptions || c.redemptionCount < c.maxRedemptions) &&
        (!c.applicableIntervals?.length || c.applicableIntervals.includes(interval))
    );

    if (coupon) {
      const priceAfterDiscount = this.priceKobo - discountKobo;
      const couponKobo = coupon.discountType === DiscountType.PERCENTAGE
        ? Math.round((coupon.discountValue / 100) * priceAfterDiscount)
        : coupon.discountValue;

      if (!coupon.minAmountKobo || priceAfterDiscount >= coupon.minAmountKobo) {
        discountKobo += couponKobo;
        couponApplied = coupon;
      }
    }
  }

  return {
    originalKobo: this.priceKobo,
    discountKobo,
    finalKobo: Math.max(0, this.priceKobo - discountKobo),
    couponApplied,
    discountApplied
  };
};

PlanSchema.methods.redeemCoupon = async function (code: string): Promise<ICoupon | null> {
  const coupon: ICoupon | undefined = this.coupons.find(
    (c: ICoupon) => c.code === code.toUpperCase() && c.status === CouponStatus.ACTIVE
  );

  if (!coupon) return null;

  coupon.redemptionCount += 1;
  if (coupon.maxRedemptions && coupon.redemptionCount >= coupon.maxRedemptions) {
    coupon.status = CouponStatus.DEPLETED;
  }

  await this.save();
  return coupon;
};

// ─── Static methods ───────────────────────────────────────────────────────────

PlanSchema.statics.findActive = function (): Promise<IPlanDocument[]> {
  return this.find({ isActive: true }).sort({ sortOrder: 1 });
};

PlanSchema.statics.findPublic = function (): Promise<IPlanDocument[]> {
  return this.find({ isActive: true, isPublic: true }).sort({ sortOrder: 1 });
};

// ─── Indexes ──────────────────────────────────────────────────────────────────

PlanSchema.index({ slug: 1 }, { unique: true });
PlanSchema.index({ tier: 1, interval: 1 });
PlanSchema.index({ isActive: 1, isPublic: 1 });
PlanSchema.index({ 'coupons.code': 1 });

// ─── Export ───────────────────────────────────────────────────────────────────

export const Plan = (mongoose.models.Plan as IPlanModel) || mongoose.model<IPlanDocument, IPlanModel>('Plan', PlanSchema);