// app/api/admin/newsletter/campaigns/[id]/route.ts
import { requireAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { Campaign, CampaignStatus } from '@/models/campaign';
import { EmailLog } from '@/models/email-log';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/newsletter/campaigns/[id] - Get campaign details
export async function GET( req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const loggedInUser = await requireAdmin();

    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const campaign = await Campaign.findById(id)
      .populate('createdBy', 'name email')
      .lean();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get email logs statistics
    const emailStats = await EmailLog.aggregate([
      { $match: { campaignId: campaign._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent logs
    const recentLogs = await EmailLog.find({ campaignId: campaign._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      campaign,
      stats: {
        pending: emailStats.find(s => s._id === 'pending')?.count || 0,
        sent: emailStats.find(s => s._id === 'sent')?.count || 0,
        failed: emailStats.find(s => s._id === 'failed')?.count || 0,
        opened: emailStats.find(s => s._id === 'opened')?.count || 0,
        clicked: emailStats.find(s => s._id === 'clicked')?.count || 0
      },
      recentLogs
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/newsletter/campaigns/[id] - Update campaign
export async function PUT( req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const loggedInUser = await requireAdmin();

    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { title, subject, content, scheduledFor } = body;

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === CampaignStatus.SENDING) {
      return NextResponse.json({ error: 'Cannot update campaign while sending' }, { status: 400 });
    }

    if (title) campaign.title = title;
    if (subject) campaign.subject = subject;
    if (content) campaign.content = content;
    if (scheduledFor) campaign.scheduledFor = new Date(scheduledFor);

    await campaign.save();

    return NextResponse.json({ campaign, success: true });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/newsletter/campaigns/[id] - Delete campaign
export async function DELETE( req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const loggedInUser = await requireAdmin();

    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === CampaignStatus.SENDING) {
      return NextResponse.json({ error: 'Cannot delete campaign while sending' }, { status: 400 });
    }

    await EmailLog.deleteMany({ campaignId: campaign._id });
    await campaign.deleteOne();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}