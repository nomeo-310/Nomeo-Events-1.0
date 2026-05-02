import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan } from '@/models/plan';
import { ApiResponse, PlanDocument } from '@/types/plan-type';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    await connectDB();

    const plan = await Plan.findOne({
      slug,
      isActive: true
    }).lean();

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plan not found',
          timestamp: new Date().toISOString()
        } as ApiResponse,
        { status: 404 }
      );
    }

    // ✅ safe metadata handling
    const safeMetadata =
      plan.metadata instanceof Map
        ? Object.fromEntries(plan.metadata)
        : typeof plan.metadata === 'object' && plan.metadata !== null
        ? plan.metadata
        : {};

    const formattedPlan: PlanDocument = {
      ...plan,

      // ✅ FIXED: remove optional chaining (guaranteed to exist)
      _id: plan._id.toString(),

      // ✅ FIXED: ensure always string
      createdAt: new Date(plan.createdAt).toISOString(),
      updatedAt: new Date(plan.updatedAt).toISOString(),

      metadata: safeMetadata
    };

    return NextResponse.json({
      success: true,
      data: formattedPlan,
      timestamp: new Date().toISOString()
    } as ApiResponse<PlanDocument>);
  } catch (error: any) {
    console.error('Failed to fetch plan:', {
      message: error?.message,
      stack: error?.stack
    });

    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch plan',
        timestamp: new Date().toISOString()
      } as ApiResponse,
      { status: 500 }
    );
  }
}