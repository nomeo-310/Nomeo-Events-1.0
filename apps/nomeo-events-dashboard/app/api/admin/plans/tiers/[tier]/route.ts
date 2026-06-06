// app/api/admin/plans/tiers/[tier]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan } from '@/models/plan';
import { PlanTier } from '@/models/plan-tier';
import { requireSuperAdmin, requireAdmin } from '@/lib/admin/authorization';

export async function GET( req: NextRequest, { params }: { params: Promise<{ tier: string }> }) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const { tier } = await params;

    // Check if tier exists in PlanTier collection
    const tierDoc = await PlanTier.findOne({ slug: tier.toLowerCase() });
    if (!tierDoc) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Tier '${tier}' does not exist` 
        },
        { status: 404 }
      );
    }

    const plans = await Plan.find({ tier: tierDoc.slug })
      .populate('tierId')
      .populate('intervalId')
      .sort({ sortOrder: 1, interval: 1 });

    return NextResponse.json({
      success: true,
      data: {
        tier: tierDoc,
        plans,
        count: plans.length
      },
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

export async function DELETE( req: NextRequest, { params }: { params: Promise<{ tier: string }> }) {
  try {
    await connectDB();
    const user = await requireSuperAdmin();
    const { tier } = await params;

    // Check if tier exists
    const tierDoc = await PlanTier.findOne({ slug: tier.toLowerCase() });
    if (!tierDoc) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Tier '${tier}' does not exist` 
        },
        { status: 404 }
      );
    }

    // Check if any plans use this tier
    const count = await Plan.countDocuments({ tier: tierDoc.slug });
    if (count === 0) {
      return NextResponse.json(
        { success: false, error: `No plans found for tier: ${tier}` },
        { status: 404 }
      );
    }

    // Get plans being deleted (for response)
    const plansToDelete = await Plan.find({ tier: tierDoc.slug }).select('name slug interval');
    
    // Delete all plans with this tier
    const result = await Plan.deleteMany({ tier: tierDoc.slug });

    return NextResponse.json({
      success: true,
      message: `Deleted entire '${tier}' tier (${result.deletedCount} plans) by ${user.email}`,
      data: { 
        tier: tierDoc,
        deletedCount: result.deletedCount,
        deletedPlans: plansToDelete
      },
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

export async function PATCH( req: NextRequest,{ params }: { params: Promise<{ tier: string }> }) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const { tier } = await params;
    const { action } = await req.json();

    if (!action || !['activate', 'deactivate'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action required: "activate" or "deactivate"' },
        { status: 400 }
      );
    }

    // Check if tier exists
    const tierDoc = await PlanTier.findOne({ slug: tier.toLowerCase() });
    if (!tierDoc) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Tier '${tier}' does not exist` 
        },
        { status: 404 }
      );
    }

    const isActive = action === 'activate';
    
    // Update the tier's own status
    tierDoc.isActive = isActive;
    await tierDoc.save();
    
    // Update all plans using this tier
    const result = await Plan.updateMany(
      { tier: tierDoc.slug }, 
      { $set: { isActive } }
    );

    return NextResponse.json({
      success: true,
      message: `${action}d ${result.modifiedCount} plan(s) in '${tier}' tier and updated tier status by ${user.email}`,
      data: { 
        tier: tierDoc,
        modifiedCount: result.modifiedCount, 
        isActive,
        tierStatusUpdated: true
      },
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