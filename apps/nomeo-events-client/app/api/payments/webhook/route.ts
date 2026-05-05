// app/api/payments/webhook/route.ts
import { connectDB } from '@/lib/mongoose';
import { PaymentService } from '@/services/payment-services';
import { NextRequest, NextResponse } from 'next/server';

/**
 * IMPORTANT: This route must receive the raw body (unparsed) to validate
 * the Paystack HMAC signature. Next.js App Router gives us the raw Request,
 * so we read it as text before any JSON parsing.
 *
 * In Paystack dashboard, set your webhook URL to:
 *   https://yourdomain.com/api/payments/webhook
 */
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, message: 'Missing Paystack signature header' },
        { status: 401 }
      );
    }

    // Read raw body as text — required for HMAC validation
    const rawBody = await req.text();

    await connectDB();

    const result = await PaymentService.handleWebhook(rawBody, signature);

    if (!result.handled) {
      // Acknowledge unhandled events so Paystack doesn't retry
      console.info(`[Webhook] Unhandled event: ${result.event}`);
    }

    // Always return 200 quickly — Paystack expects a fast acknowledgement
    return NextResponse.json({ success: true, received: true }, { status: 200 });
  } catch (error) {
    const message = (error as Error).message ?? 'Webhook processing failed';
    console.error('[POST /api/payments/webhook]', error);

    // Return 401 for signature failures, 500 for everything else
    const status = message.includes('signature') ? 401 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
};