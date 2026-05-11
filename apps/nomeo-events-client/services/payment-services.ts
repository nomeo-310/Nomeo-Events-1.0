// services/payment.service.ts
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import { Payment, PaymentGatewayStatus, PaymentProvider, PaymentPurpose, IPaymentDocument } from '@/models/payment';
import { paystack, PaystackTransaction } from '@/lib/paystack';
import { ObjectId } from 'mongodb';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InitiateEventPaymentInput {
  purpose: PaymentPurpose.EVENT_REGISTRATION;
  email: string;
  eventId: mongoose.Types.ObjectId | string;
  amount: number; // in kobo
  registrationId?: mongoose.Types.ObjectId | string;
  currency?: string;
  couponCode?: string;
  couponDiscount?: number;
  discountAmount?: number;
  metadata?: Record<string, unknown>;
}

export interface InitiateSubscriptionPaymentInput {
  purpose: PaymentPurpose.SUBSCRIPTION;
  email: string;
  subscriptionId: mongoose.Types.ObjectId | string;
  planId: mongoose.Types.ObjectId | string;
  amount: number; // in kobo
  currency?: string;
  couponCode?: string;
  couponDiscount?: number;
  discountAmount?: number;
  metadata?: Record<string, unknown>;
}

export type InitiatePaymentInput =
  | InitiateEventPaymentInput
  | InitiateSubscriptionPaymentInput;

