// app/api/admin/subscriptions/expire-manual/route.ts
//
// POST /api/admin/subscriptions/expire-manual
//
// Manual backup endpoint to expire subscriptions when cron job fails.
// Returns preview first, then requires confirmation to execute.
//
// Headers:
//   - Authorization: Bearer {ADMIN_API_KEY}
//
// Body:
//   {
//     "dryRun": true,           // Preview only, no changes
//     "type": "all",            // all | trial | past_due | free | cancelled
//     "subscriptionIds": [],    // Optional: specific subscriptions
//     "dateRange": {            // Optional: custom date range
//       "start": "2024-01-01",
//       "end": "2024-12-31"
//     }
//   }

import { NextRequest, NextResponse } from 'next/server';
import { Subscription, SubscriptionStatus } from '@/models/subscription';
import { connectDB } from '@/lib/mongoose';
import { Notification } from '@/models/notification';
import { ObjectId } from 'mongodb';
import { requireSuperAdmin } from '@/lib/admin/authorization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const systemId = new ObjectId('000000000000000000000001');

interface DateRange {
  start?: string | null;
  end?: string | null;
}

interface ExpiryRequestBody {
  dryRun?: boolean;
  type?: string;
  subscriptionIds?: string[];
  dateRange?: DateRange | null;
  sendNotifications?: boolean;
  includeStats?: boolean;
}

interface PreviewUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  type: string;
  endDate: Date | null | undefined;
}

interface PreviewSummary {
  total: number;
  byType: { trial: number; pastDue: number; free: number; pendingCancel: number };
  byPlan: Record<string, number>;
  byUser: PreviewUser[];
}

interface Preview {
  summary: PreviewSummary;
}

interface ExecResultDetail { id: string; status: string; success: boolean; error?: string }

