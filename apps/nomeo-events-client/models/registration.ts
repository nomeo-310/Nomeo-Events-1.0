// models/registration.ts
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

// Base interface for registration data
export interface IRegistration {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  
  // Registration Details
  registrationNumber: string;
  status: RegistrationStatus;
  planType: PlanType;
  planName: string;
  price: number;
  currency: string;
  
  // Attendee Information
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
  ageGroup?: string; // Store which age group they belong to
  
  // Special Requirements
  specialRequests?: string;
  dietaryRestrictions?: string[];
  accessibilityNeeds?: string[];
  
  // Group Registration
  isGroupRegistration: boolean;
  groupSize?: number;
  groupName?: string;
  groupMembers?: {
    name: string;
    email: string;
    age?: number;
    phone?: string;
  }[];
  
  // Payment Information
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentId?: string;
  amountPaid: number;
  paymentDate?: Date;
  transactionReference?: string;
  
  // Check-in
  checkedIn: boolean;
  checkedInAt?: Date;
  checkedInBy?: mongoose.Types.ObjectId;
  
  // Tickets
  ticketUrl?: string;
  qrCode?: string;
  ticketNumber?: string;
  
  // Certificate
  certificateIssued: boolean;
  certificateUrl?: string;
  
  // Feedback
  feedbackSubmitted: boolean;
  rating?: number;
  feedback?: string;
  
  // Metadata
  metadata: Map<string, any>;
  
  // Timestamps
  registeredAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

// Document interface with methods
export interface IRegistrationDocument extends IRegistration, Document {
  cancel(reason?: string): Promise<IRegistrationDocument>;
  checkIn(userId: string): Promise<IRegistrationDocument>;
  submitFeedback(rating: number, feedback: string): Promise<IRegistrationDocument>;
}

// Define Registration Model interface
interface IRegistrationModel extends Model<IRegistrationDocument> {}

const RegistrationSchema = new Schema<IRegistrationDocument>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    registrationNumber: {
      type: String,
      required: true,
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
      default: 'USD'
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
    attendeeAge: {
      type: Number,
      required: function(this: any) {
        return this.parent()?.ageRequirement?.required;
      }
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
    attendeeGender: String,
    attendeeCompany: String,
    attendeeTitle: String,
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
        name: {
          type: String,
          required: true
        },
        email: {
          type: String,
          required: true
        },
        age: Number,
        phone: String
      }
    ],
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING
    },
    paymentMethod: String,
    paymentId: String,
    amountPaid: {
      type: Number,
      required: true
    },
    paymentDate: Date,
    transactionReference: String,
    checkedIn: {
      type: Boolean,
      default: false
    },
    checkedInAt: Date,
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    ticketUrl: String,
    qrCode: String,
    ticketNumber: String,
    certificateIssued: {
      type: Boolean,
      default: false
    },
    certificateUrl: String,
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
    cancellationReason: String
  },
  {
    timestamps: true
  }
);

// Indexes
RegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
RegistrationSchema.index({ registrationNumber: 1 }, { unique: true });
RegistrationSchema.index({ status: 1, paymentStatus: 1 });
RegistrationSchema.index({ attendeeEmail: 1 });
RegistrationSchema.index({ checkedIn: 1 });
RegistrationSchema.index({ ticketNumber: 1 });

// Pre-save middleware - Using function() without parameters
RegistrationSchema.pre('save', async function() {
  // Cast this to any to access properties
  const doc = this as any;
  
  // Generate registration number if not exists
  if (!doc.registrationNumber) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    doc.registrationNumber = `REG-${timestamp}-${random}`;
  }
  
  // Generate ticket number if not exists
  if (!doc.ticketNumber) {
    const Event = mongoose.model('Event');
    const event = await Event.findById(doc.eventId);
    if (event) {
      const prefix = event.slug.substring(0, 4).toUpperCase();
      const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      doc.ticketNumber = `${prefix}-${randomNum}`;
    }
  }
});

// Post-save middleware - Using function() without parameters
RegistrationSchema.post('save', function(doc) {
  // Use setImmediate or nextTick to avoid blocking
  setImmediate(async () => {
    try {
      if (doc.status === RegistrationStatus.CONFIRMED && doc.paymentStatus === PaymentStatus.COMPLETED) {
        const Event = mongoose.model('Event');
        await Event.findByIdAndUpdate(doc.eventId, {
          $inc: { availableSeats: -1 }
        });
        
        await Event.updateOne(
          { _id: doc.eventId, 'plans.type': doc.planType },
          { $inc: { 'plans.$.availableSeats': -1 } }
        );
      }
    } catch (error) {
      console.error('Error updating event seats:', error);
    }
  });
});

// Methods
RegistrationSchema.methods.cancel = async function(reason?: string): Promise<IRegistrationDocument> {
  const doc = this as IRegistrationDocument;
  
  doc.status = RegistrationStatus.CANCELLED;
  doc.cancelledAt = new Date();
  doc.cancellationReason = reason || 'User cancelled registration';
  await doc.save();
  
  // Return seats to event
  const Event = mongoose.model('Event');
  await Event.findByIdAndUpdate(doc.eventId, {
    $inc: { availableSeats: 1 }
  });
  
  await Event.updateOne(
    { _id: doc.eventId, 'plans.type': doc.planType },
    { $inc: { 'plans.$.availableSeats': 1 } }
  );
  
  return doc;
};

RegistrationSchema.methods.checkIn = async function(userId: string): Promise<IRegistrationDocument> {
  const doc = this as IRegistrationDocument;
  
  doc.checkedIn = true;
  doc.checkedInAt = new Date();
  doc.checkedInBy = new mongoose.Types.ObjectId(userId);
  doc.status = RegistrationStatus.ATTENDED;
  await doc.save();
  
  return doc;
};

RegistrationSchema.methods.submitFeedback = async function(rating: number, feedback: string): Promise<IRegistrationDocument> {
  const doc = this as IRegistrationDocument;
  
  doc.feedbackSubmitted = true;
  doc.rating = rating;
  doc.feedback = feedback;
  await doc.save();
  
  return doc;
};

RegistrationSchema.methods.checkAgeEligibility = function(event: any): { eligible: boolean; message?: string; requiresConsent?: boolean } {
  if (!event.ageRequirement?.required) {
    return { eligible: true };
  }
  
  const age = this.attendeeAge;
  
  // Check min age
  if (event.ageRequirement.minAge && age < event.ageRequirement.minAge) {
    return { 
      eligible: false, 
      message: `Minimum age required is ${event.ageRequirement.minAge} years old` 
    };
  }
  
  // Check max age
  if (event.ageRequirement.maxAge && age > event.ageRequirement.maxAge) {
    return { 
      eligible: false, 
      message: `Maximum age allowed is ${event.ageRequirement.maxAge} years old` 
    };
  }
  
  // Check age groups
  if (event.ageRequirement.allowedAgeGroups && event.ageRequirement.allowedAgeGroups.length > 0) {
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
  
  // Check parental consent requirement
  if (event.ageRequirement.requiresParentalConsent && age < 18) {
    return { 
      eligible: true, 
      requiresConsent: true,
      message: event.ageRequirement.parentalConsentMessage || "Parental consent is required for attendees under 18"
    };
  }
  
  return { eligible: true };
};


// Create and export the model
export const Registration = (mongoose.models.Registration as IRegistrationModel) || 
  mongoose.model<IRegistrationDocument, IRegistrationModel>('Registration', RegistrationSchema);