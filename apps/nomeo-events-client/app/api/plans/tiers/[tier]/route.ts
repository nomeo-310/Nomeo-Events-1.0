import { connectDB } from '@/lib/mongoose';
import { Plan } from '@/models/plan';
import { PlanTier } from '@/models/plan-tier';
import { ApiResponse, PlanDocument } from '@/types/plan-type';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ tier: string }> }) {
  try {
    const { tier } = await params;

    await connectDB();

    // ✅ validate tier
    if (typeof tier !== 'string' || tier.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid plan tier',
          timestamp: new Date().toISOString()
        } as ApiResponse,
        { status: 400 }
      );
    }

    // ✅ Get tier details from PlanTier collection (for metadata)
    const tierDetails = await PlanTier.findOne({ slug: tier, isActive: true }).lean();

    // ✅ Find all plans for this tier
    const plans = await Plan.find({ tier, isActive: true })
      .populate('tierId')
      .populate('intervalId')
      .sort({ sortOrder: 1, interval: 1 })
      .lean();

    // ✅ helper for safe metadata
    const safeMetadata = (metadata: any) => {
      if (metadata instanceof Map) return Object.fromEntries(metadata);
      if (typeof metadata === 'object' && metadata !== null) return metadata;
      return {};
    };

    const formattedPlans: PlanDocument[] = plans.map((plan: any) => ({
      ...plan,
      _id: plan._id?.toString(),
      
      // Extract tier slug from populated data or use existing
      tier: plan.tierId ? (plan.tierId as any).slug : plan.tier,
      interval: plan.intervalId ? (plan.intervalId as any).slug : plan.interval,
      
      // Keep IDs for reference
      tierId: plan.tierId ? (plan.tierId as any)._id?.toString() : undefined,
      intervalId: plan.intervalId ? (plan.intervalId as any)._id?.toString() : undefined,

      // ✅ safe dates
      createdAt: plan.createdAt ? new Date(plan.createdAt).toISOString() : undefined,
      updatedAt: plan.updatedAt ? new Date(plan.updatedAt).toISOString() : undefined,

      metadata: safeMetadata(plan.metadata)
    }));

    return NextResponse.json({
      success: true,
      data: {
        tier,
        tierDetails: tierDetails ? {
          _id: tierDetails._id.toString(),
          name: tierDetails.name,
          slug: tierDetails.slug,
          description: tierDetails.description,
          sortOrder: tierDetails.sortOrder,
          isActive: tierDetails.isActive,
        } : null,
        plans: formattedPlans,
        count: formattedPlans.length,
        intervals: [...new Set(formattedPlans.map(p => p.interval))] // Unique intervals available
      },
      timestamp: new Date().toISOString()
    } as ApiResponse);
  } catch (error: any) {
    console.error('Failed to fetch plans for tier:', {
      message: error?.message,
      stack: error?.stack
    });

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch plans for tier',
        timestamp: new Date().toISOString()
      } as ApiResponse,
      { status: 500 }
    );
  }
}