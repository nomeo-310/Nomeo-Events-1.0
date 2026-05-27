import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment, PaymentGatewayStatus, PaymentPurpose } from '@/models/payment';
import { ok, err } from '@/lib/api-response';

/**
 * GET /api/admin/payments/stats
 *
 * Permission: super_admin
 *
 * Query params:
 *   dateFrom  ISO date string
 *   dateTo    ISO date string
 *
 * Returns:
 *   - Total revenue (amountPaid, in kobo) across all successful payments
 *   - Breakdown by purpose
 *   - Breakdown by gatewayStatus
 *   - Breakdown by channel
 *   - Total refunded amount
 *   - Daily revenue trend (last 30 days if no date range given)
 */
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo   = searchParams.get('dateTo');

    const dateFilter: Record<string, unknown> = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {
        ...(dateFrom && { $gte: new Date(dateFrom) }),
        ...(dateTo   && { $lte: new Date(dateTo)   }),
      };
    }

    const [byStatus, byPurpose, byChannel, refundStats, dailyTrend] = await Promise.all([
      // Revenue and count by gateway status
      Payment.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id:         '$gatewayStatus',
            count:       { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalPaid:   { $sum: '$amountPaid' },
          },
        },
      ]),

      // Revenue by purpose (only successful)
      Payment.aggregate([
        { $match: { ...dateFilter, gatewayStatus: PaymentGatewayStatus.SUCCESS } },
        {
          $group: {
            _id:         '$purpose',
            count:       { $sum: 1 },
            totalPaid:   { $sum: '$amountPaid' },
            totalDiscount: { $sum: '$discountAmount' },
          },
        },
      ]),

      // Revenue by payment channel (only successful)
      Payment.aggregate([
        { $match: { ...dateFilter, gatewayStatus: PaymentGatewayStatus.SUCCESS } },
        {
          $group: {
            _id:       { $ifNull: ['$channel', 'unknown'] },
            count:     { $sum: 1 },
            totalPaid: { $sum: '$amountPaid' },
          },
        },
        { $sort: { totalPaid: -1 } },
      ]),

      // Refund totals
      Payment.aggregate([
        { $match: { ...dateFilter, refundedAt: { $exists: true } } },
        {
          $group: {
            _id:           null,
            count:         { $sum: 1 },
            totalRefunded: { $sum: '$refundAmount' },
          },
        },
      ]),

      // Daily revenue trend
      Payment.aggregate([
        {
          $match: {
            ...dateFilter,
            gatewayStatus: PaymentGatewayStatus.SUCCESS,
            // Default to last 30 days when no date filter is supplied
            ...((!dateFrom && !dateTo) && {
              createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            }),
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

    const successRow = byStatus.find((r) => r._id === PaymentGatewayStatus.SUCCESS);

    return ok({
      summary: {
        totalRevenue:    successRow?.totalPaid   ?? 0,
        totalTransactions: successRow?.count     ?? 0,
        totalRefunded:   refundStats[0]?.totalRefunded ?? 0,
        refundCount:     refundStats[0]?.count    ?? 0,
        totalDiscount:   byPurpose.reduce((s: number, r: any) => s + r.totalDiscount, 0),
      },
      byStatus,
      byPurpose,
      byChannel,
      dailyTrend: dailyTrend.map((d: any) => ({
        date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
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
