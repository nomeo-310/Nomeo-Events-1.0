// app/api/events/[id]/route.ts - GET, PATCH, DELETE for single event
import { withGrouping } from "@/lib/event-grouping";
import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Event, EventStatus } from "@/models/event";
import { Notification } from "@/models/notification";
import { Registration } from "@/models/registration";
import { User } from "@/models/user";
import { NextResponse } from "next/server";

// GET single event
export async function GET( request: Request, { params }: { params: Promise<{ id: string; }> }) {
  await connectDB();
  
  const { id } = await params;

  try {
    const event = await Event.findById(id)
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

// PATCH update event
export async function PATCH( request: Request, { params }: { params: Promise<{ id: string; }> }) {
  const { id } = await params;

  await connectDB();
  
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const event = await Event.findById(id);
    
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }
    
    // Check if user is organizer or admin
    if (event.organizerId.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Prevent updating certain fields
    delete body._id;
    delete body.createdAt;
    delete body.createdBy;
    delete body.organizerId;
    
    // Update event
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('organizerId', 'name email image');
    
    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: "Event updated successfully"
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

// DELETE event
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; }> }) {
  const { id } = await params;

  await connectDB();
  
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const event = await Event.findById(id);
    
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }
    
    // Check if user is organizer or admin
    if (event.organizerId.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    
    // Soft delete or hard delete? Let's do soft delete by changing status
    event.status = EventStatus.CANCELLED;
    await event.save();
    
    const registrations = await Registration.find({ eventId: id, status: 'confirmed' });
    
    const notifications = registrations.map(reg => ({
      receiverId: reg.userId,
      senderId: user.id,
      type: 'event_cancelled',
      content: `Event "${event.title}" has been cancelled`,
      metadata: { eventId: event._id, eventTitle: event.title }
    }));
    
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
    
    return NextResponse.json({
      success: true,
      message: "Event cancelled successfully"
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}