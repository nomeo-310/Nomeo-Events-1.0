// app/api/admin/plans/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan, PlanTier, PlanInterval, DiscountType, CouponStatus } from '@/models/plan';
import { requireAdmin } from '@/lib/admin/authorization';

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
      .sort({ sortOrder: 1, tier: 1, interval: 1 });
    
    return NextResponse.json({
      success: true,
      data: plans,
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

// POST /api/admin/plans - Create a new plan with full features
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const body = await req.json();
    
    // ─── Validate Required Fields ────────────────────────────────────────────
    const requiredFields = ['name', 'slug', 'tier', 'interval', 'priceKobo'];
    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // ─── Validate Enums ──────────────────────────────────────────────────────
    if (!Object.values(PlanTier).includes(body.tier)) {
      return NextResponse.json(
        { success: false, error: `Invalid tier. Must be one of: ${Object.values(PlanTier).join(', ')}` },
        { status: 400 }
      );
    }
    
    if (!Object.values(PlanInterval).includes(body.interval)) {
      return NextResponse.json(
        { success: false, error: `Invalid interval. Must be one of: ${Object.values(PlanInterval).join(', ')}` },
        { status: 400 }
      );
    }
    
    // ─── Check for existing plan ────────────────────────────────────────────
    const existingPlan = await Plan.findOne({ slug: body.slug });
    if (existingPlan) {
      return NextResponse.json(
        { success: false, error: `Plan with slug '${body.slug}' already exists` },
        { status: 409 }
      );
    }
    
    // ─── Prepare Plan Data ───────────────────────────────────────────────────
    const planData: any = {
      name: body.name,
      slug: body.slug.toLowerCase(),
      tier: body.tier,
      description: body.description || '',
      isActive: body.isActive !== undefined ? body.isActive : true,
      isPublic: body.isPublic !== undefined ? body.isPublic : true,
      priceKobo: body.priceKobo,
      currency: body.currency || 'NGN',
      interval: body.interval,
      paystackPlanCode: body.paystackPlanCode || null,
      trialDays: body.trialDays !== undefined ? body.trialDays : (body.priceKobo === 0 ? 14 : 0),
      
      // Limits
      maxEvents: body.maxEvents,
      maxAttendeesPerEvent: body.maxAttendeesPerEvent,
      maxTeamMembers: body.maxTeamMembers,
      storageGb: body.storageGb,
      
      sortOrder: body.sortOrder !== undefined ? body.sortOrder : 0,
    };
    
    // Auto-set isFree based on price
    planData.isFree = planData.priceKobo === 0;
    
    // ─── Handle Features Array ───────────────────────────────────────────────
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
    
    // ─── Handle Discounts Array ──────────────────────────────────────────────
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
    
    // ─── Handle Coupons Array ────────────────────────────────────────────────
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
    
    // ─── Handle Metadata Map ─────────────────────────────────────────────────
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
    
    // ─── Create the Plan ─────────────────────────────────────────────────────
    const plan = new Plan(planData);
    await plan.save();
    
    return NextResponse.json({
      success: true,
      data: plan,
      message: `Plan '${plan.name}' created successfully by ${user.email}`
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