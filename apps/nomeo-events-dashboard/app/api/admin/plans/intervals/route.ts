import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { PlanInterval } from '@/models/plan-interval';
import { Plan } from '@/models/plan';
import { requireSuperAdmin } from '@/lib/admin/authorization';

export async function GET() {
  try {
    await connectDB();
    const intervals = await PlanInterval.find({}).sort({ sortOrder: 1 });
    
    const intervalsWithCounts = await Promise.all(intervals.map(async (interval) => {
      const planCount = await Plan.countDocuments({ interval: interval.slug });
      return {
        ...interval.toObject(),
        planCount,
        canDelete: planCount === 0 && !interval.isActive
      };
    }));
    
    return NextResponse.json({ success: true, data: intervalsWithCounts });
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
    const { name, monthsCount, multiplier, sortOrder, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (monthsCount === undefined) {
      return NextResponse.json({ error: 'monthsCount is required' }, { status: 400 });
    }
    if (multiplier === undefined) {
      return NextResponse.json({ error: 'multiplier is required' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');
    
    const existingInterval = await PlanInterval.findOne({ slug });
    if (existingInterval) {
      return NextResponse.json({ error: 'Interval already exists' }, { status: 409 });
    }

    const interval = await PlanInterval.create({
      name,
      slug,
      monthsCount,
      multiplier,
      sortOrder: sortOrder || 0,
      isActive: isActive !== false
    });

    return NextResponse.json({ success: true, data: interval }, { status: 201 });
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
    const { id, name, monthsCount, multiplier, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Interval ID is required' }, { status: 400 });
    }

    const interval = await PlanInterval.findById(id);
    if (!interval) {
      return NextResponse.json({ error: 'Interval not found' }, { status: 404 });
    }

    if (name) {
      interval.name = name;
      interval.slug = name.toLowerCase().replace(/\s+/g, '-');
    }
    if (monthsCount !== undefined) interval.monthsCount = monthsCount;
    if (multiplier !== undefined) interval.multiplier = multiplier;
    if (sortOrder !== undefined) interval.sortOrder = sortOrder;
    if (isActive !== undefined) interval.isActive = isActive;

    await interval.save();

    const planCount = await Plan.countDocuments({ interval: interval.slug });

    return NextResponse.json({ 
      success: true, 
      data: {
        ...interval.toObject(),
        planCount
      },
      message: isActive !== undefined
        ? (isActive ? `Interval '${interval.name}' activated.` : `Interval '${interval.name}' deactivated. ${planCount} existing plan(s) still use this interval.`)
        : `Interval '${interval.name}' updated successfully.`
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
      return NextResponse.json({ error: 'Interval ID is required' }, { status: 400 });
    }

    const interval = await PlanInterval.findById(id);
    if (!interval) {
      return NextResponse.json({ error: 'Interval not found' }, { status: 404 });
    }

    const plansUsingInterval = await Plan.countDocuments({ interval: interval.slug });
    
    if (plansUsingInterval > 0) {
      return NextResponse.json({ 
        error: `Cannot delete interval '${interval.name}'. ${plansUsingInterval} plan(s) are using it. Deactivate it instead.`,
        planCount: plansUsingInterval,
        suggestion: "Use PUT request with isActive: false to deactivate this interval."
      }, { status: 400 });
    }
    
    if (interval.isActive) {
      return NextResponse.json({ 
        error: `Cannot delete active interval '${interval.name}'. Deactivate it first.`,
        suggestion: "Use PUT request with isActive: false to deactivate this interval, then delete."
      }, { status: 400 });
    }
    
    await PlanInterval.findByIdAndDelete(id);

    return NextResponse.json({ 
      success: true, 
      message: `Interval '${interval.name}' permanently deleted. No plans were affected.`
    });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}