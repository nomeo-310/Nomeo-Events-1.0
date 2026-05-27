import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment, PaymentGatewayStatus, PaymentPurpose } from '@/models/payment';
import { ok, err } from '@/lib/api-response';

/**
 * GET /api/admin/payments/events/coupons
 *
 * Permission: super_admin
 *
 * Coupon usage summary across all event registration payments.
 * Groups by coupon code and returns redemption count, total discount
 * given, and total revenue collected after the discount.
 */
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo   = searchParams.get('dateTo');

    const match: Record<string, unknown> = {
      purpose:       PaymentPurpose.EVENT_REGISTRATION,
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
        $group: {
          _id:            '$couponCode',
          redemptions:    { $sum: 1 },
          totalDiscount:  { $sum: '$discountAmount' },
          totalPaid:      { $sum: '$amountPaid' },
          totalOriginal:  { $sum: '$amount' },
          discountValues: { $addToSet: '$couponDiscount' },
        },
      },
      { $sort: { redemptions: -1 } },
    ]);

    return ok(coupons.map((c: any) => ({
      code:            c._id,
      redemptions:     c.redemptions,
      totalDiscount:   c.totalDiscount,
      totalPaid:       c.totalPaid,
      totalOriginal:   c.totalOriginal,
      avgDiscountPct:  c.totalOriginal > 0
        ? Math.round((c.totalDiscount / c.totalOriginal) * 100 * 10) / 10
        : 0,
    })));
  } catch (e: any) {
    const status = e.message?.startsWith('Forbidden') ? 403
                 : e.message?.startsWith('Unauthorized') ? 401 : 500;
    return err(e.message ?? 'Server error', status);
  }
}
