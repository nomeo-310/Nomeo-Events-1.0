import { NextRequest, NextResponse } from 'next/server';
import { Event, EventStatus } from '@/models/event';
import { Registration, RegistrationStatus, PaymentStatus } from '@/models/registration';
import { connectDB } from '@/lib/mongoose';
import { requireAdmin } from '@/lib/admin/authorization';
// import { requireAdmin } from '@/lib/auth';

// ─── GET /api/admin/events/stats ─────────────────────────────────────────────
// High-level numbers for the admin dashboard header / overview cards.
export async function GET(_req: NextRequest) {
  try {
    await connectDB();

    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const now = new Date();

    const [eventCounts, registrationCounts, revenueSummary, categoryBreakdown] =
      await Promise.all([
        // ── Event counts by status ──────────────────────────────────────────
        Event.aggregate([
          { $match: { isDeleted: false } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),

        // ── Registration counts by status ───────────────────────────────────
        Registration.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),

        // ── Platform-wide revenue summary ───────────────────────────────────
        Registration.aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: {
                  $cond: [{ $eq: ['$paymentStatus', PaymentStatus.COMPLETED] }, '$price', 0],
                },
              },
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
              totalRefunded: {
                $sum: {
                  $cond: [{ $eq: ['$paymentStatus', PaymentStatus.REFUNDED] }, '$price', 0],
                },
              },
            },
          },
        ]),

        // ── Events per category ─────────────────────────────────────────────
        Event.aggregate([
          { $match: { isDeleted: false, status: EventStatus.PUBLISHED } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
      ]);

    // Reshape to keyed objects
    const eventsByStatus: Record<string, number> = {};
    for (const e of eventCounts) eventsByStatus[e._id] = e.count;

    const regsByStatus: Record<string, number> = {};
    for (const r of registrationCounts) regsByStatus[r._id] = r.count;

    const revenue = revenueSummary[0] ?? { totalRevenue: 0, projectedRevenue: 0, totalRefunded: 0 };

    // Upcoming / ongoing / past breakdown (no aggregation needed — use date math)
    const [upcoming, ongoing, past] = await Promise.all([
      Event.countDocuments({ isDeleted: false, status: EventStatus.PUBLISHED, startDate: { $gt: now } }),
      Event.countDocuments({ isDeleted: false, status: EventStatus.PUBLISHED, startDate: { $lte: now }, endDate: { $gte: now } }),
      Event.countDocuments({ isDeleted: false, status: EventStatus.PUBLISHED, endDate: { $lt: now } }),
    ]);

    return NextResponse.json({
      events: {
        total:     Object.values(eventsByStatus).reduce((a, b) => a + b, 0),
        byStatus:  eventsByStatus,
        grouping:  { upcoming, ongoing, past },
      },
      registrations: {
        total:    Object.values(regsByStatus).reduce((a, b) => a + b, 0),
        byStatus: regsByStatus,
      },
      revenue: {
        confirmed:  revenue.totalRevenue,
        projected:  revenue.projectedRevenue,
        refunded:   revenue.totalRefunded,
        currency:   'NGN',
      },
      categoryBreakdown,
    });
  } catch (error: any) {
    console.error('[ADMIN] GET /api/admin/events/stats', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}