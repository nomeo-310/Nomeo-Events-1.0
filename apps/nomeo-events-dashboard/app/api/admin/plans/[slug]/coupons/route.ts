// app/api/admin/plans/[slug]/coupons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan, CouponStatus, DiscountType, ICoupon } from '@/models/plan';
import { requireAdmin } from '@/lib/admin/authorization';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const plan = await Plan.findOne({ slug: params.slug });

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: plan.coupons ?? [],
      user: { role: user.role, isSuperAdmin: user.isSuperAdmin, email: user.email },
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

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const couponData = await req.json();

    if (!couponData.code || !couponData.discountType || couponData.discountValue === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required coupon fields: code, discountType, discountValue' },
        { status: 400 }
      );
    }

    if (!Object.values(DiscountType).includes(couponData.discountType)) {
      return NextResponse.json(
        { success: false, error: `Invalid discount type. Must be: ${Object.values(DiscountType).join(', ')}` },
        { status: 400 }
      );
    }

    const plan = await Plan.findOne({ slug: params.slug });
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }

    const upperCode: string = (couponData.code as string).toUpperCase();

    const existingCoupon = plan.coupons.find((c: ICoupon) => c.code === upperCode);
    if (existingCoupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon code already exists for this plan' },
        { status: 409 }
      );
    }

    // Build the new coupon, respecting ICoupon types:
    // expiresAt is Date | undefined (not null) per the interface.
    const newCoupon: ICoupon = {
      code: upperCode,
      description: couponData.description ?? '',
      discountType: couponData.discountType,
      discountValue: couponData.discountValue,
      maxRedemptions: couponData.maxRedemptions,
      redemptionCount: 0,
      minAmountKobo: couponData.minAmountKobo,
      applicableIntervals: couponData.applicableIntervals ?? [],
      status: couponData.status ?? CouponStatus.ACTIVE,
      expiresAt: couponData.expiresAt ? new Date(couponData.expiresAt) : undefined,
      createdAt: new Date(),
    };

    plan.coupons.push(newCoupon);
    await plan.save();

    return NextResponse.json(
      {
        success: true,
        data: plan.coupons,
        message: `Coupon '${upperCode}' added successfully by ${user.email}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error adding coupon:', error);
    if (error.message === 'Unauthorized. Please login.')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden. Admin access required.')
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}