// app/api/events/upcoming/route.ts
import { connectDB } from "@/lib/mongoose";
import { Event, EventStatus } from "@/models/event";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  await connectDB();
  
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '8');
  const category = searchParams.get('category');
  
  try {
    let query: any = {
      status: EventStatus.PUBLISHED,
      startDate: { $gte: new Date() },
      isPublic: true
    };
    
    if (category) query.category = category;
    
    const events = await Event.find(query)
      .sort({ startDate: 1, featured: -1 })
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