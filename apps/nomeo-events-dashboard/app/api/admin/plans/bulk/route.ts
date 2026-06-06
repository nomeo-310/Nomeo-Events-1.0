// app/api/admin/plans/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan } from '@/models/plan';
import { PlanTier } from '@/models/plan-tier';
import { PlanInterval } from '@/models/plan-interval';
import { requireSuperAdmin } from '@/lib/admin/authorization';

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireSuperAdmin();
    const { searchParams } = new URL(req.url);
    const tier = searchParams.get('tier');
    const interval = searchParams.get('interval');
    const slugsParam = searchParams.get('slugs');
    const slugs = slugsParam ? slugsParam.split(',').filter((s: string) => s.trim()) : null;

    if (tier) {
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

      // Get plans being deleted (for response)
      const plansToDelete = await Plan.find({ tier: tierDoc.slug }).select('name slug interval');
      const result = await Plan.deleteMany({ tier: tierDoc.slug });

      return NextResponse.json({
        success: true,
        message: `Deleted ${result.deletedCount} plan(s) from tier '${tier}' by ${user.email}`,
        data: { 
          deletedCount: result.deletedCount, 
          tier: tierDoc,
          deletedPlans: plansToDelete
        },
      });
    }

    if (interval) {
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

      // Get plans being deleted (for response)
      const plansToDelete = await Plan.find({ interval: intervalDoc.slug }).select('name slug tier');
      const result = await Plan.deleteMany({ interval: intervalDoc.slug });

      return NextResponse.json({
        success: true,
        message: `Deleted ${result.deletedCount} plan(s) with interval '${interval}' by ${user.email}`,
        data: { 
          deletedCount: result.deletedCount, 
          interval: intervalDoc,
          deletedPlans: plansToDelete
        },
      });
    }

    if (slugs && slugs.length > 0) {
      // Get plans being deleted (for response)
      const plansToDelete = await Plan.find({ slug: { $in: slugs } }).select('name slug tier interval');
      const result = await Plan.deleteMany({ slug: { $in: slugs } });

      return NextResponse.json({
        success: true,
        message: `Deleted ${result.deletedCount} plan(s) [${slugs.join(', ')}] by ${user.email}`,
        data: { 
          deletedCount: result.deletedCount, 
          slugs,
          deletedPlans: plansToDelete
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Please provide tier, interval, or slugs parameter' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error in bulk delete:', error);
    if (error.message === 'Unauthorized. Please login.')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden. Super admin access required.')
      return NextResponse.json({ success: false, error: 'Forbidden - Only superadmin can bulk delete' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireSuperAdmin();
    const { tier, interval, slugs, action } = await req.json();

    if (!action || !['activate', 'deactivate'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "activate" or "deactivate"' },
        { status: 400 }
      );
    }

    const isActive = action === 'activate';
    const update = { $set: { isActive } };

    if (tier) {
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

      // Get plans being updated (for response)
      const plansToUpdate = await Plan.find({ tier: tierDoc.slug }).select('name slug interval isActive');
      const result = await Plan.updateMany({ tier: tierDoc.slug }, update);

      return NextResponse.json({
        success: true,
        message: `${action}d ${result.modifiedCount} plan(s) in tier '${tier}' by ${user.email}`,
        data: { 
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount,
          tier: tierDoc,
          action,
          updatedPlans: plansToUpdate.map(p => ({
            name: p.name,
            slug: p.slug,
            interval: p.interval,
            wasActive: p.isActive,
            nowActive: isActive
          }))
        },
      });
    }

    if (interval) {
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

      // Get plans being updated (for response)
      const plansToUpdate = await Plan.find({ interval: intervalDoc.slug }).select('name slug tier isActive');
      const result = await Plan.updateMany({ interval: intervalDoc.slug }, update);

      return NextResponse.json({
        success: true,
        message: `${action}d ${result.modifiedCount} plan(s) with interval '${interval}' by ${user.email}`,
        data: { 
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount,
          interval: intervalDoc,
          action,
          updatedPlans: plansToUpdate.map(p => ({
            name: p.name,
            slug: p.slug,
            tier: p.tier,
            wasActive: p.isActive,
            nowActive: isActive
          }))
        },
      });
    }

    if (slugs && Array.isArray(slugs) && slugs.length > 0) {
      const validSlugs = (slugs as unknown[]).filter((s): s is string => typeof s === 'string');
      
      // Get plans being updated (for response)
      const plansToUpdate = await Plan.find({ slug: { $in: validSlugs } }).select('name slug tier interval isActive');
      const result = await Plan.updateMany({ slug: { $in: validSlugs } }, update);

      return NextResponse.json({
        success: true,
        message: `${action}d ${result.modifiedCount} plan(s) [${validSlugs.join(', ')}] by ${user.email}`,
        data: { 
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount,
          slugs: validSlugs,
          action,
          updatedPlans: plansToUpdate.map(p => ({
            name: p.name,
            slug: p.slug,
            tier: p.tier,
            interval: p.interval,
            wasActive: p.isActive,
            nowActive: isActive
          }))
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Please provide tier, interval, or slugs parameter' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Error in bulk operation:', error);
    if (error.message === 'Unauthorized. Please login.')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden. Super admin access required.')
      return NextResponse.json({ success: false, error: 'Forbidden - Only superadmin can bulk operations' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}