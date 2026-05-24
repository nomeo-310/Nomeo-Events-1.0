// app/api/admin/plans/tiers/[tier]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan, PlanTier } from '@/models/plan';
import { requireSuperAdmin, requireAdmin } from '@/lib/admin/authorization';

export async function GET(
  req: NextRequest,
  { params }: { params: { tier: string } }
) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const { tier } = params;

    if (!Object.values(PlanTier).includes(tier as PlanTier)) {
      return NextResponse.json(
        { success: false, error: `Invalid tier. Must be one of: ${Object.values(PlanTier).join(', ')}` },
        { status: 400 }
      );
    }

    const typedTier = tier as PlanTier;
    const plans = await Plan.find({ tier: typedTier }).sort({ sortOrder: 1, interval: 1 });

    return NextResponse.json({
      success: true,
      data: plans,
      count: plans.length,
      tier,
      user: { role: user.role, email: user.email },
    });

  } catch (error: any) {
    console.error('Error fetching tier plans:', error);
    if (error.message === 'Unauthorized. Please login.')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden. Admin access required.')
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { tier: string } }
) {
  try {
    await connectDB();
    const user = await requireSuperAdmin();
    const { tier } = params;

    if (!Object.values(PlanTier).includes(tier as PlanTier)) {
      return NextResponse.json(
        { success: false, error: `Invalid tier. Must be one of: ${Object.values(PlanTier).join(', ')}` },
        { status: 400 }
      );
    }

    const typedTier = tier as PlanTier;

    const count = await Plan.countDocuments({ tier: typedTier });
    if (count === 0) {
      return NextResponse.json(
        { success: false, error: `No plans found for tier: ${tier}` },
        { status: 404 }
      );
    }

    const result = await Plan.deleteMany({ tier: typedTier });

    return NextResponse.json({
      success: true,
      message: `Deleted entire '${tier}' tier (${result.deletedCount} plans) by ${user.email}`,
      data: { tier, deletedCount: result.deletedCount },
    });

  } catch (error: any) {
    console.error('Error deleting tier:', error);
    if (error.message === 'Unauthorized. Please login.')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden. Super admin access required.')
      return NextResponse.json({ success: false, error: 'Forbidden - Only superadmin can delete tiers' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tier: string } }
) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const { tier } = params;
    const { action } = await req.json();

    if (!action || !['activate', 'deactivate'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action required: "activate" or "deactivate"' },
        { status: 400 }
      );
    }

    if (!Object.values(PlanTier).includes(tier as PlanTier)) {
      return NextResponse.json(
        { success: false, error: `Invalid tier. Must be one of: ${Object.values(PlanTier).join(', ')}` },
        { status: 400 }
      );
    }

    const typedTier = tier as PlanTier;
    const isActive = action === 'activate';
    const result = await Plan.updateMany({ tier: typedTier }, { $set: { isActive } });

    return NextResponse.json({
      success: true,
      message: `${action}d ${result.modifiedCount} plan(s) in '${tier}' tier by ${user.email}`,
      data: { tier, modifiedCount: result.modifiedCount, isActive },
    });

  } catch (error: any) {
    console.error('Error updating tier status:', error);
    if (error.message === 'Unauthorized. Please login.')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden. Admin access required.')
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}