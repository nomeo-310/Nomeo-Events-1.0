// app/api/admin/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongoose';

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Returns {start, end} for each of the last `n` calendar months (newest first) */
function getLastNMonths(n = 12) {
  const months: { label: string; start: Date; end: Date }[] = [];
  const now = new Date();

  for (let i = 0; i < n; i++) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    const label = start.toLocaleString('default', { month: 'short', year: 'numeric' });
    months.push({ label, start, end });
  }

  return months.reverse(); // oldest → newest for chart rendering
}

/** $facet stage that counts docs created in each of the last N months */
function monthlyCreationFacet(n = 12) {
  const months = getLastNMonths(n);
  const facet: Record<string, object[]> = {};

  for (const m of months) {
    facet[m.label] = [
      { $match: { createdAt: { $gte: m.start, $lte: m.end } } },
      { $count: 'count' },
    ];
  }
  return facet;
}

/** Flatten $facet output → [{label, count}] */
function flattenFacet(facetResult: Record<string, { count: number }[]>, n = 12) {
  const months = getLastNMonths(n);
  return months.map(m => ({
    label: m.label,
    count: facetResult[m.label]?.[0]?.count ?? 0,
  }));
}

// ─── GET /api/admin/analytics ─────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const db = mongoose.connection.db!;

    // ── Collections ──────────────────────────────────────────────────────────
    const users         = db.collection('user');           // your collection name
    const admins        = db.collection('admins');
    const profiles      = db.collection('profiles');
    const events        = db.collection('events');
    const registrations = db.collection('registrations');
    const subscriptions = db.collection('subscriptions');
    const plans         = db.collection('plans');
    const payments      = db.collection('payments');
    const newsletters   = db.collection('newsletters');
    const campaigns     = db.collection('campaigns');

    const now        = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last30Days = new Date(now.getTime() - 30 * 86_400_000);
    const last7Days  = new Date(now.getTime() - 7 * 86_400_000);

    // ── Run all aggregations in parallel ─────────────────────────────────────
    const [
      userStats,
      adminStats,
      eventStats,
      registrationStats,
      subscriptionStats,
      paymentStats,
      newsletterStats,
      campaignStats,

      // Monthly trends
      userMonthly,
      eventMonthly,
      registrationMonthly,
      subscriptionMonthly,
      revenueMonthly,
      newsletterMonthly,
    ] = await Promise.all([

      // ── Users ───────────────────────────────────────────────────────────────
      users.aggregate([
        {
          $facet: {
            total:         [{ $count: 'n' }],
            verified:      [{ $match: { emailVerified: true } }, { $count: 'n' }],
            newToday:      [{ $match: { createdAt: { $gte: startOfDay } } }, { $count: 'n' }],
            newLast7Days:  [{ $match: { createdAt: { $gte: last7Days } } }, { $count: 'n' }],
            newLast30Days: [{ $match: { createdAt: { $gte: last30Days } } }, { $count: 'n' }],
            byRole: [
              { $group: { _id: '$role', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
          },
        },
      ]).toArray(),

      // ── Admins ──────────────────────────────────────────────────────────────
      admins.aggregate([
        {
          $facet: {
            total:    [{ $count: 'n' }],
            active:   [{ $match: { adminStatus: 'active' } }, { $count: 'n' }],
            byRole:   [{ $group: { _id: '$role', count: { $sum: 1 } } }],
            recentLogins: [
              { $match: { lastLoginAt: { $gte: last7Days } } },
              { $count: 'n' },
            ],
          },
        },
      ]).toArray(),

      // ── Events ──────────────────────────────────────────────────────────────
      events.aggregate([
        {
          $facet: {
            total:     [{ $count: 'n' }],
            published: [{ $match: { status: 'published', isDeleted: false } }, { $count: 'n' }],
            draft:     [{ $match: { status: 'draft' } }, { $count: 'n' }],
            cancelled: [{ $match: { status: 'cancelled' } }, { $count: 'n' }],
            archived:  [{ $match: { isArchived: true } }, { $count: 'n' }],
            deleted:   [{ $match: { isDeleted: true } }, { $count: 'n' }],
            featured:  [{ $match: { featured: true, isDeleted: false } }, { $count: 'n' }],
            upcoming:  [{ $match: { startDate: { $gt: now }, isDeleted: false, status: 'published' } }, { $count: 'n' }],
            ongoing:   [{ $match: { startDate: { $lte: now }, endDate: { $gte: now }, isDeleted: false } }, { $count: 'n' }],
            completed: [{ $match: { endDate: { $lt: now }, isDeleted: false } }, { $count: 'n' }],
            byCategory:[{ $match: { isDeleted: false } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
            byMode:    [{ $match: { isDeleted: false } }, { $group: { _id: '$eventMode', count: { $sum: 1 } } }],
            seatsUtilisation: [
              { $match: { isDeleted: false, totalSeats: { $gt: 0 } } },
              {
                $group: {
                  _id: null,
                  avgTotalSeats:     { $avg: '$totalSeats' },
                  avgAvailableSeats: { $avg: '$availableSeats' },
                  totalSeatsSum:     { $sum: '$totalSeats' },
                  takenSeatsSum:     { $sum: { $subtract: ['$totalSeats', '$availableSeats'] } },
                },
              },
            ],
            eventsPerOrganizer: [
              { $match: { isDeleted: false } },
              { $group: { _id: '$organizerId', count: { $sum: 1 } } },
              { $group: { _id: null, avg: { $avg: '$count' }, max: { $max: '$count' } } },
            ],
          },
        },
      ]).toArray(),

      // ── Registrations ────────────────────────────────────────────────────────
      registrations.aggregate([
        {
          $facet: {
            total:      [{ $count: 'n' }],
            confirmed:  [{ $match: { status: 'confirmed' } }, { $count: 'n' }],
            pending:    [{ $match: { status: 'pending' } }, { $count: 'n' }],
            cancelled:  [{ $match: { status: 'cancelled' } }, { $count: 'n' }],
            attended:   [{ $match: { status: 'attended' } }, { $count: 'n' }],
            waitlisted: [{ $match: { status: 'waitlisted' } }, { $count: 'n' }],
            refunded:   [{ $match: { status: 'refunded' } }, { $count: 'n' }],
            paidCompleted: [{ $match: { paymentStatus: 'completed' } }, { $count: 'n' }],
            group:      [{ $match: { isGroupRegistration: true } }, { $count: 'n' }],
            corporate:  [{ $match: { isCorporateRegistration: true } }, { $count: 'n' }],
            avgPerEvent: [
              { $group: { _id: '$eventId', count: { $sum: 1 } } },
              { $group: { _id: null, avg: { $avg: '$count' }, max: { $max: '$count' }, totalEvents: { $sum: 1 } } },
            ],
            withFeedback: [{ $match: { feedbackSubmitted: true } }, { $count: 'n' }],
            avgRating: [
              { $match: { rating: { $exists: true, $ne: null } } },
              { $group: { _id: null, avg: { $avg: '$rating' } } },
            ],
          },
        },
      ]).toArray(),

      // ── Subscriptions ────────────────────────────────────────────────────────
      subscriptions.aggregate([
        {
          $facet: {
            total:    [{ $count: 'n' }],
            active:   [{ $match: { status: 'active' } }, { $count: 'n' }],
            trialing: [{ $match: { status: 'trialing' } }, { $count: 'n' }],
            pastDue:  [{ $match: { status: 'past_due' } }, { $count: 'n' }],
            cancelled:[{ $match: { status: 'cancelled' } }, { $count: 'n' }],
            expired:  [{ $match: { status: 'expired' } }, { $count: 'n' }],
            paused:   [{ $match: { status: 'paused' } }, { $count: 'n' }],
            byTier:   [{ $group: { _id: '$planTier', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
            byInterval:[{ $group: { _id: '$interval', count: { $sum: 1 } } }],
            cancelAtEnd:[{ $match: { cancelAtPeriodEnd: true } }, { $count: 'n' }],
            mrr: [
              { $match: { status: { $in: ['active', 'trialing'] }, interval: 'monthly' } },
              { $group: { _id: null, total: { $sum: '$finalPriceKobo' } } },
            ],
          },
        },
      ]).toArray(),

      // ── Payments ─────────────────────────────────────────────────────────────
      payments.aggregate([
        {
          $facet: {
            total:       [{ $count: 'n' }],
            successful:  [{ $match: { gatewayStatus: 'success' } }, { $count: 'n' }],
            failed:      [{ $match: { gatewayStatus: 'failed' } }, { $count: 'n' }],
            pending:     [{ $match: { gatewayStatus: 'pending' } }, { $count: 'n' }],
            reversed:    [{ $match: { gatewayStatus: 'reversed' } }, { $count: 'n' }],
            totalRevenue: [
              { $match: { gatewayStatus: 'success' } },
              { $group: { _id: null, total: { $sum: '$amountPaid' }, count: { $sum: 1 } } },
            ],
            revenueByPurpose: [
              { $match: { gatewayStatus: 'success' } },
              { $group: { _id: '$purpose', total: { $sum: '$amountPaid' }, count: { $sum: 1 } } },
            ],
            byChannel: [
              { $match: { gatewayStatus: 'success' } },
              { $group: { _id: '$channel', total: { $sum: '$amountPaid' }, count: { $sum: 1 } } },
              { $sort: { total: -1 } },
            ],
            totalDiscounts: [
              { $group: { _id: null, total: { $sum: '$discountAmount' } } },
            ],
            refunds: [
              { $match: { refundedAt: { $exists: true } } },
              { $group: { _id: null, total: { $sum: '$refundAmount' }, count: { $sum: 1 } } },
            ],
          },
        },
      ]).toArray(),

      // ── Newsletter ────────────────────────────────────────────────────────────
      newsletters.aggregate([
        {
          $facet: {
            total:          [{ $count: 'n' }],
            active:         [{ $match: { status: 'active' } }, { $count: 'n' }],
            unsubscribed:   [{ $match: { status: 'unsubscribed' } }, { $count: 'n' }],
            withUserId:     [{ $match: { userId: { $exists: true, $ne: null } } }, { $count: 'n' }],
            newLast30Days:  [{ $match: { subscribedAt: { $gte: last30Days } } }, { $count: 'n' }],
            newLast7Days:   [{ $match: { subscribedAt: { $gte: last7Days } } }, { $count: 'n' }],
          },
        },
      ]).toArray(),

      // ── Campaigns ────────────────────────────────────────────────────────────
      campaigns.aggregate([
        {
          $facet: {
            total:     [{ $count: 'n' }],
            completed: [{ $match: { status: 'completed' } }, { $count: 'n' }],
            sending:   [{ $match: { status: 'sending' } }, { $count: 'n' }],
            draft:     [{ $match: { status: 'draft' } }, { $count: 'n' }],
            failed:    [{ $match: { status: 'failed' } }, { $count: 'n' }],
            byType:    [{ $group: { _id: '$type', count: { $sum: 1 } } }],
            emailMetrics: [
              { $match: { status: 'completed' } },
              {
                $group: {
                  _id: null,
                  totalSent:       { $sum: '$recipients.total' },
                  totalSuccessful: { $sum: '$recipients.successful' },
                  totalFailed:     { $sum: '$recipients.failed' },
                  totalOpened:     { $sum: '$recipients.opened' },
                  totalClicked:    { $sum: '$recipients.clicked' },
                },
              },
            ],
          },
        },
      ]).toArray(),

      // ── Monthly trends ────────────────────────────────────────────────────────
      users.aggregate([{ $facet: monthlyCreationFacet() }]).toArray(),
      events.aggregate([{ $match: { isDeleted: false } }, { $facet: monthlyCreationFacet() }]).toArray(),
      registrations.aggregate([{ $facet: monthlyCreationFacet() }]).toArray(),
      subscriptions.aggregate([{ $facet: monthlyCreationFacet() }]).toArray(),

      payments.aggregate([
        { $match: { gatewayStatus: 'success' } },
        {
          $facet: (() => {
            const months = getLastNMonths(12);
            const facet: Record<string, object[]> = {};
            for (const m of months) {
              facet[m.label] = [
                { $match: { createdAt: { $gte: m.start, $lte: m.end } } },
                { $group: { _id: null, total: { $sum: '$amountPaid' } } },
              ];
            }
            return facet;
          })(),
        },
      ]).toArray(),

      newsletters.aggregate([{ $facet: monthlyCreationFacet() }]).toArray(),
    ]);

    // ── Extract helpers ───────────────────────────────────────────────────────
    const n1 = (facet: any, key: string): number => facet?.[0]?.[key]?.[0]?.n ?? 0;
    const arr = (facet: any, key: string): any[] => facet?.[0]?.[key] ?? [];

    // ── Monthly revenue array ─────────────────────────────────────────────────
    const months = getLastNMonths(12);
    const revenueMonthlyFormatted = months.map(m => ({
      label: m.label,
      total: (revenueMonthly[0]?.[m.label]?.[0]?.total ?? 0) / 100,
    }));

    // ── Derived metrics ───────────────────────────────────────────────────────
    const totalPayments    = n1(paymentStats, 'total');
    const successPayments  = n1(paymentStats, 'successful');
    const paymentSuccessRate = totalPayments > 0 ? +(successPayments / totalPayments * 100).toFixed(1) : 0;

    const totalNewsletters  = n1(newsletterStats, 'total');
    const unsubscribed      = n1(newsletterStats, 'unsubscribed');
    const unsubscribeRate   = totalNewsletters > 0 ? +(unsubscribed / totalNewsletters * 100).toFixed(1) : 0;

    const emailMetrics = arr(campaignStats, 'emailMetrics')[0] ?? {};
    const openRate  = emailMetrics.totalSent > 0 ? +((emailMetrics.totalOpened / emailMetrics.totalSent) * 100).toFixed(1) : 0;
    const clickRate = emailMetrics.totalSent > 0 ? +((emailMetrics.totalClicked / emailMetrics.totalSent) * 100).toFixed(1) : 0;

    const totalRevKobo  = arr(paymentStats, 'totalRevenue')[0]?.total ?? 0;
    const totalDiscKobo = arr(paymentStats, 'totalDiscounts')[0]?.total ?? 0;
    const refundData    = arr(paymentStats, 'refunds')[0] ?? {};
    const mrrKobo       = arr(subscriptionStats, 'mrr')[0]?.total ?? 0;

    const seatsUtil    = arr(eventStats, 'seatsUtilisation')[0];
    const occupancyRate = seatsUtil ? +((seatsUtil.takenSeatsSum / seatsUtil.totalSeatsSum) * 100).toFixed(1) : 0;

    const avgRegsPerEvent = arr(registrationStats, 'avgPerEvent')[0];
    const avgEventsPerOrg = arr(eventStats, 'eventsPerOrganizer')[0];

    return NextResponse.json({
      generatedAt: now.toISOString(),

      overview: {
        totalUsers:          n1(userStats, 'total'),
        verifiedUsers:       n1(userStats, 'verified'),
        totalAdmins:         n1(adminStats, 'total'),
        activeAdmins:        n1(adminStats, 'active'),
        totalEvents:         n1(eventStats, 'total'),
        publishedEvents:     n1(eventStats, 'published'),
        totalRegistrations:  n1(registrationStats, 'total'),
        confirmedRegs:       n1(registrationStats, 'confirmed'),
        activeSubscriptions: n1(subscriptionStats, 'active') + n1(subscriptionStats, 'trialing'),
        totalRevenue:        +(totalRevKobo / 100).toFixed(2),
        mrr:                 +(mrrKobo / 100).toFixed(2),
        newsletterSubs:      n1(newsletterStats, 'active'),
        paymentSuccessRate,
        occupancyRate,
      },

      users: {
        total:         n1(userStats, 'total'),
        verified:      n1(userStats, 'verified'),
        newToday:      n1(userStats, 'newToday'),
        newLast7Days:  n1(userStats, 'newLast7Days'),
        newLast30Days: n1(userStats, 'newLast30Days'),
        byRole:        arr(userStats, 'byRole'),
        monthly:       flattenFacet(userMonthly[0] ?? {}),
      },

      admins: {
        total:        n1(adminStats, 'total'),
        active:       n1(adminStats, 'active'),
        recentLogins: n1(adminStats, 'recentLogins'),
        byRole:       arr(adminStats, 'byRole'),
      },

      events: {
        total:      n1(eventStats, 'total'),
        published:  n1(eventStats, 'published'),
        draft:      n1(eventStats, 'draft'),
        cancelled:  n1(eventStats, 'cancelled'),
        archived:   n1(eventStats, 'archived'),
        deleted:    n1(eventStats, 'deleted'),
        featured:   n1(eventStats, 'featured'),
        upcoming:   n1(eventStats, 'upcoming'),
        ongoing:    n1(eventStats, 'ongoing'),
        completed:  n1(eventStats, 'completed'),
        occupancyRate,
        avgTotalSeats:         +(seatsUtil?.avgTotalSeats ?? 0).toFixed(0),
        avgEventsPerOrganizer: +(avgEventsPerOrg?.avg ?? 0).toFixed(1),
        maxEventsByOrganizer:  avgEventsPerOrg?.max ?? 0,
        byCategory:            arr(eventStats, 'byCategory'),
        byMode:                arr(eventStats, 'byMode'),
        monthly:               flattenFacet(eventMonthly[0] ?? {}),
      },

      registrations: {
        total:         n1(registrationStats, 'total'),
        confirmed:     n1(registrationStats, 'confirmed'),
        pending:       n1(registrationStats, 'pending'),
        cancelled:     n1(registrationStats, 'cancelled'),
        attended:      n1(registrationStats, 'attended'),
        waitlisted:    n1(registrationStats, 'waitlisted'),
        refunded:      n1(registrationStats, 'refunded'),
        paidCompleted: n1(registrationStats, 'paidCompleted'),
        groupRegs:     n1(registrationStats, 'group'),
        corpRegs:      n1(registrationStats, 'corporate'),
        withFeedback:  n1(registrationStats, 'withFeedback'),
        avgRating:     +(arr(registrationStats, 'avgRating')[0]?.avg ?? 0).toFixed(2),
        avgPerEvent:   +(avgRegsPerEvent?.avg ?? 0).toFixed(1),
        maxPerEvent:   avgRegsPerEvent?.max ?? 0,
        monthly:       flattenFacet(registrationMonthly[0] ?? {}),
      },

      subscriptions: {
        total:       n1(subscriptionStats, 'total'),
        active:      n1(subscriptionStats, 'active'),
        trialing:    n1(subscriptionStats, 'trialing'),
        pastDue:     n1(subscriptionStats, 'pastDue'),
        cancelled:   n1(subscriptionStats, 'cancelled'),
        expired:     n1(subscriptionStats, 'expired'),
        paused:      n1(subscriptionStats, 'paused'),
        cancelAtEnd: n1(subscriptionStats, 'cancelAtEnd'),
        mrr:         +(mrrKobo / 100).toFixed(2),
        byTier:      arr(subscriptionStats, 'byTier'),
        byInterval:  arr(subscriptionStats, 'byInterval'),
        monthly:     flattenFacet(subscriptionMonthly[0] ?? {}),
      },

      payments: {
        total:          n1(paymentStats, 'total'),
        successful:     n1(paymentStats, 'successful'),
        failed:         n1(paymentStats, 'failed'),
        pending:        n1(paymentStats, 'pending'),
        reversed:       n1(paymentStats, 'reversed'),
        successRate:    paymentSuccessRate,
        totalRevenue:   +(totalRevKobo / 100).toFixed(2),
        totalDiscounts: +(totalDiscKobo / 100).toFixed(2),
        refundCount:    refundData.count ?? 0,
        refundTotal:    +((refundData.total ?? 0) / 100).toFixed(2),
        byPurpose:      arr(paymentStats, 'revenueByPurpose').map((p: any) => ({ ...p, total: +(p.total / 100).toFixed(2) })),
        byChannel:      arr(paymentStats, 'byChannel').map((c: any) => ({ ...c, total: +(c.total / 100).toFixed(2) })),
        monthlyRevenue: revenueMonthlyFormatted,
      },

      newsletter: {
        total:         n1(newsletterStats, 'total'),
        active:        n1(newsletterStats, 'active'),
        unsubscribed,
        unsubscribeRate,
        withUserId:    n1(newsletterStats, 'withUserId'),
        newLast7Days:  n1(newsletterStats, 'newLast7Days'),
        newLast30Days: n1(newsletterStats, 'newLast30Days'),
        monthly:       flattenFacet(newsletterMonthly[0] ?? {}),
      },

      campaigns: {
        total:     n1(campaignStats, 'total'),
        completed: n1(campaignStats, 'completed'),
        sending:   n1(campaignStats, 'sending'),
        draft:     n1(campaignStats, 'draft'),
        failed:    n1(campaignStats, 'failed'),
        byType:    arr(campaignStats, 'byType'),
        emailMetrics: {
          totalSent:       emailMetrics.totalSent ?? 0,
          totalSuccessful: emailMetrics.totalSuccessful ?? 0,
          totalFailed:     emailMetrics.totalFailed ?? 0,
          totalOpened:     emailMetrics.totalOpened ?? 0,
          totalClicked:    emailMetrics.totalClicked ?? 0,
          openRate,
          clickRate,
        },
      },
    });
  } catch (err: any) {
    console.error('[analytics] error:', err);
    return NextResponse.json({ error: 'Failed to fetch analytics', message: err.message }, { status: 500 });
  }
}