// models/subscription.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import { PlanInterval, PlanTier, DiscountType } from './plan';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',       // Payment failed but within grace period
  CANCELLED = 'cancelled',      // User cancelled; access until periodEnd
  EXPIRED = 'expired',          // Period ended and not renewed
  PAUSED = 'paused'             // Admin-paused (e.g. dispute)
}

// ─── Main interface ───────────────────────────────────────────────────────────

export interface ISubscription {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;

  // Paystack subscription identifiers (set after Paystack creates the subscription)
  paystackSubscriptionCode?: string;  // e.g. "SUB_xxxxxxxx"
  paystackEmailToken?: string;        // Token Paystack uses to manage the sub

  status: SubscriptionStatus;

  // Plan snapshot — denormalized so billing history is correct even if plan changes
  planTier: PlanTier;
  planName: string;
  interval: PlanInterval;
  priceKobo: number;          // Price at time of subscription
  currency: string;

  // Discount / coupon applied at signup — snapshot for historical accuracy
  couponCode?: string;
  couponDiscount?: number;    // Percentage or fixed kobo — mirrors what was on the Plan coupon
  couponDiscountType?: DiscountType;
  discountKobo: number;       // Actual kobo discounted on each charge
  finalPriceKobo: number;     // priceKobo - discountKobo (what is actually charged)

  // Billing periods
  trialStart?: Date;
  trialEnd?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;

  // Renewal
  cancelAtPeriodEnd: boolean;  // true = cancel when currentPeriodEnd passes
  cancelledAt?: Date;
  cancellationReason?: string;

  // The authorization code from the first successful payment (used for recurring charges)
  paystackAuthorizationCode?: string;

  // Payment history — lightweight references; full details on Payment documents
  payments: mongoose.Types.ObjectId[];

  // Limits inherited from plan at subscription time (snapshot)
  maxEvents?: number;
  maxAttendeesPerEvent?: number;
  maxTeamMembers?: number;
  storageGb?: number;

  metadata: Map<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionDocument extends ISubscription, Document {
  isActive(): boolean;
  isInTrial(): boolean;
  cancel(reason?: string, immediately?: boolean): Promise<ISubscriptionDocument>;
  recordPayment(paymentId: mongoose.Types.ObjectId, newPeriodEnd: Date): Promise<ISubscriptionDocument>;
}

interface ISubscriptionModel extends Model<ISubscriptionDocument> {
  findActiveByUser(userId: string): Promise<ISubscriptionDocument | null>;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const SubscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: true
    },

    paystackSubscriptionCode: String,
    paystackEmailToken: String,

    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.TRIALING
    },

    // Plan snapshot
    planTier: { type: String, enum: Object.values(PlanTier), required: true },
    planName: { type: String, required: true },
    interval: { type: String, enum: Object.values(PlanInterval), required: true },
    priceKobo: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NGN' },

    // Discount snapshot
    couponCode: String,
    couponDiscount: Number,
    couponDiscountType: { type: String, enum: Object.values(DiscountType) },
    discountKobo: { type: Number, default: 0, min: 0 },
    finalPriceKobo: { type: Number, required: true, min: 0 },

    // Trial
    trialStart: Date,
    trialEnd: Date,

    // Billing period
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },

    // Renewal / cancellation
    cancelAtPeriodEnd: { type: Boolean, default: false },
    cancelledAt: Date,
    cancellationReason: String,

    paystackAuthorizationCode: String,

    payments: [{ type: Schema.Types.ObjectId, ref: 'Payment' }],

    // Limits snapshot
    maxEvents: Number,
    maxAttendeesPerEvent: Number,
    maxTeamMembers: Number,
    storageGb: Number,

    metadata: { type: Map, of: Schema.Types.Mixed, default: new Map() }
  },
  { timestamps: true }
);

// ─── Instance methods ─────────────────────────────────────────────────────────

SubscriptionSchema.methods.isActive = function (): boolean {
  const now = new Date();
  return (
    (this.status === SubscriptionStatus.ACTIVE ||
      this.status === SubscriptionStatus.TRIALING) &&
    now <= this.currentPeriodEnd
  );
};

SubscriptionSchema.methods.isInTrial = function (): boolean {
  const now = new Date();
  return (
    this.status === SubscriptionStatus.TRIALING &&
    !!this.trialEnd &&
    now <= this.trialEnd
  );
};

// Cancel the subscription — immediately or at period end
SubscriptionSchema.methods.cancel = async function (
  reason?: string,
  immediately: boolean = false
): Promise<ISubscriptionDocument> {
  this.cancelledAt = new Date();
  this.cancellationReason = reason || 'User cancelled';

  if (immediately) {
    this.status = SubscriptionStatus.CANCELLED;
    this.currentPeriodEnd = new Date(); // Access ends now
  } else {
    this.cancelAtPeriodEnd = true;
    // Status stays ACTIVE until the cron job expires it at period end
  }

  return this.save();
};

// Called by the Paystack webhook handler after a successful renewal charge
SubscriptionSchema.methods.recordPayment = async function (
  paymentId: mongoose.Types.ObjectId,
  newPeriodEnd: Date
): Promise<ISubscriptionDocument> {
  this.payments.push(paymentId);
  this.currentPeriodStart = this.currentPeriodEnd;
  this.currentPeriodEnd = newPeriodEnd;
  this.status = SubscriptionStatus.ACTIVE;
  return this.save();
};

// ─── Static methods ───────────────────────────────────────────────────────────

SubscriptionSchema.statics.findActiveByUser = function (
  userId: string
): Promise<ISubscriptionDocument | null> {
  return this.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
    currentPeriodEnd: { $gte: new Date() }
  })
    .populate('planId')
    .exec();
};

// ─── Indexes ──────────────────────────────────────────────────────────────────

// A user should only have one active subscription at a time
SubscriptionSchema.index(
  { userId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] }
    }
  }
);
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ planId: 1, status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1, status: 1 }); // For renewal cron jobs
SubscriptionSchema.index({ paystackSubscriptionCode: 1 });

// ─── Export ───────────────────────────────────────────────────────────────────

export const Subscription =
  (mongoose.models.Subscription as ISubscriptionModel) ||
  mongoose.model<ISubscriptionDocument, ISubscriptionModel>('Subscription', SubscriptionSchema);