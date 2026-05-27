import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment, PaymentGatewayStatus, PaymentPurpose } from '@/models/payment';
import { err, paginate } from '@/lib/api-response';
import mongoose from 'mongoose';

/**
 * GET /api/admin/payments/events/:eventId
 *
 * Permission: super_admin
 *
 * All payments for a specific event, paginated.
 */
export async function GET( req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;

    await requireSuperAdmin();
    await connectDB();

    if (!mongoose.isValidObjectId(eventId)) {
      return err('Invalid eventId', 400);
    }

    const { searchParams } = req.nextUrl;
    const page  = Math.max(1, Number(searchParams.get('page')  ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const skip  = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      purpose: PaymentPurpose.EVENT_REGISTRATION,
      eventId: new mongoose.Types.ObjectId(eventId),
    };

    const status = searchParams.get('status') as PaymentGatewayStatus | null;
    if (status && Object.values(PaymentGatewayStatus).includes(status)) {
      filter.gatewayStatus = status;
    }

    const [data, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('registrationId', 'registrationNumber attendeeName attendeeEmail planType planName')
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
