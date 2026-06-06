import { connectDB } from "@/lib/mongoose";
import { Plan } from "@/models/plan";
import { PlanTier } from "@/models/plan-tier";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    const tiers = await PlanTier.find({}).sort({ sortOrder: 1 });
    
    const tiersWithCounts = await Promise.all(tiers.map(async (tier) => {
      const planCount = await Plan.countDocuments({ tier: tier.slug });
      return {
        ...tier.toObject(),
        planCount,
        canDelete: planCount === 0 && !tier.isActive
      };
    }));
    
    return NextResponse.json({ success: true, data: tiersWithCounts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}