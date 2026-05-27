import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment, PaymentGatewayStatus, PaymentPurpose } from '@/models/payment';
import { ok, err, paginate } from '@/lib/api-response';
import mongoose from 'mongoose';

/**
 * GET /api/admin/payments/plans/:planId
 *
 * Permission: super_admin
 *
 * All subscription payments for a specific plan, with
 * a revenue summary (MRR contribution, total collected, failed count).
 *
 * Query params:
 *   page     number
 *   limit    number
 *   status   PaymentGatewayStatus
 */
export async function GET( req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  
  try {
    await requireSuperAdmin();
    await connectDB();

    if (!mongoose.isValidObjectId(planId)) {
      return err('Invalid planId', 400);
    }

    const { searchParams } = req.nextUrl;
    const page  = Math.max(1, Number(searchParams.get('page')  ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const skip  = (page - 1) * limit;

    const planOid = new mongoose.Types.ObjectId(planId);

    const filter: Record<string, unknown> = {
      purpose: PaymentPurpose.SUBSCRIPTION,
      planId:  planOid,
    };

    const status = searchParams.get('status') as PaymentGatewayStatus | null;
    if (status && Object.values(PaymentGatewayStatus).includes(status)) {
      filter.gatewayStatus = status;
    }

    // MRR window (current calendar month, successful only)
    const now = new Date();
    const mrrStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mrrEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [data, total, summary, mrrRaw] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('subscriptionId', 'status')
        .lean(),

      Payment.countDocuments(filter),

      Payment.aggregate([
        { $match: { purpose: PaymentPurpose.SUBSCRIPTION, planId: planOid } },
        {
          $group: {
            _id:         '$gatewayStatus',
            count:       { $sum: 1 },
            totalPaid:   { $sum: '$amountPaid' },
            totalDiscount: { $sum: '$discountAmount' },
          },
        },
      ]),

      Payment.aggregate([
        {
          $match: {
            purpose:       PaymentPurpose.SUBSCRIPTION,
            planId:        planOid,
            gatewayStatus: PaymentGatewayStatus.SUCCESS,
            paidAt:        { $gte: mrrStart, $lte: mrrEnd },
          },
        },
        { $group: { _id: null, mrr: { $sum: '$amountPaid' }, count: { $sum: 1 } } },
      ]),
    ]);

    const successRow = summary.find((r: any) => r._id === PaymentGatewayStatus.SUCCESS);

    return ok({
      summary: {
        totalRevenue: successRow?.totalPaid ?? 0,
        totalDiscount: successRow?.totalDiscount ?? 0,
        mrr:          mrrRaw[0]?.mrr  ?? 0,
        arr:          (mrrRaw[0]?.mrr ?? 0) * 12,
        byStatus:     summary,
      },
      ...paginate(data, total, page, limit),
    });
  } catch (e: any) {
    const status = e.message?.startsWith('Forbidden') ? 403
                 : e.message?.startsWith('Unauthorized') ? 401 : 500;
    return err(e.message ?? 'Server error', status);
  }
}
