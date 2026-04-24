// app/api/events/category/[category]/route.ts
import { connectDB } from "@/lib/mongoose";
import { Event, EventStatus, EventCategory } from "@/models/event";
import { NextResponse } from "next/server";

export async function GET( req: Request, { params }: { params: Promise<{ category: string }> } ) {
  const { category:requestedCategory } = await params;

  await connectDB();
  
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || EventStatus.PUBLISHED;
  const limit = parseInt(searchParams.get('limit') || '50');
  const upcoming = searchParams.get('upcoming') === 'true';
  
  try {
    const category = decodeURIComponent(requestedCategory);
    
    // Validate category
    if (!Object.values(EventCategory).includes(category as EventCategory)) {
      return NextResponse.json({ 
        error: `Invalid category. Valid categories: ${Object.values(EventCategory).join(', ')}` 
      }, { status: 400 });
    }
    
    let query: any = { 
      category: category,
      status: status
    };
    
    if (upcoming) {
      query.startDate = { $gte: new Date() };
    }
    
    const events = await Event.find(query)
      .populate('organizerId', 'name email image')
      .sort({ startDate: 1, createdAt: -1 })
      .limit(limit);
    
    // Get category stats
    const totalEvents = await Event.countDocuments({ category: category });
    const upcomingEvents = await Event.countDocuments({ 
      category: category, 
      startDate: { $gte: new Date() },
      status: EventStatus.PUBLISHED
    });
    
    return NextResponse.json({ 
      success: true, 
      data: events,
      stats: {
        total: totalEvents,
        upcoming: upcomingEvents,
        category: category
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}