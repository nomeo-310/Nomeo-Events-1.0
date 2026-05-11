// app/api/payments/recent/route.ts
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

    const { searchParams } = req.nextUrl;
    const limit = parseInt(searchParams.get('limit') ?? '10', 10);

    const payments = await PaymentService.getRecentPayments(loggedInUser.id, limit);
    
    return NextResponse.json({ success: true, payments }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/payments/recent]', error);
    return NextResponse.json(
      { success: false, message: (error as Error).message ?? 'Failed to fetch recent payments' },
      { status: 500 }
    );
  }
}