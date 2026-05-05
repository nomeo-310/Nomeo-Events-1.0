// app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PaymentGatewayStatus, PaymentPurpose } from '@/models/payment';
import { connectDB } from '@/lib/mongoose';
import { PaymentService } from '@/services/payment-services';

/**
 * GET /api/payments
 *
 * Query params:
 *   purpose          — event_registration | subscription
 *   gatewayStatus    — pending | success | failed | abandoned | reversed
 *   eventId          — filter by event
 *   registrationId   — filter by registration
 *   subscriptionId   — filter by subscription
 *   page             — default 1
 *   limit            — default 20, max 100
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = req.nextUrl;

    const purpose = searchParams.get('purpose') as PaymentPurpose | null;
    const gatewayStatus = searchParams.get('gatewayStatus') as PaymentGatewayStatus | null;

    // Validate enums if provided
    if (purpose && !Object.values(PaymentPurpose).includes(purpose)) {
      return NextResponse.json(
        { success: false, message: `Invalid purpose. Must be one of: ${Object.values(PaymentPurpose).join(', ')}` },
        { status: 400 }
      );
    }

    if (gatewayStatus && !Object.values(PaymentGatewayStatus).includes(gatewayStatus)) {
      return NextResponse.json(
        { success: false, message: `Invalid gatewayStatus. Must be one of: ${Object.values(PaymentGatewayStatus).join(', ')}` },
        { status: 400 }
      );
    }

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

    const result = await PaymentService.list({
      ...(purpose && { purpose }),
      ...(gatewayStatus && { gatewayStatus }),
      ...(searchParams.get('eventId') && { eventId: searchParams.get('eventId')! }),
      ...(searchParams.get('registrationId') && { registrationId: searchParams.get('registrationId')! }),
      ...(searchParams.get('subscriptionId') && { subscriptionId: searchParams.get('subscriptionId')! }),
      page,
      limit
    });

    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/payments]', error);
    return NextResponse.json(
      { success: false, message: (error as Error).message ?? 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}