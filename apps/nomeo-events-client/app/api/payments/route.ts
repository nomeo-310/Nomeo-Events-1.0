// app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PaymentGatewayStatus, PaymentPurpose } from '@/models/payment';
import { connectDB } from '@/lib/mongoose';
import { PaymentService } from '@/services/payment-services';
import { getCurrentUser } from '@/lib/session';

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
 *   organizerId      — filter by organizer (automatically set from session)
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get the current user session
    const loggedInUser = await getCurrentUser();

    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Please log in' },
        { status: 401 }
      );
    }

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

    // Get optional eventId from query params (for additional filtering)
    const eventId = searchParams.get('eventId');
    const registrationId = searchParams.get('registrationId');
    const subscriptionId = searchParams.get('subscriptionId');

    // Build filters object
    const filters: any = {
      organizerId: loggedInUser.id,
      page,
      limit
    };

    if (purpose) filters.purpose = purpose;
    if (gatewayStatus) filters.gatewayStatus = gatewayStatus;
    if (eventId) filters.eventId = eventId;
    if (registrationId) filters.registrationId = registrationId;
    if (subscriptionId) filters.subscriptionId = subscriptionId;

    const result = await PaymentService.list(filters);

    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/payments]', error);
    return NextResponse.json(
      { success: false, message: (error as Error).message ?? 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}