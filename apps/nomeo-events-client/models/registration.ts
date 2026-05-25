import mongoose, { Schema, Document, Model } from 'mongoose';
import { PlanType } from './event';

export enum RegistrationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  ATTENDED = 'attended',
  WAITLISTED = 'waitlisted',
  REFUNDED = 'refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIAL = 'partial'
}

export interface IRegistration {
  eventId?: mongoose.Types.ObjectId;
  paymentId?: mongoose.Types.ObjectId;
  ticketId?: mongoose.Types.ObjectId;
  registrationNumber: string;
  status: RegistrationStatus;
  planType: PlanType;
  planName: string;
  price: number;
  currency: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  attendeeGender?: string;
  attendeeCompany?: string;
  attendeeTitle?: string;
  attendeeAge: number;
  ageVerified: boolean;
  ageVerifiedAt?: Date;
  ageVerifiedBy?: mongoose.Types.ObjectId;
  parentalConsentProvided: boolean;
  parentalConsentAt?: Date;
  parentalConsentByName?: string;
  parentalConsentByEmail?: string;
  ageGroup?: string;
  specialRequests?: string;
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
  isGroupRegistration: boolean;
  groupSize?: number;
  groupName?: string;
  groupMembers?: {
    name: string;
    email: string;
    age?: number;
    phone?: string;
  }[];
  isCorporateRegistration?: boolean;
  companyName?: string;
  companySize?: number;
  companyMembers?: {
    name: string;
    email: string;
    age?: number;
    phone?: string;
  }[];
  paymentStatus: PaymentStatus;
  certificateIssued: boolean;
  feedbackSubmitted: boolean;
  rating?: number;
  feedback?: string;
  metadata: Map<string, any>;
  registeredAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancelledBy?: "by_user" | "by_organizer" | "by_admin";
  cancellationOtp?: string;
  cancellationOtpExpiresAt?: number;
}

export interface IRegistrationDocument extends IRegistration, Document {
  cancel(reason?: string, cancelledBy?: "by_user" | "by_organizer" | "by_admin" ): Promise<IRegistrationDocument>;
  checkIn(email: string): Promise<IRegistrationDocument>;
  submitFeedback(rating: number, feedback: string): Promise<IRegistrationDocument>;
  checkAgeEligibility(event: any): { eligible: boolean; message?: string; requiresConsent?: boolean };
}

interface IRegistrationModel extends Model<IRegistrationDocument> {}

const RegistrationSchema = new Schema<IRegistrationDocument>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment'
    },
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket'
    },
    registrationNumber: {
      type: String,
      unique: true
    },
    status: {
      type: String,
      enum: Object.values(RegistrationStatus),
      default: RegistrationStatus.PENDING
    },
    planType: {
      type: String,
      enum: Object.values(PlanType),
      required: true
    },
    planName: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'NGN'
    },
    attendeeName: {
      type: String,
      required: true
    },
    attendeeEmail: {
      type: String,
      required: true,
      lowercase: true
    },
    attendeePhone: String,
    attendeeGender: String,
    attendeeCompany: String,
    attendeeTitle: String,
    attendeeAge: {
      type: Number,
    },
    ageVerified: {
      type: Boolean,
      default: false
    },
    ageVerifiedAt: Date,
    ageVerifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    parentalConsentProvided: {
      type: Boolean,
      default: false
    },
    parentalConsentAt: Date,
    parentalConsentByName: String,
    parentalConsentByEmail: String,
    ageGroup: String,
    specialRequests: String,
    dietaryRestrictions: [String],
    accessibilityNeeds: [String],
    isGroupRegistration: {
      type: Boolean,
      default: false
    },
    groupSize: Number,
    groupName: String,
    groupMembers: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        age: Number,
        phone: String
      }
    ],
    isCorporateRegistration: {
      type: Boolean,
      default: false
    },
    companyName: String,
    companySize: Number,
    companyMembers: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        age: Number,
        phone: String
      }
    ],
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING
    },
    certificateIssued: {
      type: Boolean,
      default: false
    },
    feedbackSubmitted: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map()
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    cancelledAt: Date,
    cancellationReason: String,
    cancelledBy: { type: String, enum: ["by_user", "by_organizer", "by_admin"] },
    cancellationOtp: { type: String, select: false },
    cancellationOtpExpiresAt: { type: Number, select: false }
  },
  { timestamps: true }
);

RegistrationSchema.index({ eventId: 1, attendeeEmail: 1 }, { unique: true, sparse: true });
RegistrationSchema.index({ registrationNumber: 1 }, { unique: true });
RegistrationSchema.index({ status: 1, paymentStatus: 1 });
RegistrationSchema.index({ attendeeEmail: 1 });

