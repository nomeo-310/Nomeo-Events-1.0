import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan, CouponStatus, DiscountType, ICoupon } from '@/models/plan';
import { PlanInterval } from '@/models/plan-interval';
import { requireAdmin } from '@/lib/admin/authorization';
import mongoose from 'mongoose';

// GET - Get a single coupon by plan ID and coupon index
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string; couponIndex: string }> }
) {
  const { planId, couponIndex } = await params;
  try {
    await connectDB();
    const user = await requireAdmin();
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json({ success: false, error: 'Invalid plan ID' }, { status: 400 });
    }
    
    const index = parseInt(couponIndex);
    if (isNaN(index) || index < 0) {
      return NextResponse.json({ success: false, error: 'Invalid coupon index' }, { status: 400 });
    }
    
    const plan = await Plan.findById(planId)
      .populate('tierId')
      .populate('intervalId');
    
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }
    
    if (index >= plan.coupons.length) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }
    
    const coupon = plan.coupons[index];
    
    return NextResponse.json({
      success: true,
      data: {
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
      },
      user: { role: user.role, isSuperAdmin: user.isSuperAdmin, email: user.email }
    });
    
  } catch (error: any) {
    console.error('Error fetching coupon:', error);
    if (error.message === 'Unauthorized. Please login.')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden. Admin access required.')
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Update a coupon
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string; couponIndex: string }> }
) {
  const { planId, couponIndex } = await params;
  try {
    await connectDB();
    const user = await requireAdmin();
    const body = await req.json();
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json({ success: false, error: 'Invalid plan ID' }, { status: 400 });
    }
    
    const index = parseInt(couponIndex);
    if (isNaN(index) || index < 0) {
      return NextResponse.json({ success: false, error: 'Invalid coupon index' }, { status: 400 });
    }
    
    const plan = await Plan.findById(planId);
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }
    
    if (index >= plan.coupons.length) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }
    
    const coupon = plan.coupons[index];
    
    // Update fields
    if (body.description !== undefined) coupon.description = body.description;
    if (body.discountType) {
      if (!Object.values(DiscountType).includes(body.discountType)) {
        return NextResponse.json(
          { success: false, error: `Invalid discount type. Must be: ${Object.values(DiscountType).join(', ')}` },
          { status: 400 }
        );
      }
      coupon.discountType = body.discountType;
    }
    if (body.discountValue !== undefined) coupon.discountValue = body.discountValue;
    if (body.maxRedemptions !== undefined) coupon.maxRedemptions = body.maxRedemptions;
    if (body.minAmountKobo !== undefined) coupon.minAmountKobo = body.minAmountKobo;
    if (body.applicableIntervals) {
      // Validate intervals
      const intervals = await PlanInterval.find({ slug: { $in: body.applicableIntervals } });
      if (intervals.length !== body.applicableIntervals.length) {
        return NextResponse.json(
          { success: false, error: 'One or more specified intervals do not exist' },
          { status: 400 }
        );
      }
      coupon.applicableIntervals = body.applicableIntervals;
    }
    if (body.status) {
      if (!Object.values(CouponStatus).includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be: ${Object.values(CouponStatus).join(', ')}` },
          { status: 400 }
        );
      }
      coupon.status = body.status;
    }
    if (body.expiresAt !== undefined) {
      coupon.expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    }
    
    await plan.save();
    
    const updatedCoupon = plan.coupons[index];
    
    return NextResponse.json({
      success: true,
      data: {
        couponIndex: index,
        code: updatedCoupon.code,
        description: updatedCoupon.description,
        discountType: updatedCoupon.discountType,
        discountValue: updatedCoupon.discountValue,
        maxRedemptions: updatedCoupon.maxRedemptions,
        redemptionCount: updatedCoupon.redemptionCount,
        minAmountKobo: updatedCoupon.minAmountKobo,
        applicableIntervals: updatedCoupon.applicableIntervals,
        status: updatedCoupon.status,
        expiresAt: updatedCoupon.expiresAt,
        plan: {
          id: plan._id,
          name: plan.name,
          slug: plan.slug,
          tier: plan.tier,
          interval: plan.interval
        }
      },
      message: `Coupon '${coupon.code}' updated by ${user.email}`
    });
    
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    if (error.message === 'Unauthorized. Please login.')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden. Admin access required.')
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a coupon
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string; couponIndex: string }> }
) {
  const { planId, couponIndex } = await params;
  try {
    await connectDB();
    const user = await requireAdmin();
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return NextResponse.json({ success: false, error: 'Invalid plan ID' }, { status: 400 });
    }
    
    const index = parseInt(couponIndex);
    if (isNaN(index) || index < 0) {
      return NextResponse.json({ success: false, error: 'Invalid coupon index' }, { status: 400 });
    }
    
    const plan = await Plan.findById(planId);
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }
    
    if (index >= plan.coupons.length) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }
    
    const couponCode = plan.coupons[index].code;
    plan.coupons.splice(index, 1);
    await plan.save();
    
    return NextResponse.json({
      success: true,
      message: `Coupon '${couponCode}' deleted by ${user.email}`,
      data: { 
        deletedCouponCode: couponCode,
        planId: plan._id,
        planName: plan.name
      }
    });
    
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    if (error.message === 'Unauthorized. Please login.')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden. Admin access required.')
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}