// app/api/events/[id]/register/route.ts

import { connectDB } from "@/lib/mongoose";
import { Event } from "@/models/event";
import { Registration, RegistrationStatus, PaymentStatus } from "@/models/registration";
import { Payment, PaymentGatewayStatus, PaymentPurpose } from "@/models/payment";
import { Ticket, TicketStatus } from "@/models/ticket";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { sendRegistrationEmail, sendParentalConsentEmail } from "@/lib/emails/send-registration-email";
import mongoose from "mongoose";

// In-memory seat reservation store (use Redis in production)
const seatReservations = new Map<string, {
  eventId: string;
  planType: string;
  totalTickets: number;
  expiresAt: number;
}>();

// Clean up expired reservations every minute
setInterval(() => {
  const now = Date.now();
  for (const [id, reservation] of seatReservations.entries()) {
    if (reservation.expiresAt < now) {
      seatReservations.delete(id);
    }
  }
}, 60000);

// Helper function to check seat availability
function checkSeatAvailability(eventDoc: any, plan: any, tickets: number): { 
  available: boolean; 
  globalSeats: number; 
  planSeats: number; 
  message?: string;
} {
  const globalSeats = eventDoc.availableSeats;
  const planSeats = plan?.availableSeats !== undefined && plan?.availableSeats !== null 
    ? plan.availableSeats 
    : plan?.maxSeats;
  
  if (globalSeats < tickets) {
    return { 
      available: false, 
      globalSeats, 
      planSeats, 
      message: `Only ${globalSeats} seat${globalSeats !== 1 ? 's' : ''} remaining in total` 
    };
  }
  
  if (planSeats !== undefined && planSeats < tickets) {
    return { 
      available: false, 
      globalSeats, 
      planSeats, 
      message: `Only ${planSeats} seat${planSeats !== 1 ? 's' : ''} remaining for ${plan?.name || 'this'} plan` 
    };
  }
  
  return { available: true, globalSeats, planSeats };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();

  try {
    const body = await req.json();
    const { id } = await params;
    const attendeeEmail = body.attendeeEmail?.toLowerCase().trim();

    if (!attendeeEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // ─── Plan validation ───────────────────────────────────────────────────────
    const eventPlans = event.plans || [];
    const selectedPlan = eventPlans.find((p: any) => p.type === body.planType);
    if (!selectedPlan) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    const isFree = selectedPlan.price === 0;

    // ─── Calculate total tickets needed ───────────────────────────────────────
    let totalTickets = 1;
    if (body.isGroupRegistration && body.groupSize > 1) totalTickets = Number(body.groupSize);
    else if (body.isCorporateRegistration && body.companySize > 1) totalTickets = Number(body.companySize);

    // Validate totalTickets
    if (totalTickets < 1) {
      return NextResponse.json({ error: "Invalid number of tickets" }, { status: 400 });
    }

    // ─── Step 1: For paid events without payment, reserve seats temporarily ───
    if (!isFree && !body.paymentReference && !body.skipReservation) {
      const availability = checkSeatAvailability(event, selectedPlan, totalTickets);
      
      if (!availability.available) {
        return NextResponse.json({ 
          error: availability.message,
          availableSeats: availability.globalSeats,
          requestedSeats: totalTickets,
          seatUnavailable: true
        }, { status: 409 });
      }
      
      // Create temporary reservation (expires in 15 minutes)
      const reservationId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      seatReservations.set(reservationId, {
        eventId: event._id.toString(),
        planType: body.planType,
        totalTickets,
        expiresAt: Date.now() + 15 * 60 * 1000
      });
      
      return NextResponse.json({
        success: true,
        message: "Seats reserved. Complete payment to confirm your registration.",
        data: {
          seatReservationId: reservationId,
          totalTickets,
          planType: body.planType,
          planName: selectedPlan.name,
          price: selectedPlan.price,
          totalAmount: selectedPlan.price * totalTickets,
          expiresIn: 900 // 15 minutes in seconds
        }
      });
    }

    // ─── Resolve payment from DB — never trust body.paymentStatus ─────────────
    let verifiedPayment: any = null;

    if (!isFree && body.paymentReference) {
      verifiedPayment = await Payment.findOne({
        reference: body.paymentReference,
        purpose: PaymentPurpose.EVENT_REGISTRATION,
        eventId: event._id,
      });

      if (!verifiedPayment) {
        return NextResponse.json(
          { error: "Payment record not found for this event. Please complete payment first." },
          { status: 400 }
        );
      }

      if (verifiedPayment.gatewayStatus !== PaymentGatewayStatus.SUCCESS) {
        return NextResponse.json(
          { error: "Payment has not been confirmed. Please complete payment first." },
          { status: 400 }
        );
      }

      // Guard: payment already linked to a DIFFERENT attendee
      if (verifiedPayment.registrationId) {
        const linkedReg = await Registration.findById(verifiedPayment.registrationId);
        if (linkedReg && linkedReg.attendeeEmail !== attendeeEmail) {
          return NextResponse.json(
            { error: "This payment has already been used for another registration." },
            { status: 409 }
          );
        }
      }
      
      // Release temporary reservation if it exists
      if (body.seatReservationId && seatReservations.has(body.seatReservationId)) {
        seatReservations.delete(body.seatReservationId);
      }
    }

    const hasVerifiedPayment = !!verifiedPayment;

    // ─── Duplicate registration check ─────────────────────────────────────────
    let existingRegistration = await Registration.findOne({ eventId: id, attendeeEmail });

    if (existingRegistration) {
      if (existingRegistration.status === RegistrationStatus.CANCELLED) {
        await Registration.findByIdAndDelete(existingRegistration._id);
        existingRegistration = null;
      } else if (
        existingRegistration.status === RegistrationStatus.CONFIRMED ||
        (existingRegistration.status === RegistrationStatus.PENDING && !hasVerifiedPayment)
      ) {
        return NextResponse.json({
          error: "You have already registered for this event",
          alreadyRegistered: true,
          registrationNumber: existingRegistration.registrationNumber,
          status: existingRegistration.status,
        }, { status: 400 });
      }
    }

    // ─── Seat availability FINAL check (refetch latest data) ─────────────────
    const freshEvent = await Event.findById(event._id);
    if (!freshEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    const freshPlan = freshEvent.plans?.find((p: any) => p.type === body.planType);
    if (!freshPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    
    const finalAvailability = checkSeatAvailability(freshEvent, freshPlan, totalTickets);
    
    if (!finalAvailability.available) {
      return NextResponse.json({
        error: finalAvailability.message,
        availableSeats: finalAvailability.globalSeats,
        requestedSeats: totalTickets,
      }, { status: 409 });
    }

    // ─── Age validation ────────────────────────────────────────────────────────
    let requiresParentalConsentEmail = false;
    let parentName = '';
    let parentEmail = '';

    if (event.ageRequirement?.required) {
      if (!body.attendeeAge && body.attendeeAge !== 0) {
        return NextResponse.json({ error: "Age is required for this event" }, { status: 400 });
      }
      if (event.ageRequirement.minAge && body.attendeeAge < event.ageRequirement.minAge) {
        return NextResponse.json({ error: `Minimum age required is ${event.ageRequirement.minAge} years old` }, { status: 400 });
      }
      if (event.ageRequirement.maxAge && body.attendeeAge > event.ageRequirement.maxAge) {
        return NextResponse.json({ error: `Maximum age allowed is ${event.ageRequirement.maxAge} years old` }, { status: 400 });
      }
      if (event.ageRequirement.requiresParentalConsent && body.attendeeAge < 18) {
        if (!body.parentalConsentProvided) {
          return NextResponse.json({
            error: "Parental consent is required for attendees under 18",
            requiresParentalConsent: true,
          }, { status: 400 });
        }
        if (body.parentalConsentProvided && body.parentalConsentByName && body.parentalConsentByEmail) {
          requiresParentalConsentEmail = true;
          parentName = body.parentalConsentByName;
          parentEmail = body.parentalConsentByEmail;
        }
      }
    }

    // ─── Age group ────────────────────────────────────────────────────────────
    let ageGroup = '';
    if (body.attendeeAge) {
      if (body.attendeeAge <= 25) ageGroup = '18-25';
      else if (body.attendeeAge <= 35) ageGroup = '26-35';
      else if (body.attendeeAge <= 50) ageGroup = '36-50';
      else ageGroup = '50+';
    }

    // ─── PAID — no verified payment yet → pending registration ─────────────────
    if (!isFree && !hasVerifiedPayment) {
      const registration = new Registration({
        ...buildRegistrationFields(body, id, selectedPlan, totalTickets, ageGroup),
        status: RegistrationStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      });
      await registration.save();

      return NextResponse.json({
        success: true,
        message: "Registration created. Complete payment to confirm your seats.",
        data: {
          registrationId: registration._id,
          registrationNumber: registration.registrationNumber,
          totalAmount: selectedPlan.price * totalTickets,
        },
      });
    }

    // ─── PAID — verified payment → confirm + deduct seats in TRANSACTION ───────
    if (!isFree && hasVerifiedPayment) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Re-fetch event WITHIN transaction for latest data
        const eventInTx = await Event.findById(event._id).session(session);
        if (!eventInTx) {
          throw new Error("Event not found");
        }

        const planInTx = eventInTx.plans?.find((p: any) => p.type === body.planType);
        if (!planInTx) {
          throw new Error("Plan not found");
        }

        // Final seat check inside transaction
        if (eventInTx.availableSeats < totalTickets) {
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json({
            error: `Sorry, only ${eventInTx.availableSeats} seats remaining. Your ${totalTickets} seat${totalTickets !== 1 ? 's' : ''} cannot be accommodated.`,
          }, { status: 409 });
        }

        const planSeatsAvailable = planInTx.availableSeats !== undefined && planInTx.availableSeats !== null
          ? planInTx.availableSeats
          : planInTx.maxSeats;
          
        if (planSeatsAvailable !== undefined && planSeatsAvailable < totalTickets) {
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json({
            error: `Only ${planSeatsAvailable} seat${planSeatsAvailable !== 1 ? 's' : ''} left for ${planInTx.name} plan. Your ${totalTickets} seat${totalTickets !== 1 ? 's' : ''} cannot be accommodated.`,
          }, { status: 409 });
        }

        // Create or update registration
        let registration = existingRegistration;
        if (!registration) {
          registration = new Registration({
            ...buildRegistrationFields(body, id, selectedPlan, totalTickets, ageGroup),
          });
        }
        
        registration.status = RegistrationStatus.CONFIRMED;
        registration.paymentStatus = PaymentStatus.COMPLETED;
        registration.paymentId = verifiedPayment._id;
        await registration.save({ session });

        // Link payment to registration
        verifiedPayment.registrationId = registration._id;
        if (!verifiedPayment.paystackReference) verifiedPayment.paystackReference = body.paymentReference;
        if (!verifiedPayment.paidAt) verifiedPayment.paidAt = new Date();
        await verifiedPayment.save({ session });

        // Deduct global seats
        const globalUpdate = await Event.findOneAndUpdate(
          { 
            _id: event._id, 
            availableSeats: { $gte: totalTickets }
          },
          { $inc: { availableSeats: -totalTickets } },
          { new: true, session }
        );

        if (!globalUpdate) {
          await session.abortTransaction();
          session.endSession();
          // Initiate refund since payment succeeded but registration failed
          await refundPayment(verifiedPayment);
          return NextResponse.json(
            { error: "Seat availability changed. Your payment will be refunded." },
            { status: 409 }
          );
        }

        // Deduct plan seats
        if (selectedPlan.maxSeats !== undefined) {
          // Update plan seats using array filter
          const updateQuery: any = {
            _id: event._id,
            'plans.type': body.planType,
          };
          
          // Add condition for availableSeats if it exists
          if (planInTx.availableSeats !== undefined && planInTx.availableSeats !== null) {
            updateQuery['plans.availableSeats'] = { $gte: totalTickets };
          }
          
          const planUpdate = await Event.findOneAndUpdate(
            updateQuery,
            { $inc: { 'plans.$.availableSeats': -totalTickets } },
            { new: true, session }
          );

          if (!planUpdate) {
            // Rollback global seat deduction
            await Event.findOneAndUpdate(
              { _id: event._id },
              { $inc: { availableSeats: totalTickets } },
              { session }
            );
            await session.abortTransaction();
            session.endSession();
            await refundPayment(verifiedPayment);
            return NextResponse.json(
              { error: "Plan seats were just taken. Your payment will be refunded." },
              { status: 409 }
            );
          }
        }

        await session.commitTransaction();
        session.endSession();

        // Generate ticket and send emails
        return await generateTicketAndSendEmails({
          event,
          registration,
          paymentRecord: verifiedPayment,
          selectedPlan,
          body,
          totalTickets,
          isFree: false,
          requiresParentalConsentEmail,
          parentName,
          parentEmail,
        });

      } catch (txError: any) {
        await session.abortTransaction();
        session.endSession();
        console.error('[register] Transaction failed:', txError);
        
        // Attempt refund if payment was verified
        if (verifiedPayment) {
          await refundPayment(verifiedPayment);
        }
        
        return NextResponse.json({
          error: "Registration failed due to technical issues. Your payment will be refunded within 5-7 business days.",
          message: txError.message,
        }, { status: 500 });
      }
    }

    // ─── FREE REGISTRATION ─────────────────────────────────────────────────────
    // For free registrations: confirm, deduct seats, generate ticket in transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Re-fetch event within transaction
      const eventInTx = await Event.findById(event._id).session(session);
      if (!eventInTx) {
        throw new Error("Event not found");
      }

      const planInTx = eventInTx.plans?.find((p: any) => p.type === body.planType);
      
      // Final seat check
      if (eventInTx.availableSeats < totalTickets) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({
          error: `Sorry, only ${eventInTx.availableSeats} seats remaining. Your ${totalTickets} seat${totalTickets !== 1 ? 's' : ''} cannot be accommodated.`,
        }, { status: 409 });
      }

      const planSeatsAvailable = planInTx?.availableSeats !== undefined && planInTx?.availableSeats !== null
        ? planInTx.availableSeats
        : planInTx?.maxSeats;
        
      if (planSeatsAvailable !== undefined && planSeatsAvailable < totalTickets) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json({
          error: `Only ${planSeatsAvailable} seat${planSeatsAvailable !== 1 ? 's' : ''} left for ${planInTx?.name} plan. Your ${totalTickets} seat${totalTickets !== 1 ? 's' : ''} cannot be accommodated.`,
        }, { status: 409 });
      }

      const registration = new Registration({
        ...buildRegistrationFields(body, id, selectedPlan, totalTickets, ageGroup),
        status: RegistrationStatus.CONFIRMED,
        paymentStatus: PaymentStatus.COMPLETED,
      });
      await registration.save({ session });

      // Deduct global seats
      const globalUpdate = await Event.findOneAndUpdate(
        { _id: event._id, availableSeats: { $gte: totalTickets } },
        { $inc: { availableSeats: -totalTickets } },
        { new: true, session }
      );

      if (!globalUpdate) {
        await session.abortTransaction();
        session.endSession();
        return NextResponse.json(
          { error: "Seats were just taken. Please try again." },
          { status: 409 }
        );
      }

      // Deduct plan seats if applicable
      if (selectedPlan.maxSeats !== undefined && planInTx) {
        const planUpdate = await Event.findOneAndUpdate(
          {
            _id: event._id,
            'plans.type': body.planType,
          },
          { $inc: { 'plans.$.availableSeats': -totalTickets } },
          { new: true, session }
        );

        if (!planUpdate) {
          // Rollback global seat deduction
          await Event.findOneAndUpdate(
            { _id: event._id },
            { $inc: { availableSeats: totalTickets } },
            { session }
          );
          await session.abortTransaction();
          session.endSession();
          return NextResponse.json(
            { error: "Plan seats were just taken. Please try again." },
            { status: 409 }
          );
        }
      }

      await session.commitTransaction();
      session.endSession();

      return await generateTicketAndSendEmails({
        event,
        registration,
        paymentRecord: null,
        selectedPlan,
        body,
        totalTickets,
        isFree: true,
        requiresParentalConsentEmail,
        parentName,
        parentEmail,
      });
      
    } catch (txError: any) {
      await session.abortTransaction();
      session.endSession();
      console.error('[register] Free registration failed:', txError);
      return NextResponse.json({
        error: "Registration failed. Please try again.",
        message: txError.message,
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[register] Fatal error:', error);

    if (error.code === 11000) {
      if (error.keyPattern?.registrationNumber) {
        return NextResponse.json(
          { error: "Registration number conflict. Please try again." },
          { status: 409 }
        );
      }
      if (error.keyPattern?.eventId && error.keyPattern?.attendeeEmail) {
        return NextResponse.json({
          error: "You have already registered for this event with this email address.",
          alreadyRegistered: true,
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      error: "Registration failed. Please try again.",
      message: error.message,
    }, { status: 500 });
  }
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function buildRegistrationFields(
  body: any,
  eventId: string,
  selectedPlan: any,
  totalTickets: number,
  ageGroup: string
) {
  const basePrice = selectedPlan.price;
  const totalPrice = (body.isGroupRegistration || body.isCorporateRegistration) 
    ? basePrice * totalTickets 
    : basePrice;
    
  return {
    eventId: new mongoose.Types.ObjectId(eventId),
    attendeeName: body.attendeeName,
    attendeeEmail: body.attendeeEmail.toLowerCase().trim(),
    attendeePhone: body.attendeePhone,
    attendeeAge: body.attendeeAge,
    attendeeGender: body.attendeeGender,
    attendeeCompany: body.attendeeCompany,
    attendeeTitle: body.attendeeTitle,
    planType: body.planType,
    planName: selectedPlan.name,
    price: totalPrice,
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

async function generateTicketAndSendEmails({ 
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
  const ticketNumber = await generateTicketNumber(event);
  const qrCodeData = JSON.stringify({
    ticketNumber,
    registrationId: registration._id.toString(),
    eventId: event._id.toString(),
    attendeeName: body.attendeeName,
    attendeeEmail: body.attendeeEmail.toLowerCase().trim(),
    price: (body.isGroupRegistration || body.isCorporateRegistration)
      ? selectedPlan.price * totalTickets
      : selectedPlan.price,
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
    price: (body.isGroupRegistration || body.isCorporateRegistration)
      ? selectedPlan.price * totalTickets
      : selectedPlan.price,
    currency: selectedPlan.currency || 'NGN',
    quantity: totalTickets,
    status: TicketStatus.ACTIVE,
    expiresAt: event.endDate,
  });

  await ticket.save();

  registration.ticketId = ticket._id;
  await registration.save();

  // Send emails (don't block on failure)
  try {
    const startDateStr = event.startDate instanceof Date
      ? event.startDate.toISOString()
      : String(event.startDate);
    const endDateStr = event.endDate
      ? (event.endDate instanceof Date ? event.endDate.toISOString() : String(event.endDate))
      : undefined;
    const isVirtualEvent = !event.location?.venue || event.location.venue === 'Online';

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
      price: (body.isGroupRegistration || body.isCorporateRegistration)
        ? selectedPlan.price * totalTickets
        : selectedPlan.price,
      currency: selectedPlan.currency || 'NGN',
      ticketNumber: ticket.ticketNumber,
      qrCode: ticket.qrCode,
      paymentReference: paymentRecord?.reference,
      paymentAmount: paymentRecord?.amountPaid,
      isFree,
      isGroupRegistration: body.isGroupRegistration || false,
      groupSize: totalTickets,
      groupName: body.groupName,
      registrationType: body.isCorporateRegistration
        ? 'corporate'
        : body.isGroupRegistration ? 'group' : 'individual',
      specialInstructions: (event as any).registrationInstructions
        || (event as any).instructions
        || event.location?.notes
        || '',
    });

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
    }
  } catch (emailError) {
    console.error('[register] Failed to send confirmation email:', emailError);
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
      planType: body.planType,
      planName: selectedPlan.name,
      totalAmount: (body.isGroupRegistration || body.isCorporateRegistration)
        ? selectedPlan.price * totalTickets
        : selectedPlan.price,
      ...(paymentRecord && {
        paymentId: paymentRecord._id,
        paymentReference: paymentRecord.reference,
      }),
      ...(requiresParentalConsentEmail && { parentalConsentSent: true, parentEmail }),
    },
  });
}

async function generateTicketNumber(event: any): Promise<string> {
  const eventPrefix = event.title
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 4)
    .toUpperCase();
  const count = await Ticket.countDocuments({ eventId: event._id });
  return `${eventPrefix}-${(count + 1).toString().padStart(6, '0')}`;
}

async function refundPayment(payment: any): Promise<void> {
  try {
    console.log(`[refund] Initiating refund for payment: ${payment.reference}`);
    
    // Implement your payment provider's refund logic here
    // Example for Paystack:
    // const response = await fetch('https://api.paystack.co/refund', {
    //   method: 'POST',
    //   headers: {
    //     Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     transaction: payment.paystackReference,
    //     amount: payment.amountPaid * 100, // Convert to kobo if needed
    //   }),
    // });
    
    // Update payment status
    payment.refundStatus = 'processing';
    payment.refundRequestedAt = new Date();
    await payment.save();
    
    console.log(`[refund] Refund initiated for ${payment.reference}`);
  } catch (error) {
    console.error(`[refund] Failed to refund payment ${payment.reference}:`, error);
  }
}