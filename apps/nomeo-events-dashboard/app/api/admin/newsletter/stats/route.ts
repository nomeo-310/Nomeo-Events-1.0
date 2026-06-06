// app/api/admin/newsletter/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Newsletter, NewsletterStatus } from '@/models/newsletter';
import { requireAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Campaign } from '@/models/campaign';
import { EmailLog } from '@/models/email-log';
// GET /api/admin/newsletter/stats - Get dashboard statistics
export async function GET(req: NextRequest) {
  try {
    const loggedInUser = await requireAdmin()

    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Subscriber statistics
    const subscriberStats = await Newsletter.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Campaign statistics
    const campaignStats = await Campaign.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Growth over time
    const growthOverTime = await Newsletter.aggregate([
      {
        $match: {
          subscribedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$subscribedAt' },
            month: { $month: '$subscribedAt' },
            day: { $dayOfMonth: '$subscribedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Email performance
    const emailPerformance = await EmailLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalSubscribers = subscriberStats.reduce((acc, curr) => acc + curr.count, 0);
    const activeSubscribers = subscriberStats.find(s => s._id === NewsletterStatus.ACTIVE)?.count || 0;
    const unsubscribedCount = subscriberStats.find(s => s._id === NewsletterStatus.UNSUBSCRIBED)?.count || 0;

    const totalCampaigns = campaignStats.reduce((acc, curr) => acc + curr.count, 0);
    const sentCampaigns = campaignStats.find(s => s._id === 'completed')?.count || 0;

    const openRate = emailPerformance.find(s => s._id === 'opened')?.count || 0;
    const clickRate = emailPerformance.find(s => s._id === 'clicked')?.count || 0;
    const totalSent = emailPerformance.find(s => s._id === 'sent')?.count || 0;

    return NextResponse.json({
      subscribers: {
        total: totalSubscribers,
        active: activeSubscribers,
        unsubscribed: unsubscribedCount,
        growthOverTime
      },
      campaigns: {
        total: totalCampaigns,
        sent: sentCampaigns,
        draft: campaignStats.find(s => s._id === 'draft')?.count || 0,
        failed: campaignStats.find(s => s._id === 'failed')?.count || 0
      },
      engagement: {
        openRate: totalSent > 0 ? ((openRate / totalSent) * 100).toFixed(2) : '0',
        clickRate: totalSent > 0 ? ((clickRate / totalSent) * 100).toFixed(2) : '0',
        totalOpens: openRate,
        totalClicks: clickRate,
        totalSent
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}