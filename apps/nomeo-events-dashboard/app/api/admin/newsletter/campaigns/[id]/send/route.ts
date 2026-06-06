// app/api/admin/newsletter/campaigns/[id]/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Newsletter } from '@/models/newsletter';
import { connectDB } from '@/lib/mongoose';
import { requireAdmin } from '@/lib/admin/authorization';
import { Campaign, CampaignStatus } from '@/models/campaign';
import { EmailLog } from '@/models/email-log';
import { sendBulkEmails } from '@/services/newsletter-email-services';

// POST /api/admin/newsletter/campaigns/[id]/send - Send campaign now
export async function POST( req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json({ error: 'Campaign already sending' }, { status: 400 });
    }

    // Get recipients from email logs
    const emailLogs = await EmailLog.find({ campaignId: campaign._id });
    
    const recipients = await Promise.all(
      emailLogs.map(async (log) => {
        const subscriber = await Newsletter.findById(log.newsletterId);
        return {
          email: log.email,
          name: subscriber?.name,
          newsletterId: log.newsletterId
        };
      })
    );

    // Start sending
    sendBulkEmails(campaign._id.toString(), recipients, campaign.subject, campaign.content);

    return NextResponse.json({ success: true, message: 'Campaign sending started' });
  } catch (error) {
    console.error('Error sending campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}