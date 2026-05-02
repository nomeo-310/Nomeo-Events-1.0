import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan } from '@/models/plan';
import { ApiResponse, PlansListResponse, PlanTier, PlanInterval } from '@/types/plan-type';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const tiersParam = searchParams.get('tiers');
    const intervalsParam = searchParams.get('intervals');

    const isActiveParam = searchParams.get('isActive');
    const isActive =
      isActiveParam === 'true' ? true :
      isActiveParam === 'false' ? false :
      undefined;

    const isPublicParam = searchParams.get('isPublic');
    const isPublic =
      isPublicParam === 'false' ? false : true; // default true

    const query: any = {};

    // ✅ validate enums instead of blind casting
    if (tiersParam) {
      const tiers = tiersParam
        .split(',')
        .filter(t => Object.values(PlanTier).includes(t as PlanTier));

      if (tiers.length) query.tier = { $in: tiers };
    }

    if (intervalsParam) {
      const intervals = intervalsParam
        .split(',')
        .filter(i => Object.values(PlanInterval).includes(i as PlanInterval));

      if (intervals.length) query.interval = { $in: intervals };
    }

    if (isActive !== undefined) query.isActive = isActive;
    if (isPublic !== undefined) query.isPublic = isPublic;

    const plans = await Plan.find(query)
      .sort({ sortOrder: 1, tier: 1, interval: 1 })
      .lean();

    const formattedPlans = plans.map((plan: any) => ({
      ...plan,
      _id: plan._id?.toString(),

      // ✅ safer date handling
      createdAt: plan.createdAt
        ? new Date(plan.createdAt).toISOString()
        : undefined,

      updatedAt: plan.updatedAt
        ? new Date(plan.updatedAt).toISOString()
        : undefined,

      // ✅ FIXED: safe metadata handling
      metadata:
        plan.metadata instanceof Map
          ? Object.fromEntries(plan.metadata)
          : typeof plan.metadata === 'object' && plan.metadata !== null
          ? plan.metadata
          : {},
    }));

    return NextResponse.json({
      success: true,
      data: {
        plans: formattedPlans,
        total: formattedPlans.length,
        filters: {
          tiers: tiersParam ? tiersParam.split(',') : undefined,
          intervals: intervalsParam ? intervalsParam.split(',') : undefined,
          isActive,
          isPublic,
        },
      } as PlansListResponse,
      timestamp: new Date().toISOString(),
    } as ApiResponse<PlansListResponse>);
  } catch (error: any) {
    console.error('Failed to fetch plans:', {
      message: error?.message,
      stack: error?.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch plans',
        timestamp: new Date().toISOString(),
      } as ApiResponse,
      { status: 500 }
    );
  }
}