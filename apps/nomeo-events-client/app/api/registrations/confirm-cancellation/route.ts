import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { Registration, RegistrationStatus } from "@/models/registration";
import { connectDB } from "@/lib/mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, eventId, otp, reason } = body as {
      email?: string;
      eventId?: string;
      otp?: string;
      reason?: string;
    };

    if (!email || !eventId || !otp) {
      return NextResponse.json(
        { success: false, message: "email, eventId, and otp are required" },
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(eventId)) {
      return NextResponse.json(
        { success: false, message: "Invalid eventId" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const registration = await Registration.findOne({
      eventId: new mongoose.Types.ObjectId(eventId),
      attendeeEmail: normalizedEmail,
    }).select("+cancellationOtp +cancellationOtpExpiresAt +groupMembers +companyMembers +isGroupRegistration +isCorporateRegistration");

    if (!registration) {
      const memberRegistration = await Registration.findOne({
        eventId: new mongoose.Types.ObjectId(eventId),
        $or: [
          { "groupMembers.email": normalizedEmail },
          { "companyMembers.email": normalizedEmail },
        ],
      }).lean();

      if (memberRegistration) {
        const isGroup = memberRegistration.isGroupRegistration;
        const memberType = isGroup ? "group" : "corporate";
        const membersArray = isGroup
          ? memberRegistration.groupMembers
          : memberRegistration.companyMembers;

        const isPrimaryAttendee =
          membersArray &&
          membersArray.length > 0 &&
          membersArray[0].email.toLowerCase() === normalizedEmail;

        const primaryName = memberRegistration.attendeeName;
        const primaryEmail = memberRegistration.attendeeEmail;

        if (!isPrimaryAttendee) {
          return NextResponse.json(
            {
              success: false,
              message: `You are registered as a ${memberType} member. Only the primary registrant (${primaryName}) can cancel the entire booking. Please contact them at ${primaryEmail} to request cancellation.`,
              data: {
                isMember: true,
                isPrimaryAttendee: false,
                memberType,
                primaryRegistrant: { name: primaryName, email: primaryEmail },
              },
            },
            { status: 403 }
          );
        }
      }

      return NextResponse.json(
        { success: false, message: "Registration not found." },
        { status: 404 }
      );
    }

    if (
      registration.status === RegistrationStatus.CANCELLED ||
      registration.status === RegistrationStatus.REFUNDED
    ) {
      return NextResponse.json(
        { success: false, message: "This registration is already cancelled." },
        { status: 409 }
      );
    }

    if (!registration.cancellationOtp || !registration.cancellationOtpExpiresAt) {
      return NextResponse.json(
        { success: false, message: "No cancellation code found. Please request a new one." },
        { status: 400 }
      );
    }

    if (Date.now() > registration.cancellationOtpExpiresAt) {
      return NextResponse.json(
        { success: false, message: "Cancellation code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (registration.cancellationOtp !== otp.trim()) {
      return NextResponse.json(
        { success: false, message: "Invalid cancellation code." },
        { status: 400 }
      );
    }

    // Clear OTP immediately — one-time use
    registration.cancellationOtp = undefined as any;
    registration.cancellationOtpExpiresAt = undefined as any;
    await registration.save();

    // cancel() now owns status, paymentStatus, ticket, payment, and seats
    const cancellationReason = reason?.trim() || "User cancelled registration";
    await registration.cancel(cancellationReason, "by_user");

    // Cascade-cancel linked member registrations
    let cancelledMemberCount = 0;
    const memberEmails: string[] = [];

    if (registration.isGroupRegistration && registration.groupMembers?.length) {
      memberEmails.push(...registration.groupMembers.slice(1).map((m) => m.email.toLowerCase()));
    }

    if (registration.isCorporateRegistration && registration.companyMembers?.length) {
      memberEmails.push(...registration.companyMembers.slice(1).map((m) => m.email.toLowerCase()));
    }

    if (memberEmails.length > 0) {
      const memberResult = await Registration.updateMany(
        {
          eventId: registration.eventId,
          attendeeEmail: { $in: memberEmails },
          status: { $nin: [RegistrationStatus.CANCELLED, RegistrationStatus.REFUNDED] },
        },
        {
          $set: {
            status: RegistrationStatus.CANCELLED,
            cancelledAt: new Date(),
            cancellationReason: registration.isGroupRegistration
              ? "Primary registrant cancelled the group booking"
              : "Primary corporate registrant cancelled the booking",
            cancelledBy: "by_organizer",
          },
        }
      );
      cancelledMemberCount = memberResult.modifiedCount;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your registration has been successfully cancelled.",
        data: {
          registrationNumber: registration.registrationNumber,
          cancelledAt: registration.cancelledAt,
          ...(cancelledMemberCount > 0 && {
            cascadedCancellations: cancelledMemberCount,
            note: `${cancelledMemberCount} linked member registration(s) were also cancelled.`,
          }),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[confirm-cancellation] error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}