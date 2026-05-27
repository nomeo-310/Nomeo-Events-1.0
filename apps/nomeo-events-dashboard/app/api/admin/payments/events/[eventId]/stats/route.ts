import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment, PaymentGatewayStatus, PaymentPurpose } from '@/models/payment';
import { ok, err } from '@/lib/api-response';
import mongoose from 'mongoose';

/**
 * GET /api/admin/payments/events/:eventId/stats
 *
 * Permission: super_admin
 *
 * Revenue breakdown for a single event:
 *   - Total collected, refunded, abandoned, pending
 *   - Breakdown by payment channel
 *   - Breakdown by plan type (from registrationId.planType)
 *   - Coupon usage summary
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    await requireSuperAdmin();
    await connectDB();

    if (!mongoose.isValidObjectId(params.eventId)) {
      return err('Invalid eventId', 400);
    }

    const eventOid = new mongoose.Types.ObjectId(params.eventId);

    const baseMatch = {
      purpose: PaymentPurpose.EVENT_REGISTRATION,
      eventId: eventOid,
    };

    const [byStatus, byChannel, couponSummary, planTypeSummary] = await Promise.all([
      // Totals by gateway status
      Payment.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id:           '$gatewayStatus',
            count:         { $sum: 1 },
            totalAmount:   { $sum: '$amount' },
            totalPaid:     { $sum: '$amountPaid' },
            totalDiscount: { $sum: '$discountAmount' },
          },
        },
      ]),

      // Breakdown by channel (successful only)
      Payment.aggregate([
        { $match: { ...baseMatch, gatewayStatus: PaymentGatewayStatus.SUCCESS } },
        {
          $group: {
            _id:       { $ifNull: ['$channel', 'unknown'] },
            count:     { $sum: 1 },
            totalPaid: { $sum: '$amountPaid' },
          },
        },
        { $sort: { totalPaid: -1 } },
      ]),

      // Coupon usage (successful only)
      Payment.aggregate([
        {
          $match: {
            ...baseMatch,
            gatewayStatus: PaymentGatewayStatus.SUCCESS,
            couponCode: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id:           '$couponCode',
            redemptions:   { $sum: 1 },
            totalDiscount: { $sum: '$discountAmount' },
            totalPaid:     { $sum: '$amountPaid' },
          },
        },
        { $sort: { redemptions: -1 } },
      ]),

      // Breakdown by plan type via registrationId join
      Payment.aggregate([
        { $match: { ...baseMatch, gatewayStatus: PaymentGatewayStatus.SUCCESS } },
        {
          $lookup: {
            from:         'registrations',
            localField:   'registrationId',
            foreignField: '_id',
            as:           'registration',
          },
        },
        { $unwind: { path: '$registration', preserveNullAndEmpty: true } },
        {
          $group: {
            _id:       { $ifNull: ['$registration.planType', 'unknown'] },
            count:     { $sum: 1 },
            totalPaid: { $sum: '$amountPaid' },
          },
        },
        { $sort: { totalPaid: -1 } },
      ]),
    ]);

    const successRow = byStatus.find((r: any) => r._id === PaymentGatewayStatus.SUCCESS);

    return ok({
      summary: {
        totalRevenue:    successRow?.totalPaid   ?? 0,
        totalTransactions: successRow?.count     ?? 0,
        totalDiscount:   successRow?.totalDiscount ?? 0,
      },
      byStatus,
      byChannel,
      byPlanType: planTypeSummary,
      couponUsage: couponSummary,
    });
  } catch (e: any) {
    const status = e.message?.startsWith('Forbidden') ? 403
                 : e.message?.startsWith('Unauthorized') ? 401 : 500;
    return err(e.message ?? 'Server error', status);
  }
}
