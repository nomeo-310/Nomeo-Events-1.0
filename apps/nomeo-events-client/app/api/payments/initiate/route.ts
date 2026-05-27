// app/api/payments/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PaymentPurpose } from '@/models/payment';
import { connectDB } from '@/lib/mongoose';
import { PaymentService } from '@/services/payment-services';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { purpose, email, amount } = body;

    if (!purpose || !email || !amount) {
      return NextResponse.json(
        { success: false, message: 'purpose, email, and amount are required' },
        { status: 400 }
      );
    }

    if (!Object.values(PaymentPurpose).includes(purpose)) {
      return NextResponse.json(
        { success: false, message: `Invalid purpose. Must be one of: ${Object.values(PaymentPurpose).join(', ')}` },
        { status: 400 }
      );
    }

    if (purpose === PaymentPurpose.EVENT_REGISTRATION) {
      if (!body.eventId) {
        return NextResponse.json(
          { success: false, message: 'eventId is required for event_registration' },
          { status: 400 }
        );
      }
    }

    // KEY CHANGE: subscriptionId is no longer required or expected.
    // The subscription record doesn't exist yet at initiation time —
    // it is created by POST /api/subscriptions after payment is verified,
    // mirroring how event_registration works (no registrationId at initiation).
    if (purpose === PaymentPurpose.SUBSCRIPTION) {
      if (!body.planId) {
        return NextResponse.json(
          { success: false, message: 'planId is required for subscription' },
          { status: 400 }
        );
      }
    }

    const result = await PaymentService.initiate(body);

    return NextResponse.json(
      {
        success: true,
        data: {
          paymentId:        result.payment._id,
          reference:        result.reference,
          accessCode:       result.accessCode,
          authorizationUrl: result.authorizationUrl,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/payments/initiate]', error);
    return NextResponse.json(
      { success: false, message: (error as Error).message ?? 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}