// app/api/payments/[id]/route.ts
import { connectDB } from '@/lib/mongoose';
import { PaymentService } from '@/services/payment-services';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/payments/:id
 * Returns a single payment document by MongoDB _id
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  
  const { id } = await params;
  try {
    await connectDB();

    const payment = await PaymentService.getById(id);

    return NextResponse.json({ success: true, data: payment }, { status: 200 });
  } catch (error) {
    const message = (error as Error).message ?? 'Payment not found';
    const status = message.includes('not found') ? 404 : 500;
    console.error('[GET /api/payments/:id]', error);
    return NextResponse.json({ success: false, message }, { status });
  }
}