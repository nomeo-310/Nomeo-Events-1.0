// app/api/admin/subscriptions/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Subscription } from '@/models/subscription';
import { requireAuth } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';

// GET /api/admin/subscriptions/export
export async function GET(req: NextRequest) {
  try {
    const loggedInUser = await requireAuth();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    // ?? guards against string | null from searchParams.get()
    const format    = searchParams.get('format')    ?? 'csv';
    const status    = searchParams.get('status')    ?? undefined;
    const startDate = searchParams.get('startDate') ?? undefined;
    const endDate   = searchParams.get('endDate')   ?? undefined;
    const planTier  = searchParams.get('planTier')  ?? undefined;

    const query: Record<string, any> = {};
    if (status   && status   !== 'all') query.status   = status;
    if (planTier && planTier !== 'all') query.planTier = planTier;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate)   query.createdAt.$lte = new Date(endDate);
    }

    const subscriptions = await Subscription.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      // Exclude sensitive fields even in exports
      .select('-paystackAuthorizationCode -paystackEmailToken -metadata')
      .lean();

    if (format === 'csv') {
      const csvData = convertToCSV(subscriptions);
      return new NextResponse(csvData, {
        headers: {
          'Content-Type':        'text/csv',
          'Content-Disposition': `attachment; filename=subscriptions-export-${Date.now()}.csv`,
        },
      });
    }

    // JSON export — sanitize to only expose what's needed
    const sanitizedData = subscriptions.map((sub: any) => ({
      id:   sub._id,
      user: sub.userId,
      plan: {
        name:       sub.planName,
        tier:       sub.planTier,
        interval:   sub.interval,
        price:      sub.priceKobo      / 100,
        finalPrice: sub.finalPriceKobo / 100,
      },
      status: sub.status,
      dates: {
        created:     sub.createdAt,
        periodStart: sub.currentPeriodStart,
        periodEnd:   sub.currentPeriodEnd,
        trialEnd:    sub.trialEnd     ?? null,
        cancelled:   sub.cancelledAt  ?? null,
      },
      coupon:   sub.couponCode    ?? null,
      discount: sub.discountKobo / 100,
    }));

    return NextResponse.json(sanitizedData);
  } catch (error) {
    console.error('Error exporting subscriptions:', error);
    return NextResponse.json({ error: 'Failed to export subscriptions' }, { status: 500 });
  }
}

function convertToCSV(subscriptions: any[]): string {
  const headers = [
    'User Name',
    'User Email',
    'Plan Name',
    'Tier',
    'Interval',
    'Price (NGN)',
    'Final Price (NGN)',
    'Discount (NGN)',
    'Status',
    'Period Start',
    'Period End',
    'Created At',
    'Trial End',
    'Cancelled At',
    'Coupon Code',
    'Has Paystack Auth',
  ].join(',');

  const rows = subscriptions.map((sub: any) => {
    const user = sub.userId as { name?: string; email?: string } | null;
    return [
      `"${user?.name  ?? 'N/A'}"`,
      `"${user?.email ?? 'N/A'}"`,
      `"${sub.planName}"`,
      sub.planTier,
      sub.interval,
      (sub.priceKobo      / 100).toFixed(2),
      (sub.finalPriceKobo / 100).toFixed(2),
      (sub.discountKobo   / 100).toFixed(2),
      sub.status,
      sub.currentPeriodStart ? new Date(sub.currentPeriodStart).toISOString().split('T')[0] : '',
      sub.currentPeriodEnd   ? new Date(sub.currentPeriodEnd).toISOString().split('T')[0]   : '',
      sub.createdAt          ? new Date(sub.createdAt).toISOString().split('T')[0]           : '',
      sub.trialEnd           ? new Date(sub.trialEnd).toISOString().split('T')[0]            : '',
      sub.cancelledAt        ? new Date(sub.cancelledAt).toISOString().split('T')[0]         : '',
      sub.couponCode ?? '',
      // paystackAuthorizationCode is excluded from query — use payment array length instead
      sub.payments?.length > 0 ? 'Yes' : 'No',
    ].join(',');
  });

  return [headers, ...rows].join('\n');
}