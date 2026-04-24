// app/api/registrations/[id]/verify-age/route.ts
import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Registration } from "@/models/registration";
import { Event } from "@/models/event";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; }> } ) {
  const { id } = await params;
  
  await connectDB();
  
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const { ageVerified } = await req.json();
    const registration = await Registration.findById(id);
    
    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }
    
    const event = await Event.findById(registration.eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    // Only organizers can verify age
    if (event.organizerId.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    registration.ageVerified = ageVerified;
    registration.ageVerifiedAt = new Date();
    registration.ageVerifiedBy = new ObjectId(user.id);
    await registration.save();
    
    return NextResponse.json({ 
      success: true, 
      message: ageVerified ? "Age verified successfully" : "Age verification failed",
      data: registration
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}