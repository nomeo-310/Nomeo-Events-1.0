import { NextRequest, NextResponse } from 'next/server';
import { Newsletter, NewsletterStatus } from '@/models/newsletter';
import { connectDB } from '@/lib/mongoose';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const { email } = await req.json();
    
    // Find by token (from email link) or by email (from account)

    const subscriber = await Newsletter.findOne({ email: email.toLowerCase() });
    
    if (!subscriber) {
      return NextResponse.json(
        { success: false, message: 'Subscriber not found' },
        { status: 404 }
      );
    }
    
    if (subscriber.status === NewsletterStatus.UNSUBSCRIBED) {
      return NextResponse.json(
        { success: false, message: 'Already unsubscribed' },
        { status: 400 }
      );
    }
    
    // Unsubscribe
    subscriber.status = NewsletterStatus.UNSUBSCRIBED;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();
    
    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
      data: { email: subscriber.email, status: subscriber.status }
    });
    
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}