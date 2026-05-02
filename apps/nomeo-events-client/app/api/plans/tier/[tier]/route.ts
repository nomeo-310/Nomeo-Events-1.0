import { connectDB } from '@/lib/mongoose';
import { Plan } from '@/models/plan';
import { ApiResponse, PlanTier, PlanDocument } from '@/types/plan-type';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ tier: string }> }) {
  try {
    const { tier } = await params;

    await connectDB();

    // ✅ validate tier
    if (!Object.values(PlanTier).includes(tier as PlanTier)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid plan tier',
          timestamp: new Date().toISOString()
        } as ApiResponse,
        { status: 400 }
      );
    }

    const plans = await Plan.find({
      tier: tier as PlanTier,
      isActive: true
    })
      .sort({ interval: 1 })
      .lean();

    // ✅ helper inline (so it never crashes again)
    const safeMetadata = (metadata: any) => {
      if (metadata instanceof Map) return Object.fromEntries(metadata);
      if (typeof metadata === 'object' && metadata !== null) return metadata;
      return {};
    };

    const formattedPlans: PlanDocument[] = plans.map((plan: any) => ({
      ...plan,
      _id: plan._id?.toString(),

      // ✅ safe dates
      createdAt: plan.createdAt
        ? new Date(plan.createdAt).toISOString()
        : undefined,

      updatedAt: plan.updatedAt
        ? new Date(plan.updatedAt).toISOString()
        : undefined,

      metadata: safeMetadata(plan.metadata)
    }));

    return NextResponse.json({
      success: true,
      data: {
        tier,
        plans: formattedPlans,
        count: formattedPlans.length
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