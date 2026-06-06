import { NextRequest, NextResponse } from 'next/server';
import { Event } from '@/models/event';
import { Registration, RegistrationStatus, PaymentStatus } from '@/models/registration';
import { connectDB } from '@/lib/mongoose';
import { requireAdmin } from '@/lib/admin/authorization';

type Params = { params: Promise<{ eventId: string }> };

// ─── GET /api/admin/events/[eventId]/registrations ───────────────────────────
// Query params:
//   page          number  (default 1)
//   limit         number  (default 20)
//   status        RegistrationStatus
//   paymentStatus PaymentStatus
//   planType      PlanType
//   search        string  (attendee name / email / registration number)
//   sortBy        createdAt | attendeeName | price | status (default createdAt)
//   sortOrder     asc | desc (default desc)
export async function GET(req: NextRequest, { params }: Params) {

  const { eventId } = await params;

  try {
    await connectDB();

    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const event = await Event.findById(eventId).lean();
    if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });

    const { searchParams } = req.nextUrl;

    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip  = (page - 1) * limit;

    const filter: Record<string, any> = { eventId: eventId };

    const status        = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const planType      = searchParams.get('planType');
    const search        = searchParams.get('search');

    if (status        && Object.values(RegistrationStatus).includes(status as RegistrationStatus))
      filter.status = status;

    if (paymentStatus && Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus))
      filter.paymentStatus = paymentStatus;

    if (planType) filter.planType = planType;

    if (search) {
      filter.$or = [
        { attendeeName:         { $regex: search, $options: 'i' } },
        { attendeeEmail:        { $regex: search, $options: 'i' } },
        { registrationNumber:   { $regex: search, $options: 'i' } },
      ];
    }

    const SORTABLE = ['createdAt', 'attendeeName', 'price', 'status', 'registeredAt'];
    const sortBy    = SORTABLE.includes(searchParams.get('sortBy') || '') ? searchParams.get('sortBy')! : 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    const [registrations, total] = await Promise.all([
      Registration.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Registration.countDocuments(filter),
    ]);

    return NextResponse.json({
      event: { _id: (event as any)._id, title: (event as any).title, slug: (event as any).slug },
      data: registrations,
      pagination: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error('[ADMIN] GET /api/admin/events/[eventId]/registrations', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}