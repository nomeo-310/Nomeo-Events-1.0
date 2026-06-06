// app/api/admin/plans/deactivate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan } from '@/models/plan';
import { PlanTier } from '@/models/plan-tier';
import { PlanInterval } from '@/models/plan-interval';
import { requireAdmin } from '@/lib/admin/authorization';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const body = await req.json();
    const { tier, interval, slugs, excludeIntervals, includeIntervals } = body;

    let query: any = {};
    let description = '';

    // Handle deletion by specific plan slugs
    if (slugs && slugs.length > 0) {
      query.slug = { $in: slugs };
      description = `specific plans: ${slugs.join(', ')}`;
    } 
    // Handle deletion by tier
    else if (tier) {
      // Check if tier exists in PlanTier collection
      const tierDoc = await PlanTier.findOne({ slug: tier.toLowerCase() });
      if (!tierDoc) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Tier '${tier}' does not exist. Available tiers: ${(await PlanTier.find({}).select('slug')).map(t => t.slug).join(', ')}` 
          },
          { status: 400 }
        );
      }

      query.tier = tierDoc.slug;
      description = `tier '${tier}'`;

      // includeIntervals and excludeIntervals are mutually exclusive
      if (includeIntervals?.length) {
        // Validate intervals exist
        const validIntervals = [];
        for (const intervalName of includeIntervals) {
          const intervalDoc = await PlanInterval.findOne({ slug: intervalName.toLowerCase() });
          if (intervalDoc) {
            validIntervals.push(intervalDoc.slug);
          }
        }
        if (validIntervals.length) {
          query.interval = { $in: validIntervals };
          description += ` with intervals: ${validIntervals.join(', ')}`;
        }
      } else if (excludeIntervals?.length) {
        // Validate intervals exist
        const validIntervals = [];
        for (const intervalName of excludeIntervals) {
          const intervalDoc = await PlanInterval.findOne({ slug: intervalName.toLowerCase() });
          if (intervalDoc) {
            validIntervals.push(intervalDoc.slug);
          }
        }
        if (validIntervals.length) {
          query.interval = { $nin: validIntervals };
          description += ` excluding intervals: ${validIntervals.join(', ')}`;
        }
      }
    } 
    // Handle deletion by interval
    else if (interval) {
      // Check if interval exists in PlanInterval collection
      const intervalDoc = await PlanInterval.findOne({ slug: interval.toLowerCase() });
      if (!intervalDoc) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Interval '${interval}' does not exist. Available intervals: ${(await PlanInterval.find({}).select('slug')).map(i => i.slug).join(', ')}` 
          },
          { status: 400 }
        );
      }
      query.interval = intervalDoc.slug;
      description = `all '${interval}' plans across all tiers`;
    } 
    else {
      return NextResponse.json(
        { success: false, error: 'Please provide slugs, tier, or interval parameter' },
        { status: 400 }
      );
    }

    // Get the plans that will be deactivated (for response)
    const plansToDeactivate = await Plan.find(query).select('name slug tier interval isActive');
    
    // Deactivate the plans
    const result = await Plan.updateMany(query, { $set: { isActive: false } });

    return NextResponse.json({
      success: true,
      message: `Deactivated ${result.modifiedCount} ${description} plan(s) by ${user.email}`,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
        deactivatedPlans: plansToDeactivate.map(p => ({
          name: p.name,
          slug: p.slug,
          tier: p.tier,
          interval: p.interval,
          wasActive: p.isActive
        })),
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