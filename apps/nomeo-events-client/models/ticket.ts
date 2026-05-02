// models/ticket.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export enum TicketStatus {
  ACTIVE = 'active',
  USED = 'used',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  TRANSFERRED = 'transferred'
}

export interface ITicket {
  // Core references — everything else lives on Registration/Event
  registrationId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  paymentId?: mongoose.Types.ObjectId;

  // Ticket identity
  ticketNumber: string;    // e.g., "TECH-004521" (same value synced to Registration.ticketNumber)
  qrCode: string;          // Base64 or URL of QR code image
  qrCodeData: string;      // The raw string encoded in the QR (e.g., JSON payload for scanning)
  ticketUrl?: string;      // Public URL to view/download the ticket

  status: TicketStatus;

  // Plan snapshot (denormalized to survive plan edits on the event)
  planType: string;
  planName: string;
  price: number;
  currency: string;

  // Check-in tracking (mirrors Registration.checkedIn for quick scans)
  checkedIn: boolean;
  checkedInAt?: Date;
  checkedInBy?: mongoose.Types.ObjectId;

  // Transfer support
  transferredTo?: mongoose.Types.ObjectId;  // userId of new owner
  transferredAt?: Date;

  // When the ticket becomes invalid
  expiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface ITicketDocument extends ITicket, Document {
  markUsed(scannedBy: string): Promise<ITicketDocument>;
  transfer(toUserId: string): Promise<ITicketDocument>;
}

interface ITicketModel extends Model<ITicketDocument> {}

const TicketSchema = new Schema<ITicketDocument>(
  {
    registrationId: {
      type: Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
      unique: true  // One ticket per registration
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment'
    },
    ticketNumber: {
      type: String,
      required: true,
      unique: true
    },
    qrCode: {
      type: String,
      required: true
    },
    qrCodeData: {
      type: String,
      required: true
    },
    ticketUrl: String,
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.ACTIVE
    },
    // Plan snapshot
    planType: {
      type: String,
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
    // Check-in
    checkedIn: {
      type: Boolean,
      default: false
    },
    checkedInAt: Date,
    checkedInBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    // Transfer
    transferredTo: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    transferredAt: Date,
    expiresAt: Date
  },
  { timestamps: true }
);

TicketSchema.index({ ticketNumber: 1 }, { unique: true });
TicketSchema.index({ registrationId: 1 }, { unique: true });
TicketSchema.index({ eventId: 1, checkedIn: 1 });

// Mark ticket as used during check-in
TicketSchema.methods.markUsed = async function(scannedBy: string): Promise<ITicketDocument> {
  this.status = TicketStatus.USED;
  this.checkedIn = true;
  this.checkedInAt = new Date();
  this.checkedInBy = new mongoose.Types.ObjectId(scannedBy);
  return this.save();
};

// Transfer ticket to another user
TicketSchema.methods.transfer = async function(toUserId: string): Promise<ITicketDocument> {
  this.transferredTo = new mongoose.Types.ObjectId(toUserId);
  this.transferredAt = new Date();
  this.status = TicketStatus.TRANSFERRED;
  return this.save();
};

export const Ticket = (mongoose.models.Ticket as ITicketModel) ||
  mongoose.model<ITicketDocument, ITicketModel>('Ticket', TicketSchema);