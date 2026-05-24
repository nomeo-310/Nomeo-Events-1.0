// app/api/admin/plans/[slug]/activate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan } from '@/models/plan';
import { requireAdmin } from '@/lib/admin/authorization';

export async function PATCH( req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    await connectDB();
    const user = await requireAdmin();
    const plan = await Plan.findOneAndUpdate(
      { slug: params.slug },
      { $set: { isActive: true } },
      { new: true }
    );
    
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: plan,
      message: `Plan '${plan.name}' activated successfully by ${user.email}`
    });
    
  } catch (error: any) {
    console.error('Error activating plan:', error);
    
    if (error.message === 'Unauthorized. Please login.') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Forbidden. Admin access required.') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}