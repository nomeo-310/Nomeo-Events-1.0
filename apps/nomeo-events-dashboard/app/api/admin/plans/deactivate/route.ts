// app/api/admin/plans/deactivate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan, PlanTier, PlanInterval } from '@/models/plan';
import { requireAdmin } from '@/lib/admin/authorization';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const body = await req.json();
    const { tier, interval, slugs, excludeIntervals, includeIntervals } = body;

    let query: any = {};
    let description = '';

    if (slugs && slugs.length > 0) {
      query.slug = { $in: slugs };
      description = `specific plans: ${slugs.join(', ')}`;
    } else if (tier) {
      if (!Object.values(PlanTier).includes(tier as PlanTier)) {
        return NextResponse.json(
          { success: false, error: `Invalid tier. Must be one of: ${Object.values(PlanTier).join(', ')}` },
          { status: 400 }
        );
      }

      query.tier = tier;
      description = `tier '${tier}'`;

      // includeIntervals and excludeIntervals are mutually exclusive —
      // if both arrive, includeIntervals wins. Apply them to separate keys
      // so they don't clobber each other.
      if (includeIntervals?.length) {
        const valid = (includeIntervals as string[]).filter((i) =>
          Object.values(PlanInterval).includes(i as PlanInterval)
        );
        if (valid.length) {
          query.interval = { $in: valid };
          description += ` with intervals: ${valid.join(', ')}`;
        }
      } else if (excludeIntervals?.length) {
        // Only applied when includeIntervals is not provided
        const valid = (excludeIntervals as string[]).filter((i) =>
          Object.values(PlanInterval).includes(i as PlanInterval)
        );
        if (valid.length) {
          query.interval = { $nin: valid };
          description += ` excluding intervals: ${valid.join(', ')}`;
        }
      }
    } else if (interval) {
      if (!Object.values(PlanInterval).includes(interval as PlanInterval)) {
        return NextResponse.json(
          { success: false, error: `Invalid interval. Must be one of: ${Object.values(PlanInterval).join(', ')}` },
          { status: 400 }
        );
      }
      query.interval = interval;
      description = `all '${interval}' plans across all tiers`;
    } else {
      return NextResponse.json(
        { success: false, error: 'Please provide slugs, tier, or interval parameter' },
        { status: 400 }
      );
    }

    const result = await Plan.updateMany(query, { $set: { isActive: false } });

    return NextResponse.json({
      success: true,
      message: `Deactivated ${result.modifiedCount} ${description} plan(s) by ${user.email}`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
        filters: { tier, interval, includeIntervals, excludeIntervals, slugs },
        action: 'deactivate',
      },
    });
  } catch (error: any) {
    console.error('Error deactivating plans:', error);
    if (error.message === 'Unauthorized. Please login.')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden. Admin access required.')
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}