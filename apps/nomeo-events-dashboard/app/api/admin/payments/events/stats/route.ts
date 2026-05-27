import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment, PaymentGatewayStatus, PaymentPurpose } from '@/models/payment';
import { ok, err } from '@/lib/api-response';

/**
 * GET /api/admin/payments/events/stats
 *
 * Permission: super_admin
 *
 * Aggregate stats across ALL event payments:
 *   - Total revenue, transaction count, discount given
 *   - Top 10 revenue-generating events
 *   - Breakdown by channel
 *   - Daily trend
 */
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo   = searchParams.get('dateTo');

    const baseMatch: Record<string, unknown> = {
      purpose: PaymentPurpose.EVENT_REGISTRATION,
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom && { $gte: new Date(dateFrom) }),
              ...(dateTo   && { $lte: new Date(dateTo)   }),
            },
          }
        : {}),
    };

    const successMatch = { ...baseMatch, gatewayStatus: PaymentGatewayStatus.SUCCESS };

    const [summary, topEvents, byChannel, dailyTrend] = await Promise.all([
      Payment.aggregate([
        { $match: successMatch },
        {
          $group: {
            _id:           null,
            totalRevenue:  { $sum: '$amountPaid' },
            totalDiscount: { $sum: '$discountAmount' },
            count:         { $sum: 1 },
          },
        },
      ]),

      Payment.aggregate([
        { $match: successMatch },
        {
          $group: {
            _id:       '$eventId',
            totalPaid: { $sum: '$amountPaid' },
            count:     { $sum: 1 },
          },
        },
        { $sort: { totalPaid: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from:         'events',
            localField:   '_id',
            foreignField: '_id',
            as:           'event',
          },
        },
        { $unwind: { path: '$event', preserveNullAndEmpty: true } },
        {
          $project: {
            eventId:   '$_id',
            title:     '$event.title',
            slug:      '$event.slug',
            totalPaid: 1,
            count:     1,
          },
        },
      ]),

      Payment.aggregate([
        { $match: successMatch },
        {
          $group: {
            _id:       { $ifNull: ['$channel', 'unknown'] },
            count:     { $sum: 1 },
            totalPaid: { $sum: '$amountPaid' },
          },
        },
        { $sort: { totalPaid: -1 } },
      ]),

      Payment.aggregate([
        {
          $match: {
            ...successMatch,
            ...(!dateFrom && !dateTo
              ? { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
              : {}),
          },
        },
        {
          $group: {
            _id: {
              year:  { $year:  '$paidAt' },
              month: { $month: '$paidAt' },
              day:   { $dayOfMonth: '$paidAt' },
            },
            count:     { $sum: 1 },
            totalPaid: { $sum: '$amountPaid' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
    ]);

    return ok({
      summary: {
        totalRevenue:  summary[0]?.totalRevenue  ?? 0,
        totalDiscount: summary[0]?.totalDiscount ?? 0,
        count:         summary[0]?.count         ?? 0,
      },
      topEvents,
      byChannel,
      dailyTrend: dailyTrend.map((d: any) => ({
        date:      `${d._id.year}-${String(d._id.month).padStart(2,'0')}-${String(d._id.day).padStart(2,'0')}`,
        count:     d.count,
        totalPaid: d.totalPaid,
      })),
    });
  } catch (e: any) {
    const status = e.message?.startsWith('Forbidden') ? 403
                 : e.message?.startsWith('Unauthorized') ? 401 : 500;
    return err(e.message ?? 'Server error', status);
  }
}
