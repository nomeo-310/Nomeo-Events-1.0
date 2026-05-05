// app/api/cron/subscriptions/route.ts
//
// GET /api/cron/subscriptions
//
// Runs daily to expire subscriptions that have lapsed.
// Handles three cases:
//   1. PAST_DUE subs whose period has ended → EXPIRED
//   2. Subs with cancelAtPeriodEnd=true whose period has ended → CANCELLED
//   3. TRIALING subs whose trialEnd has passed → EXPIRED
//
// Protect with CRON_SECRET. Configure in vercel.json:
//
//   {
//     "crons": [{ "path": "/api/cron/subscriptions", "schedule": "0 1 * * *" }]
//   }
//
// Vercel sets the Authorization header automatically using CRON_SECRET.
// For external runners, pass it as x-cron-secret instead.

import { NextRequest, NextResponse } from 'next/server';
import { Subscription, SubscriptionStatus } from '@/models/subscription';
import { connectDB } from '@/lib/mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const cronHeader = req.headers.get('x-cron-secret');
  const secret = process.env.CRON_SECRET;

  const isVercel = authHeader === `Bearer ${secret}`;
  const isExternal = cronHeader === secret;

  if (!isVercel && !isExternal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const now = new Date();
    const results = await expireSubscriptions(now);

    console.log('[cron/subscriptions]', results);
    return NextResponse.json({ ok: true, ...results, ranAt: now.toISOString() });
  } catch (err) {
    console.error('[cron/subscriptions] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Core expiry logic (exported so it can be unit-tested or called directly) ──

export async function expireSubscriptions(now = new Date()) {
  // 1. PAST_DUE → EXPIRED (grace period over)
  const pastDue = await Subscription.updateMany(
    { status: SubscriptionStatus.PAST_DUE, currentPeriodEnd: { $lt: now } },
    { $set: { status: SubscriptionStatus.EXPIRED } }
  );

  // 2. cancelAtPeriodEnd → CANCELLED
  const pendingCancel = await Subscription.updateMany(
    {
      cancelAtPeriodEnd: true,
      status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      currentPeriodEnd: { $lt: now },
    },
    { $set: { status: SubscriptionStatus.CANCELLED } }
  );

  // 3. Trial ended but no payment → EXPIRED
  const trialExpired = await Subscription.updateMany(
    {
      status: SubscriptionStatus.TRIALING,
      trialEnd: { $lt: now },
      // Only expire free-plan trials (paid plan trials would have a payment attached)
      finalPriceKobo: 0,
    },
    { $set: { status: SubscriptionStatus.EXPIRED } }
  );

  return {
    expired: pastDue.modifiedCount + trialExpired.modifiedCount,
    cancelled: pendingCancel.modifiedCount,
  };
}