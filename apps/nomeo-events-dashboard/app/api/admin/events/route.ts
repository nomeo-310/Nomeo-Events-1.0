import { NextRequest, NextResponse } from 'next/server';
import { Event, EventStatus, EventCategory } from '@/models/event';
import { Registration, RegistrationStatus, PaymentStatus } from '@/models/registration';
import { connectDB } from '@/lib/mongoose';
import { requireAdmin } from '@/lib/admin/authorization';
import { User } from '@/models/user';

// ─── GET /api/admin/events ────────────────────────────────────────────────────
// Query params:
//   page        number  (default 1)
//   limit       number  (default 20, max 100)
//   status      EventStatus
//   category    EventCategory
//   eventMode   physical | virtual | hybrid
//   featured    boolean
//   search      string  (title / slug full-text search)
//   startAfter  ISO date
//   startBefore ISO date
//   sortBy      startDate | createdAt | title | availableSeats (default createdAt)
//   sortOrder   asc | desc (default desc)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // ── Auth guard ──────────────────────────────────────────────────────────
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;

    // ── Pagination ──────────────────────────────────────────────────────────
    const page  = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip  = (page - 1) * limit;

    // ── Filters ─────────────────────────────────────────────────────────────
    const filter: Record<string, any> = { isDeleted: false };

    const status   = searchParams.get('status');
    const category = searchParams.get('category');
    const mode     = searchParams.get('eventMode');
    const featured = searchParams.get('featured');
    const search   = searchParams.get('search');
    const startAfter  = searchParams.get('startAfter');
    const startBefore = searchParams.get('startBefore');

    if (status   && Object.values(EventStatus).includes(status as EventStatus))
      filter.status = status;

    if (category && Object.values(EventCategory).includes(category as EventCategory))
      filter.category = category;

    if (mode && ['physical', 'virtual', 'hybrid'].includes(mode))
      filter.eventMode = mode;

    if (featured !== null && featured !== undefined)
      filter.featured = featured === 'true';

    if (search)
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { slug:  { $regex: search, $options: 'i' } },
      ];

    if (startAfter || startBefore) {
      filter.startDate = {};
      if (startAfter)  filter.startDate.$gte = new Date(startAfter);
      if (startBefore) filter.startDate.$lte = new Date(startBefore);
    }

    // ── Sorting ─────────────────────────────────────────────────────────────
    const SORTABLE = ['startDate', 'createdAt', 'title', 'availableSeats', 'totalSeats'];
    const sortBy    = SORTABLE.includes(searchParams.get('sortBy') || '') ? searchParams.get('sortBy')! : 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // ── Query ────────────────────────────────────────────────────────────────
    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        // Populate basic organizer info only — full details are on the single-event endpoint
        .populate({ path: 'organizerId', model: User, select: 'name email avatar phone createdAt' })
        .populate({ path: 'createdBy', model: User, select: 'name email' })
        .lean(),
      Event.countDocuments(filter),
    ]);

    // ── Attach lightweight registration stats per event ───────────────────
    const eventIds = events.map((e: any) => e._id);

    const registrationStats = await Registration.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      {
        $group: {
          _id: '$eventId',
          total:      { $sum: 1 },
          pending:    { $sum: { $cond: [{ $eq: ['$status', RegistrationStatus.PENDING]    }, 1, 0] } },
          confirmed:  { $sum: { $cond: [{ $eq: ['$status', RegistrationStatus.CONFIRMED]  }, 1, 0] } },
          attended:   { $sum: { $cond: [{ $eq: ['$status', RegistrationStatus.ATTENDED]   }, 1, 0] } },
          cancelled:  { $sum: { $cond: [{ $eq: ['$status', RegistrationStatus.CANCELLED]  }, 1, 0] } },
          waitlisted: { $sum: { $cond: [{ $eq: ['$status', RegistrationStatus.WAITLISTED] }, 1, 0] } },
          refunded:   { $sum: { $cond: [{ $eq: ['$status', RegistrationStatus.REFUNDED]   }, 1, 0] } },
          // Projected revenue: sum of price for non-cancelled, non-refunded registrations
          projectedRevenue: {
            $sum: {
              $cond: [
                {
                  $not: {
                    $in: ['$status', [RegistrationStatus.CANCELLED, RegistrationStatus.REFUNDED]],
                  },
                },
                '$price',
                0,
              ],
            },
          },
          // Confirmed revenue: only payment-completed registrations
          confirmedRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', PaymentStatus.COMPLETED] }, '$price', 0],
            },
          },
        },
      },
    ]);

    const statsMap = new Map(registrationStats.map((s: any) => [s._id.toString(), s]));

    const enriched = events.map((event: any) => {
      const stats = statsMap.get(event._id.toString()) || {
        total: 0, pending: 0, confirmed: 0, attended: 0,
        cancelled: 0, waitlisted: 0, refunded: 0,
        projectedRevenue: 0, confirmedRevenue: 0,
      };
      return { ...event, registrationStats: stats };
    });

    return NextResponse.json({
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error('[ADMIN] GET /api/admin/events', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}