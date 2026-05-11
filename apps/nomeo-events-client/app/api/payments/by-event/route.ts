// app/api/payments/by-event/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { PaymentService } from '@/services/payment-services';
import { getCurrentUser } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const paymentsByEvent = await PaymentService.getPaymentsByEvent(loggedInUser.id);
    
    return NextResponse.json({ success: true, paymentsByEvent }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/payments/by-event]', error);
    return NextResponse.json(
      { success: false, message: (error as Error).message ?? 'Failed to fetch payments by event' },
      { status: 500 }
    );
  }
}