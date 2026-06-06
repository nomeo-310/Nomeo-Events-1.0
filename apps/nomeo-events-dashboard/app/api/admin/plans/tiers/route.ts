import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { PlanTier } from '@/models/plan-tier';
import { Plan } from '@/models/plan';
import { requireSuperAdmin } from '@/lib/admin/authorization';

export async function GET() {
  try {
    await connectDB();
    const tiers = await PlanTier.find({}).sort({ sortOrder: 1 });
    
    const tiersWithCounts = await Promise.all(tiers.map(async (tier) => {
      const planCount = await Plan.countDocuments({ tier: tier.slug });
      return {
        ...tier.toObject(),
        planCount,
        canDelete: planCount === 0 && !tier.isActive
      };
    }));
    
    return NextResponse.json({ success: true, data: tiersWithCounts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const admin = await requireSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, sortOrder, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');
    
    const existingTier = await PlanTier.findOne({ slug });
    if (existingTier) {
      return NextResponse.json({ error: 'Tier already exists' }, { status: 409 });
    }

    const tier = await PlanTier.create({
      name,
      slug,
      description,
      sortOrder: sortOrder || 0,
      isActive: isActive !== false
    });

    return NextResponse.json({ success: true, data: tier }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const admin = await requireSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Tier ID is required' }, { status: 400 });
    }

    const tier = await PlanTier.findById(id);
    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    if (name) {
      tier.name = name;
      tier.slug = name.toLowerCase().replace(/\s+/g, '-');
    }
    if (description !== undefined) tier.description = description;
    if (sortOrder !== undefined) tier.sortOrder = sortOrder;
    if (isActive !== undefined) tier.isActive = isActive;

    await tier.save();

    const planCount = await Plan.countDocuments({ tier: tier.slug });

    return NextResponse.json({ 
      success: true, 
      data: {
        ...tier.toObject(),
        planCount
      },
      message: isActive !== undefined
        ? (isActive ? `Tier '${tier.name}' activated.` : `Tier '${tier.name}' deactivated. ${planCount} existing plan(s) still use this tier.`)
        : `Tier '${tier.name}' updated successfully.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const admin = await requireSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tier ID is required' }, { status: 400 });
    }

    const tier = await PlanTier.findById(id);
    if (!tier) {
      return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
    }

    const plansUsingTier = await Plan.countDocuments({ tier: tier.slug });
    
    if (plansUsingTier > 0) {
      return NextResponse.json({ 
        error: `Cannot delete tier '${tier.name}'. ${plansUsingTier} plan(s) are using it. Deactivate it instead.`,
        planCount: plansUsingTier,
        suggestion: "Use PUT request with isActive: false to deactivate this tier."
      }, { status: 400 });
    }
    
    if (tier.isActive) {
      return NextResponse.json({ 
        error: `Cannot delete active tier '${tier.name}'. Deactivate it first.`,
        suggestion: "Use PUT request with isActive: false to deactivate this tier, then delete."
      }, { status: 400 });
    }
    
    await PlanTier.findByIdAndDelete(id);

    return NextResponse.json({ 
      success: true, 
      message: `Tier '${tier.name}' permanently deleted. No plans were affected.`
    });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}