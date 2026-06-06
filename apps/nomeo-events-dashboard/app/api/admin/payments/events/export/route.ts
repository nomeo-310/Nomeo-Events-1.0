import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment, PaymentPurpose } from '@/models/payment';
import { csv, toCSV, err } from '@/lib/api-response';
import { Registration } from '@/models/registration';
import { Event } from '@/models/event';

/**
 * GET /api/admin/payments/events/export
 *
 * Permission: super_admin
 *
 * CSV export of event registration payments (max 10,000 rows).
 * Includes denormalized registration and event fields via populate.
 */
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const filter: Record<string, unknown> = { purpose: PaymentPurpose.EVENT_REGISTRATION };

    const status = searchParams.get('status');
    if (status) filter.gatewayStatus = status;

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
      .populate({path: 'eventId', model: Event, select: 'title slug'})
      .populate({path: 'registrationId', model: Registration, select: 'registrationNumber attendeeName attendeeEmail planType'})
      .lean();

    const rows = payments.map((p: any) => ({
      paymentId:          String(p._id),
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
      paidAt:             p.paidAt?.toISOString() ?? '',
      refundedAt:         p.refundedAt?.toISOString() ?? '',
      refundAmount:       p.refundAmount ?? '',
      refundReason:       p.refundReason ?? '',
      eventId:            p.eventId?._id ? String(p.eventId._id) : '',
      eventTitle:         p.eventId?.title ?? '',
      eventSlug:          p.eventId?.slug ?? '',
      registrationNumber: p.registrationId?.registrationNumber ?? '',
      attendeeName:       p.registrationId?.attendeeName ?? '',
      attendeeEmail:      p.registrationId?.attendeeEmail ?? '',
      planType:           p.registrationId?.planType ?? '',
      createdAt:          p.createdAt.toISOString(),
    }));

    const filename = `event-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    return csv(toCSV(rows), filename);
  } catch (e: any) {
    const status = e.message?.startsWith('Forbidden') ? 403
                 : e.message?.startsWith('Unauthorized') ? 401 : 500;
    return err(e.message ?? 'Server error', status);
  }
}
