// app/api/admin/subscriptions/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Subscription, SubscriptionStatus } from '@/models/subscription';
import { requireAuth } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';

// GET /api/admin/subscriptions/stats
export async function GET(req: NextRequest) {
  try {
    const loggedInUser = await requireAuth();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    // ?? 'default' guards against string | null
    const period    = searchParams.get('period') ?? '30';
    const periodInt = parseInt(period);

    const now       = new Date();
    const startDate = new Date(now.getTime() - periodInt * 86_400_000);

    const [
      statusDistribution,
      tierDistribution,
      intervalDistribution,
      revenueMetrics,
      trialMetrics,
      churnMetrics,
      growthMetrics,
      upcomingRenewals,
      paymentMetrics,
      topPlans,
      acquisitionMetrics,
    ] = await Promise.all([

      // ── Status distribution ───────────────────────────────────────────────
      // Count across ALL statuses (not just active) for an accurate total
      Subscription.aggregate([
        {
          $group: {
            _id:     '$status',
            count:   { $sum: 1 },
            revenue: { $sum: '$finalPriceKobo' },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // ── Tier distribution (active + trialing only) ────────────────────────
      Subscription.aggregate([
        { $match: { status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } } },
        {
          $group: {
            _id:                  '$planTier',
            count:                { $sum: 1 },
            totalRevenue:         { $sum: '$finalPriceKobo' },
            avgRevenue:           { $avg: '$finalPriceKobo' },
            activeSubscribers:    { $sum: { $cond: [{ $eq: ['$status', SubscriptionStatus.ACTIVE] }, 1, 0] } },
            trialingSubscribers:  { $sum: { $cond: [{ $eq: ['$status', SubscriptionStatus.TRIALING] }, 1, 0] } },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ]),

      // ── Interval distribution ─────────────────────────────────────────────
      Subscription.aggregate([
        { $match: { status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } } },
        {
          $group: {
            _id:     '$interval',
            count:   { $sum: 1 },
            revenue: { $sum: '$finalPriceKobo' },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // ── Revenue metrics ───────────────────────────────────────────────────
      Subscription.aggregate([
        {
          $facet: {
            mrr: [
              { $match: { status: SubscriptionStatus.ACTIVE, interval: 'monthly' } },
              { $group: { _id: null, total: { $sum: '$finalPriceKobo' } } },
            ],
            arr: [
              { $match: { status: SubscriptionStatus.ACTIVE } },
              // Normalise every interval to annual kobo
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: {
                      $switch: {
                        branches: [
                          { case: { $eq: ['$interval', 'monthly']   }, then: { $multiply: ['$finalPriceKobo', 12] } },
                          { case: { $eq: ['$interval', 'quarterly'] }, then: { $multiply: ['$finalPriceKobo', 4]  } },
                          { case: { $eq: ['$interval', 'biannual']  }, then: { $multiply: ['$finalPriceKobo', 2]  } },
                          { case: { $eq: ['$interval', 'annual']    }, then: '$finalPriceKobo' },
                          { case: { $eq: ['$interval', 'lifetime']  }, then: 0 }, // lifetime not recurring
                        ],
                        default: '$finalPriceKobo',
                      },
                    },
                  },
                },
              },
            ],
            totalRevenue: [
              { $group: { _id: null, total: { $sum: '$finalPriceKobo' } } },
            ],
            averageSubscription: [
              { $match: { status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } } },
              {
                $group: {
                  _id: null,
                  avg: { $avg: '$finalPriceKobo' },
                  min: { $min: '$finalPriceKobo' },
                  max: { $max: '$finalPriceKobo' },
                },
              },
            ],
          },
        },
      ]),

      // ── Trial metrics ─────────────────────────────────────────────────────
      Subscription.aggregate([
        {
          $facet: {
            activeTrials: [
              { $match: { status: SubscriptionStatus.TRIALING, trialEnd: { $gte: now } } },
              { $count: 'count' },
            ],
            trialsEndingSoon: [
              {
                $match: {
                  status:   SubscriptionStatus.TRIALING,
                  trialEnd: { $gte: now, $lte: new Date(now.getTime() + 7 * 86_400_000) },
                },
              },
              { $count: 'count' },
            ],
            // Users who were trialing, trial has ended, and are now active (converted)
            convertedTrials: [
              {
                $match: {
                  status:   SubscriptionStatus.ACTIVE,
                  trialEnd: { $exists: true, $lte: now }, // trial ended in the past
                },
              },
              { $count: 'count' },
            ],
            // Users whose trial ended and they cancelled or expired (did NOT convert)
            expiredTrials: [
              {
                $match: {
                  status:   { $in: [SubscriptionStatus.EXPIRED, SubscriptionStatus.CANCELLED] },
                  trialEnd: { $exists: true, $lte: now },
                },
              },
              { $count: 'count' },
            ],
          },
        },
      ]),

      // ── Churn metrics ─────────────────────────────────────────────────────
      Subscription.aggregate([
        {
          $facet: {
            cancelled: [
              { $match: { status: SubscriptionStatus.CANCELLED, cancelledAt: { $gte: startDate } } },
              { $count: 'count' },
            ],
            expired: [
              {
                $match: {
                  status:           SubscriptionStatus.EXPIRED,
                  currentPeriodEnd: { $gte: startDate, $lte: now },
                },
              },
              { $count: 'count' },
            ],
            totalChurned: [
              {
                $match: {
                  status: { $in: [SubscriptionStatus.CANCELLED, SubscriptionStatus.EXPIRED] },
                  $or: [
                    { cancelledAt:        { $gte: startDate } },
                    { currentPeriodEnd:   { $gte: startDate, $lte: now } },
                  ],
                },
              },
              { $count: 'count' },
            ],
          },
        },
      ]),

      // ── Daily growth ──────────────────────────────────────────────────────
      Subscription.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id:               { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            newSubscriptions:  { $sum: 1 },
            activeCount: {
              $sum: {
                $cond: [{ $in: ['$status', [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING]] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // ── Upcoming renewals (next 30 days) ──────────────────────────────────
      Subscription.aggregate([
        {
          $match: {
            status:            SubscriptionStatus.ACTIVE,
            cancelAtPeriodEnd: false,
            currentPeriodEnd:  { $gte: now, $lte: new Date(now.getTime() + 30 * 86_400_000) },
          },
        },
        {
          $group: {
            _id:             { $dateToString: { format: '%Y-%m-%d', date: '$currentPeriodEnd' } },
            count:           { $sum: 1 },
            expectedRevenue: { $sum: '$finalPriceKobo' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // ── Payment metrics (via lookup into payments collection) ─────────────
      // Uses gatewayStatus (not status) per the Payment schema
      Subscription.aggregate([
        { $match: { 'payments.0': { $exists: true } } },
        {
          $lookup: {
            from:         'payments',
            localField:   'payments',
            foreignField: '_id',
            as:           'paymentDetails',
          },
        },
        { $unwind: '$paymentDetails' },
        { $match: { 'paymentDetails.createdAt': { $gte: startDate } } },
        {
          $group: {
            _id:                null,
            totalPayments:      { $sum: 1 },
            successfulPayments: {
              $sum: { $cond: [{ $eq: ['$paymentDetails.gatewayStatus', 'success'] }, 1, 0] },
            },
            failedPayments: {
              $sum: { $cond: [{ $eq: ['$paymentDetails.gatewayStatus', 'failed'] }, 1, 0] },
            },
            totalAmount: {
              $sum: {
                $cond: [
                  { $eq: ['$paymentDetails.gatewayStatus', 'success'] },
                  '$paymentDetails.amountPaid', // amountPaid = actual charged amount
                  0,
                ],
              },
            },
          },
        },
      ]),

      // ── Top plans by subscriber count ─────────────────────────────────────
      Subscription.aggregate([
        { $match: { status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] } } },
        {
          $group: {
            _id:         { planName: '$planName', tier: '$planTier', interval: '$interval' },
            subscribers: { $sum: 1 },
            revenue:     { $sum: '$finalPriceKobo' },
            avgPrice:    { $avg: '$finalPriceKobo' },
          },
        },
        { $sort: { subscribers: -1 } },
        { $limit: 10 },
      ]),

      // ── New user acquisition by tier in period ────────────────────────────
      Subscription.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id:      '$planTier',
            newUsers: { $sum: 1 },
            revenue:  { $sum: '$finalPriceKobo' },
          },
        },
        { $sort: { newUsers: -1 } },
      ]),
    ]);

    // ── Totals ────────────────────────────────────────────────────────────────
    const totalAll    = statusDistribution.reduce((s: number, x: any) => s + x.count, 0);
    const totalActive = statusDistribution
      .filter((s: any) => [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING].includes(s._id))
      .reduce((s: number, x: any) => s + x.count, 0);

    const rv      = revenueMetrics[0];
    const mrr     = rv?.mrr?.[0]?.total        ?? 0;
    const arr     = rv?.arr?.[0]?.total        ?? 0;
    const totRev  = rv?.totalRevenue?.[0]?.total ?? 0;
    const avgSub  = rv?.averageSubscription?.[0] ?? null;

    const trials  = trialMetrics[0];
    const churn   = churnMetrics[0];
    const pmStats = paymentMetrics[0] ?? null;

    const activeTrialCount     = trials?.activeTrials?.[0]?.count     ?? 0;
    const convertedTrialCount  = trials?.convertedTrials?.[0]?.count  ?? 0;
    const conversionDenominator = activeTrialCount + convertedTrialCount;

    return NextResponse.json({
      overview: {
        totalSubscriptions:  totalAll,
        activeSubscriptions: totalActive,
        statusBreakdown: statusDistribution.map((s: any) => ({
          status:     s._id,
          count:      s.count,
          // Divide by totalAll (not totalActive) so percentages sum to 100
          percentage: totalAll > 0 ? ((s.count / totalAll) * 100).toFixed(1) : '0.0',
          revenue:    s.revenue / 100,
        })),
      },

      revenue: {
        mrr:                      mrr / 100,
        arr:                      arr / 100,
        totalRevenue:             totRev / 100,
        averageSubscription:      avgSub ? avgSub.avg / 100 : 0,
        subscriptionRange: {
          min: avgSub ? avgSub.min / 100 : 0,
          max: avgSub ? avgSub.max / 100 : 0,
        },
        projectedAnnualRevenue: arr / 100,
      },

      tiers: tierDistribution.map((t: any) => ({
        name:           t._id,
        total:          t.count,
        active:         t.activeSubscribers,
        trialing:       t.trialingSubscribers,
        percentage:     totalActive > 0 ? ((t.count / totalActive) * 100).toFixed(1) : '0.0',
        revenue:        t.totalRevenue / 100,
        averageRevenue: t.avgRevenue   / 100,
      })),

      intervals: intervalDistribution.map((i: any) => ({
        name:       i._id,
        count:      i.count,
        percentage: totalActive > 0 ? ((i.count / totalActive) * 100).toFixed(1) : '0.0',
        revenue:    i.revenue / 100,
      })),

      trials: {
        active:         activeTrialCount,
        endingThisWeek: trials?.trialsEndingSoon?.[0]?.count ?? 0,
        converted:      convertedTrialCount,
        expired:        trials?.expiredTrials?.[0]?.count    ?? 0,
        conversionRate: conversionDenominator > 0
          ? ((convertedTrialCount / conversionDenominator) * 100).toFixed(1)
          : '0.0',
      },

      churn: {
        thisPeriod: churn?.totalChurned?.[0]?.count ?? 0,
        cancelled:  churn?.cancelled?.[0]?.count    ?? 0,
        expired:    churn?.expired?.[0]?.count       ?? 0,
        churnRate:  totalActive > 0
          ? (((churn?.totalChurned?.[0]?.count ?? 0) / totalActive) * 100).toFixed(1)
          : '0.0',
      },

      growth: growthMetrics,

      upcomingRenewals: upcomingRenewals.map((r: any) => ({
        date:            r._id,
        count:           r.count,
        expectedRevenue: r.expectedRevenue / 100,
      })),

      payments: pmStats
        ? {
            total:       pmStats.totalPayments,
            successful:  pmStats.successfulPayments,
            failed:      pmStats.failedPayments,
            successRate: pmStats.totalPayments > 0
              ? ((pmStats.successfulPayments / pmStats.totalPayments) * 100).toFixed(1)
              : '0.0',
            totalAmount: pmStats.totalAmount / 100,
          }
        : null,

      topPlans: topPlans.map((p: any) => ({
        name:        p._id.planName,
        tier:        p._id.tier,
        interval:    p._id.interval,
        subscribers: p.subscribers,
        revenue:     p.revenue  / 100,
        avgPrice:    p.avgPrice / 100,
      })),

      acquisition: acquisitionMetrics.map((a: any) => ({
        tier:     a._id,
        newUsers: a.newUsers,
        revenue:  a.revenue / 100,
      })),

      metadata: {
        period,
        startDate,
        endDate:     now,
        generatedAt: now,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription statistics' }, { status: 500 });
  }
}