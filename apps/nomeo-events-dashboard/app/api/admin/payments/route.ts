import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment, PaymentGatewayStatus, PaymentPurpose } from '@/models/payment';
import { err, paginate } from '@/lib/api-response';

/**
 * GET /api/admin/payments
 *
 * Permission: super_admin
 *
 * Query params:
 *   page       number  (default 1)
 *   limit      number  (default 20, max 100)
 *   purpose    PaymentPurpose
 *   status     PaymentGatewayStatus
 *   search     string  (searches reference, paystackReference, couponCode)
 *   dateFrom   ISO date string
 *   dateTo     ISO date string
 *   channel    string  (card | bank_transfer | ussd | ...)
 */
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;

    const page  = Math.max(1, Number(searchParams.get('page')  ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const skip  = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    const purpose = searchParams.get('purpose') as PaymentPurpose | null;
    if (purpose && Object.values(PaymentPurpose).includes(purpose)) {
      filter.purpose = purpose;
    }

    const status = searchParams.get('status') as PaymentGatewayStatus | null;
    if (status && Object.values(PaymentGatewayStatus).includes(status)) {
      filter.gatewayStatus = status;
    }

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

    const search = searchParams.get('search');
    if (search) {
      filter.$or = [
        { reference:         { $regex: search, $options: 'i' } },
        { paystackReference: { $regex: search, $options: 'i' } },
        { couponCode:        { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('registrationId', 'registrationNumber attendeeName attendeeEmail')
        .populate('subscriptionId', 'status')
        .populate('eventId',        'title slug')
        .populate('planId',         'name tier interval')
        .lean(),
      Payment.countDocuments(filter),
    ]);

    return paginate(data, total, page, limit);
  } catch (e: any) {
    const status = e.message?.startsWith('Forbidden') ? 403
                 : e.message?.startsWith('Unauthorized') ? 401 : 500;
    return err(e.message ?? 'Server error', status);
  }
}
