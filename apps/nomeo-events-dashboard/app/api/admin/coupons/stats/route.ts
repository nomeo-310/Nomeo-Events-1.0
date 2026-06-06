import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan, CouponStatus } from '@/models/plan';
import { requireAdmin } from '@/lib/admin/authorization';

// GET /api/admin/coupons/stats - Get coupon analytics
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireAdmin();
    
    const plans = await Plan.find({ coupons: { $exists: true, $not: { $size: 0 } } })
      .select('coupons');
    
    let allCoupons: any[] = [];
    for (const plan of plans) {
      allCoupons.push(...plan.coupons);
    }
    
    const stats = {
      total: allCoupons.length,
      byStatus: {
        active: allCoupons.filter(c => c.status === CouponStatus.ACTIVE).length,
        expired: allCoupons.filter(c => c.status === CouponStatus.EXPIRED).length,
        depleted: allCoupons.filter(c => c.status === CouponStatus.DEPLETED).length,
        disabled: allCoupons.filter(c => c.status === CouponStatus.DISABLED).length
      },
      byDiscountType: {
        percentage: allCoupons.filter(c => c.discountType === 'percentage').length,
        fixed: allCoupons.filter(c => c.discountType === 'fixed').length
      },
      totalRedemptions: allCoupons.reduce((sum, c) => sum + c.redemptionCount, 0),
      averageRedemptionRate: allCoupons.length > 0 
        ? allCoupons.reduce((sum, c) => {
            const maxRedemptions = c.maxRedemptions || 0;
            const rate = maxRedemptions > 0 ? (c.redemptionCount / maxRedemptions) * 100 : 0;
            return sum + rate;
          }, 0) / allCoupons.length
        : 0,
      expiringSoon: allCoupons.filter(c => {
        if (!c.expiresAt || c.status !== CouponStatus.ACTIVE) return false;
        const daysUntilExpiry = (new Date(c.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length,
      expired: allCoupons.filter(c => {
        if (!c.expiresAt) return false;
        return new Date(c.expiresAt) < new Date();
      }).length
    };
    
    return NextResponse.json({
      success: true,
      data: stats,
      user: { role: user.role, email: user.email }
    });
    
  } catch (error: any) {
    console.error('Error fetching coupon stats:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}