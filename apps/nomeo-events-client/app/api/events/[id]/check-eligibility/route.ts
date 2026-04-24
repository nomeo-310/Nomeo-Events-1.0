// app/api/events/[id]/check-eligibility/route.ts
import { connectDB } from "@/lib/mongoose";
import { Event } from "@/models/event";
import { Registration } from "@/models/registration";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string; }> }) {
  await connectDB();
  
  try {
    const { email, phone, age } = await req.json();
    const { id } = await params;

    const event = await Event.findById(id);
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    const checks: any = {
      eligible: true,
      errors: [],
      warnings: [],
      requirements: {
        requiresAgeVerification: event.ageRequirement?.required || false,
        minAge: event.ageRequirement?.minAge,
        maxAge: event.ageRequirement?.maxAge,
        requiresParentalConsent: event.ageRequirement?.requiresParentalConsent || false,
        ageVerificationRequired: event.ageRequirement?.ageVerificationRequired || false
      }
    };
    
    // Check existing registration
    if (email) {
      const existing = await Registration.findOne({
        eventId: id,
        attendeeEmail: email.toLowerCase(),
        status: { $ne: 'cancelled' }
      });
      
      if (existing) {
        checks.eligible = false;
        checks.errors.push("This email is already registered for this event");
        checks.existingRegistration = {
          ticketNumber: existing.ticketNumber,
          status: existing.status
        };
      }
    }
    
    // Check age requirements
    if (age && event.ageRequirement?.required) {
      if (event.ageRequirement.minAge && age < event.ageRequirement.minAge) {
        checks.eligible = false;
        checks.errors.push(`Minimum age required is ${event.ageRequirement.minAge}`);
      }
      if (event.ageRequirement.maxAge && age > event.ageRequirement.maxAge) {
        checks.eligible = false;
        checks.errors.push(`Maximum age allowed is ${event.ageRequirement.maxAge}`);
      }
      if (event.ageRequirement.requiresParentalConsent && age < 18) {
        checks.requiresParentalConsent = true;
        checks.warnings.push("Parental consent is required for attendees under 18");
      }
    }
    
    // Check event status
    if (event.status !== 'published') {
      checks.eligible = false;
      checks.errors.push("Event is not available for registration");
    }
    
    // Check capacity
    if (event.availableSeats <= 0) {
      checks.eligible = false;
      checks.errors.push("Event is sold out");
    }
    
    // Check registration deadline
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      checks.eligible = false;
      checks.errors.push("Registration deadline has passed");
    }
    
    return NextResponse.json({ success: true, data: checks });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}