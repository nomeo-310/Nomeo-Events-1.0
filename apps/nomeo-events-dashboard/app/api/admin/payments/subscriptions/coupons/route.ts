import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment, PaymentGatewayStatus, PaymentPurpose } from '@/models/payment';
import { ok, err } from '@/lib/api-response';

/**
 * GET /api/admin/payments/subscriptions/coupons
 *
 * Permission: super_admin
 *
 * Coupon usage summary across all subscription payments,
 * broken down by plan tier.
 */
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo   = searchParams.get('dateTo');

    const match: Record<string, unknown> = {
      purpose:       PaymentPurpose.SUBSCRIPTION,
      gatewayStatus: PaymentGatewayStatus.SUCCESS,
      couponCode:    { $exists: true, $ne: null },
    };

    if (dateFrom || dateTo) {
      match.createdAt = {
        ...(dateFrom && { $gte: new Date(dateFrom) }),
        ...(dateTo   && { $lte: new Date(dateTo)   }),
      };
    }

    const coupons = await Payment.aggregate([
      { $match: match },
      {
        $lookup: {
          from:         'plans',
          localField:   'planId',
          foreignField: '_id',
          as:           'plan',
        },
      },
      { $unwind: { path: '$plan', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            code: '$couponCode',
            tier: { $ifNull: ['$plan.tier', 'unknown'] },
          },
          redemptions:   { $sum: 1 },
          totalDiscount: { $sum: '$discountAmount' },
          totalPaid:     { $sum: '$amountPaid' },
          totalOriginal: { $sum: '$amount' },
        },
      },
      {
        $group: {
          _id:           '$_id.code',
          totalRedemptions: { $sum: '$redemptions' },
          totalDiscount:    { $sum: '$totalDiscount' },
          totalPaid:        { $sum: '$totalPaid' },
          totalOriginal:    { $sum: '$totalOriginal' },
          byTier: {
            $push: {
              tier:          '$_id.tier',
              redemptions:   '$redemptions',
              totalDiscount: '$totalDiscount',
            },
          },
        },
      },
      { $sort: { totalRedemptions: -1 } },
    ]);

    return ok(coupons.map((c: any) => ({
      code:             c._id,
      totalRedemptions: c.totalRedemptions,
      totalDiscount:    c.totalDiscount,
      totalPaid:        c.totalPaid,
      avgDiscountPct:   c.totalOriginal > 0
        ? Math.round((c.totalDiscount / c.totalOriginal) * 100 * 10) / 10
        : 0,
      byTier: c.byTier,
    })));
  } catch (e: any) {
    const status = e.message?.startsWith('Forbidden') ? 403
                 : e.message?.startsWith('Unauthorized') ? 401 : 500;
    return err(e.message ?? 'Server error', status);
  }
}
