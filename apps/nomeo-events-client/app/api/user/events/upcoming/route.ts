// app/api/events/organizer/upcoming/route.ts
import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Event } from "@/models/event";
import { User } from "@/models/user";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  await connectDB();
  
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const organizerId = searchParams.get('organizerId');
  const limit = parseInt(searchParams.get('limit') || '3');
  
  try {
    const events = await Event.find({
      organizerId: organizerId || user.id,
      status: 'published',
      startDate: { $gte: new Date() }
    })
    .sort({ startDate: 1 })
    .limit(limit)
    .populate(
      { path: 'organizerId',
        model: User,
        select: 'name email image' 
      }
    );
    
    const eventsWithGrouping = events.map(event => ({
      ...event.toObject(),
      grouping: event.getGrouping(),
      availableSeats: event.availableSeats,
      totalSeats: event.totalSeats
    }));
    
    return NextResponse.json({
      success: true,
      data: eventsWithGrouping
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}