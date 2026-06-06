// app/api/admin/newsletter/campaigns/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Newsletter, NewsletterStatus } from '@/models/newsletter';
import { sendBulkEmails } from '@/services/newsletter-email-services';
import { connectDB } from '@/lib/mongoose';
import { requireAdmin } from '@/lib/admin/authorization';
import { User } from '@/models/user';
import { ObjectId } from 'mongodb';
import { Campaign, CampaignStatus, CampaignType } from '@/models/campaign';
import { EmailLog } from '@/models/email-log';

// GET /api/admin/newsletter/campaigns - List all campaigns
export async function GET(req: NextRequest) {
  try {
    const loggedInUser = await requireAdmin()

    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;

    const skip = (page - 1) * limit;
    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate({ path: 'createdBy', model: User, select: 'name email' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Campaign.countDocuments(query)
    ]);

    return NextResponse.json({
      campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/newsletter/campaigns - Create new campaign
export async function POST(req: NextRequest) {
  try {
    const loggedInUser = await requireAdmin()

    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();
    const { title, subject, content, type, scheduledFor, filters, recipientIds, externalRecipients } = body;

    // Determine recipients and prepare email logs
    let recipients: any[] = [];
    let totalRecipients = 0;
    let emailLogs: any[] = [];

    // Handle external recipients (CSV uploads / manually provided emails)
    if (externalRecipients && externalRecipients.length > 0) {
      recipients = externalRecipients.map((recipient: any) => ({
        email: recipient.email,
        name: recipient.name || '',
        newsletterId: null,
        recipientType: 'external',
        isExternal: true, // FIX 1: flag required by sendBulkEmails to skip subscriber lookup
      }));
      totalRecipients = recipients.length;

      // Route is solely responsible for creating email logs
      emailLogs = recipients.map(recipient => ({
        campaignId: null, // Will be set after campaign creation
        email: recipient.email,
        name: recipient.name,
        recipientType: 'external',
        status: 'pending'
      }));
    }
    // Handle specific subscriber IDs
    else if (recipientIds && recipientIds.length > 0) {
      const subscribers = await Newsletter.find({
        _id: { $in: recipientIds },
        status: NewsletterStatus.ACTIVE
      }).lean();

      recipients = subscribers.map(s => ({
        email: s.email,
        name: s.name,
        newsletterId: s._id,
        isExternal: false,
        recipientType: 'subscriber'
      }));
      totalRecipients = recipients.length;

      emailLogs = recipients.map(recipient => ({
        campaignId: null,
        newsletterId: recipient.newsletterId,
        email: recipient.email,
        name: recipient.name,
        recipientType: 'subscriber',
        status: 'pending'
      }));
    }
    // Handle all active subscribers with optional filters
    else {
      const query: any = { status: NewsletterStatus.ACTIVE };
      if (filters?.status) query.status = { $in: filters.status };
      if (filters?.subscribedAfter) {
        query.subscribedAt = { $gte: new Date(filters.subscribedAfter) };
      }
      if (filters?.hasUserId !== undefined) {
        if (filters.hasUserId) query.userId = { $ne: null };
        else query.userId = null;
      }

      const subscribers = await Newsletter.find(query).lean();
      recipients = subscribers.map(s => ({
        email: s.email,
        name: s.name,
        newsletterId: s._id,
        isExternal: false,
        recipientType: 'subscriber'
      }));
      totalRecipients = recipients.length;

      emailLogs = recipients.map(recipient => ({
        campaignId: null,
        newsletterId: recipient.newsletterId,
        email: recipient.email,
        name: recipient.name,
        recipientType: 'subscriber',
        status: 'pending'
      }));
    }

    if (totalRecipients === 0) {
      return NextResponse.json({ error: 'No recipients found' }, { status: 400 });
    }

    // Create campaign
    const campaignData: any = {
      title,
      subject,
      content,
      type: type || CampaignType.NEWSLETTER,
      status: scheduledFor ? CampaignStatus.DRAFT : CampaignStatus.SENDING,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      recipients: {
        total: totalRecipients,
        successful: 0,
        failed: 0,
        opened: 0,
        clicked: 0
      },
      filters,
      createdBy: new ObjectId(loggedInUser.id),
      hasExternalRecipients: !!(externalRecipients && externalRecipients.length > 0)
    };

    if (externalRecipients && externalRecipients.length > 0) {
      campaignData.externalRecipients = externalRecipients;
    }

    if (recipientIds && recipientIds.length > 0) {
      campaignData.recipientIds = recipientIds;
    }

    const campaign = await Campaign.create(campaignData);

    // Attach campaignId to all logs now that the campaign exists
    emailLogs = emailLogs.map(log => ({
      ...log,
      campaignId: campaign._id
    }));

    // Route creates all email logs — the email service only reads them
    if (emailLogs.length > 0) {
      await EmailLog.insertMany(emailLogs);
    }

    // If not scheduled, send immediately (fire-and-forget)
    if (!scheduledFor) {
      sendBulkEmails(
        campaign._id.toString(),
        recipients,
        subject,
        content,
        // FIX 3: pass campaignType so the correct email template is used
        (type as 'newsletter' | 'announcement' | 'promotion') || 'newsletter'
      ).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      campaign,
      recipientCount: totalRecipients,
      externalCount: externalRecipients?.length || 0,
      subscriberCount: recipients.filter(r => r.recipientType === 'subscriber').length
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}