// app/api/admin/newsletter/subscribers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Newsletter, NewsletterStatus } from '@/models/newsletter';
import { requireAdmin } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/models/user';

// GET /api/admin/newsletter/subscribers/[id] - Get single subscriber
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const loggedInUser = await requireAdmin()

    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const subscriber = await Newsletter.findById(id)
      .populate({ path: 'userId', model: User, select: 'name email avatar' })
      .lean();

    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    return NextResponse.json({ subscriber });
  } catch (error) {
    console.error('Error fetching subscriber:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/newsletter/subscribers/[id] - Update single subscriber
export async function PUT( req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const loggedInUser = await requireAdmin()

    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { name, status } = body;

    const subscriber = await Newsletter.findById(id);
    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    if (name) subscriber.name = name;
    if (status) {
      subscriber.status = status;
      if (status === NewsletterStatus.UNSUBSCRIBED) {
        subscriber.unsubscribedAt = new Date();
      } else {
        subscriber.unsubscribedAt = undefined;
      }
    }

    await subscriber.save();

    return NextResponse.json({ subscriber, success: true });
  } catch (error) {
    console.error('Error updating subscriber:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/newsletter/subscribers/[id] - Delete single subscriber
export async function DELETE( req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const loggedInUser = await requireAdmin()

    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } 

    await connectDB();

    const subscriber = await Newsletter.findByIdAndDelete(id);

    if (!subscriber) {
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}