interface ExecResults {
  totalProcessed: number;
  expired: number;
  cancelled: number;
  notificationsSent: number;
  failed: number;
  details: ExecResultDetail[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const loggedInUser = await requireSuperAdmin();

  if (!loggedInUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const body = (await req.json()) as ExpiryRequestBody;
    const { dryRun = true, type = 'all', subscriptionIds = [], dateRange = null, sendNotifications = true, includeStats = true } = body;

    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);

    // Build query based on filters
    let query: Record<string, any> = {};
    
    if (subscriptionIds.length > 0) {
      // Specific subscriptions
      query._id = { $in: subscriptionIds.map(id => new ObjectId(id)) };
    } else {
      // Build query based on type
      switch (type) {
        case 'trial':
          query = {
            status: SubscriptionStatus.TRIALING,
            trialEnd: { $exists: true, $lt: now },
            $or: [
              { cancelAtPeriodEnd: false },
              { cancelAtPeriodEnd: { $exists: false } }
            ]
          };
          break;
          
        case 'past_due':
          query = {
            status: SubscriptionStatus.PAST_DUE,
            currentPeriodEnd: { $lt: now }
          };
          break;
          
        case 'free':
          query = {
            status: SubscriptionStatus.ACTIVE,
            currentPeriodEnd: { $lt: now },
            finalPriceKobo: 0,
            paystackSubscriptionCode: { $exists: false }
          };
          break;
          
        case 'cancelled_pending':
          query = {
            cancelAtPeriodEnd: true,
            status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
            currentPeriodEnd: { $lt: now }
          };
          break;
          
        case 'all':
        default:
          query = {
            $or: [
              {
                status: SubscriptionStatus.TRIALING,
                trialEnd: { $exists: true, $lt: now }
              },
              {
                status: SubscriptionStatus.PAST_DUE,
                currentPeriodEnd: { $lt: now }
              },
              {
                status: SubscriptionStatus.ACTIVE,
                currentPeriodEnd: { $lt: now },
                finalPriceKobo: 0,
                paystackSubscriptionCode: { $exists: false }
              },
              {
                cancelAtPeriodEnd: true,
                status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
                currentPeriodEnd: { $lt: now }
              }
            ]
          };
          break;
      }
      
      // Apply date range filter if provided
      if (dateRange) {
        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          startDate.setUTCHours(0, 0, 0, 0);
          query.trialEnd = { ...query.trialEnd, $gte: startDate };
        }
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setUTCHours(23, 59, 59, 999);
          query.trialEnd = { ...query.trialEnd, $lte: endDate };
        }
      }
    }

    // Get affected subscriptions with proper population
    const affectedSubscriptions = await Subscription.find(query)
      .populate('userId', 'name email avatar')
      .sort({ trialEnd: 1, currentPeriodEnd: 1 });
    
    if (affectedSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscriptions found matching criteria',
        affectedCount: 0,
        total: 0,
        byType: { trial: 0, pastDue: 0, free: 0, pendingCancel: 0 },
        byPlan: {},
        sampleSubscriptions: [],
        dryRun
      });
    }

    // Group by type for better reporting
    const grouped = {
      trial_expired: affectedSubscriptions.filter(s => 
        s.status === SubscriptionStatus.TRIALING && s.trialEnd && s.trialEnd < now
      ),
      past_due_expired: affectedSubscriptions.filter(s => 
        s.status === SubscriptionStatus.PAST_DUE && s.currentPeriodEnd < now
      ),
      free_expired: affectedSubscriptions.filter(s => 
        s.status === SubscriptionStatus.ACTIVE && 
        s.finalPriceKobo === 0 && 
        !s.paystackSubscriptionCode
      ),
      pending_cancel: affectedSubscriptions.filter(s => 
        s.cancelAtPeriodEnd === true && 
        s.currentPeriodEnd < now
      )
    };

    // Prepare byPlan counts
    const byPlan: Record<string, number> = {};
    affectedSubscriptions.forEach(sub => {
      const planName = sub.planName;
      byPlan[planName] = (byPlan[planName] || 0) + 1;
    });

    // Get user details for preview with proper typing
    const sampleSubscriptions = affectedSubscriptions.slice(0, 20).map(sub => {
      let subType = 'unknown';
      if (sub.status === SubscriptionStatus.TRIALING && sub.trialEnd && sub.trialEnd < now) {
        subType = 'trial';
      } else if (sub.status === SubscriptionStatus.PAST_DUE && sub.currentPeriodEnd < now) {
        subType = 'past_due';
      } else if (sub.status === SubscriptionStatus.ACTIVE && sub.finalPriceKobo === 0 && !sub.paystackSubscriptionCode) {
        subType = 'free';
      } else if (sub.cancelAtPeriodEnd === true && sub.currentPeriodEnd < now) {
        subType = 'pending_cancel';
      }
      
      const userObj = sub.userId as any;
      return {
        id: sub._id.toString(),
        name: userObj?.name || 'Unknown User',
        email: userObj?.email || 'unknown@email.com',
        plan: sub.planName,
        type: subType,
        endDate: sub.trialEnd || sub.currentPeriodEnd,
        status: sub.status
      };
    });

    const total = affectedSubscriptions.length;
    const byTypeData = {
      trial: grouped.trial_expired.length,
      pastDue: grouped.past_due_expired.length,
      free: grouped.free_expired.length,
      pendingCancel: grouped.pending_cancel.length
    };

    if (dryRun) {
      // Return the detailed preview structure that matches frontend expectations
      return NextResponse.json({
        success: true,
        dryRun: true,
        message: `Found ${total} subscriptions ready for expiry (dry run - no changes made)`,
        affectedCount: total,
        total: total,
        byType: byTypeData,
        byPlan: byPlan,
        sampleSubscriptions: sampleSubscriptions,
        preview: {
          summary: {
            total: total,
            byType: byTypeData,
            byPlan: byPlan,
            byUser: sampleSubscriptions
          }
        }
      });
    }

    // Execute the updates
    const results = await executeExpiry(affectedSubscriptions as any[], sendNotifications, now);
    
    // Get updated stats
    let stats: any = null;
    if (includeStats) {
      stats = await getUpdatedStats(now);
    }

    return NextResponse.json({
      success: true,
      dryRun: false,
      message: `Successfully processed ${results.totalProcessed} subscriptions`,
      affectedCount: results.totalProcessed,
      results,
      stats,
      timestamp: now.toISOString()
    });

  } catch (err) {
    console.error('[manual-expiry] error', err);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: err instanceof Error ? err.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function executeExpiry(subscriptions: any[], sendNotifications: boolean, now: Date) {
  const results = {
    totalProcessed: 0,
    expired: 0,
    cancelled: 0,
    notificationsSent: 0,
    failed: 0,
    details: [] as Array<{ id: string; status: string; success: boolean; error?: string }>
  };

  for (const sub of subscriptions) {
    try {
      let newStatus = null;
      let reason = '';

      // Determine new status
      if (sub.status === SubscriptionStatus.TRIALING && sub.trialEnd && sub.trialEnd < now) {
        newStatus = SubscriptionStatus.EXPIRED;
        reason = 'trial_ended_manual';
      } else if (sub.status === SubscriptionStatus.PAST_DUE && sub.currentPeriodEnd < now) {
        newStatus = SubscriptionStatus.EXPIRED;
        reason = 'past_due_manual';
      } else if (sub.status === SubscriptionStatus.ACTIVE && sub.finalPriceKobo === 0 && !sub.paystackSubscriptionCode) {
        newStatus = SubscriptionStatus.EXPIRED;
        reason = 'free_plan_expired_manual';
      } else if (sub.cancelAtPeriodEnd === true && sub.currentPeriodEnd < now) {
        newStatus = SubscriptionStatus.CANCELLED;
        reason = 'cancelled_manual';
      }

      if (newStatus) {
        // Update subscription
        await Subscription.findByIdAndUpdate(sub._id, {
          $set: {
            status: newStatus,
            'metadata.expiredBy': 'manual_admin',
            'metadata.expiredAt': now,
            'metadata.expiredReason': reason,
            ...(newStatus === SubscriptionStatus.CANCELLED && { cancelledAt: now })
          }
        });

        results.totalProcessed++;
        if (newStatus === SubscriptionStatus.EXPIRED) results.expired++;
        if (newStatus === SubscriptionStatus.CANCELLED) results.cancelled++;

        results.details.push({
          id: sub._id.toString(),
          status: newStatus,
          success: true
        });

        // Send notifications
        if (sendNotifications) {
          await sendManualNotification(sub, newStatus, reason, now);
          results.notificationsSent++;
        }
      }
    } catch (err) {
      results.failed++;
      results.details.push({
        id: sub._id.toString(),
        status: 'failed',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      console.error(`Failed to process subscription ${sub._id}:`, err);
    }
  }

  return results;
}

async function sendManualNotification(subscription: any, newStatus: string, reason: string, now: Date) {
  const userName = typeof subscription.userId === 'object' 
    ? (subscription.userId as any)?.name || 'User' 
    : 'User';
  
  let title = '';
  let message = '';
  
  if (newStatus === SubscriptionStatus.EXPIRED) {
    title = 'Subscription Expired (Manual Action)';
    message = `Hi ${userName}, your ${subscription.planName} subscription has been marked as expired by system admin. If you believe this is an error, please contact support.`;
  } else if (newStatus === SubscriptionStatus.CANCELLED) {
    title = 'Subscription Cancelled (Manual Action)';
    message = `Hi ${userName}, your ${subscription.planName} subscription has been cancelled by system admin. Please contact support if you have questions.`;
  }
  
  await Notification.create({
    senderId: systemId,
    receiverId: subscription.userId,
    title,
    message,
    message_type: 'info',
    metadata: new Map<string, boolean | string>([
      ['manualAction', 'true'],
      ['reason', reason]
    ]),
    createdAt: now,
    updatedAt: now,
  });
}

async function getUpdatedStats(now: Date) {
  const activeTrials = await Subscription.countDocuments({
    status: SubscriptionStatus.TRIALING,
    trialEnd: { $gt: now }
  });
  
  const expiredTrials = await Subscription.countDocuments({
    status: SubscriptionStatus.EXPIRED,
    'metadata.expiredReason': { $regex: /manual|expired/ }
  });
  
  const activeSubscriptions = await Subscription.countDocuments({
    status: SubscriptionStatus.ACTIVE
  });
  
  return {
    current: {
      activeTrials,
      expiredTrials,
      activeSubscriptions,
      totalSubscriptions: await Subscription.countDocuments()
    }
  };
}

// GET endpoint to preview without making changes
export async function GET(req: NextRequest) {
  const loggedInUser = await requireSuperAdmin();

  if (!loggedInUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get('type') || 'all';
  
  // Create a POST request with dryRun=true
  const mockReq = {
    json: async () => ({ dryRun: true, type, includeStats: true })
  } as NextRequest;
  
  return POST(mockReq);
}