import { connectDB } from "@/lib/mongoose";
import { Plan } from "@/models/plan";
import { PlanInterval } from "@/models/plan-interval";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const intervals = await PlanInterval.find({}).sort({ sortOrder: 1 });
    
    const intervalsWithCounts = await Promise.all(intervals.map(async (interval) => {
      const planCount = await Plan.countDocuments({ interval: interval.slug });
      return {
        ...interval.toObject(),
        planCount,
        canDelete: planCount === 0 && !interval.isActive
      };
    }));
    
    return NextResponse.json({ success: true, data: intervalsWithCounts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}