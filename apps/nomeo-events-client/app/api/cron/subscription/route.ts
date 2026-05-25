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
//
// Query parameters:
//   ?dryRun=true  - Preview changes without actually updating
//   ?debug=true   - Include detailed debug information

import { NextRequest, NextResponse } from 'next/server';
import { Subscription, SubscriptionStatus } from '@/models/subscription';
import { connectDB } from '@/lib/mongoose';
import { Notification } from '@/models/notification';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const systemId = new ObjectId('000000000000000000000001');

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronHeader = req.headers.get('x-cron-secret');
  const secret = process.env.CRON_SECRET;

  const isVercel = authHeader === `Bearer ${secret}`;
  const isExternal = cronHeader === secret;

  if (!isVercel && !isExternal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse query parameters
  const dryRun = req.nextUrl.searchParams.get('dryRun') === 'true';
  const debug = req.nextUrl.searchParams.get('debug') === 'true';

  try {
    await connectDB();
    
    // Use UTC midnight for consistency
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    
    if (dryRun) {
      const counts = await getExpiryCounts(now);
      console.log('[cron/subscriptions] DRY RUN:', counts);
      return NextResponse.json({ 
        dryRun: true, 
        ...counts, 
        ranAt: now.toISOString(),
        message: 'Dry run completed - no changes were made'
      });
    }

    const results = await expireSubscriptions(now, debug);
    console.log('[cron/subscriptions]', results);
    
    return NextResponse.json({ ok: true, ...results, ranAt: now.toISOString() });
  } catch (err) {
    console.error('[cron/subscriptions] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to get counts without updating (for dry run)
async function getExpiryCounts(now: Date) {
  const pastDueCount = await Subscription.countDocuments({
    status: SubscriptionStatus.PAST_DUE,
    currentPeriodEnd: { $lt: now },
  });

  const pendingCancelCount = await Subscription.countDocuments({
    cancelAtPeriodEnd: true,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
    currentPeriodEnd: { $lt: now },
  });

  const trialExpiredCount = await Subscription.countDocuments({
    status: SubscriptionStatus.TRIALING,
    trialEnd: { $exists: true, $lt: now },
    $or: [
      { cancelAtPeriodEnd: false },
      { cancelAtPeriodEnd: { $exists: false } }
    ],
  });

  const freeExpiredCount = await Subscription.countDocuments({
    status: SubscriptionStatus.ACTIVE,
    currentPeriodEnd: { $lt: now },
    finalPriceKobo: 0,
    paystackSubscriptionCode: { $exists: false },
  });

  return {
    breakdown: {
      pastDueExpired: pastDueCount,
      trialExpired: trialExpiredCount,
      freeExpired: freeExpiredCount,
      pendingCancel: pendingCancelCount,
    },
    totalExpiring: pastDueCount + trialExpiredCount + freeExpiredCount,
    totalCancelling: pendingCancelCount,
  };
}

// Core expiry logic
export async function expireSubscriptions(now = new Date(), debug = false) {
  const expiredIds: string[] = [];
  const cancelledIds: string[] = [];

  // ── 1. PAST_DUE → EXPIRED (grace period over) ──────────────────────────
  const pastDueQuery = {
    status: SubscriptionStatus.PAST_DUE,
    currentPeriodEnd: { $lt: now },
  };

  if (debug) {
    const count = await Subscription.countDocuments(pastDueQuery);
    console.log(`[cron] Found ${count} PAST_DUE subscriptions to expire`);
  }

  const pastDue = await Subscription.updateMany(
    pastDueQuery,
    { 
      $set: { 
        status: SubscriptionStatus.EXPIRED,
        'metadata.expiredBy': 'cron',
        'metadata.expiredAt': now,
        'metadata.expiredReason': 'past_due_period_ended'
      } 
    }
  );

  // Get IDs of expired PAST_DUE subscriptions for notifications
  if (pastDue.modifiedCount > 0) {
    const expiredDocs = await Subscription.find(pastDueQuery).select('_id userId planName').lean();
    expiredIds.push(...expiredDocs.map(doc => doc._id.toString()));
  }

  // ── 2. cancelAtPeriodEnd → CANCELLED ───────────────────────────────────
  const pendingCancelQuery = {
    cancelAtPeriodEnd: true,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
    currentPeriodEnd: { $lt: now },
    // Only process if not already cancelled in the last 24 hours (idempotency)
    updatedAt: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
  };

  if (debug) {
    const count = await Subscription.countDocuments(pendingCancelQuery);
    console.log(`[cron] Found ${count} subscriptions pending cancellation to process`);
  }

  const pendingCancel = await Subscription.updateMany(
    pendingCancelQuery,
    { 
      $set: { 
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: now,
        'metadata.cancelledBy': 'cron',
        'metadata.cancelledAt': now
      } 
    }
  );

  // Get IDs of cancelled subscriptions for notifications
  if (pendingCancel.modifiedCount > 0) {
    const cancelledDocs = await Subscription.find(pendingCancelQuery).select('_id userId planName').lean();
    cancelledIds.push(...cancelledDocs.map(doc => doc._id.toString()));
  }

  // ── 3. TRIALING with expired trialEnd → EXPIRED ────────────────────────
  const trialExpiredQuery = {
    status: SubscriptionStatus.TRIALING,
    trialEnd: { $exists: true, $lt: now },
    $or: [
      { cancelAtPeriodEnd: false },
      { cancelAtPeriodEnd: { $exists: false } }
    ],
    // Only update if not already processed in the last 24 hours
    updatedAt: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
  };

  if (debug) {
    const count = await Subscription.countDocuments(trialExpiredQuery);
    console.log(`[cron] Found ${count} TRIALING subscriptions with expired trials`);
  }

  const trialExpired = await Subscription.updateMany(
    trialExpiredQuery,
    { 
      $set: { 
        status: SubscriptionStatus.EXPIRED,
        'metadata.expiredBy': 'cron',
        'metadata.expiredAt': now,
        'metadata.expiredReason': 'trial_ended'
      } 
    }
  );

  // Get IDs of expired trials for notifications
  if (trialExpired.modifiedCount > 0) {
    const trialDocs = await Subscription.find(trialExpiredQuery).select('_id userId planName trialEnd').lean();
    expiredIds.push(...trialDocs.map(doc => doc._id.toString()));
  }

  // ── 4. ACTIVE free subs whose 10-year window has closed → EXPIRED ───────
  const freeExpiredQuery = {
    status: SubscriptionStatus.ACTIVE,
    currentPeriodEnd: { $lt: now },
    finalPriceKobo: 0,
    paystackSubscriptionCode: { $exists: false },
    updatedAt: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
  };

  if (debug) {
    const count = await Subscription.countDocuments(freeExpiredQuery);
    console.log(`[cron] Found ${count} ACTIVE free subscriptions with expired periods`);
  }

  const freeExpired = await Subscription.updateMany(
    freeExpiredQuery,
    { 
      $set: { 
        status: SubscriptionStatus.EXPIRED,
        'metadata.expiredBy': 'cron',
        'metadata.expiredAt': now,
        'metadata.expiredReason': 'free_plan_period_ended'
      } 
    }
  );

  // Get IDs of expired free plans for notifications
  if (freeExpired.modifiedCount > 0) {
    const freeDocs = await Subscription.find(freeExpiredQuery).select('_id userId planName').lean();
    expiredIds.push(...freeDocs.map(doc => doc._id.toString()));
  }

  // ── 5. Send notifications for all affected users ───────────────────────
  let notificationsSent = 0;
  
  if (expiredIds.length > 0) {
    notificationsSent += await sendExpiryNotifications(expiredIds, now);
  }
  
  if (cancelledIds.length > 0) {
    notificationsSent += await sendCancellationNotifications(cancelledIds, now);
  }

  return {
    expired: pastDue.modifiedCount + trialExpired.modifiedCount + freeExpired.modifiedCount,
    cancelled: pendingCancel.modifiedCount,
    notificationsSent,
    breakdown: {
      pastDueExpired: pastDue.modifiedCount,
      trialExpired: trialExpired.modifiedCount,
      freeExpired: freeExpired.modifiedCount,
      pendingCancel: pendingCancel.modifiedCount,
    },
    ...(debug && {
      debug: {
        expiredIds: expiredIds.slice(0, 10), // Only return first 10 to avoid huge response
        cancelledIds: cancelledIds.slice(0, 10),
      }
    })
  };
}

// Helper function to send expiry notifications
async function sendExpiryNotifications(subscriptionIds: string[], now: Date) {
  let sent = 0;
  
  // Fetch subscriptions with user details
  const subscriptions = await Subscription.find({
    _id: { $in: subscriptionIds.map(id => new ObjectId(id)) }
  }).populate('userId', 'name email');
  
  for (const sub of subscriptions) {
    try {
      const userName = typeof sub.userId === 'object' ? (sub.userId as any).name : 'User';
      const userEmail = typeof sub.userId === 'object' ? (sub.userId as any).email : '';
      
      // Determine expiry reason from metadata
      const expiryReason = sub.metadata?.get('expiredReason') || 'subscription_expired';
      let title = '';
      let message = '';
      
      switch (expiryReason) {
        case 'trial_ended':
          title = 'Your Free Trial Has Ended';
          message = `Hi ${userName}, your ${sub.planName} free trial has ended. To continue using our services, please upgrade to a paid plan. Visit your dashboard to choose a plan that works for you.`;
          break;
        case 'free_plan_period_ended':
          title = 'Your Free Plan Period Has Ended';
          message = `Hi ${userName}, your ${sub.planName} free plan period has ended. You can still reactivate your account by logging in and selecting a plan.`;
          break;
        default:
          title = 'Your Subscription Has Expired';
          message = `Hi ${userName}, your ${sub.planName} subscription has expired. To continue using our services, please renew your subscription from your dashboard.`;
      }
      
      await Notification.create({
        senderId: systemId,
        receiverId: sub.userId,
        title,
        message,
        message_type: 'info',
        createdAt: now,
        updatedAt: now,
      });
      
      sent++;
    } catch (err) {
      console.error(`[cron] Failed to send expiry notification for subscription ${sub._id}:`, err);
    }
  }
  
  return sent;
}

// Helper function to send cancellation notifications
async function sendCancellationNotifications(subscriptionIds: string[], now: Date) {
  let sent = 0;
  
  // Fetch subscriptions with user details
  const subscriptions = await Subscription.find({
    _id: { $in: subscriptionIds.map(id => new ObjectId(id)) }
  }).populate('userId', 'name email');
  
  for (const sub of subscriptions) {
    try {
      const userName = typeof sub.userId === 'object' ? (sub.userId as any).name : 'User';
      
      await Notification.create({
        senderId: systemId,
        receiverId: sub.userId,
        title: 'Subscription Cancelled',
        message: `Hi ${userName}, your ${sub.planName} subscription has been cancelled as requested. Your access has ended. You can start a new subscription anytime from your dashboard.`,
        message_type: 'update',
        createdAt: now,
        updatedAt: now,
      });
      
      sent++;
    } catch (err) {
      console.error(`[cron] Failed to send cancellation notification for subscription ${sub._id}:`, err);
    }
  }
  
  return sent;
}