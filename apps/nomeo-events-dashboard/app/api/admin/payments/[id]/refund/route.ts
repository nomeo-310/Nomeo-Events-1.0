import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment, PaymentGatewayStatus } from '@/models/payment';
import { ok, err } from '@/lib/api-response';

/**
 * POST /api/admin/payments/:id/refund
 *
 * Permission: super_admin only — financial write action
 *
 * Body:
 *   refundAmount   number  (kobo; omit to refund full amountPaid)
 *   refundReason   string  (required)
 *   refundReference string (your internal or Paystack refund ref)
 *
 * Note: this marks the payment as reversed in your DB.
 * You are responsible for calling Paystack's refund API separately
 * (or wire it in here before the save).
 */
export async function POST( req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await requireSuperAdmin();
    await connectDB();

    const body = await req.json();
    const { refundReason, refundReference } = body;

    if (!refundReason) return err('refundReason is required', 422);

    const payment = await Payment.findById(id);
    if (!payment) return err('Payment not found', 404);

    if (payment.gatewayStatus !== PaymentGatewayStatus.SUCCESS) {
      return err(
        `Cannot refund a payment with status "${payment.gatewayStatus}". Only successful payments can be refunded.`,
        422
      );
    }

    if (payment.refundedAt) {
      return err('Payment has already been refunded', 422);
    }

    const refundAmount = body.refundAmount ?? payment.amountPaid;

    if (refundAmount <= 0 || refundAmount > payment.amountPaid) {
      return err(
        `refundAmount must be between 1 and ${payment.amountPaid} kobo (the amount paid)`,
        422
      );
    }

    payment.gatewayStatus  = PaymentGatewayStatus.REVERSED;
    payment.refundedAt     = new Date();
    payment.refundAmount   = refundAmount;
    payment.refundReason   = refundReason;
    payment.refundReference = refundReference ?? undefined;

    await payment.save();

    return ok({ payment }, 200);
  } catch (e: any) {
    const status = e.message?.startsWith('Forbidden') ? 403
                 : e.message?.startsWith('Unauthorized') ? 401 : 500;
    return err(e.message ?? 'Server error', status);
  }
}
