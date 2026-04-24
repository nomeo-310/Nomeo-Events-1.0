// app/api/registrations/[id]/route.ts - Get, update, cancel single registration
import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Registration, RegistrationStatus, PaymentStatus } from "@/models/registration";
import { Event } from "@/models/event";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// GET single registration
export async function GET( request: Request, { params }: { params: Promise<{ id: string; }> }) {
  const { id } = await params;

  await connectDB();
  
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const registration = await Registration.findById(id)
      .populate('eventId', 'title startDate endDate location banner slug')
      .populate('userId', 'name email image');
    
    if (!registration) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
    }
    
    // Check if user owns this registration or is admin
    if (registration.userId._id.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    
    return NextResponse.json({ success: true, data: registration });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH update registration (check-in, mark attended, etc.)
export async function PATCH( request: Request, { params }: { params: Promise<{ id: string; }> }) {
  const { id } = await params;
  
  await connectDB();

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const registration = await Registration.findById(id);
    if (!registration) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
    }
    
    const event = await Event.findById(registration.eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }
    
    // Check if user is organizer, admin, or the registrant
    const isOrganizer = event.organizerId.toString() === user.id;
    const isRegistrant = registration.userId.toString() === user.id;
    
    if (!isOrganizer && !isRegistrant && user.role !== 'admin') {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    
    const body = await request.json();
    const { action, ...updateData } = body;
    
    let updatedRegistration;
    
    switch (action) {
      case 'check-in':
        if (!isOrganizer && user.role !== 'admin') {
          return NextResponse.json({ success: false, error: "Only organizers can check in attendees" }, { status: 403 });
        }
        updatedRegistration = await registration.checkIn(user.id);
        break;
        
      case 'mark-attended':
        if (!isOrganizer && user.role !== 'admin') {
          return NextResponse.json({ success: false, error: "Only organizers can mark attendance" }, { status: 403 });
        }
        registration.status = RegistrationStatus.ATTENDED;
        registration.checkedIn = true;
        registration.checkedInAt = new Date();
        registration.checkedInBy = new mongoose.Types.ObjectId(user.id);
        updatedRegistration = await registration.save();
        break;
        
      case 'confirm-payment':
        if (!isOrganizer && user.role !== 'admin') {
          return NextResponse.json({ success: false, error: "Only organizers can confirm payments" }, { status: 403 });
        }
        registration.paymentStatus = PaymentStatus.COMPLETED;
        registration.paymentDate = new Date();
        registration.status = RegistrationStatus.CONFIRMED;
        updatedRegistration = await registration.save();
        break;
        
      default:
        // General update
        Object.assign(registration, updateData);
        updatedRegistration = await registration.save();
    }
    
    await updatedRegistration.populate('eventId', 'title startDate');
    await updatedRegistration.populate('userId', 'name email');
    
    return NextResponse.json({
      success: true,
      data: updatedRegistration,
      message: "Registration updated successfully"
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE/Cancel registration
export async function DELETE( request: Request, { params }: { params: Promise<{ id: string; }> }) {
  const { id } = await params;

  await connectDB();
  
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const registration = await Registration.findById(id).session(session);
    if (!registration) {
      await session.abortTransaction();
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 });
    }
    
    const event = await Event.findById(registration.eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }
    
    // Check if user owns this registration or is organizer/admin
    const isRegistrant = registration.userId.toString() === user.id;
    const isOrganizer = event.organizerId.toString() === user.id;
    
    if (!isRegistrant && !isOrganizer && user.role !== 'admin') {
      await session.abortTransaction();
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || 'User cancelled registration';
    
    // Cancel registration (returns seats to event)
    await registration.cancel(reason);
    
    // Create notification for organizer if cancelled by registrant
    if (isRegistrant && !isOrganizer) {
      const Notification = mongoose.model('Notification');
      await Notification.create([{
        receiverId: event.organizerId,
        senderId: user.id,
        type: 'registration_cancelled',
        content: `${registration.attendeeName} cancelled registration for ${event.title}`,
        metadata: {
          eventId: event._id,
          registrationId: registration._id,
          eventTitle: event.title
        }
      }], { session });
    }
    
    await session.commitTransaction();
    
    return NextResponse.json({
      success: true,
      message: "Registration cancelled successfully"
    });
  } catch (error: any) {
    await session.abortTransaction();
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    session.endSession();
  }
}