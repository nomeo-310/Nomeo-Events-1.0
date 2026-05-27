import { NextRequest } from 'next/server';
import { requireSupport } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment } from '@/models/payment';
import { ok, err } from '@/lib/api-response';

/**
 * GET /api/admin/payments/:id
 *
 * Permission: support (lowest level — useful for customer support lookups)
 *
 * Returns full payment detail with all populated references.
 */
export async function GET( _req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await requireSupport();
    await connectDB();

    const payment = await Payment.findById(id)
      .populate('registrationId', 'registrationNumber attendeeName attendeeEmail attendeePhone planType planName')
      .populate('subscriptionId', 'status')
      .populate('eventId',        'title slug startDate endDate location')
      .populate('planId',         'name tier interval priceKobo')
      .lean();

    if (!payment) return err('Payment not found', 404);

    return ok(payment);
  } catch (e: any) {
    const status = e.message?.startsWith('Forbidden') ? 403
                 : e.message?.startsWith('Unauthorized') ? 401 : 500;
    return err(e.message ?? 'Server error', status);
  }
}
