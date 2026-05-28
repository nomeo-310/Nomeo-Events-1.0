// app/api/events/[id]/register/route.ts

import { connectDB } from "@/lib/mongoose";
import { Event } from "@/models/event";
import { Registration, RegistrationStatus, PaymentStatus } from "@/models/registration";
import { Payment, PaymentGatewayStatus, PaymentPurpose, PaymentProvider } from "@/models/payment";
import { Ticket, TicketStatus } from "@/models/ticket";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { sendRegistrationEmail, sendParentalConsentEmail } from "@/lib/emails/send-registration-email";
import mongoose from "mongoose";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();

  try {
    const body = await req.json();
    const { id } = await params;

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // ─── Duplicate registration check ───
    const existingRegistration = await Registration.findOne({
      eventId: id,
      attendeeEmail: body.attendeeEmail.toLowerCase().trim()
    });

    if (existingRegistration) {
      if (existingRegistration.status === RegistrationStatus.CANCELLED) {
        await Registration.findByIdAndDelete(existingRegistration._id);
      } else {
        return NextResponse.json({
          error: "You have already registered for this event",
          alreadyRegistered: true,
          registrationNumber: existingRegistration.registrationNumber,
          status: existingRegistration.status
        }, { status: 400 });
      }
    }

    // ─── Plan validation ───
    const eventPlans = event.plans || [];
    const selectedPlan = eventPlans.find((p: any) => p.type === body.planType);
    if (!selectedPlan) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    // ─── Ticket count ───
    let totalTickets = 1;
    if (body.isGroupRegistration && body.groupSize > 1) {
      totalTickets = Number(body.groupSize);
    } else if (body.isCorporateRegistration && body.companySize > 1) {
      totalTickets = Number(body.companySize);
    }

    // ─── Seat pre-checks ───
    if (event.availableSeats < totalTickets) {
      return NextResponse.json({
        error: `Not enough seats available. Requested: ${totalTickets}, Available: ${event.availableSeats}`
      }, { status: 400 });
    }

    if (selectedPlan.maxSeats !== undefined) {
      const planAvailable = selectedPlan.availableSeats ?? selectedPlan.maxSeats;
      if (planAvailable < totalTickets) {
        return NextResponse.json({
          error: `Not enough seats for the ${selectedPlan.name} plan. Requested: ${totalTickets}, Available: ${planAvailable}`
        }, { status: 400 });
      }
    }

    // ─── Age validation and parental consent tracking ───
    let requiresParentalConsentEmail = false;
    let parentName = '';
    let parentEmail = '';

    if (event.ageRequirement?.required) {
      if (!body.attendeeAge) {
        return NextResponse.json({ error: "Age is required for this event" }, { status: 400 });
      }
      if (event.ageRequirement.minAge && body.attendeeAge < event.ageRequirement.minAge) {
        return NextResponse.json({ error: `Minimum age required is ${event.ageRequirement.minAge} years old` }, { status: 400 });
      }
      if (event.ageRequirement.maxAge && body.attendeeAge > event.ageRequirement.maxAge) {
        return NextResponse.json({ error: `Maximum age allowed is ${event.ageRequirement.maxAge} years old` }, { status: 400 });
      }
      
      // Check if parental consent is required
      if (event.ageRequirement.requiresParentalConsent && body.attendeeAge < 18) {
        if (!body.parentalConsentProvided) {
          return NextResponse.json({ 
            error: "Parental consent is required for attendees under 18", 
            requiresParentalConsent: true 
          }, { status: 400 });
        }
        
        // If parental consent is provided, we'll send a confirmation email to the parent
        if (body.parentalConsentProvided && body.parentalConsentByName && body.parentalConsentByEmail) {
          requiresParentalConsentEmail = true;
          parentName = body.parentalConsentByName;
          parentEmail = body.parentalConsentByEmail;
        }
      }
    }

    // ─── Age group bucket ───
    let ageGroup = '';
    if (body.attendeeAge) {
      if (body.attendeeAge <= 25) ageGroup = '18-25';
      else if (body.attendeeAge <= 35) ageGroup = '26-35';
      else if (body.attendeeAge <= 50) ageGroup = '36-50';
      else ageGroup = '50+';
    }

    const isFree = selectedPlan.price === 0;
    const hasPaymentData = !!(body.paymentReference && body.paymentStatus === PaymentGatewayStatus.SUCCESS);

    // ─── PAID: wrap everything in a transaction ───
    if (!isFree) {
      if (!hasPaymentData) {
        // No payment info provided yet — create a pending registration only
        const registration = new Registration({
          ...buildRegistrationFields(body, id, selectedPlan, totalTickets, ageGroup),
          status: RegistrationStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
        });
        await registration.save();

        return NextResponse.json({
          success: true,
          message: "Registration created. Awaiting payment confirmation.",
          data: {
            registrationId: registration._id,
            registrationNumber: registration.registrationNumber,
          }
        });
      }

      // Payment data present — use a transaction so registration + payment are atomic
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        const registration = new Registration({
          ...buildRegistrationFields(body, id, selectedPlan, totalTickets, ageGroup),
          status: RegistrationStatus.CONFIRMED,
          paymentStatus: PaymentStatus.COMPLETED,
        });
        await registration.save({ session });

        const totalAmountInKobo = selectedPlan.price * totalTickets * 100;
        const paymentRecord = new Payment({
          purpose: PaymentPurpose.EVENT_REGISTRATION,
          provider: PaymentProvider.PAYSTACK,
          registrationId: registration._id,
          eventId: event._id,
          amount: totalAmountInKobo,
          amountPaid: totalAmountInKobo,
          discountAmount: 0,
          currency: selectedPlan.currency || 'NGN',
          reference: body.paymentReference,
          paystackReference: body.paymentReference,
          gatewayStatus: PaymentGatewayStatus.SUCCESS,
          gatewayResponse: body.paymentMessage || "Approved",
          paidAt: new Date(),
        });
        await paymentRecord.save({ session });

        registration.paymentId = paymentRecord._id;
        await registration.save({ session });

        await session.commitTransaction();
        session.endSession();

        // ─── Post-commit: seats, ticket, emails ───
        const result = await confirmRegistration({
          event, 
          registration, 
          paymentRecord, 
          selectedPlan,
          body, 
          totalTickets, 
          isFree,
          requiresParentalConsentEmail,
          parentName,
          parentEmail
        });

        return result;

      } catch (txError: any) {
        await session.abortTransaction();
        session.endSession();
        console.error('Transaction aborted:', txError.message);
        throw txError;
      }
    }

    // ─── FREE: no transaction needed, just save and confirm ───
    const registration = new Registration({
      ...buildRegistrationFields(body, id, selectedPlan, totalTickets, ageGroup),
      status: RegistrationStatus.CONFIRMED,
      paymentStatus: PaymentStatus.COMPLETED,
    });
    await registration.save();

    return await confirmRegistration({
      event, 
      registration, 
      paymentRecord: null, 
      selectedPlan,
      body, 
      totalTickets, 
      isFree,
      requiresParentalConsentEmail,
      parentName,
      parentEmail
    });

  } catch (error: any) {
    console.error('Registration error:', error.message);

    if (error.code === 11000) {
      if (error.keyPattern?.registrationNumber) {
        return NextResponse.json({ error: "Registration number conflict. Please try again." }, { status: 409 });
      }
      if (error.keyPattern?.eventId && error.keyPattern?.attendeeEmail) {
        return NextResponse.json({
          error: "You have already registered for this event with this email address.",
          alreadyRegistered: true
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      error: "Registration failed. Please try again.",
      message: error.message
    }, { status: 500 });
  }
}

// ─── Shared field builder ───────────────────────────────────────────────────
function buildRegistrationFields(body: any, eventId: string, selectedPlan: any, totalTickets: number, ageGroup: string) {
  return {
    eventId,
    attendeeName: body.attendeeName,
    attendeeEmail: body.attendeeEmail.toLowerCase().trim(),
    attendeePhone: body.attendeePhone,
    attendeeAge: body.attendeeAge,
    attendeeGender: body.attendeeGender,
    attendeeCompany: body.attendeeCompany,
    attendeeTitle: body.attendeeTitle,
    planType: body.planType,
    planName: selectedPlan.name,
    price: body.isGroupRegistration ? selectedPlan.price * totalTickets : selectedPlan.price,
    currency: selectedPlan.currency || 'NGN',
    isGroupRegistration: body.isGroupRegistration || false,
    groupSize: body.isGroupRegistration ? totalTickets : undefined,
    groupName: body.groupName,
    groupMembers: body.groupMembers || [],
    isCorporateRegistration: body.isCorporateRegistration || false,
    companyName: body.companyName,
    companySize: body.isCorporateRegistration ? totalTickets : undefined,
    companyMembers: body.companyMembers || [],
    specialRequests: body.specialRequests,
    dietaryRestrictions: body.dietaryRestrictions || [],
    accessibilityNeeds: body.accessibilityNeeds || [],
    ageGroup,
    parentalConsentProvided: body.parentalConsentProvided || false,
    parentalConsentByName: body.parentalConsentByName,
    parentalConsentByEmail: body.parentalConsentByEmail,
    parentalConsentAt: body.parentalConsentProvided ? new Date() : undefined,
    ageVerified: true,
    registeredAt: new Date(),
    metadata: new Map(),
  };
}

// ─── Post-save confirmation steps (seats + ticket + emails) ──────────────────
async function confirmRegistration({ event, registration, 
  paymentRecord, 
  selectedPlan, 
  body, 
  totalTickets, 
  isFree,
  requiresParentalConsentEmail,
  parentName,
  parentEmail
}: {
  event: any;
  registration: any;
  paymentRecord: any;
  selectedPlan: any;
  body: any;
  totalTickets: number;
  isFree: boolean;
  requiresParentalConsentEmail: boolean;
  parentName: string;
  parentEmail: string;
}): Promise<NextResponse> {

  // 1. Atomically deduct global seats
  const globalUpdate = await Event.findOneAndUpdate(
    { _id: event._id, availableSeats: { $gte: totalTickets } },
    { $inc: { availableSeats: -totalTickets } },
    { new: true }
  );

  if (!globalUpdate) {
    registration.status = RegistrationStatus.CANCELLED;
    await registration.save();
    return NextResponse.json({ error: "Seats were just taken. Please try again." }, { status: 409 });
  }

  // 2. Atomically deduct plan seats
  if (selectedPlan.maxSeats !== undefined) {
    const planHasSeatsField = selectedPlan.availableSeats !== undefined && selectedPlan.availableSeats !== null;
    let planUpdate = null;

    if (planHasSeatsField) {
      planUpdate = await Event.findOneAndUpdate(
        { _id: event._id, plans: { $elemMatch: { type: body.planType, availableSeats: { $gte: totalTickets } } } },
        { $inc: { 'plans.$.availableSeats': -totalTickets } },
        { new: true }
      );
    } else {
      const newAvailable = selectedPlan.maxSeats - totalTickets;
      if (newAvailable < 0) {
        await Event.findByIdAndUpdate(event._id, { $inc: { availableSeats: totalTickets } });
        registration.status = RegistrationStatus.CANCELLED;
        await registration.save();
        return NextResponse.json({ error: `Not enough seats for the ${selectedPlan.name} plan.` }, { status: 409 });
      }

      planUpdate = await Event.findOneAndUpdate(
        { _id: event._id, 'plans.type': body.planType, 'plans.availableSeats': { $exists: false } },
        { $set: { 'plans.$.availableSeats': newAvailable } },
        { new: true }
      );

      if (!planUpdate) {
        planUpdate = await Event.findOneAndUpdate(
          { _id: event._id, plans: { $elemMatch: { type: body.planType, availableSeats: { $gte: totalTickets } } } },
          { $inc: { 'plans.$.availableSeats': -totalTickets } },
          { new: true }
        );
      }
    }

    if (!planUpdate) {
      await Event.findByIdAndUpdate(event._id, { $inc: { availableSeats: totalTickets } });
      registration.status = RegistrationStatus.CANCELLED;
      await registration.save();
      return NextResponse.json({ error: "Plan seats were just taken. Please try again." }, { status: 409 });
    }
  }

  // 3. Generate ticket
  const ticketNumber = await generateTicketNumber(event);
  const qrCodeData = JSON.stringify({
    ticketNumber,
    registrationId: registration._id.toString(),
    eventId: event._id.toString(),
    attendeeName: body.attendeeName,
    attendeeEmail: body.attendeeEmail.toLowerCase().trim(),
    price: body.isGroupRegistration ? selectedPlan.price * totalTickets : selectedPlan.price,
    planType: body.planType,
    eventTitle: event.title,
    eventDate: event.startDate,
    eventVenue: event.location?.venue || 'TBA',
    ...(body.isGroupRegistration && { groupSize: totalTickets, groupName: body.groupName }),
    ...(body.isCorporateRegistration && { companySize: totalTickets, companyName: body.companyName }),
  });

  const qrCodeImage = await QRCode.toDataURL(qrCodeData);

  const ticket = new Ticket({
    registrationId: registration._id,
    eventId: event._id,
    paymentId: paymentRecord?._id,
    ticketNumber,
    qrCode: qrCodeImage,
    qrCodeData,
    planType: body.planType,
    planName: selectedPlan.name,
    price: body.isGroupRegistration ? selectedPlan.price * totalTickets : selectedPlan.price,
    currency: selectedPlan.currency || 'NGN',
    quantity: totalTickets,
    status: TicketStatus.ACTIVE,
    expiresAt: event.endDate,
  });

  await ticket.save();
  registration.ticketId = ticket._id;
  await registration.save();

  // 4. Send confirmation emails (non-blocking, but we await to catch errors)
  try {
    const startDateStr = event.startDate instanceof Date ? event.startDate.toISOString() : String(event.startDate);
    const endDateStr = event.endDate ? (event.endDate instanceof Date ? event.endDate.toISOString() : String(event.endDate)) : undefined;
    const isVirtualEvent = !event.location?.venue || event.location.venue === 'Online';

    // Send registration confirmation to attendee
    await sendRegistrationEmail({
      email: body.attendeeEmail.toLowerCase().trim(),
      name: body.attendeeName,
      registrationNumber: registration.registrationNumber,
      eventTitle: event.title,
      eventDate: startDateStr,
      eventEndDate: endDateStr,
      eventVenue: event.location?.venue || (isVirtualEvent ? 'Online' : 'TBA'),
      eventType: isVirtualEvent ? 'virtual' : 'physical',
      planName: selectedPlan.name,
      planType: body.planType,
      price: body.isGroupRegistration ? selectedPlan.price * totalTickets : selectedPlan.price,
      currency: selectedPlan.currency || 'NGN',
      ticketNumber: ticket.ticketNumber,
      qrCode: ticket.qrCode,
      paymentReference: paymentRecord?.reference,
      paymentAmount: paymentRecord?.amountPaid,
      isFree,
      isGroupRegistration: body.isGroupRegistration || false,
      groupSize: totalTickets,
      groupName: body.groupName,
      registrationType: body.isCorporateRegistration ? 'corporate' : body.isGroupRegistration ? 'group' : 'individual',
      specialInstructions: (event as any).registrationInstructions || (event as any).instructions || event.location?.notes || '',
    });

    // Send parental consent confirmation email if required
    if (requiresParentalConsentEmail && parentEmail && parentName) {
      await sendParentalConsentEmail({
        parentName,
        parentEmail,
        attendeeName: body.attendeeName,
        attendeeAge: body.attendeeAge,
        eventTitle: event.title,
        eventDate: startDateStr,
        eventVenue: event.location?.venue || (isVirtualEvent ? 'Online' : 'TBA'),
        registrationNumber: registration.registrationNumber,
        ticketNumber: ticket.ticketNumber,
      });
      console.log(`✅ Parental consent email sent to ${parentEmail}`);
    }

  } catch (emailError) {
    console.error('❌ Failed to send registration email:', emailError);
    // Don't fail the registration if email fails, just log the error
  }

  return NextResponse.json({
    success: true,
    message: "Registration successful! Confirmation email sent.",
    data: {
      registrationId: registration._id,
      registrationNumber: registration.registrationNumber,
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      qrCode: ticket.qrCode,
      totalSeatsBooked: totalTickets,
      ...(paymentRecord && {
        paymentId: paymentRecord._id,
        paymentReference: paymentRecord.reference,
      }),
      ...(requiresParentalConsentEmail && {
        parentalConsentSent: true,
        parentEmail,
      }),
    }
  });
}

async function generateTicketNumber(event: any): Promise<string> {
  const eventPrefix = event.title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
  const count = await Ticket.countDocuments({ eventId: event._id });
  return `${eventPrefix}-${(count + 1).toString().padStart(6, '0')}`;
}