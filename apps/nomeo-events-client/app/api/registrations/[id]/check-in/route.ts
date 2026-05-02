import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Registration } from "@/models/registration";
import { Ticket } from "@/models/ticket";
import { Event } from "@/models/event";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await connectDB();

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const registration = await Registration.findById(id).populate('ticketId');
    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    const event = await Event.findById(registration.eventId);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.organizerId?.toString() !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check-in state is owned by Ticket
    const ticket = registration.ticketId as any;

    if (!ticket) {
      return NextResponse.json({ error: "No ticket found for this registration" }, { status: 404 });
    }

    if (ticket.checkedIn) {
      return NextResponse.json({
        error: "Attendee already checked in",
        checkedInAt: ticket.checkedInAt
      }, { status: 400 });
    }

    // Mark Ticket as used (owns checkedIn, checkedInAt, checkedInBy)
    await ticket.markUsed(user.id);

    // Sync Registration status to ATTENDED
    await registration.checkIn(user.id);

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('checkedInBy', 'name email');

    return NextResponse.json({
      success: true,
      message: "Checked in successfully",
      data: {
        registrationId: registration._id,
        status: registration.status,
        ticket: updatedTicket
      }
    });
  } catch (error: any) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}