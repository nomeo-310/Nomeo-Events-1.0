// app/api/admin/newsletter/subscribers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Newsletter, NewsletterStatus } from '@/models/newsletter';
import { requireAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { EmailLog } from '@/models/email-log';
import { User } from '@/models/user';

// GET /api/admin/newsletter/subscribers - List all subscribers
export async function GET(req: NextRequest) {
  const loggedInUser = await requireAdmin()

  if (!loggedInUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {

    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'subscribedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort: any = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [subscribers, total] = await Promise.all([
      Newsletter.find(query)
        .populate({ path: 'userId', model: User,  select: 'name email avatar' })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Newsletter.countDocuments(query)
    ]);

    const stats = await Newsletter.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      subscribers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        active: stats.find(s => s._id === NewsletterStatus.ACTIVE)?.count || 0,
        unsubscribed: stats.find(s => s._id === NewsletterStatus.UNSUBSCRIBED)?.count || 0,
        total
      }
    });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/newsletter/subscribers - Add single subscriber
export async function POST(req: NextRequest) {
  const loggedInUser = await requireAdmin()

  if (!loggedInUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    
    const body = await req.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let subscriber = await Newsletter.findOne({ email: email.toLowerCase() });
    
    if (subscriber) {
      if (subscriber.status === NewsletterStatus.UNSUBSCRIBED) {
        subscriber.status = NewsletterStatus.ACTIVE;
        subscriber.unsubscribedAt = undefined;
        await subscriber.save();
      }
      return NextResponse.json({ subscriber, message: 'Subscriber already exists' });
    }

    subscriber = await Newsletter.create({
      email: email.toLowerCase(),
      name,
      status: NewsletterStatus.ACTIVE,
      subscribedAt: new Date()
    });

    return NextResponse.json({ subscriber, success: true });
  } catch (error) {
    console.error('Error creating subscriber:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/newsletter/subscribers - Bulk delete subscribers
export async function DELETE(req: NextRequest) {
  const loggedInUser = await requireAdmin()

  if (!loggedInUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {

    await connectDB();
    
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const result = await Newsletter.deleteMany({ _id: { $in: ids } });
    await EmailLog.deleteMany({ newsletterId: { $in: ids } });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting subscribers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/newsletter/subscribers - Bulk update subscribers
export async function PUT(req: NextRequest) {
    const loggedInUser = await requireAdmin()

  if (!loggedInUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {

    await connectDB();

    const { ids, action } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !action) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    let updateData = {};
    if (action === 'unsubscribe') {
      updateData = {
        status: NewsletterStatus.UNSUBSCRIBED,
        unsubscribedAt: new Date()
      };
    } else if (action === 'subscribe') {
      updateData = {
        status: NewsletterStatus.ACTIVE,
        unsubscribedAt: null
      };
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await Newsletter.updateMany(
      { _id: { $in: ids } },
      updateData
    );

    return NextResponse.json({
      success: true,
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating subscribers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}