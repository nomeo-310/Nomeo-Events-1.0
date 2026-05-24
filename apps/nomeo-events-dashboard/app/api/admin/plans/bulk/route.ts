// app/api/admin/plans/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan, PlanTier, PlanInterval } from '@/models/plan';
import { requireSuperAdmin } from '@/lib/admin/authorization';
import type { IPlanDocument } from '@/models/plan';

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
      if (!Object.values(PlanTier).includes(tier as PlanTier)) {
        return NextResponse.json(
          { success: false, error: `Invalid tier. Must be one of: ${Object.values(PlanTier).join(', ')}` },
          { status: 400 }
        );
      }

      const result = await Plan.deleteMany({ tier: tier as PlanTier });

      return NextResponse.json({
        success: true,
        message: `Deleted ${result.deletedCount} plan(s) from tier '${tier}' by ${user.email}`,
        data: { deletedCount: result.deletedCount, tier },
      });
    }

    if (interval) {
      if (!Object.values(PlanInterval).includes(interval as PlanInterval)) {
        return NextResponse.json(
          { success: false, error: `Invalid interval. Must be one of: ${Object.values(PlanInterval).join(', ')}` },
          { status: 400 }
        );
      }

    const result = await Plan.deleteMany({ interval: interval as PlanInterval });

      return NextResponse.json({
        success: true,
        message: `Deleted ${result.deletedCount} plan(s) with interval '${interval}' by ${user.email}`,
        data: { deletedCount: result.deletedCount, interval },
      });
    }

    if (slugs && slugs.length > 0) {
      const result = await Plan.deleteMany({ slug: { $in: slugs } });

      return NextResponse.json({
        success: true,
        message: `Deleted ${result.deletedCount} plan(s) [${slugs.join(', ')}] by ${user.email}`,
        data: { deletedCount: result.deletedCount, slugs },
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
      if (!Object.values(PlanTier).includes(tier as PlanTier)) {
        return NextResponse.json(
          { success: false, error: `Invalid tier. Must be one of: ${Object.values(PlanTier).join(', ')}` },
          { status: 400 }
        );
      }

      const result = await Plan.updateMany({ tier: tier as PlanTier }, update);

      return NextResponse.json({
        success: true,
        message: `${action}d ${result.modifiedCount} plan(s) in tier '${tier}' by ${user.email}`,
        data: { modifiedCount: result.modifiedCount, tier, action },
      });
    }

    if (interval) {
      if (!Object.values(PlanInterval).includes(interval as PlanInterval)) {
        return NextResponse.json(
          { success: false, error: `Invalid interval. Must be one of: ${Object.values(PlanInterval).join(', ')}` },
          { status: 400 }
        );
      }

      const result = await Plan.updateMany({ interval: interval as PlanInterval }, update);

      return NextResponse.json({
        success: true,
        message: `${action}d ${result.modifiedCount} plan(s) with interval '${interval}' by ${user.email}`,
        data: { modifiedCount: result.modifiedCount, interval, action },
      });
    }

    if (slugs && Array.isArray(slugs) && slugs.length > 0) {
      const validSlugs = (slugs as unknown[]).filter((s): s is string => typeof s === 'string');
      const result = await Plan.updateMany({ slug: { $in: validSlugs } }, update);

      return NextResponse.json({
        success: true,
        message: `${action}d ${result.modifiedCount} plan(s) [${validSlugs.join(', ')}] by ${user.email}`,
        data: { modifiedCount: result.modifiedCount, slugs: validSlugs, action },
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