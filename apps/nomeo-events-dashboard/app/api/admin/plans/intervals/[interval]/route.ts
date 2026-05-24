// app/api/admin/plans/intervals/[interval]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan, PlanInterval } from '@/models/plan';
import { requireSuperAdmin, requireAdmin } from '@/lib/admin/authorization';

export async function GET(
  req: NextRequest,
  { params }: { params: { interval: string } }
) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const { interval } = params;

    if (!Object.values(PlanInterval).includes(interval as PlanInterval)) {
      return NextResponse.json(
        { success: false, error: `Invalid interval. Must be one of: ${Object.values(PlanInterval).join(', ')}` },
        { status: 400 }
      );
    }

    const typedInterval = interval as PlanInterval;
    const plans = await Plan.find({ interval: typedInterval }).sort({ sortOrder: 1, tier: 1 });

    return NextResponse.json({
      success: true,
      data: plans,
      count: plans.length,
      interval,
      user: { role: user.role, email: user.email },
    });

  } catch (error: any) {
    console.error('Error fetching interval plans:', error);
    if (error.message === 'Unauthorized. Please login.')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden. Admin access required.')
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { interval: string } }
) {
  try {
    await connectDB();
    const user = await requireSuperAdmin();
    const { interval } = params;

    if (!Object.values(PlanInterval).includes(interval as PlanInterval)) {
      return NextResponse.json(
        { success: false, error: `Invalid interval. Must be one of: ${Object.values(PlanInterval).join(', ')}` },
        { status: 400 }
      );
    }

    const typedInterval = interval as PlanInterval;

    const count = await Plan.countDocuments({ interval: typedInterval });
    if (count === 0) {
      return NextResponse.json(
        { success: false, error: `No plans found with interval: ${interval}` },
        { status: 404 }
      );
    }

    const result = await Plan.deleteMany({ interval: typedInterval });

    return NextResponse.json({
      success: true,
      message: `Deleted all '${interval}' plans (${result.deletedCount} plans) by ${user.email}`,
      data: { interval, deletedCount: result.deletedCount },
    });

  } catch (error: any) {
    console.error('Error deleting interval plans:', error);
    if (error.message === 'Unauthorized. Please login.')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden. Super admin access required.')
      return NextResponse.json({ success: false, error: 'Forbidden - Only superadmin can delete interval groups' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { interval: string } }
) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const { interval } = params;
    const { action } = await req.json();

    if (!action || !['activate', 'deactivate'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action required: "activate" or "deactivate"' },
        { status: 400 }
      );
    }

    if (!Object.values(PlanInterval).includes(interval as PlanInterval)) {
      return NextResponse.json(
        { success: false, error: `Invalid interval. Must be one of: ${Object.values(PlanInterval).join(', ')}` },
        { status: 400 }
      );
    }

    const typedInterval = interval as PlanInterval;
    const isActive = action === 'activate';
    const result = await Plan.updateMany({ interval: typedInterval }, { $set: { isActive } });

    return NextResponse.json({
      success: true,
      message: `${action}d ${result.modifiedCount} '${interval}' plan(s) by ${user.email}`,
      data: { interval, modifiedCount: result.modifiedCount, isActive },
    });

  } catch (error: any) {
    console.error('Error updating interval status:', error);
    if (error.message === 'Unauthorized. Please login.')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden. Admin access required.')
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}