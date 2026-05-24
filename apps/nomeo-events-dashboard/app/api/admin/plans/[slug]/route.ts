// app/api/admin/plans/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan, PlanTier, PlanInterval, DiscountType, CouponStatus } from '@/models/plan';
import { requireAdmin, requireSuperAdmin } from '@/lib/admin/authorization';

// GET /api/admin/plans/[slug] - Get single plan
export async function GET( req: NextRequest, { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const plan = await Plan.findOne({ slug: (await params).slug });
    
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: plan,
      user: { role: user.role, isSuperAdmin: user.isSuperAdmin, email: user.email }
    });
    
  } catch (error: any) {
    console.error('Error fetching plan:', error);
    
    if (error.message === 'Unauthorized. Please login.') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden. Admin access required.') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/plans/[slug] - Update plan with full features
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const updates = await req.json();
    
    // Prevent updating slug to avoid conflicts
    if (updates.slug) {
      delete updates.slug;
    }
    
    // Find existing plan
    const existingPlan = await Plan.findOne({ slug: (await params).slug });
    if (!existingPlan) {
      return NextResponse.json(
        { success: false, error: 'Plan not found' },
        { status: 404 }
      );
    }
    
    // ─── Prepare Update Data ─────────────────────────────────────────────────
    const updateData: any = {};
    
    // Basic fields
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.tier !== undefined) {
      if (!Object.values(PlanTier).includes(updates.tier)) {
        return NextResponse.json(
          { success: false, error: `Invalid tier. Must be one of: ${Object.values(PlanTier).join(', ')}` },
          { status: 400 }
        );
      }
      updateData.tier = updates.tier;
    }
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;
    
    if (updates.priceKobo !== undefined) {
      updateData.priceKobo = updates.priceKobo;
      updateData.isFree = updates.priceKobo === 0;
    }
    
    if (updates.currency !== undefined) updateData.currency = updates.currency;
    if (updates.interval !== undefined) {
      if (!Object.values(PlanInterval).includes(updates.interval)) {
        return NextResponse.json(
          { success: false, error: `Invalid interval. Must be one of: ${Object.values(PlanInterval).join(', ')}` },
          { status: 400 }
        );
      }
      updateData.interval = updates.interval;
    }
    
    if (updates.paystackPlanCode !== undefined) updateData.paystackPlanCode = updates.paystackPlanCode;
    if (updates.trialDays !== undefined) updateData.trialDays = updates.trialDays;
    
    // Limits
    if (updates.maxEvents !== undefined) updateData.maxEvents = updates.maxEvents;
    if (updates.maxAttendeesPerEvent !== undefined) updateData.maxAttendeesPerEvent = updates.maxAttendeesPerEvent;
    if (updates.maxTeamMembers !== undefined) updateData.maxTeamMembers = updates.maxTeamMembers;
    if (updates.storageGb !== undefined) updateData.storageGb = updates.storageGb;
    
    if (updates.sortOrder !== undefined) updateData.sortOrder = updates.sortOrder;
    
    // ─── Handle Features Update ──────────────────────────────────────────────
    if (updates.features !== undefined) {
      if (Array.isArray(updates.features)) {
        updateData.features = updates.features.map((feature: any) => ({
          name: feature.name,
          description: feature.description || '',
          included: feature.included !== undefined ? feature.included : true,
          limit: feature.limit,
          unit: feature.unit
        }));
      } else {
        return NextResponse.json(
          { success: false, error: 'features must be an array' },
          { status: 400 }
        );
      }
    }
    
    // ─── Handle Discounts Update ─────────────────────────────────────────────
    if (updates.discounts !== undefined) {
      if (Array.isArray(updates.discounts)) {
        updateData.discounts = updates.discounts.map((discount: any) => {
          if (!discount.name || !discount.discountType || discount.discountValue === undefined) {
            throw new Error('Discount missing required fields');
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
        return NextResponse.json(
          { success: false, error: 'discounts must be an array' },
          { status: 400 }
        );
      }
    }
    
    // ─── Handle Coupons Update ───────────────────────────────────────────────
    if (updates.coupons !== undefined) {
      if (Array.isArray(updates.coupons)) {
        updateData.coupons = updates.coupons.map((coupon: any) => {
          if (!coupon.code || !coupon.discountType || coupon.discountValue === undefined) {
            throw new Error('Coupon missing required fields');
          }
          return {
            code: coupon.code.toUpperCase(),
            description: coupon.description || '',
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            maxRedemptions: coupon.maxRedemptions,
            redemptionCount: coupon.redemptionCount || 0,
            minAmountKobo: coupon.minAmountKobo,
            applicableIntervals: coupon.applicableIntervals || [],
            status: coupon.status || CouponStatus.ACTIVE,
            expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt) : null,
            createdAt: coupon.createdAt || new Date()
          };
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'coupons must be an array' },
          { status: 400 }
        );
      }
    }
    
    // ─── Handle Metadata Update ─────────────────────────────────────────────
    if (updates.metadata !== undefined) {
      if (updates.metadata instanceof Map) {
        updateData.metadata = updates.metadata;
      } else if (typeof updates.metadata === 'object') {
        const metadataMap = new Map();
        Object.entries(updates.metadata).forEach(([key, value]) => {
          metadataMap.set(key, value);
        });
        updateData.metadata = metadataMap;
      }
    }
    
    // ─── Apply Update ───────────────────────────────────────────────────────
    const plan = await Plan.findOneAndUpdate(
      { slug: await (await params).slug },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({
      success: true,
      data: plan,
      message: `Plan '${plan?.name}' updated successfully by ${user.email}`
    });
    
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/plans/[slug] - Delete plan (superadmin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();
    const user = await requireSuperAdmin();
    const plan = await Plan.findOneAndDelete({ slug: (await params).slug });
    
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Plan '${plan.name}' deleted successfully by ${user.email}`,
      data: { slug: (await params).slug }
    });
    
  } catch (error: any) {
    console.error('Error deleting plan:', error);
    
    if (error.message === 'Unauthorized. Please login.') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden. Super admin access required.') {
      return NextResponse.json({ success: false, error: 'Forbidden - Only superadmin can delete plans' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}