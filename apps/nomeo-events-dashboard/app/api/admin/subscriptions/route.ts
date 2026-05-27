// app/api/admin/subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Subscription } from '@/models/subscription';
import { requireAuth } from '@/lib/admin/authorization';
import { connectDB } from '@/lib/mongoose';
import { User } from '@/models/user';

// GET /api/admin/subscriptions - List all subscriptions with filtering, sorting, and pagination
export async function GET(req: NextRequest) {
  try {
    const loggedInUser = await requireAuth();
    if (!loggedInUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const searchParams = req.nextUrl.searchParams;
    const page      = parseInt(searchParams.get('page')  ?? '1');
    const limit     = parseInt(searchParams.get('limit') ?? '20');
    // ?? undefined keeps TypeScript happy — these are string | null from searchParams
    const status    = searchParams.get('status')    ?? undefined;
    const planTier  = searchParams.get('planTier')  ?? undefined;
    const interval  = searchParams.get('interval')  ?? undefined;
    const search    = searchParams.get('search')    ?? undefined;
    const startDate = searchParams.get('startDate') ?? undefined;
    const endDate   = searchParams.get('endDate')   ?? undefined;
    // sortBy is used as a dynamic key — type it as string and validate below
    const sortByRaw  = searchParams.get('sortBy')    ?? 'createdAt';
    const sortOrder  = searchParams.get('sortOrder') ?? 'desc';

    // Whitelist sortBy to prevent NoSQL injection via arbitrary key names
    const ALLOWED_SORT_FIELDS = [
      'createdAt', 'updatedAt', 'currentPeriodEnd', 'currentPeriodStart',
      'finalPriceKobo', 'priceKobo', 'planTier', 'status', 'planName',
    ] as const;
    type AllowedSortField = typeof ALLOWED_SORT_FIELDS[number];
    const sortBy: AllowedSortField = (ALLOWED_SORT_FIELDS as readonly string[]).includes(sortByRaw)
      ? (sortByRaw as AllowedSortField)
      : 'createdAt';

    // ── Build query ────────────────────────────────────────────────────────────
    const query: Record<string, any> = {};

    if (status && status !== 'all')   query.status   = status;
    if (planTier && planTier !== 'all') query.planTier = planTier;
    if (interval && interval !== 'all') query.interval = interval;

    if (search) {
      // planName and paystackSubscriptionCode are denormalized on the doc.
      // User name/email require a $lookup — handled below via pipeline.
      query.$or = [
        { planName:                  { $regex: search, $options: 'i' } },
        { paystackSubscriptionCode:  { $regex: search, $options: 'i' } },
        { couponCode:                { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.currentPeriodStart.$gte = new Date(startDate);
      if (endDate)   query.currentPeriodEnd.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const sort: Record<AllowedSortField, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 } as any;

    // ── Execute ────────────────────────────────────────────────────────────────
    const [subscriptions, totalCount] = await Promise.all([
      Subscription.find(query)
        .populate({ path: 'userId', model: User, select: 'name email avatar' })
        // Don't expose sensitive Paystack tokens / authorization codes
        .select('-paystackAuthorizationCode -paystackEmailToken -metadata')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      subscriptions,
      pagination: {
        currentPage:     page,
        totalPages,
        totalCount,
        limit,
        hasNextPage:     page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}