import { NextRequest } from 'next/server';
import { requireSupport } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment } from '@/models/payment';
import { ok, err } from '@/lib/api-response';
import { Registration } from '@/models/registration';
import { Subscription } from '@/models/subscription';
import { Event } from '@/models/event';
import { Plan } from '@/models/plan';
import { User } from '@/models/user';

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
      .populate({path: 'registrationId', model: Registration, select: 'registrationNumber attendeeName attendeeEmail attendeePhone planType planName'})
      .populate({path: 'subscriptionId', model: Subscription, select: 'status userId',
        populate: { path: 'userId', model: User, select: 'name email avatar image' } 
      })
      .populate({path: 'eventId', model: Event, select: 'title slug startDate endDate location'})
      .populate({path: 'planId', model: Plan, select: 'name tier interval priceKobo'})
      .lean();

    if (!payment) return err('Payment not found', 404);

    return ok(payment);
  } catch (e: any) {
    const status = e.message?.startsWith('Forbidden') ? 403
                 : e.message?.startsWith('Unauthorized') ? 401 : 500;
    return err(e.message ?? 'Server error', status);
  }
}
