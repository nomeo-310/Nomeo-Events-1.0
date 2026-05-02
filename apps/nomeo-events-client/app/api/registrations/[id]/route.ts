import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Event } from "@/models/event";
import { Registration, RegistrationStatus, PaymentStatus } from "@/models/registration";
import { sendUserCancelEmail } from "@/lib/send-user-cancel-email";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { Ticket } from "@/models/ticket";
import { Payment } from "@/models/payment";

async function getRegistrationForOrganizer(id: string, userId: string, userRole: string) {
  if (!mongoose.isValidObjectId(id)) {
    return { error: NextResponse.json({ error: "Invalid registration ID" }, { status: 400 }) };
  }

  const registration = await Registration.findById(id);
  if (!registration) {
    return { error: NextResponse.json({ error: "Registration not found" }, { status: 404 }) };
  }

  const event = await Event.findById(registration.eventId);
  if (!event) {
    return { error: NextResponse.json({ error: "Event not found" }, { status: 404 }) };
  }

  const isOrganizer = event.organizerId?.toString() === userId;
  const isAdmin = userRole === "admin";

  if (!isOrganizer && !isAdmin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { registration, event };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await getRegistrationForOrganizer(id, user.id, user.role);
    if (result.error) return result.error;

    const registration = await Registration.findById(id)
      .populate({
        path: "eventId", 
        model:Event,
        select: "title startDate endDate venue eventType organizerId"
      })
      .populate({
        path: "ticketId", 
        model:Ticket, 
        select: "ticketNumber qrCode status"
      })
      .populate({
        path: "paymentId", 
        model: Payment,
        select: "reference amount gatewayStatus amountPaid"
      })
      .lean();

    const event = registration!.eventId as any;

    const registrationType = registration!.isCorporateRegistration
      ? "corporate"
      : registration!.isGroupRegistration
      ? "group"
      : "individual";

    return NextResponse.json({
      success: true,
      data: {
        registration: {
          id: registration!._id,
          registrationNumber: registration!.registrationNumber,
          status: registration!.status,
          paymentStatus: registration!.paymentStatus,
          registrationType,
          planName: registration!.planName,
          planType: registration!.planType,
          price: registration!.price,
          currency: registration!.currency,
          attendeeName: registration!.attendeeName,
          attendeeEmail: registration!.attendeeEmail,
          attendeePhone: registration!.attendeePhone,
          attendeeGender: registration!.attendeeGender,
          attendeeCompany: registration!.attendeeCompany,
          attendeeTitle: registration!.attendeeTitle,
          attendeeAge: registration!.attendeeAge,
          ageVerified: registration!.ageVerified,
          ageVerifiedAt: registration!.ageVerifiedAt,
          parentalConsentProvided: registration!.parentalConsentProvided,
          ageGroup: registration!.ageGroup,
          specialRequests: registration!.specialRequests,
          dietaryRestrictions: registration!.dietaryRestrictions,
          accessibilityNeeds: registration!.accessibilityNeeds,
          ...(registration!.isGroupRegistration && {
            groupName: registration!.groupName,
            groupSize: registration!.groupSize,
            groupMembers: registration!.groupMembers,
          }),
          ...(registration!.isCorporateRegistration && {
            companyName: registration!.companyName,
            companySize: registration!.companySize,
            companyMembers: registration!.companyMembers,
          }),
          certificateIssued: registration!.certificateIssued,
          feedbackSubmitted: registration!.feedbackSubmitted,
          rating: registration!.rating,
          feedback: registration!.feedback,
          cancelledAt: registration!.cancelledAt,
          cancellationReason: registration!.cancellationReason,
          cancelledBy: registration!.cancelledBy,
          registeredAt: registration!.registeredAt,
          updatedAt: registration!.updatedAt,
          event: event
            ? {
                id: event._id,
                title: event.title,
                startDate: event.startDate,
                endDate: event.endDate,
                venue: event.venue,
                eventType: event.eventType,
              }
            : null,
          ticket: registration!.ticketId ?? null,
          payment: registration!.paymentId ?? null,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching registration:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await getRegistrationForOrganizer(id, user.id, user.role);
    if (result.error) return result.error;

    const { registration, event } = result;

    if (registration!.status === RegistrationStatus.CANCELLED) {
      return NextResponse.json({ error: "Registration is already cancelled" }, { status: 400 });
    }

    const eventDate = new Date(event!.startDate);
    const now = new Date();

    if (eventDate < now && registration!.status === RegistrationStatus.ATTENDED) {
      return NextResponse.json(
        { error: "Cannot cancel a registration for a past event that was attended" },
        { status: 400 }
      );
    }

    const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
    let cancellationReason = `Cancelled by organizer (${user.email || user.id})`;

    if (registration!.isCorporateRegistration) {
      if (daysUntilEvent < 7) cancellationReason += ` - Corporate cancellation with 50% fee (${daysUntilEvent} days before event)`;
      else if (daysUntilEvent < 14) cancellationReason += ` - Corporate cancellation with 25% fee (${daysUntilEvent} days before event)`;
      else cancellationReason += ` - Corporate cancellation (${daysUntilEvent} days before event)`;
    } else if (registration!.isGroupRegistration) {
      if (daysUntilEvent < 3) cancellationReason += ` - Group cancellation with 30% fee (${daysUntilEvent} days before event)`;
      else if (daysUntilEvent < 7) cancellationReason += ` - Group cancellation with 15% fee (${daysUntilEvent} days before event)`;
      else cancellationReason += ` - Group cancellation (${daysUntilEvent} days before event)`;
    } else {
      if (daysUntilEvent < 1) cancellationReason += ` - Individual cancellation with 10% fee (${daysUntilEvent} days before event)`;
      else if (daysUntilEvent < 3) cancellationReason += ` - Individual cancellation with 5% fee (${daysUntilEvent} days before event)`;
      else cancellationReason += ` - Individual cancellation (${daysUntilEvent} days before event)`;
    }

    // cancel() handles everything: status, paymentStatus, ticket, payment, seats, cancelledBy
    await registration!.cancel(cancellationReason, "by_organizer");

    const registrationType = registration!.isCorporateRegistration
      ? "corporate"
      : registration!.isGroupRegistration
      ? "group"
      : "individual";

    try {
      await sendUserCancelEmail({
        email: registration!.attendeeEmail,
        name: registration!.attendeeName,
        eventTitle: event!.title,
        eventDate: new Date(event!.startDate).toISOString(),
        registrationNumber: registration!.registrationNumber,
        cancellationReason: registration!.cancellationReason,
        registrationType,
        refunded: registration!.paymentStatus === PaymentStatus.REFUNDED,
        currency: registration!.currency,
        price: registration!.price,
      });
    } catch (emailError) {
      console.error("Failed to send cancellation notification email:", emailError);
    }

    console.log(`Registration ${id} cancelled by organizer ${user.id}`);

    return NextResponse.json({
      success: true,
      message: "Registration cancelled successfully",
      data: {
        registrationId: id,
        registrationNumber: registration!.registrationNumber,
        registrationType,
        cancelledAt: registration!.cancelledAt,
        cancellationReason: registration!.cancellationReason,
        cancelledBy: registration!.cancelledBy,
        status: registration!.status,
        paymentStatus: registration!.paymentStatus,
      },
    });
  } catch (error: any) {
    console.error("Error cancelling registration:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await getRegistrationForOrganizer(id, user.id, user.role);
    if (result.error) return result.error;

    const { registration } = result;
    const body = await req.json();

    const {
      status,
      paymentStatus,
      ageVerified,
      attendeeName,
      attendeeEmail,
      attendeePhone,
      attendeeCompany,
      attendeeTitle,
      specialRequests,
      dietaryRestrictions,
      accessibilityNeeds,
      isGroupRegistration,
      isCorporateRegistration,
      groupName,
      companyName,
      certificateIssued,
      feedbackSubmitted,
      rating,
      feedback,
    } = body;

    const changes: string[] = [];

    if (status && status !== registration!.status) {
      if (status === RegistrationStatus.ATTENDED) {
        await registration!.checkIn(attendeeEmail || registration!.attendeeEmail);
        changes.push(`status to ATTENDED via check-in`);
      } else {
        registration!.status = status;
        changes.push(`status from ${registration!.status} to ${status}`);
      }
    }

    if (paymentStatus && paymentStatus !== registration!.paymentStatus) {
      registration!.paymentStatus = paymentStatus;
      changes.push(`paymentStatus to ${paymentStatus}`);
    }

    if (ageVerified !== undefined && ageVerified !== registration!.ageVerified) {
      registration!.ageVerified = ageVerified;
      registration!.ageVerifiedAt = new Date();
      registration!.ageVerifiedBy = new mongoose.Types.ObjectId(user.id);
      changes.push(`ageVerified to ${ageVerified}`);
    }

    if (attendeeName) { registration!.attendeeName = attendeeName; changes.push("attendeeName updated"); }
    if (attendeeEmail) { registration!.attendeeEmail = attendeeEmail; changes.push("attendeeEmail updated"); }
    if (attendeePhone) registration!.attendeePhone = attendeePhone;
    if (attendeeCompany) registration!.attendeeCompany = attendeeCompany;
    if (attendeeTitle) registration!.attendeeTitle = attendeeTitle;
    if (specialRequests !== undefined) registration!.specialRequests = specialRequests;
    if (dietaryRestrictions) registration!.dietaryRestrictions = dietaryRestrictions;
    if (accessibilityNeeds) registration!.accessibilityNeeds = accessibilityNeeds;

    if (isGroupRegistration !== undefined && isGroupRegistration !== registration!.isGroupRegistration) {
      registration!.isGroupRegistration = isGroupRegistration;
      changes.push(`isGroupRegistration to ${isGroupRegistration}`);
    }

    if (isCorporateRegistration !== undefined && isCorporateRegistration !== registration!.isCorporateRegistration) {
      registration!.isCorporateRegistration = isCorporateRegistration;
      changes.push(`isCorporateRegistration to ${isCorporateRegistration}`);
    }

    if (registration!.isGroupRegistration && registration!.isCorporateRegistration) {
      return NextResponse.json(
        { error: "Registration cannot be both group and corporate" },
        { status: 400 }
      );
    }

    if (groupName && registration!.isGroupRegistration) { registration!.groupName = groupName; changes.push("groupName updated"); }
    if (companyName && registration!.isCorporateRegistration) { registration!.companyName = companyName; changes.push("companyName updated"); }
    if (certificateIssued !== undefined && certificateIssued !== registration!.certificateIssued) {
      registration!.certificateIssued = certificateIssued;
      changes.push(`certificateIssued to ${certificateIssued}`);
    }
    if (feedbackSubmitted !== undefined) { registration!.feedbackSubmitted = feedbackSubmitted; changes.push(`feedbackSubmitted to ${feedbackSubmitted}`); }
    if (rating !== undefined && rating >= 1 && rating <= 5) { registration!.rating = rating; changes.push(`rating to ${rating}`); }
    if (feedback !== undefined) { registration!.feedback = feedback; changes.push("feedback updated"); }

    await registration!.save();

    const registrationType = registration!.isCorporateRegistration
      ? "corporate"
      : registration!.isGroupRegistration
      ? "group"
      : "individual";

    return NextResponse.json({
      success: true,
      message: changes.length > 0 ? `Registration updated: ${changes.join(", ")}` : "No changes made",
      data: {
        registration: {
          id: registration!._id,
          registrationNumber: registration!.registrationNumber,
          attendeeName: registration!.attendeeName,
          attendeeEmail: registration!.attendeeEmail,
          status: registration!.status,
          paymentStatus: registration!.paymentStatus,
          registrationType,
          isGroupRegistration: registration!.isGroupRegistration,
          isCorporateRegistration: registration!.isCorporateRegistration,
          ageVerified: registration!.ageVerified,
          certificateIssued: registration!.certificateIssued,
          feedbackSubmitted: registration!.feedbackSubmitted,
          updatedAt: registration!.updatedAt,
        },
        updatedBy: user.email || user.id,
        changes,
      },
    });
  } catch (error: any) {
    console.error("Error updating registration:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}