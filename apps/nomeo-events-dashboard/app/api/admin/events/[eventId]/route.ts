import { NextRequest, NextResponse } from 'next/server';
import { Event } from '@/models/event';
import { Registration, RegistrationStatus, PaymentStatus } from '@/models/registration';
import { connectDB } from '@/lib/mongoose';
import { requireAdmin } from '@/lib/admin/authorization';
import { User } from '@/models/user';

type Params = { params: Promise<{ eventId: string }> };

// ─── GET /api/admin/events/[eventId] ─────────────────────────────────────────
// Returns full event document + organizer details + deep registration statistics
// + projected / confirmed revenue breakdown.
export async function GET(_req: NextRequest, { params }: Params) {
  const { eventId } = await params;

  const admin = await requireAdmin();

  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();

    const event = await Event.findById(eventId)
      .populate({ path: 'organizerId', model: User, select: 'name email avatar phone createdAt' })
      .populate({ path: 'createdBy', model: User, select: 'name email' })
      .lean();

    if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });

    // Calculate projected revenue from event plans (what the organizer planned to earn)
    const eventPlans = event.plans || [];
    let projectedRevenueFromPlans = 0;
    const planProjections: Record<string, { price: number; maxSeats: number; projectedRevenue: number; currency: string }> = {};

    for (const plan of eventPlans) {
      const maxSeats = plan.maxSeats || 0;
      const price = plan.price || 0;
      const currency = plan.currency || 'NGN';
      const planProjectedRevenue = maxSeats * price;
      projectedRevenueFromPlans += planProjectedRevenue;
      
      planProjections[plan.type] = {
        price,
        maxSeats,
        projectedRevenue: planProjectedRevenue,
        currency
      };
    }

    // ── Deep registration stats ──────────────────────────────────────────────
    const [statusBreakdown, planBreakdown, revenueByPlan, recentRegistrations] =
      await Promise.all([
        // 1. Status breakdown
        Registration.aggregate([
          { $match: { eventId: event._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              revenue: {
                $sum: {
                  $cond: [{ $eq: ['$paymentStatus', PaymentStatus.COMPLETED] }, '$price', 0],
                },
              },
            },
          },
        ]),

        // 2. Plan-type breakdown with actual registration data
        Registration.aggregate([
          { $match: { eventId: event._id } },
          {
            $group: {
              _id: '$planType',
              planName: { $first: '$planName' },
              count: { $sum: 1 },
              price: { $first: '$price' },
              // Actual confirmed revenue from this plan
              confirmedRevenue: {
                $sum: {
                  $cond: [{ $eq: ['$paymentStatus', PaymentStatus.COMPLETED] }, '$price', 0],
                },
              },
            },
          },
        ]),

        // 3. Total actual revenue figures
        Registration.aggregate([
          { $match: { eventId: event._id } },
          {
            $group: {
              _id: null,
              totalRegistrations: { $sum: 1 },
              // Actual confirmed revenue (what's been paid)
              confirmedRevenue: {
                $sum: {
                  $cond: [{ $eq: ['$paymentStatus', PaymentStatus.COMPLETED] }, '$price', 0],
                },
              },
              refundedAmount: {
                $sum: {
                  $cond: [{ $eq: ['$paymentStatus', PaymentStatus.REFUNDED] }, '$price', 0],
                },
              },
              avgRating: { $avg: '$rating' },
              feedbackCount: { $sum: { $cond: ['$feedbackSubmitted', 1, 0] } },
              certIssued: { $sum: { $cond: ['$certificateIssued', 1, 0] } },
              groupRegistrations: { $sum: { $cond: ['$isGroupRegistration', 1, 0] } },
              corporateRegistrations: { $sum: { $cond: ['$isCorporateRegistration', 1, 0] } },
            },
          },
        ]),

        // 4. 5 most recent registrations for the preview table in modal
        Registration.find({ eventId: event._id })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('attendeeName attendeeEmail status planType planName price paymentStatus createdAt registrationNumber')
          .lean(),
      ]);

    // Enhance plan breakdown with projected revenue from event plans
    const enhancedPlanBreakdown = planBreakdown.map(plan => ({
      _id: plan._id,
      planName: plan.planName,
      count: plan.count,
      price: plan.price,
      confirmedRevenue: plan.confirmedRevenue,
      // Add projected revenue from the event plan (if available)
      projectedRevenue: planProjections[plan._id]?.projectedRevenue || 0,
      maxSeats: planProjections[plan._id]?.maxSeats || 0,
      plannedPrice: planProjections[plan._id]?.price || plan.price,
      currency: planProjections[plan._id]?.currency || 'NGN',
    }));

    // Also include plans that have no registrations yet
    for (const [planType, projection] of Object.entries(planProjections)) {
      const existingPlan = enhancedPlanBreakdown.find(p => p._id === planType);
      if (!existingPlan) {
        enhancedPlanBreakdown.push({
          _id: planType,
          planName: eventPlans.find(p => p.type === planType)?.name || planType,
          count: 0,
          price: projection.price,
          confirmedRevenue: 0,
          projectedRevenue: projection.projectedRevenue,
          maxSeats: projection.maxSeats,
          plannedPrice: projection.price,
          currency: projection.currency,
        });
      }
    }

    // Reshape status breakdown into a keyed object for easy consumption
    const statusMap: Record<string, { count: number; revenue: number }> = {};
    for (const s of statusBreakdown) {
      statusMap[s._id] = { count: s.count, revenue: s.revenue };
    }

    const revenueSummary = revenueByPlan[0] ?? {
      totalRegistrations: 0,
      confirmedRevenue: 0,
      refundedAmount: 0,
      avgRating: null,
      feedbackCount: 0,
      certIssued: 0,
      groupRegistrations: 0,
      corporateRegistrations: 0,
    };

    return NextResponse.json({
      event,
      statistics: {
        byStatus: {
          pending:    statusMap[RegistrationStatus.PENDING]    ?? { count: 0, revenue: 0 },
          confirmed:  statusMap[RegistrationStatus.CONFIRMED]  ?? { count: 0, revenue: 0 },
          attended:   statusMap[RegistrationStatus.ATTENDED]   ?? { count: 0, revenue: 0 },
          cancelled:  statusMap[RegistrationStatus.CANCELLED]  ?? { count: 0, revenue: 0 },
          waitlisted: statusMap[RegistrationStatus.WAITLISTED] ?? { count: 0, revenue: 0 },
          refunded:   statusMap[RegistrationStatus.REFUNDED]   ?? { count: 0, revenue: 0 },
        },
        byPlan: enhancedPlanBreakdown,
        revenue: {
          projected:  projectedRevenueFromPlans,
          confirmed:  revenueSummary.confirmedRevenue,
          refunded:   revenueSummary.refundedAmount,
          currency:   'NGN',
        },
        totals: {
          registrations:         revenueSummary.totalRegistrations,
          groupRegistrations:    revenueSummary.groupRegistrations,
          corporateRegistrations: revenueSummary.corporateRegistrations,
          certificatesIssued:    revenueSummary.certIssued,
          feedbackCount:         revenueSummary.feedbackCount,
          avgRating:             revenueSummary.avgRating
            ? parseFloat(revenueSummary.avgRating.toFixed(2))
            : null,
        },
      },
      recentRegistrations,
    });
  } catch (error: any) {
    console.error('[ADMIN] GET /api/admin/events/[eventId]', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}