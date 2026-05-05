// models/subscription.ts
import mongoose, { Schema, Document, Model } from 'mongoose';
import { PlanInterval, PlanTier, DiscountType, Plan } from './plan';
import { Notification } from './notification';
import { ObjectId } from 'mongodb';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum SubscriptionStatus {
  TRIALING  = 'trialing',
  ACTIVE    = 'active',
  PAST_DUE  = 'past_due',   // Payment failed but within grace period
  CANCELLED = 'cancelled',  // User cancelled; access until periodEnd
  EXPIRED   = 'expired',    // Period ended and not renewed
  PAUSED    = 'paused'      // Admin-paused (e.g. dispute)
}

const systemId = new ObjectId('000000000000000000000001');

// ─── Main interface ───────────────────────────────────────────────────────────

export interface ISubscription {
  userId: mongoose.Types.ObjectId;
  planId: mongoose.Types.ObjectId;

  paystackSubscriptionCode?: string;
  paystackEmailToken?: string;

  status: SubscriptionStatus;

  // Plan snapshot — denormalized so billing history is correct if plan changes
  planTier: PlanTier;
  planName: string;
  interval: PlanInterval;
  priceKobo: number;
  currency: string;

  // Discount / coupon snapshot
  couponCode?: string;
  couponDiscount?: number;
  couponDiscountType?: DiscountType;
  discountKobo: number;
  finalPriceKobo: number;

  // Billing periods
  trialStart?: Date;
  trialEnd?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;

  // Renewal
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  cancellationReason?: string;

  paystackAuthorizationCode?: string;
  payments: mongoose.Types.ObjectId[];

  // Limits snapshot from plan at subscription time
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

// ── Static methods ─────────────────────────────────────────────────────────────
// initialSubscription takes (userId, username) — username is used in the
// welcome notification. subscribeToFreePlan mirrors this signature.

interface ISubscriptionModel extends Model<ISubscriptionDocument> {
  findActiveByUser(userId: string): Promise<ISubscriptionDocument | null>;
  findFreePlan(): Promise<any>;
  initialSubscription(userId: string, username: string): Promise<ISubscriptionDocument>;
  subscribeToFreePlan(userId: string, username: string): Promise<ISubscriptionDocument>;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const SubscriptionSchema = new Schema<ISubscriptionDocument, ISubscriptionModel>(
  {
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    planId:  { type: Schema.Types.ObjectId, ref: 'Plan', required: true },

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

SubscriptionSchema.methods.cancel = async function (
  reason?: string,
  immediately = false
): Promise<ISubscriptionDocument> {
  this.cancelledAt = new Date();
  this.cancellationReason = reason ?? 'User cancelled';

  if (immediately) {
    this.status = SubscriptionStatus.CANCELLED;
    this.currentPeriodEnd = new Date();
  } else {
    this.cancelAtPeriodEnd = true;
    // Status stays ACTIVE — cron expires it at period end
  }

  return this.save();
};

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
    currentPeriodEnd: { $gte: new Date() },
  })
    .populate('planId')
    .exec();
};

SubscriptionSchema.statics.findFreePlan = function () {
  return Plan.findOne({
    $or: [{ priceKobo: 0 }, { tier: PlanTier.FREE }],
  }).exec();
};

/**
 * initialSubscription — called once at user signup.
 * Finds the free plan, starts a trial if trialDays > 0, and fires
 * a welcome notification.
 *
 * @param userId   - The new user's ObjectId string
 * @param username - Used in the welcome notification message
 */
SubscriptionSchema.statics.initialSubscription = async function (
  userId: string,
  username: string
): Promise<ISubscriptionDocument> {
  // Guard: only one subscription per user
  const existing = await this.findOne({ userId: new mongoose.Types.ObjectId(userId) });
  if (existing) {
    throw new Error('User already has a subscription');
  }

  const freePlan = await Plan.findOne({
    $or: [{ priceKobo: 0 }, { tier: PlanTier.FREE }],
  });

  if (!freePlan) {
    throw new Error('No free plan found. Please seed a free plan first.');
  }

  const now = new Date();
  const trialDays: number = freePlan.trialDays ?? 0;

  let status = SubscriptionStatus.ACTIVE;
  let trialStart: Date | undefined;
  let trialEnd: Date | undefined;
  let currentPeriodEnd: Date;

  if (trialDays > 0) {
    status = SubscriptionStatus.TRIALING;
    trialStart = now;
    trialEnd = new Date(now.getTime() + trialDays * 86_400_000);
    currentPeriodEnd = trialEnd;
  } else {
    // Free plans without a trial period get a 10-year window
    currentPeriodEnd = new Date(now);
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 10);
  }

  const subscription = new this({
    userId: new mongoose.Types.ObjectId(userId),
    planId: freePlan._id,
    status,
    planTier: freePlan.tier,
    planName: freePlan.name,
    interval: freePlan.interval,
    priceKobo: freePlan.priceKobo,
    currency: freePlan.currency ?? 'NGN',
    discountKobo: 0,
    finalPriceKobo: freePlan.priceKobo,
    trialStart,
    trialEnd,
    currentPeriodStart: now,
    currentPeriodEnd,
    cancelAtPeriodEnd: false,
    payments: [],
    maxEvents: freePlan.maxEvents,
    maxAttendeesPerEvent: freePlan.maxAttendeesPerEvent,
    maxTeamMembers: freePlan.maxTeamMembers,
    storageGb: freePlan.storageGb,
    metadata: new Map([['source', 'initial_signup']]),
  });

// Send welcome notification
  const trialEndDateFormatted = trialEnd?.toLocaleDateString() || 'the end of your trial';
  
  await Notification.create({
    senderId: systemId,
    receiverId: new mongoose.Types.ObjectId(userId),
    title: trialDays > 0 ? `Welcome! Your ${trialDays}-Day Free Trial Has Started` : "Welcome to the Free Plan!",
    message: trialDays > 0 
      ? `Hi ${username}, your account is now active with a ${trialDays}-day free trial! During this period, you'll have access to all features including event management, attendee tracking, and team collaboration. Your trial will expire on ${trialEndDateFormatted}. No payment details needed until your trial ends. Explore your dashboard to get started!`
      : `Hi ${username}, your account is now active on the free plan! You have access to basic features including event management and attendee tracking. Upgrade anytime to unlock more features. Explore your dashboard to get started!`,
    message_type: "update",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return subscription.save();
};

/**
 * subscribeToFreePlan — alias for initialSubscription.
 * Kept for backwards compatibility; passes username through correctly.
 */
SubscriptionSchema.statics.subscribeToFreePlan = function (
  userId: string,
  username: string
): Promise<ISubscriptionDocument> {
  return this.initialSubscription(userId, username);
};

// ─── Indexes ──────────────────────────────────────────────────────────────────

// One active subscription per user at a time
SubscriptionSchema.index(
  { userId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
    },
  }
);
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ planId: 1, status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1, status: 1 });
SubscriptionSchema.index({ paystackSubscriptionCode: 1 });

// ─── Export ───────────────────────────────────────────────────────────────────

export const Subscription =
  (mongoose.models.Subscription as ISubscriptionModel) ||
  mongoose.model<ISubscriptionDocument, ISubscriptionModel>('Subscription', SubscriptionSchema);