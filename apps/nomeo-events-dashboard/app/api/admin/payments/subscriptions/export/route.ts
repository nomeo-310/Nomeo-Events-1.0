import { NextRequest } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Payment, PaymentPurpose } from '@/models/payment';
import { csv, toCSV, err } from '@/lib/api-response';

/**
 * GET /api/admin/payments/subscriptions/export
 *
 * Permission: super_admin
 *
 * CSV export of subscription payments (max 10,000 rows).
 */
export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin();
    await connectDB();

    const { searchParams } = req.nextUrl;
    const filter: Record<string, unknown> = { purpose: PaymentPurpose.SUBSCRIPTION };

    const status = searchParams.get('status');
    if (status) filter.gatewayStatus = status;

    const dateFrom = searchParams.get('dateFrom');
    const dateTo   = searchParams.get('dateTo');
    if (dateFrom || dateTo) {
      filter.createdAt = {
        ...(dateFrom && { $gte: new Date(dateFrom) }),
        ...(dateTo   && { $lte: new Date(dateTo)   }),
      };
    }

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .limit(10_000)
      .populate('planId',         'name tier interval')
      .populate('subscriptionId', 'status')
      .lean();

    const rows = payments.map((p: any) => ({
      paymentId:         String(p._id),
      reference:         p.reference,
      paystackReference: p.paystackReference ?? '',
      gatewayStatus:     p.gatewayStatus,
      amount:            p.amount,
      amountPaid:        p.amountPaid,
      discountAmount:    p.discountAmount,
      currency:          p.currency,
      couponCode:        p.couponCode ?? '',
      channel:           p.channel ?? '',
      paidAt:            p.paidAt?.toISOString() ?? '',
      refundedAt:        p.refundedAt?.toISOString() ?? '',
      refundAmount:      p.refundAmount ?? '',
      refundReason:      p.refundReason ?? '',
      subscriptionId:    p.subscriptionId?._id ? String(p.subscriptionId._id) : '',
      subscriptionStatus: p.subscriptionId?.status ?? '',
      planId:            p.planId?._id ? String(p.planId._id) : '',
      planName:          p.planId?.name ?? '',
      planTier:          p.planId?.tier ?? '',
      planInterval:      p.planId?.interval ?? '',
      createdAt:         p.createdAt.toISOString(),
    }));

    const filename = `subscription-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    return csv(toCSV(rows), filename);
  } catch (e: any) {
    const status = e.message?.startsWith('Forbidden') ? 403
                 : e.message?.startsWith('Unauthorized') ? 401 : 500;
    return err(e.message ?? 'Server error', status);
  }
}
