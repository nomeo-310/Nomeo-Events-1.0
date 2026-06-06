import { connectDB } from '@/lib/mongoose';
import { Plan } from '@/models/plan';
import { ApiResponse, DiscountType, CouponStatus } from '@/types/plan-type';
import { NextRequest, NextResponse } from 'next/server';

function formatPrice(priceKobo: number): string {
  return `₦${(priceKobo / 100).toLocaleString('en-NG')}`;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { code, planId, interval } = body;
    
    if (!code || !planId || !interval) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: code, planId, and interval are required',
        timestamp: new Date().toISOString()
      } as ApiResponse, { status: 400 });
    }
    
    const plan = await Plan.findById(planId);
    
    if (!plan) {
      return NextResponse.json({
        success: false,
        error: 'Plan not found',
        timestamp: new Date().toISOString()
      } as ApiResponse, { status: 404 });
    }
    
    const coupon = plan.coupons?.find(
      (c: any) => c.code === code.toUpperCase()
    );
    
    if (!coupon) {
      return NextResponse.json({
        success: false,
        data: { valid: false, message: 'Invalid coupon code' },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
    
    if (coupon.status !== CouponStatus.ACTIVE) {
      return NextResponse.json({
        success: false,
        data: { valid: false, message: 'Coupon is no longer active' },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
    
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return NextResponse.json({
        success: false,
        data: { valid: false, message: 'Coupon has expired' },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
    
    if (coupon.maxRedemptions && coupon.redemptionCount >= coupon.maxRedemptions) {
      return NextResponse.json({
        success: false,
        data: { valid: false, message: 'Coupon has reached maximum redemptions' },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
    
    if (coupon.applicableIntervals?.length && !coupon.applicableIntervals.includes(interval)) {
      return NextResponse.json({
        success: false,
        data: { valid: false, message: `Coupon not applicable for ${interval} billing` },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
    
    if (coupon.minAmountKobo && plan.priceKobo < coupon.minAmountKobo) {
      return NextResponse.json({
        success: false,
        data: { valid: false, message: `Minimum purchase of ${formatPrice(coupon.minAmountKobo)} required` },
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
    
    let discountAmount = 0;
    let discountPercentage = 0;
    
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountPercentage = coupon.discountValue;
      discountAmount = (plan.priceKobo * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
      discountPercentage = Math.round((discountAmount / plan.priceKobo) * 100);
    }
    
    return NextResponse.json({
      success: true,
      data: { 
        valid: true, 
        discountAmount, 
        discountPercentage, 
        message: 'Coupon applied successfully!' 
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error) {
    console.error('Failed to validate coupon:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to validate coupon',
      timestamp: new Date().toISOString()
    } as ApiResponse, { status: 500 });
  }
}