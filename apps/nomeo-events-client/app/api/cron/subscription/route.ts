// app/api/cron/subscriptions/route.ts
//
// GET /api/cron/subscriptions
//
// Runs daily to expire subscriptions that have lapsed.
// Handles four cases:
//   1. PAST_DUE subs whose period has ended           → EXPIRED
//   2. cancelAtPeriodEnd subs whose period has ended  → CANCELLED
//   3. TRIALING subs whose trialEnd has passed        → EXPIRED  (any plan, any price)
//   4. ACTIVE free subs whose currentPeriodEnd passed → EXPIRED  (the 10-yr window)
//
// Protect with CRON_SECRET. Configure in vercel.json:
//   { "crons": [{ "path": "/api/cron/subscriptions", "schedule": "0 1 * * *" }] }

import { NextRequest, NextResponse } from 'next/server';
import { Subscription, SubscriptionStatus } from '@/models/subscription';
import { connectDB } from '@/lib/mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronHeader = req.headers.get('x-cron-secret');
  const secret     = process.env.CRON_SECRET;

  const isVercel   = authHeader === `Bearer ${secret}`;
  const isExternal = cronHeader === secret;

  if (!isVercel && !isExternal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const now     = new Date();
    const results = await expireSubscriptions(now);
    console.log('[cron/subscriptions]', results);
    return NextResponse.json({ ok: true, ...results, ranAt: now.toISOString() });
  } catch (err) {
    console.error('[cron/subscriptions] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function expireSubscriptions(now = new Date()) {
  // ── 1. PAST_DUE → EXPIRED (grace period over) ──────────────────────────
  const pastDue = await Subscription.updateMany(
    {
      status:           SubscriptionStatus.PAST_DUE,
      currentPeriodEnd: { $lt: now },
    },
    { $set: { status: SubscriptionStatus.EXPIRED } }
  );

  // ── 2. cancelAtPeriodEnd → CANCELLED ───────────────────────────────────
  const pendingCancel = await Subscription.updateMany(
    {
      cancelAtPeriodEnd: true,
      status:            { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      currentPeriodEnd:  { $lt: now },
    },
    { $set: { status: SubscriptionStatus.CANCELLED } }
  );

  // ── 3. TRIALING with expired trialEnd → EXPIRED ────────────────────────
  //
  // BUG FIX: The original filter added `finalPriceKobo: 0` to "only target
  // free plans". This was wrong for two reasons:
  //
  //   a) Paid plan trials also have finalPriceKobo = 0 during the trial period.
  //   b) The intent should be: ANY trial that has ended with no subsequent
  //      payment recorded should become EXPIRED. If a paid plan user's trial
  //      ended and a payment was taken, the payment webhook should have already
  //      moved them to ACTIVE. If it hasn't, expiring them here is correct.
  //
  // We deliberately DO NOT filter on price. We check:
  //   - status is TRIALING
  //   - trialEnd exists and is in the past (the $exists guard prevents matching
  //     docs where trialEnd was never set — those cannot be trialing correctly)
  //   - cancelAtPeriodEnd is false (case 2 already handles those)
  const trialExpired = await Subscription.updateMany(
    {
      status:            SubscriptionStatus.TRIALING,
      trialEnd:          { $exists: true, $lt: now },
      cancelAtPeriodEnd: false,
    },
    { $set: { status: SubscriptionStatus.EXPIRED } }
  );

  // ── 4. ACTIVE free subs whose 10-year window has closed → EXPIRED ───────
  //
  // Free plans without a trial get a currentPeriodEnd 10 years out.
  // They have no payment webhook to expire them, so the cron must do it.
  // We identify them by finalPriceKobo = 0 AND no Paystack subscription code
  // (paid plans always have a paystackSubscriptionCode).
  const freeExpired = await Subscription.updateMany(
    {
      status:                   SubscriptionStatus.ACTIVE,
      currentPeriodEnd:         { $lt: now },
      finalPriceKobo:           0,
      paystackSubscriptionCode: { $exists: false },
    },
    { $set: { status: SubscriptionStatus.EXPIRED } }
  );

  return {
    expired:   pastDue.modifiedCount + trialExpired.modifiedCount + freeExpired.modifiedCount,
    cancelled: pendingCancel.modifiedCount,
    breakdown: {
      pastDueExpired:  pastDue.modifiedCount,
      trialExpired:    trialExpired.modifiedCount,
      freeExpired:     freeExpired.modifiedCount,
      pendingCancel:   pendingCancel.modifiedCount,
    },
  };
}