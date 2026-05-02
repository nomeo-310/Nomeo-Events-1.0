// app/api/events/[eventId]/route.ts
import { connectDB } from "@/lib/mongoose";
import { User } from "@/models/user";
import { Event } from "@/models/event";
import { NextRequest, NextResponse } from "next/server";
import { withGrouping } from "@/lib/event-grouping";
import { getCurrentUser } from "@/lib/session";

// ===================== GET - Organizer access only =====================
export async function GET( request: Request,  { params }: { params: Promise<{ id: string; }> }) {
  await connectDB();
  
  const { id } = await params;

  try {
    const logedInUser = await getCurrentUser();

    if (!logedInUser) {
      return NextResponse.json({success: false, error: "Not Authenticated"}, { status: 403})
    };

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

    if (event?.organizerId._id.toString() !== logedInUser.id) {
      return NextResponse.json({success: false, error: "Not Authenticated"}, { status: 403})
    }
    
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    const eventWithGrouping = withGrouping(event.toObject());
    
    return NextResponse.json({ success: true, data: eventWithGrouping });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ===================== PATCH - Update event =====================
export async function PATCH( request: NextRequest, { params }: { params: Promise<{ id: string; }> }) {
  await connectDB();
  
  const { id } = await params;

  try {
    const logedInUser = await getCurrentUser();

    if (!logedInUser) {
      return NextResponse.json(
        { success: false, error: "Not Authenticated" }, 
        { status: 403 }
      );
    }

    const event = await Event.findById(id);
    
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" }, 
        { status: 404 }
      );
    }

    // Check if user owns this event
    if (event.organizerId.toString() !== logedInUser.id) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to update this event" }, 
        { status: 403 }
      );
    }

    const updateData = await request.json();
    
    // Prevent updating sensitive fields
    const allowedUpdates = [
      'title',
      'shortDescription',
      'description',
      'category',
      'type',
      'startDate',
      'endDate',
      'timezone',
      'eventMode',
      'location',
      'banner',
      'gallery',
      'totalSeats',
      'availableSeats',
      'plans',
      'featured',
      'registrationDeadline',
      'isPublic'
    ];

    // Filter only allowed fields
    const filteredUpdate: any = {};
    for (const key of allowedUpdates) {
      if (updateData[key] !== undefined) {
        filteredUpdate[key] = updateData[key];
      }
    }

    // If updating seats, validate availability
    if (filteredUpdate.totalSeats !== undefined && filteredUpdate.availableSeats !== undefined) {
      if (filteredUpdate.availableSeats > filteredUpdate.totalSeats) {
        return NextResponse.json(
          { success: false, error: "Available seats cannot exceed total seats" }, 
          { status: 400 }
        );
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $set: filteredUpdate },
      { new: true, runValidators: true }
    )
    .populate('organizerId', 'name email image')
    .populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      data: updatedEvent,
      message: "Event updated successfully"
    });

  } catch (error: any) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update event" }, 
      { status: 500 }
    );
  }
}

// ===================== DELETE - Permanently delete event =====================
export async function DELETE( request: NextRequest, { params }: { params: Promise<{ id: string; }> }) {
  await connectDB();
  
  const { id } = await params;

  try {
    const logedInUser = await getCurrentUser();

    if (!logedInUser) {
      return NextResponse.json(
        { success: false, error: "Not Authenticated" }, 
        { status: 403 }
      );
    }

    const event = await Event.findById(id);
    
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" }, 
        { status: 404 }
      );
    }

    // Check if user owns this event
    if (event.organizerId.toString() !== logedInUser.id) {
      return NextResponse.json(
        { success: false, error: "You don't have permission to delete this event" }, 
        { status: 403 }
      );
    }

    // Permanently delete
    await Event.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Event permanently deleted"
    });

  } catch (error: any) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete event" }, 
      { status: 500 }
    );
  }
}