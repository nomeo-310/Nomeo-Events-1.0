// app/api/registrations/[id]/checkin/route.ts
import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Registration } from "@/models/registration";
import { Event } from "@/models/event";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; }> } ) {
  const { id } = await params;
  
  await connectDB();
  
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const registration = await Registration.findById(id);
    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }
    
    const event = await Event.findById(registration.eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    // Only organizers can check in attendees
    if (event.organizerId.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    await registration.checkIn(user.id);
    
    return NextResponse.json({ 
      success: true, 
      message: "Checked in successfully",
      data: registration
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}