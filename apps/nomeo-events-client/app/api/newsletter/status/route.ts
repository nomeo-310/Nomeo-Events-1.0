import { NextRequest, NextResponse } from 'next/server';
import { Newsletter } from '@/models/newsletter';
import { connectDB } from '@/lib/mongoose'; 

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }
    
    const subscriber = await Newsletter.findOne({ email: email.toLowerCase() });
    
    return NextResponse.json({
      success: true,
      data: {
        isSubscribed: subscriber?.status === 'active',
        status: subscriber?.status || null,
        subscribedAt: subscriber?.subscribedAt || null
      }
    });
    
  } catch (error) {
    console.error('Newsletter status error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}