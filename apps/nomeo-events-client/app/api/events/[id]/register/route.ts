// app/api/events/[id]/register/route.ts
import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Event } from "@/models/event";
import { Registration, RegistrationStatus, PaymentStatus } from "@/models/registration";
import { NextResponse } from "next/server";
import { Profile } from "@/models/profile";

export async function POST(req: Request, { params }: { params: Promise<{ id: string; }> }) {
  await connectDB();
  const loggedInUser = await getCurrentUser();
  
  try {
    const body = await req.json();
    const { id } = await params;
    const event = await Event.findById(id);
    
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    // Check if already registered
    const existingRegistration = await Registration.findOne({
      eventId: id,
      attendeeEmail: body.attendeeEmail.toLowerCase()
    });
    
    if (existingRegistration && existingRegistration.status !== RegistrationStatus.CANCELLED) {
      return NextResponse.json({ 
        error: "You have already registered for this event",
        alreadyRegistered: true,
        ticketNumber: existingRegistration.ticketNumber
      }, { status: 400 });
    }

    const eventPlans = event.plans || [];
    const selectedPlan = eventPlans.find((p: any) => p.type === body.planType);
    
    if (!selectedPlan) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }
    
    if (event.availableSeats <= 0) {
      return NextResponse.json({ error: "Event is sold out" }, { status: 400 });
    }
    
    // Age validation
    if (event.ageRequirement?.required) {
      if (!body.attendeeAge) {
        return NextResponse.json({ error: "Age is required for this event" }, { status: 400 });
      }
      
      // Check min age
      if (event.ageRequirement.minAge && body.attendeeAge < event.ageRequirement.minAge) {
        return NextResponse.json({ 
          error: `Minimum age required is ${event.ageRequirement.minAge} years old` 
        }, { status: 400 });
      }
      
      // Check max age
      if (event.ageRequirement.maxAge && body.attendeeAge > event.ageRequirement.maxAge) {
        return NextResponse.json({ 
          error: `Maximum age allowed is ${event.ageRequirement.maxAge} years old` 
        }, { status: 400 });
      }
      
      // Check parental consent for under 18
      if (event.ageRequirement.requiresParentalConsent && body.attendeeAge < 18) {
        if (!body.parentalConsentProvided) {
          return NextResponse.json({ 
            error: "Parental consent is required for attendees under 18",
            requiresParentalConsent: true
          }, { status: 400 });
        }
      }
    }
    
    // Determine age group
    let ageGroup = '';
    if (body.attendeeAge <= 25) ageGroup = '18-25';
    else if (body.attendeeAge <= 35) ageGroup = '26-35';
    else if (body.attendeeAge <= 50) ageGroup = '36-50';
    else ageGroup = '50+';
    
    // Create registration
    const registration = new Registration({
      eventId: id,
      userId: loggedInUser?.id,
      attendeeName: body.attendeeName,
      attendeeEmail: body.attendeeEmail.toLowerCase(),
      attendeePhone: body.attendeePhone,
      attendeeAge: body.attendeeAge,
      attendeeGender: body.attendeeGender,
      attendeeCompany: body.attendeeCompany,
      attendeeTitle: body.attendeeTitle,
      planType: body.planType,
      planName: selectedPlan.name,
      price: selectedPlan.price,
      currency: selectedPlan.currency,
      isGroupRegistration: body.isGroupRegistration || false,
      groupSize: body.groupSize,
      groupName: body.groupName,
      groupMembers: body.groupMembers,
      specialRequests: body.specialRequests,
      dietaryRestrictions: body.dietaryRestrictions,
      accessibilityNeeds: body.accessibilityNeeds,
      amountPaid: selectedPlan.price,
      status: RegistrationStatus.CONFIRMED,
      paymentStatus: selectedPlan.price === 0 ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
      ageGroup: ageGroup,
      parentalConsentProvided: body.parentalConsentProvided || false,
      parentalConsentByName: body.parentalConsentByName,
      parentalConsentByEmail: body.parentalConsentByEmail,
      ageVerified: !event.ageRequirement?.ageVerificationRequired
    });
    
    await registration.save();
    
    // Update available seats
    event.availableSeats -= 1;
    await event.save();
    
    return NextResponse.json({ 
      success: true, 
      message: "Registration successful!",
      data: {
        registrationId: registration._id,
        ticketNumber: registration.ticketNumber,
        registrationNumber: registration.registrationNumber
      }
    });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "You have already registered for this event" 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}