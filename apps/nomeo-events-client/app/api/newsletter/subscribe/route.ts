// app/api/newsletter/subscribe/route.ts (updated)
import { NextRequest, NextResponse } from 'next/server';
import { Newsletter, NewsletterStatus } from '@/models/newsletter';
import { connectDB } from '@/lib/mongoose';
import { getCurrentUser } from '@/lib/session';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const { email, name } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    const loggedInUser = await getCurrentUser();


    
    // Check if user already exists in newsletter
    let subscriber = await Newsletter.findOne({ email: email.toLowerCase() });
    
    if (subscriber) {
      // If exists and is unsubscribed, reactivate
      if (subscriber.status === NewsletterStatus.UNSUBSCRIBED) {
        subscriber.status = NewsletterStatus.ACTIVE;
        subscriber.unsubscribedAt = undefined;
        if (name) subscriber.name = name;
        await subscriber.save();
        
        return NextResponse.json({
          success: true,
          message: 'Successfully re-subscribed to newsletter',
          data: { email: subscriber.email, status: subscriber.status }
        });
      }
      
      // If already active
      if (subscriber.status === NewsletterStatus.ACTIVE) {
        return NextResponse.json(
          { success: false, message: 'Email already subscribed' },
          { status: 409 }
        );
      }
    }
    
    // Create new subscriber
    const newSubscriber = await Newsletter.create({
      email: email.toLowerCase(),
      name: name || undefined,
      userId: loggedInUser?.id|| undefined,
      status: NewsletterStatus.ACTIVE,
      subscribedAt: new Date(),
    });
    
    // TODO: Send welcome email here
    
    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: { email: newSubscriber.email, status: newSubscriber.status }
    });
    
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}