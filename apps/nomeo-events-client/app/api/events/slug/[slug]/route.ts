import { connectDB } from "@/lib/mongoose";
import { User } from "@/models/user";
import { Event } from "@/models/event";
import { NextResponse } from "next/server";
import { withGrouping } from "@/lib/event-grouping";

export async function GET( request: Request, { params }: { params: Promise<{ slug: string; }> }) {
  await connectDB();
  
  const { slug } = await params;

  try {
    const event = await Event.findOne({ slug })
      .populate(
        { 
          path: 'organizerId', 
          model: User,
          select: 'name email image' 
        }
      )
      .populate(
        { 
          path: 'createdBy', 
          model: User,
          select: 'name email' 
        }
      );

    
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    const eventWithGrouping = withGrouping(event.toObject());
    
    return NextResponse.json({ success: true, data: eventWithGrouping });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}