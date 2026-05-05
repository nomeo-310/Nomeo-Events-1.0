// services/payment.service.ts
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import { Payment, PaymentGatewayStatus, PaymentProvider, PaymentPurpose, IPaymentDocument } from '@/models/payment';
import { paystack, PaystackTransaction } from '@/lib/paystack';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InitiateEventPaymentInput {
  purpose: PaymentPurpose.EVENT_REGISTRATION;
  email: string;
  eventId: mongoose.Types.ObjectId | string;
  amount: number; // in kobo
  // registrationId is optional — no registration exists yet when payment is
  // initiated. The webhook handler links the registration back to this Payment
  // record after the transaction is confirmed, using the shared reference.
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
  page?: number;
  limit?: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const PaymentService = {
  /**
   * Create a payment record and initialize a Paystack transaction.
   * Returns the access_code and authorizationUrl for the frontend Paystack modal.
   *
   * For event registrations, registrationId may be omitted — the webhook
   * handler is responsible for linking the registration after confirmation.
   */
  async initiate(input: InitiatePaymentInput) {
    const reference = `pay_${nanoid(16)}`;
    const amountPaid = input.amount - (input.discountAmount ?? 0);

    // Build context fields depending on purpose.
    // For event registrations, registrationId is stored only when provided.
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
    // if Paystack is unreachable or rejects the request.
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
   * Safe to call multiple times — skips the network call if already confirmed.
   * Called by the polling fallback (frontend) and the webhook handler.
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
   * Validates the HMAC signature before touching anything.
   * Caller must pass the raw request body as a string (not parsed JSON).
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

    // Additional Paystack events can be handled here as needed:
    // 'charge.failed', 'refund.processed', 'charge.dispute.create', etc.
    return { handled: false, event: event.event };
  },

  /**
   * Initiate a full or partial refund via Paystack and record it locally.
   * Omit `amount` to refund the full transaction value.
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
   */
  async list(filters: PaymentFilters = {}) {
    const { page = 1, limit = 20, ...rest } = filters;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (rest.purpose) query.purpose = rest.purpose;
    if (rest.gatewayStatus) query.gatewayStatus = rest.gatewayStatus;
    if (rest.eventId) query.eventId = new mongoose.Types.ObjectId(rest.eventId);
    if (rest.registrationId)
      query.registrationId = new mongoose.Types.ObjectId(rest.registrationId);
    if (rest.subscriptionId)
      query.subscriptionId = new mongoose.Types.ObjectId(rest.subscriptionId);

    const [payments, total] = await Promise.all([
      Payment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
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
   * Get a single payment by ID.
   */
  async getById(id: string): Promise<IPaymentDocument> {
    const payment = await Payment.findById(id);
    if (!payment) throw new Error('Payment not found');
    return payment;
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