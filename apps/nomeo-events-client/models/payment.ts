// models/payment.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export enum PaymentProvider {
  PAYSTACK = 'paystack'
}

export enum PaymentPurpose {
  EVENT_REGISTRATION = 'event_registration',
  SUBSCRIPTION = 'subscription'
}

export enum PaymentGatewayStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  ABANDONED = 'abandoned',
  REVERSED = 'reversed'
}

export interface IPayment {
  purpose: PaymentPurpose;
  provider: PaymentProvider;

  // Contextual references — only one pair is set depending on purpose
  // EVENT_REGISTRATION
  registrationId?: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;
  // SUBSCRIPTION
  subscriptionId?: mongoose.Types.ObjectId;
  planId?: mongoose.Types.ObjectId;

  // Amount (in kobo for NGN — always store in smallest currency unit)
  amount: number;         // Amount intended to charge
  amountPaid: number;     // Amount actually charged (may differ if coupon/discount applied)
  discountAmount: number; // Kobo discounted (0 if none)
  currency: string;

  // Coupon snapshot — denormalized so historical payments reflect the deal at time of charge
  couponCode?: string;
  couponDiscount?: number; // The percentage or fixed kobo amount that was applied

  // Paystack handshake fields
  reference: string;           // Your generated reference sent to Paystack
  paystackReference?: string;  // Paystack's own reference (from webhook)
  accessCode?: string;         // For Paystack hosted page
  authorizationUrl?: string;   // Redirect URL for hosted checkout

  // Paystack webhook / verification response
  gatewayStatus: PaymentGatewayStatus;
  gatewayResponse?: string;    // e.g. "Approved", "Declined"
  channel?: string;            // 'card' | 'bank_transfer' | 'ussd' | 'qr' | 'mobile_money'
  ipAddress?: string;
  paidAt?: Date;

  // Non-sensitive card / bank details returned by Paystack
  cardType?: string;           // 'visa' | 'mastercard' | 'verve'
  cardLast4?: string;
  cardBank?: string;
  authorizationCode?: string;  // Reusable token for recurring charges (Paystack charge auth)

  // Refund tracking
  refundedAt?: Date;
  refundAmount?: number;
  refundReference?: string;
  refundReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentDocument extends IPayment, Document {
  isSuccessful(): boolean;
  isRefunded(): boolean;
}

interface IPaymentModel extends Model<IPaymentDocument> {}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    purpose: {
      type: String,
      enum: Object.values(PaymentPurpose),
      required: true
    },

    // Event registration context (set when purpose = EVENT_REGISTRATION)
    registrationId: {
      type: Schema.Types.ObjectId,
      ref: 'Registration'
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event'
    },

    // Subscription context (set when purpose = SUBSCRIPTION)
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'Plan'
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'NGN'
    },

    couponCode: String,
    couponDiscount: Number,

    reference: {
      type: String,
      required: true,
      unique: true
    },
    paystackReference: String,
    accessCode: String,
    authorizationUrl: String,

    gatewayStatus: {
      type: String,
      enum: Object.values(PaymentGatewayStatus),
      default: PaymentGatewayStatus.PENDING
    },
    gatewayResponse: String,
    channel: String,
    ipAddress: String,
    paidAt: Date,

    cardType: String,
    cardLast4: String,
    cardBank: String,
    authorizationCode: String,

    refundedAt: Date,
    refundAmount: Number,
    refundReference: String,
    refundReason: String
  },
  { timestamps: true }
);

// Enforce correct context fields per purpose
PaymentSchema.pre('validate', function () {
  if (this.purpose === PaymentPurpose.EVENT_REGISTRATION) {
    if (!this.registrationId || !this.eventId) {
      throw new Error('registrationId and eventId are required for event_registration payments');
    }
  }
  if (this.purpose === PaymentPurpose.SUBSCRIPTION) {
    if (!this.subscriptionId || !this.planId) {
      throw new Error('subscriptionId and planId are required for subscription payments');
    }
  }
});

PaymentSchema.index({ reference: 1 }, { unique: true });
PaymentSchema.index({ purpose: 1, gatewayStatus: 1 });
PaymentSchema.index({ registrationId: 1 });
PaymentSchema.index({ subscriptionId: 1 });
PaymentSchema.index({ eventId: 1, gatewayStatus: 1 });

PaymentSchema.methods.isSuccessful = function (): boolean {
  return this.gatewayStatus === PaymentGatewayStatus.SUCCESS;
};

PaymentSchema.methods.isRefunded = function (): boolean {
  return !!this.refundedAt;
};

export const Payment = (mongoose.models.Payment as IPaymentModel) || mongoose.model<IPaymentDocument, IPaymentModel>('Payment', PaymentSchema);