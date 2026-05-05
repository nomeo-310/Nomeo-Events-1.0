// app/api/payments/verify/[reference]/route.ts
import { connectDB } from '@/lib/mongoose';
import { PaymentService } from '@/services/payment-services';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/payments/verify/:reference
 *
 * Fallback verification endpoint — use this when:
 * - The Paystack modal closes but you haven't received the webhook yet
 * - You want to poll for payment status on the frontend
 *
 * Prefer the webhook for production flows. This is the safety net.
 */
export async function GET( _req: NextRequest, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const { reference } = await params;

    if (!reference) {
      return NextResponse.json(
        { success: false, message: 'Payment reference is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const payment = await PaymentService.verify(reference);

    return NextResponse.json(
      {
        success: true,
        data: {
          paymentId: payment._id,
          reference: payment.reference,
          gatewayStatus: payment.gatewayStatus,
          amount: payment.amount,
          amountPaid: payment.amountPaid,
          currency: payment.currency,
          paidAt: payment.paidAt,
          purpose: payment.purpose,
          channel: payment.channel,
          gatewayResponse: payment.gatewayResponse
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/payments/verify]', error);
    return NextResponse.json(
      { success: false, message: (error as Error).message ?? 'Verification failed' },
      { status: 500 }
    );
  }
}