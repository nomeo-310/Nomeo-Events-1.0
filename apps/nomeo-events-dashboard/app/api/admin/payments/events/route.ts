import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment, PaymentGatewayStatus, PaymentPurpose } from '@/models/payment';
import { err, paginate } from '@/lib/api-response';
import { Registration } from '@/models/registration';
import { Event } from '@/models/event';

/**
 * GET /api/admin/payments/events
 *
 * Permission: super_admin
 *
 * All event registration payments, paginated.
 *
 * Query params:
 *   page      number
 *   limit     number
 *   status    PaymentGatewayStatus
 *   dateFrom  ISO date
 *   dateTo    ISO date
 *   search    string (reference / couponCode)
 */
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;

    const page  = Math.max(1, Number(searchParams.get('page')  ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const skip  = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      purpose: PaymentPurpose.EVENT_REGISTRATION,
    };

    const status = searchParams.get('status') as PaymentGatewayStatus | null;
    if (status && Object.values(PaymentGatewayStatus).includes(status)) {
      filter.gatewayStatus = status;
    }

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
        { reference:  { $regex: search, $options: 'i' } },
        { couponCode: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({path: 'eventId',  model: Event, select: 'title slug startDate'})
        .populate({path: 'registrationId', model: Registration, select: 'registrationNumber attendeeName attendeeEmail planType planName'})
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
