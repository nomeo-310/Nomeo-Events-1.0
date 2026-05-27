import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment, PaymentGatewayStatus, PaymentPurpose } from '@/models/payment';
import { ok, err } from '@/lib/api-response';

/**
 * GET /api/admin/payments/subscriptions/stats
 *
 * Permission: super_admin
 *
 * Subscription payment analytics:
 *   - MRR (Monthly Recurring Revenue) — sum of successful amountPaid
 *     in the current calendar month
 *   - ARR estimate (MRR × 12)
 *   - Breakdown by plan tier and interval
 *   - Failed vs successful breakdown (churn signal)
 *   - Coupon usage overview
 *   - Daily revenue trend
 */
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo   = searchParams.get('dateTo');

    const baseMatch: Record<string, unknown> = {
      purpose: PaymentPurpose.SUBSCRIPTION,
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

    // MRR window: current calendar month (ignores any date filter)
    const now = new Date();
    const mrrStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mrrEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [byStatus, byPlanTier, mrrRaw, couponSummary, dailyTrend] = await Promise.all([
      Payment.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id:         '$gatewayStatus',
            count:       { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            totalPaid:   { $sum: '$amountPaid' },
          },
        },
      ]),

      // Revenue by plan tier + interval
      Payment.aggregate([
        { $match: successMatch },
        {
          $lookup: {
            from:         'plans',
            localField:   'planId',
            foreignField: '_id',
            as:           'plan',
          },
        },
        { $unwind: { path: '$plan', preserveNullAndEmpty: true } },
        {
          $group: {
            _id: {
              tier:     { $ifNull: ['$plan.tier',     'unknown'] },
              interval: { $ifNull: ['$plan.interval', 'unknown'] },
            },
            count:     { $sum: 1 },
            totalPaid: { $sum: '$amountPaid' },
          },
        },
        { $sort: { totalPaid: -1 } },
      ]),

      // MRR: current month successful payments
      Payment.aggregate([
        {
          $match: {
            purpose:       PaymentPurpose.SUBSCRIPTION,
            gatewayStatus: PaymentGatewayStatus.SUCCESS,
            paidAt:        { $gte: mrrStart, $lte: mrrEnd },
          },
        },
        {
          $group: {
            _id:  null,
            mrr:  { $sum: '$amountPaid' },
            count: { $sum: 1 },
          },
        },
      ]),

      // Coupon usage
      Payment.aggregate([
        {
          $match: {
            ...successMatch,
            couponCode: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id:           '$couponCode',
            redemptions:   { $sum: 1 },
            totalDiscount: { $sum: '$discountAmount' },
          },
        },
        { $sort: { redemptions: -1 } },
        { $limit: 10 },
      ]),

      // Daily trend
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

    const mrr = mrrRaw[0]?.mrr ?? 0;

    return ok({
      mrr,
      arr:    mrr * 12,
      mrrTransactionCount: mrrRaw[0]?.count ?? 0,
      byStatus,
      byPlanTier,
      topCoupons: couponSummary,
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
