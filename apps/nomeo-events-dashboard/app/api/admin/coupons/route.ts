import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan, CouponStatus, DiscountType, ICoupon } from '@/models/plan';
import { PlanInterval } from '@/models/plan-interval';
import { requireAdmin } from '@/lib/admin/authorization';

// GET /api/admin/coupons - List all coupons across all plans
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireAdmin();
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const code = searchParams.get('code');
    const planSlug = searchParams.get('planSlug');
    const tier = searchParams.get('tier');
    const interval = searchParams.get('interval');
    
    // Build query for plans
    let planQuery: any = {};
    
    if (tier) {
      planQuery.tier = tier;
    }
    
    if (interval) {
      planQuery.interval = interval;
    }
    
    if (planSlug) {
      planQuery.slug = planSlug;
    }
    
    // Only get plans that have coupons
    planQuery.coupons = { $exists: true, $not: { $size: 0 } };
    
    const plans = await Plan.find(planQuery)
      .select('name slug tier interval coupons')
      .populate('tierId')
      .populate('intervalId');
    
    // Extract and flatten all coupons (using index as identifier since no _id)
    let allCoupons: any[] = [];
    
    for (const plan of plans) {
      plan.coupons.forEach((coupon: any, index: number) => {
        allCoupons.push({
          couponIndex: index,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxRedemptions: coupon.maxRedemptions,
          redemptionCount: coupon.redemptionCount,
          minAmountKobo: coupon.minAmountKobo,
          applicableIntervals: coupon.applicableIntervals,
          status: coupon.status,
          expiresAt: coupon.expiresAt,
          createdAt: coupon.createdAt,
          plan: {
            id: plan._id,
            name: plan.name,
            slug: plan.slug,
            tier: plan.tier,
            interval: plan.interval,
            tierDetails: plan.tierId,
            intervalDetails: plan.intervalId
          }
        });
      });
    }
    
    // Apply filters
    if (status) {
      allCoupons = allCoupons.filter(c => c.status === status);
    }
    
    if (code) {
      allCoupons = allCoupons.filter(c => 
        c.code.toLowerCase().includes(code.toLowerCase())
      );
    }
    
    // Sort by createdAt
    allCoupons.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Calculate stats
    const stats = {
      total: allCoupons.length,
      active: allCoupons.filter(c => c.status === CouponStatus.ACTIVE).length,
      expired: allCoupons.filter(c => c.status === CouponStatus.EXPIRED).length,
      depleted: allCoupons.filter(c => c.status === CouponStatus.DEPLETED).length,
      disabled: allCoupons.filter(c => c.status === CouponStatus.DISABLED).length,
      totalRedemptions: allCoupons.reduce((sum, c) => sum + c.redemptionCount, 0),
      uniquePlans: new Set(allCoupons.map(c => c.plan.id)).size
    };
    
    return NextResponse.json({
      success: true,
      data: allCoupons,
      stats,
      count: allCoupons.length,
      user: { role: user.role, isSuperAdmin: user.isSuperAdmin, email: user.email }
    });
    
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    if (error.message === 'Unauthorized. Please login.')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden. Admin access required.')
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/coupons - Create a new coupon for a plan
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const body = await req.json();
    
    const { 
      planId, 
      planSlug,
      code, 
      discountType, 
      discountValue, 
      description,
      maxRedemptions,
      minAmountKobo,
      applicableIntervals,
      status,
      expiresAt
    } = body;
    
    // Validate required fields
    if ((!planId && !planSlug) || !code || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: planId/planSlug, code, discountType, discountValue' },
        { status: 400 }
      );
    }
    
    // Validate discount type
    if (!Object.values(DiscountType).includes(discountType)) {
      return NextResponse.json(
        { success: false, error: `Invalid discount type. Must be: ${Object.values(DiscountType).join(', ')}` },
        { status: 400 }
      );
    }
    
    // Find the plan
    let plan;
    if (planId) {
      plan = await Plan.findById(planId);
    } else {
      plan = await Plan.findOne({ slug: planSlug });
    }
    
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }
    
    // Check if plan is active
    if (!plan.isActive) {
      return NextResponse.json(
        { success: false, error: 'Cannot add coupon to inactive plan' },
        { status: 400 }
      );
    }
    
    // Check for duplicate coupon code
    const upperCode = code.toUpperCase();
    const existingCoupon = plan.coupons.find((c: ICoupon) => c.code === upperCode);
    if (existingCoupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon code already exists for this plan' },
        { status: 409 }
      );
    }
    
    // Validate applicable intervals if provided
    let validatedIntervals: string[] = [];
    if (applicableIntervals && applicableIntervals.length > 0) {
      const intervals = await PlanInterval.find({ slug: { $in: applicableIntervals } });
      validatedIntervals = intervals.map(i => i.slug);
      
      if (validatedIntervals.length !== applicableIntervals.length) {
        return NextResponse.json(
          { success: false, error: 'One or more specified intervals do not exist' },
          { status: 400 }
        );
      }
    }
    
    // Create new coupon
    const newCoupon: ICoupon = {
      code: upperCode,
      description: description || '',
      discountType,
      discountValue,
      maxRedemptions,
      redemptionCount: 0,
      minAmountKobo,
      applicableIntervals: validatedIntervals,
      status: status || CouponStatus.ACTIVE,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdAt: new Date(),
    };
    
    plan.coupons.push(newCoupon);
    await plan.save();
    
    const couponIndex = plan.coupons.length - 1;
    const addedCoupon = plan.coupons[couponIndex];
    
    return NextResponse.json({
      success: true,
      data: {
        couponIndex,
        code: addedCoupon.code,
        description: addedCoupon.description,
        discountType: addedCoupon.discountType,
        discountValue: addedCoupon.discountValue,
        maxRedemptions: addedCoupon.maxRedemptions,
        redemptionCount: addedCoupon.redemptionCount,
        minAmountKobo: addedCoupon.minAmountKobo,
        applicableIntervals: addedCoupon.applicableIntervals,
        status: addedCoupon.status,
        expiresAt: addedCoupon.expiresAt,
        createdAt: addedCoupon.createdAt,
        plan: {
          id: plan._id,
          name: plan.name,
          slug: plan.slug,
          tier: plan.tier,
          interval: plan.interval
        }
      },
      message: `Coupon '${upperCode}' created for plan '${plan.name}' by ${user.email}`
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    if (error.message === 'Unauthorized. Please login.')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden. Admin access required.')
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}