export interface PaymentFilters {
  purpose?: PaymentPurpose;
  gatewayStatus?: PaymentGatewayStatus;
  eventId?: string;
  registrationId?: string;
  subscriptionId?: string;
  organizerId?: string; // Changed from userId to organizerId
  page?: number;
  limit?: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const PaymentService = {
  /**
   * Create a payment record and initialize a Paystack transaction.
   * Returns the access_code and authorizationUrl for the frontend Paystack modal.
   */
  async initiate(input: InitiatePaymentInput) {
    const reference = `pay_${nanoid(16)}`;
    const amountPaid = input.amount - (input.discountAmount ?? 0);

    // Build context fields depending on purpose.
    const contextFields =
      input.purpose === PaymentPurpose.EVENT_REGISTRATION
        ? {
            eventId: new mongoose.Types.ObjectId(input.eventId as string),
            ...(input.registrationId && {
              registrationId: new mongoose.Types.ObjectId(
                input.registrationId as string
              ),
            }),
          }
        : {
            subscriptionId: new mongoose.Types.ObjectId(
              input.subscriptionId as string
            ),
            planId: new mongoose.Types.ObjectId(input.planId as string),
          };

    // Initialize on Paystack first — fail fast before writing to DB
    const paystackData = await paystack.initializeTransaction({
      email: input.email,
      amount: amountPaid,
      reference,
      currency: input.currency ?? 'NGN',
      metadata: {
        purpose: input.purpose,
        ...(input.metadata ?? {}),
      },
    });

    // Persist the payment record only after Paystack confirms initialization.
    const payment = await Payment.create({
      purpose: input.purpose,
      provider: PaymentProvider.PAYSTACK,
      ...contextFields,
      amount: input.amount,
      amountPaid,
      discountAmount: input.discountAmount ?? 0,
      currency: input.currency ?? 'NGN',
      couponCode: input.couponCode,
      couponDiscount: input.couponDiscount,
      reference,
      accessCode: paystackData.access_code,
      authorizationUrl: paystackData.authorization_url,
      gatewayStatus: PaymentGatewayStatus.PENDING,
    });

    return {
      payment,
      accessCode: paystackData.access_code,
      authorizationUrl: paystackData.authorization_url,
      reference,
    };
  },

  /**
   * Verify a payment by reference against Paystack and update the local record.
   */
  async verify(reference: string): Promise<IPaymentDocument> {
    const payment = await Payment.findOne({ reference });
    if (!payment) throw new Error('Payment record not found');

    // Already in a terminal state — skip the Paystack network call
    if (
      payment.gatewayStatus === PaymentGatewayStatus.SUCCESS ||
      payment.gatewayStatus === PaymentGatewayStatus.FAILED ||
      payment.gatewayStatus === PaymentGatewayStatus.REVERSED
    ) {
      return payment;
    }

    const tx = await paystack.verifyTransaction(reference);

    payment.gatewayStatus = mapPaystackStatus(tx.status);
    payment.paystackReference = tx.reference;
    payment.gatewayResponse = tx.gateway_response;
    payment.channel = tx.channel;
    payment.ipAddress = tx.ip_address;
    payment.paidAt = tx.paid_at ? new Date(tx.paid_at) : undefined;
    payment.cardType = tx.authorization?.card_type;
    payment.cardLast4 = tx.authorization?.last4;
    payment.cardBank = tx.authorization?.bank;
    payment.authorizationCode = tx.authorization?.authorization_code;

    await payment.save();
    return payment;
  },

  /**
   * Process a verified Paystack webhook event.
   */
  async handleWebhook(rawBody: string, signature: string) {
    if (!paystack.validateWebhookSignature(rawBody, signature)) {
      throw new Error('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody) as {
      event: string;
      data: PaystackTransaction;
    };

    if (event.event === 'charge.success') {
      const payment = await PaymentService.verify(event.data.reference);
      return { handled: true, payment };
    }

    return { handled: false, event: event.event };
  },

  /**
   * Initiate a full or partial refund via Paystack and record it locally.
   */
  async refund(
    paymentId: string,
    { amount, reason }: { amount?: number; reason?: string }
  ): Promise<IPaymentDocument> {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error('Payment not found');
    if (!payment.isSuccessful()) throw new Error('Only successful payments can be refunded');
    if (payment.isRefunded()) throw new Error('Payment already refunded');

    const refundData = await paystack.refund(payment.reference, amount);

    payment.refundedAt = new Date(refundData.refunded_at);
    payment.refundAmount = refundData.amount;
    payment.refundReference = refundData.refund_reference;
    payment.refundReason = reason;
    payment.gatewayStatus = PaymentGatewayStatus.REVERSED;

    await payment.save();
    return payment;
  },

  /**
   * List payments with optional filters and pagination.
   * If organizerId is provided, only returns payments for events organized by that user.
   */
  async list(filters: PaymentFilters = {}) {
    const { page = 1, limit = 20, organizerId, ...rest } = filters;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (rest.purpose) query.purpose = rest.purpose;
    if (rest.gatewayStatus) query.gatewayStatus = rest.gatewayStatus;
    if (rest.eventId) query.eventId = new mongoose.Types.ObjectId(rest.eventId);
    if (rest.registrationId)
      query.registrationId = new mongoose.Types.ObjectId(rest.registrationId);
    if (rest.subscriptionId)
      query.subscriptionId = new mongoose.Types.ObjectId(rest.subscriptionId);

    // If organizerId is provided, filter payments by events organized by that user
    if (organizerId) {
      // First, get all event IDs organized by this user
      const Event = mongoose.model('Event');
      const userEvents = await Event.find({ organizerId: new ObjectId(organizerId) }).select('_id');
      const eventIds = userEvents.map(event => event._id);
      
      // Add to query: only payments where eventId is in the user's events
      if (eventIds.length > 0) {
        query.eventId = { $in: eventIds };
      } else {
        // User has no events, return empty result
        return {
          payments: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }
    }

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('eventId', 'title date slug') // Populate event details
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get a single payment by ID, with access control based on user's organized events.
   */
  async getById(id: string, organizerId?: string): Promise<IPaymentDocument> {
    const payment = await Payment.findById(id).populate('eventId', 'title date slug');
    if (!payment) throw new Error('Payment not found');

    // If organizerId is provided, verify that the payment belongs to an event organized by the user
    if (organizerId && payment.eventId) {
      const Event = mongoose.model('Event');
      const event = await Event.findById(payment.eventId);
      if (!event || event.organizerId.toString() !== organizerId) {
        throw new Error('Unauthorized: You do not have permission to view this payment');
      }
    }

    return payment;
  },

  /**
   * Get payment statistics for an organizer (total revenue, successful payments, etc.)
   */
  async getStats(organizerId: string) {
    // Get all event IDs organized by this user
    const Event = mongoose.model('Event');
    const userEvents = await Event.find({ organizerId: new ObjectId(organizerId) }).select('_id');
    const eventIds = userEvents.map(event => event._id);

    if (eventIds.length === 0) {
      return {
        totalRevenue: 0,
        successfulPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        refundedPayments: 0,
        averagePaymentAmount: 0,
        totalEvents: 0,
        totalTransactions: 0,
      };
    }

    const stats = await Payment.aggregate([
      {
        $match: {
          eventId: { $in: eventIds },
          purpose: PaymentPurpose.EVENT_REGISTRATION,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$gatewayStatus', PaymentGatewayStatus.SUCCESS] },
                '$amountPaid',
                0,
              ],
            },
          },
          successfulPayments: {
            $sum: {
              $cond: [{ $eq: ['$gatewayStatus', PaymentGatewayStatus.SUCCESS] }, 1, 0],
            },
          },
          pendingPayments: {
            $sum: {
              $cond: [{ $eq: ['$gatewayStatus', PaymentGatewayStatus.PENDING] }, 1, 0],
            },
          },
          failedPayments: {
            $sum: {
              $cond: [{ $eq: ['$gatewayStatus', PaymentGatewayStatus.FAILED] }, 1, 0],
            },
          },
          refundedPayments: {
            $sum: {
              $cond: [{ $eq: ['$gatewayStatus', PaymentGatewayStatus.REVERSED] }, 1, 0],
            },
          },
          abandonedPayments: {
            $sum: {
              $cond: [{ $eq: ['$gatewayStatus', PaymentGatewayStatus.ABANDONED] }, 1, 0],
            },
          },
          averagePaymentAmount: { $avg: '$amountPaid' },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    const result = stats[0] || {
      totalRevenue: 0,
      successfulPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
      refundedPayments: 0,
      abandonedPayments: 0,
      averagePaymentAmount: 0,
      totalTransactions: 0,
    };

    return {
      ...result,
      totalEvents: eventIds.length,
    };
  },

  /**
   * Get recent payments for an organizer (last 10 payments)
   */
  async getRecentPayments(organizerId: string, limit: number = 10) {
    const Event = mongoose.model('Event');
    const userEvents = await Event.find({ organizerId: new ObjectId(organizerId) }).select('_id');
    const eventIds = userEvents.map(event => event._id);

    if (eventIds.length === 0) {
      return [];
    }

    const payments = await Payment.find({
      eventId: { $in: eventIds },
    })
      .populate('eventId', 'title date slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return payments;
  },

  /**
   * Get payment summary by event for an organizer
   */
  async getPaymentsByEvent(organizerId: string) {
    const Event = mongoose.model('Event');
    const userEvents = await Event.find({ organizerId: new ObjectId(organizerId) }).select('_id title slug');
    const eventIds = userEvents.map(event => event._id);

    if (eventIds.length === 0) {
      return [];
    }

    const paymentsByEvent = await Payment.aggregate([
      {
        $match: {
          eventId: { $in: eventIds },
          purpose: PaymentPurpose.EVENT_REGISTRATION,
          gatewayStatus: PaymentGatewayStatus.SUCCESS,
        },
      },
      {
        $group: {
          _id: '$eventId',
          totalRevenue: { $sum: '$amountPaid' },
          totalRegistrations: { $sum: 1 },
          averageAmount: { $avg: '$amountPaid' },
        },
      },
      {
        $lookup: {
          from: 'events',
          localField: '_id',
          foreignField: '_id',
          as: 'event',
        },
      },
      {
        $unwind: '$event',
      },
      {
        $project: {
          eventId: '$_id',
          eventTitle: '$event.title',
          eventSlug: '$event.slug',
          totalRevenue: 1,
          totalRegistrations: 1,
          averageAmount: 1,
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    return paymentsByEvent;
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapPaystackStatus(status: string): PaymentGatewayStatus {
  const map: Record<string, PaymentGatewayStatus> = {
    success: PaymentGatewayStatus.SUCCESS,
    failed: PaymentGatewayStatus.FAILED,
    abandoned: PaymentGatewayStatus.ABANDONED,
    reversed: PaymentGatewayStatus.REVERSED,
  };
  return map[status] ?? PaymentGatewayStatus.PENDING;
}