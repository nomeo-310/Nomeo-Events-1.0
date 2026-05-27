import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment } from '@/models/payment';
import { csv, toCSV, err } from '@/lib/api-response';

/**
 * GET /api/admin/payments/export
 *
 * Permission: super_admin
 *
 * Streams all payments as CSV. Accepts the same filters as
 * GET /api/admin/payments (purpose, status, dateFrom, dateTo, channel).
 *
 * Capped at 10,000 rows — for larger exports trigger an async job instead.
 */
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const filter: Record<string, unknown> = {};

    const purpose = searchParams.get('purpose');
    if (purpose) filter.purpose = purpose;

    const status = searchParams.get('status');
    if (status) filter.gatewayStatus = status;

    const channel = searchParams.get('channel');
    if (channel) filter.channel = channel;

    const dateFrom = searchParams.get('dateFrom');
    const dateTo   = searchParams.get('dateTo');
    if (dateFrom || dateTo) {
      filter.createdAt = {
        ...(dateFrom && { $gte: new Date(dateFrom) }),
        ...(dateTo   && { $lte: new Date(dateTo)   }),
      };
    }

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .limit(10_000)
      .lean();

    const rows = payments.map((p) => ({
      id:                 String(p._id),
      purpose:            p.purpose,
      reference:          p.reference,
      paystackReference:  p.paystackReference ?? '',
      gatewayStatus:      p.gatewayStatus,
      gatewayResponse:    p.gatewayResponse ?? '',
      amount:             p.amount,
      amountPaid:         p.amountPaid,
      discountAmount:     p.discountAmount,
      currency:           p.currency,
      couponCode:         p.couponCode ?? '',
      channel:            p.channel ?? '',
      cardType:           p.cardType ?? '',
      cardLast4:          p.cardLast4 ?? '',
      cardBank:           p.cardBank ?? '',
      paidAt:             p.paidAt ? p.paidAt.toISOString() : '',
      refundedAt:         p.refundedAt ? p.refundedAt.toISOString() : '',
      refundAmount:       p.refundAmount ?? '',
      refundReason:       p.refundReason ?? '',
      eventId:            p.eventId ? String(p.eventId) : '',
      registrationId:     p.registrationId ? String(p.registrationId) : '',
      subscriptionId:     p.subscriptionId ? String(p.subscriptionId) : '',
      planId:             p.planId ? String(p.planId) : '',
      createdAt:          p.createdAt.toISOString(),
    }));

    const filename = `payments-export-${new Date().toISOString().slice(0, 10)}.csv`;
    return csv(toCSV(rows), filename);
  } catch (e: any) {
    const status = e.message?.startsWith('Forbidden') ? 403
                 : e.message?.startsWith('Unauthorized') ? 401 : 500;
    return err(e.message ?? 'Server error', status);
  }
}
