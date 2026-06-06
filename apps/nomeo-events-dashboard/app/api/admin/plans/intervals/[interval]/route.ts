// app/api/admin/plans/intervals/[interval]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan } from '@/models/plan';
import { PlanInterval } from '@/models/plan-interval';
import { requireSuperAdmin, requireAdmin } from '@/lib/admin/authorization';

export async function GET( req: NextRequest, { params }: { params: Promise<{ interval: string }> }) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const { interval } = await params;

    // Check if interval exists in PlanInterval collection
    const intervalDoc = await PlanInterval.findOne({ slug: interval.toLowerCase() });
    if (!intervalDoc) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Interval '${interval}' does not exist` 
        },
        { status: 404 }
      );
    }

    const plans = await Plan.find({ interval: intervalDoc.slug })
      .populate('tierId')
      .populate('intervalId')
      .sort({ sortOrder: 1, tier: 1 });

    return NextResponse.json({
      success: true,
      data: {
        interval: intervalDoc,
        plans,
        count: plans.length
      },
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

export async function DELETE( req: NextRequest, { params }: { params: Promise<{ interval: string }> }) {
  try {
    await connectDB();
    const user = await requireSuperAdmin();
    const { interval } = await params;

    // Check if interval exists
    const intervalDoc = await PlanInterval.findOne({ slug: interval.toLowerCase() });
    if (!intervalDoc) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Interval '${interval}' does not exist` 
        },
        { status: 404 }
      );
    }

    // Check if any plans use this interval
    const count = await Plan.countDocuments({ interval: intervalDoc.slug });
    if (count === 0) {
      return NextResponse.json(
        { success: false, error: `No plans found with interval: ${interval}` },
        { status: 404 }
      );
    }

    // Get plans being deleted (for response)
    const plansToDelete = await Plan.find({ interval: intervalDoc.slug }).select('name slug tier');
    
    // Delete all plans with this interval
    const result = await Plan.deleteMany({ interval: intervalDoc.slug });

    return NextResponse.json({
      success: true,
      message: `Deleted all '${interval}' plans (${result.deletedCount} plans) by ${user.email}`,
      data: { 
        interval: intervalDoc,
        deletedCount: result.deletedCount,
        deletedPlans: plansToDelete
      },
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

export async function PATCH( req: NextRequest, { params }: { params: Promise<{ interval: string }> }) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const { interval } = await params;
    const { action } = await req.json();

    if (!action || !['activate', 'deactivate'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action required: "activate" or "deactivate"' },
        { status: 400 }
      );
    }

    // Check if interval exists
    const intervalDoc = await PlanInterval.findOne({ slug: interval.toLowerCase() });
    if (!intervalDoc) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Interval '${interval}' does not exist` 
        },
        { status: 404 }
      );
    }

    const isActive = action === 'activate';
    
    // Update the interval's own status
    intervalDoc.isActive = isActive;
    await intervalDoc.save();
    
    // Update all plans using this interval
    const result = await Plan.updateMany(
      { interval: intervalDoc.slug }, 
      { $set: { isActive } }
    );

    return NextResponse.json({
      success: true,
      message: `${action}d ${result.modifiedCount} '${interval}' plan(s) and updated interval status by ${user.email}`,
      data: { 
        interval: intervalDoc,
        modifiedCount: result.modifiedCount, 
        isActive,
        intervalStatusUpdated: true
      },
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