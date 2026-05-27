import { NextRequest } from 'next/server';
import { requireSupport } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment, PaymentPurpose } from '@/models/payment';
import { ok, err } from '@/lib/api-response';
import mongoose from 'mongoose';

/**
 * GET /api/admin/payments/registrations/:registrationId
 *
 * Permission: support (customer support needs to look up payment by registration)
 *
 * Returns the payment record linked to a specific registration.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { registrationId: string } }
) {
  try {
    await requireSupport();
    await connectDB();

    if (!mongoose.isValidObjectId(params.registrationId)) {
      return err('Invalid registrationId', 400);
    }

    const payment = await Payment.findOne({
      purpose:        PaymentPurpose.EVENT_REGISTRATION,
      registrationId: new mongoose.Types.ObjectId(params.registrationId),
    })
      .populate('eventId',        'title slug startDate')
      .populate('registrationId', 'registrationNumber attendeeName attendeeEmail planType planName status')
      .lean();

    if (!payment) return err('No payment found for this registration', 404);

    return ok(payment);
  } catch (e: any) {
    const status = e.message?.startsWith('Forbidden') ? 403
                 : e.message?.startsWith('Unauthorized') ? 401 : 500;
    return err(e.message ?? 'Server error', status);
  }
}
