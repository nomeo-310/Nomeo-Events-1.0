import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan, DiscountType, CouponStatus } from '@/models/plan';
import { PlanTier } from '@/models/plan-tier';
import { PlanInterval } from '@/models/plan-interval';
import { requireAdmin, requireSuperAdmin } from '@/lib/admin/authorization';

// GET /api/admin/plans - Get all plans with filters
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireAdmin();
    
    const { searchParams } = new URL(req.url);
    const tier = searchParams.get('tier');
    const interval = searchParams.get('interval');
    const isActive = searchParams.get('isActive');
    const isPublic = searchParams.get('isPublic');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    let query: any = {};
    
    if (tier) query.tier = tier;
    if (interval) query.interval = interval;
    if (isActive !== null) query.isActive = isActive === 'true';
    if (isPublic !== null) query.isPublic = isPublic === 'true';
    
    if (!includeInactive && isActive === null) {
      query.isActive = true;
    }
    
    const plans = await Plan.find(query)
      .populate('tierId')
      .populate('intervalId')
      .sort({ sortOrder: 1, tier: 1, interval: 1 });
    
    const allTiers = await PlanTier.find({}).sort({ sortOrder: 1 });
    const allIntervals = await PlanInterval.find({}).sort({ sortOrder: 1 });
    
    return NextResponse.json({
      success: true,
      data: {
        plans,
        tiers: allTiers,
        intervals: allIntervals
      },
      count: plans.length,
      user: { role: user.role, isSuperAdmin: user.isSuperAdmin, email: user.email }
    });
    
  } catch (error: any) {
    console.error('Error fetching plans:', error);
    
    if (error.message === 'Unauthorized. Please login.') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden. Admin access required.') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/plans - Create a new plan (requires existing tier and interval)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireSuperAdmin();
    const body = await req.json();
    
    // Validate Required Fields
    const requiredFields = ['name', 'slug', 'tierId', 'intervalId', 'priceKobo'];
    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Validate tier exists and is active
    const tier = await PlanTier.findById(body.tierId);
    if (!tier) {
      return NextResponse.json(
        { success: false, error: 'Tier not found' },
        { status: 400 }
      );
    }
    if (!tier.isActive) {
      return NextResponse.json(
        { success: false, error: `Cannot create plan. Tier '${tier.name}' is deactivated.` },
        { status: 400 }
      );
    }
    
    // Validate interval exists and is active
    const interval = await PlanInterval.findById(body.intervalId);
    if (!interval) {
      return NextResponse.json(
        { success: false, error: 'Interval not found' },
        { status: 400 }
      );
    }
    if (!interval.isActive) {
      return NextResponse.json(
        { success: false, error: `Cannot create plan. Interval '${interval.name}' is deactivated.` },
        { status: 400 }
      );
    }
    
    // Check for existing plan
    const existingPlan = await Plan.findOne({ slug: body.slug });
    if (existingPlan) {
      return NextResponse.json(
        { success: false, error: `Plan with slug '${body.slug}' already exists` },
        { status: 409 }
      );
    }
    
    // Prepare Plan Data
    const planData: any = {
      name: body.name,
      slug: body.slug.toLowerCase(),
      tier: tier.slug,
      interval: interval.slug,
      tierId: tier._id,
      intervalId: interval._id,
      description: body.description || '',
      isActive: body.isActive !== undefined ? body.isActive : true,
      isPublic: body.isPublic !== undefined ? body.isPublic : true,
      priceKobo: body.priceKobo,
      currency: body.currency || 'NGN',
      paystackPlanCode: body.paystackPlanCode || null,
      trialDays: body.trialDays !== undefined ? body.trialDays : (body.priceKobo === 0 ? 14 : 0),
      
      maxEvents: body.maxEvents,
      maxAttendeesPerEvent: body.maxAttendeesPerEvent,
      maxTeamMembers: body.maxTeamMembers,
      storageGb: body.storageGb,
      
      sortOrder: body.sortOrder !== undefined ? body.sortOrder : 0,
    };
    
    planData.isFree = planData.priceKobo === 0;
    
    // Handle Features Array
    if (body.features && Array.isArray(body.features)) {
      planData.features = body.features.map((feature: any) => ({
        name: feature.name,
        description: feature.description || '',
        included: feature.included !== undefined ? feature.included : true,
        limit: feature.limit,
        unit: feature.unit
      }));
    } else {
      planData.features = [];
    }
    
    // Handle Discounts Array
    if (body.discounts && Array.isArray(body.discounts)) {
      planData.discounts = body.discounts.map((discount: any) => {
        if (!discount.name || !discount.discountType || discount.discountValue === undefined) {
          throw new Error('Discount missing required fields: name, discountType, discountValue');
        }
        
        if (!Object.values(DiscountType).includes(discount.discountType)) {
          throw new Error(`Invalid discount type. Must be: ${Object.values(DiscountType).join(', ')}`);
        }
        
        return {
          name: discount.name,
          description: discount.description || '',
          discountType: discount.discountType,
          discountValue: discount.discountValue,
          interval: discount.interval || null,
          startsAt: discount.startsAt ? new Date(discount.startsAt) : null,
          endsAt: discount.endsAt ? new Date(discount.endsAt) : null,
          isActive: discount.isActive !== undefined ? discount.isActive : true
        };
      });
    } else {
      planData.discounts = [];
    }
    
    // Handle Coupons Array
    if (body.coupons && Array.isArray(body.coupons)) {
      planData.coupons = body.coupons.map((coupon: any) => {
        if (!coupon.code || !coupon.discountType || coupon.discountValue === undefined) {
          throw new Error('Coupon missing required fields: code, discountType, discountValue');
        }
        
        if (!Object.values(DiscountType).includes(coupon.discountType)) {
          throw new Error(`Invalid discount type. Must be: ${Object.values(DiscountType).join(', ')}`);
        }
        
        if (coupon.status && !Object.values(CouponStatus).includes(coupon.status)) {
          throw new Error(`Invalid coupon status. Must be: ${Object.values(CouponStatus).join(', ')}`);
        }
        
        return {
          code: coupon.code.toUpperCase(),
          description: coupon.description || '',
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxRedemptions: coupon.maxRedemptions,
          redemptionCount: 0,
          minAmountKobo: coupon.minAmountKobo,
          applicableIntervals: coupon.applicableIntervals || [],
          status: coupon.status || CouponStatus.ACTIVE,
          expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt) : null,
          createdAt: new Date()
        };
      });
    } else {
      planData.coupons = [];
    }
    
    // Handle Metadata Map
    if (body.metadata) {
      if (body.metadata instanceof Map) {
        planData.metadata = body.metadata;
      } else if (typeof body.metadata === 'object') {
        const metadataMap = new Map();
        Object.entries(body.metadata).forEach(([key, value]) => {
          metadataMap.set(key, value);
        });
        planData.metadata = metadataMap;
      }
    } else {
      planData.metadata = new Map();
    }
    
    // Create the Plan
    const plan = new Plan(planData);
    await plan.save();
    
    // Populate references for response
    await plan.populate('tierId intervalId');
    
    return NextResponse.json({
      success: true,
      data: plan,
      message: `Plan '${plan.name}' created successfully with ${tier.name} / ${interval.name}`
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating plan:', error);
    
    if (error.message === 'Unauthorized. Please login.') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }
    
    if (error.message === 'Forbidden. Admin access required.') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Plan slug already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/plans - Update an existing plan
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireSuperAdmin();
    const body = await req.json();
    
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      );
    }
    
    const plan = await Plan.findById(id);
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }
    
    // Update fields
    if (updates.name) plan.name = updates.name;
    if (updates.description !== undefined) plan.description = updates.description;
    if (updates.isActive !== undefined) plan.isActive = updates.isActive;
    if (updates.isPublic !== undefined) plan.isPublic = updates.isPublic;
    if (updates.priceKobo !== undefined) plan.priceKobo = updates.priceKobo;
    if (updates.trialDays !== undefined) plan.trialDays = updates.trialDays;
    if (updates.maxEvents !== undefined) plan.maxEvents = updates.maxEvents;
    if (updates.maxAttendeesPerEvent !== undefined) plan.maxAttendeesPerEvent = updates.maxAttendeesPerEvent;
    if (updates.maxTeamMembers !== undefined) plan.maxTeamMembers = updates.maxTeamMembers;
    if (updates.storageGb !== undefined) plan.storageGb = updates.storageGb;
    if (updates.sortOrder !== undefined) plan.sortOrder = updates.sortOrder;
    if (updates.features !== undefined) plan.features = updates.features;
    if (updates.discounts !== undefined) plan.discounts = updates.discounts;
    if (updates.coupons !== undefined) plan.coupons = updates.coupons;
    
    plan.isFree = plan.priceKobo === 0;
    
    // If updating tier or interval, validate they exist
    if (updates.tierId) {
      const newTier = await PlanTier.findById(updates.tierId);
      if (!newTier) {
        return NextResponse.json({ success: false, error: 'New tier not found' }, { status: 400 });
      }
      plan.tierId = newTier._id;
      plan.tier = newTier.slug;
    }
    
    if (updates.intervalId) {
      const newInterval = await PlanInterval.findById(updates.intervalId);
      if (!newInterval) {
        return NextResponse.json({ success: false, error: 'New interval not found' }, { status: 400 });
      }
      plan.intervalId = newInterval._id;
      plan.interval = newInterval.slug;
    }
    
    await plan.save();
    await plan.populate('tierId intervalId');
    
    return NextResponse.json({
      success: true,
      data: plan,
      message: `Plan '${plan.name}' updated successfully`
    });
    
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/plans - Delete a plan
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireSuperAdmin();
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      );
    }
    
    const plan = await Plan.findByIdAndDelete(id);
    
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Plan '${plan.name}' deleted successfully`
    });
    
  } catch (error: any) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}