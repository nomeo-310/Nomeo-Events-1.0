import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment, PaymentPurpose } from '@/models/payment';
import { ok, err, paginate } from '@/lib/api-response';
import mongoose from 'mongoose';

/**
 * GET /api/admin/payments/subscriptions/:subscriptionId
 *
 * Permission: super_admin
 *
 * Full payment history for a specific subscription (most recent first).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { subscriptionId: string } }
) {
  try {
    await requireSuperAdmin();
    await connectDB();

    if (!mongoose.isValidObjectId(params.subscriptionId)) {
      return err('Invalid subscriptionId', 400);
    }

    const { searchParams } = req.nextUrl;
    const page  = Math.max(1, Number(searchParams.get('page')  ?? 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const skip  = (page - 1) * limit;

    const filter = {
      purpose:        PaymentPurpose.SUBSCRIPTION,
      subscriptionId: new mongoose.Types.ObjectId(params.subscriptionId),
    };

    const [data, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('planId', 'name tier interval priceKobo')
        .lean(),
      Payment.countDocuments(filter),
    ]);

    return paginate(data, total, page, limit);
  } catch (e: any) {
    const status = e.message?.startsWith('Forbidden') ? 403
                 : e.message?.startsWith('Unauthorized') ? 401 : 500;
    return err(e.message ?? 'Server error', status);
  }
}