// Pre-save: generate registration number
RegistrationSchema.pre('save', async function () {
  const doc = this as any;

  if (!doc.registrationNumber) {
    let isUnique = false;
    let registrationNumber = '';
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      registrationNumber = `REG-${timestamp}-${random}`;

      const existing = await Registration.findOne({ registrationNumber });
      if (!existing) {
        isUnique = true;
        doc.registrationNumber = registrationNumber.toUpperCase();
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique registration number');
    }
  }
});

// ─── cancel() ────────────────────────────────────────────────────────────────
// Owns the full cancellation lifecycle:
//   1. Marks the registration as cancelled
//   2. Restores global + plan-level event seats
//   3. Cancels the linked ticket
//   4. Marks the linked payment as reversed + sets Registration.paymentStatus
RegistrationSchema.methods.cancel = async function (
  reason?: string,
  cancelledBy?: "by_user" | "by_organizer" | "by_admin"
): Promise<IRegistrationDocument> {
  const doc = this as IRegistrationDocument;

  const totalTickets = doc.isGroupRegistration
    ? doc.groupSize || 1
    : doc.isCorporateRegistration
    ? doc.companySize || 1
    : 1;

  // ── 1. Update registration fields ──
  doc.status = RegistrationStatus.CANCELLED;
  doc.cancelledAt = new Date();
  doc.cancellationReason = reason || 'Cancelled';
  if (cancelledBy) doc.cancelledBy = cancelledBy;

  // Sync paymentStatus on the registration document itself
  if (doc.paymentId && doc.paymentStatus === PaymentStatus.COMPLETED) {
    doc.paymentStatus = PaymentStatus.REFUNDED;
  }

  await doc.save();

  const EventModel = mongoose.model('Event');
  const Ticket = mongoose.model('Ticket');
  const Payment = mongoose.model('Payment');

  // ── 2. Restore seats (global + plan) ──
  await EventModel.findByIdAndUpdate(doc.eventId, {
    $inc: { availableSeats: totalTickets }
  });

  await EventModel.updateOne(
    { _id: doc.eventId, 'plans.type': doc.planType },
    { $inc: { 'plans.$.availableSeats': totalTickets } }
  );

  // ── 3. Cancel the ticket ──
  if (doc.ticketId) {
    await Ticket.findByIdAndUpdate(doc.ticketId, {
      $set: { status: 'cancelled' }
    });
  }

  // ── 4. Reverse the payment (only if paid and completed) ──
  if (doc.paymentId && doc.paymentStatus === PaymentStatus.REFUNDED) {
    await Payment.findByIdAndUpdate(doc.paymentId, {
      $set: {
        gatewayStatus: 'reversed',
        refundedAt: new Date(),
        refundReason: reason || 'Registration cancelled',
      }
    });
  }

  return doc;
};

RegistrationSchema.methods.checkIn = async function (email: string): Promise<IRegistrationDocument> {
  const doc = this as IRegistrationDocument;
  doc.status = RegistrationStatus.ATTENDED;
  await doc.save();
  return doc;
};

RegistrationSchema.methods.submitFeedback = async function (
  rating: number,
  feedback: string
): Promise<IRegistrationDocument> {
  const doc = this as IRegistrationDocument;
  doc.feedbackSubmitted = true;
  doc.rating = rating;
  doc.feedback = feedback;
  await doc.save();
  return doc;
};

RegistrationSchema.methods.checkAgeEligibility = function (
  event: any
): { eligible: boolean; message?: string; requiresConsent?: boolean } {
  if (!event.ageRequirement?.required) {
    return { eligible: true };
  }

  const age = this.attendeeAge;

  if (event.ageRequirement.minAge && age < event.ageRequirement.minAge) {
    return { eligible: false, message: `Minimum age required is ${event.ageRequirement.minAge} years old` };
  }

  if (event.ageRequirement.maxAge && age > event.ageRequirement.maxAge) {
    return { eligible: false, message: `Maximum age allowed is ${event.ageRequirement.maxAge} years old` };
  }

  if (event.ageRequirement.allowedAgeGroups?.length > 0) {
    let ageGroup = '';
    if (age <= 25) ageGroup = '18-25';
    else if (age <= 35) ageGroup = '26-35';
    else if (age <= 50) ageGroup = '36-50';
    else ageGroup = '50+';

    if (!event.ageRequirement.allowedAgeGroups.includes(ageGroup)) {
      return {
        eligible: false,
        message: `This event is only for age groups: ${event.ageRequirement.allowedAgeGroups.join(', ')}`
      };
    }
    this.ageGroup = ageGroup;
  }

  if (event.ageRequirement.requiresParentalConsent && age < 18) {
    return {
      eligible: true,
      requiresConsent: true,
      message: event.ageRequirement.parentalConsentMessage || 'Parental consent is required for attendees under 18'
    };
  }

  return { eligible: true };
};

export const Registration = (mongoose.models.Registration as IRegistrationModel) || mongoose.model<IRegistrationDocument, IRegistrationModel>('Registration', RegistrationSchema);