// app/api/events/featured/route.ts
import { connectDB } from "@/lib/mongoose";
import { Event, EventStatus } from "@/models/event";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  await connectDB();
  
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '6');
  
  try {
    const events = await Event.find({
      status: EventStatus.PUBLISHED,
      featured: true,
      startDate: { $gte: new Date() },
      isPublic: true
    })
      .sort({ startDate: 1 })
      .limit(limit)
      .populate('organizerId', 'name email image');
    
    return NextResponse.json({
      success: true,
      data: events
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}