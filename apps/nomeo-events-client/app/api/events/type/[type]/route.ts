// app/api/events/type/[type]/route.ts
import { connectDB } from "@/lib/mongoose";
import { Event, EventStatus } from "@/models/event";
import { NextResponse } from "next/server";

export async function GET( req: Request, { params }: { params: Promise<{ type: string }> } ) {
  const { type } = await params;

  await connectDB();
  
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || EventStatus.PUBLISHED;
  const limit = parseInt(searchParams.get('limit') || '50');
  const upcoming = searchParams.get('upcoming') === 'true';
  const category = searchParams.get('category');
  
  try {
    const eventType = decodeURIComponent(type);
    
    let query: any = { 
      type: eventType,
      status: status
    };
    
    if (category) {
      query.category = category;
    }
    
    if (upcoming) {
      query.startDate = { $gte: new Date() };
    }
    
    const events = await Event.find(query)
      .populate('organizerId', 'name email image')
      .sort({ startDate: 1, createdAt: -1 })
      .limit(limit);
    
    // Get type stats
    const totalEvents = await Event.countDocuments({ type: eventType });
    const upcomingEvents = await Event.countDocuments({ 
      type: eventType, 
      startDate: { $gte: new Date() },
      status: EventStatus.PUBLISHED
    });
    
    return NextResponse.json({ 
      success: true, 
      data: events,
      stats: {
        total: totalEvents,
        upcoming: upcomingEvents,
        type: eventType
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}