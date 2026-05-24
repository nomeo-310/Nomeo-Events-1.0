// app/api/admin/plans/[slug]/coupons/[couponCode]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan } from '@/models/plan';
import { requireAdmin } from '@/lib/admin/authorization';

// DELETE /api/admin/plans/[slug]/coupons/[couponCode] - Remove coupon
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; couponCode: string } }
) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const plan = await Plan.findOne({ slug: params.slug });
    
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }
    
    const couponIndex = plan.coupons.findIndex(
      (c: any) => c.code === params.couponCode.toUpperCase()
    );
    
    if (couponIndex === -1) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }
    
    const removedCoupon = plan.coupons[couponIndex];
    plan.coupons.splice(couponIndex, 1);
    await plan.save();
    
    return NextResponse.json({
      success: true,
      message: `Coupon '${removedCoupon.code}' removed successfully by ${user.email}`,
      data: plan.coupons
    });
    
  } catch (error: any) {
    console.error('Error removing coupon:', error);
    
    if (error.message === 'Unauthorized. Please login.') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden. Admin access required.') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}