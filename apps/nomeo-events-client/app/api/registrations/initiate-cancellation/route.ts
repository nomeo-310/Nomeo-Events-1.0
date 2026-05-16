// app/api/registrations/initiate-cancellation/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import crypto from "crypto";
import { Registration, RegistrationStatus } from "@/models/registration";
import { connectDB } from "@/lib/mongoose";
import { sendCancellationOtpEmail } from "@/lib/emails/send-cancellation-email";

const OTP_TTL_MS = 15 * 60 * 1_000;

function generateOtp(): string {
  return crypto.randomInt(100_000, 999_999).toString();
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { email, eventId } = body as { email?: string; eventId?: string };

    if (!email || !eventId) {
      return NextResponse.json(
        { success: false, message: "email and eventId are required" },
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

    // Find the registration where this email is the primary attendee
    const registration = await Registration.findOne({
      eventId: new mongoose.Types.ObjectId(eventId),
      attendeeEmail: normalizedEmail,
    }).select("+cancellationOtp +cancellationOtpExpiresAt +groupMembers +companyMembers +isGroupRegistration +isCorporateRegistration");

    if (!registration) {
      // Check if this email exists as a group/corporate member (but not primary)
      const memberRegistration = await Registration.findOne({
        eventId: new mongoose.Types.ObjectId(eventId),
        $or: [
          { "groupMembers.email": normalizedEmail },
          { "companyMembers.email": normalizedEmail },
        ],
      }).lean();

      if (memberRegistration) {
        // Find the specific member in the array to check if they're primary
        const isGroup = memberRegistration.isGroupRegistration;
        const memberType = isGroup ? "group" : "corporate";
        const membersArray = isGroup ? memberRegistration.groupMembers : memberRegistration.companyMembers;
        
        // Find the member in the array
        const member = membersArray?.find((m: any) => m.email.toLowerCase() === normalizedEmail);
        
        // Check if this is the first member (primary attendee) - index 0
        const isPrimaryAttendee = membersArray && membersArray.length > 0 && membersArray[0].email.toLowerCase() === normalizedEmail;
        
        const primaryName = memberRegistration.attendeeName;
        const primaryEmail = memberRegistration.attendeeEmail;

        // If it's NOT the primary attendee (not the first in array), block cancellation
        if (!isPrimaryAttendee) {
          return NextResponse.json(
            {
              success: false,
              message: `You are registered as a ${memberType} member. Only the primary registrant (${primaryName}) can cancel the entire booking. Please contact them at ${primaryEmail} to request cancellation.`,
              data: {
                isMember: true,
                isPrimaryAttendee: false,
                memberType,
                primaryRegistrant: {
                  name: primaryName,
                  email: primaryEmail,
                },
              },
            },
            { status: 403 }
          );
        }
        
        // If it IS the primary attendee, we need to use their registration
        // But since we didn't find by attendeeEmail (which should exist), 
        // there's a data inconsistency. Log and continue to find by attendeeEmail properly
        console.warn(`Primary attendee ${normalizedEmail} found in ${memberType}Members array but not as attendeeEmail`);
        
        // Try to find by attendeeEmail again (should exist)
        const primaryRegistration = await Registration.findOne({
          eventId: new mongoose.Types.ObjectId(eventId),
          attendeeEmail: normalizedEmail,
        });
        
        if (!primaryRegistration) {
          return NextResponse.json(
            { success: false, message: "Registration not found for primary attendee." },
            { status: 404 }
          );
        }
        
        // Continue with primaryRegistration instead
        const otp = generateOtp();
        primaryRegistration.cancellationOtp = otp;
        primaryRegistration.cancellationOtpExpiresAt = Date.now() + OTP_TTL_MS;
        await primaryRegistration.save();
        
        const Event = mongoose.model("Event");
        const event = await Event.findById(eventId).select("title date venue").lean();
        
        await sendCancellationOtpEmail({
          email: primaryRegistration.attendeeEmail,
          name: primaryRegistration.attendeeName,
          otp,
          eventTitle: (event as any)?.title ?? "the event",
          eventDate: (event as any)?.date ?? new Date().toISOString(),
          registrationNumber: primaryRegistration.registrationNumber,
          expiresInMinutes: 15,
        });
        
        return NextResponse.json(
          { 
            success: true, 
            message: "A cancellation code has been sent to your email.",
            data: {
              isMember: false,
              registrationNumber: primaryRegistration.registrationNumber,
            }
          },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { success: false, message: "No registration found for this email and event." },
        { status: 404 }
      );
    }

    // Check if registration is already cancelled
    if (
      registration.status === RegistrationStatus.CANCELLED ||
      registration.status === RegistrationStatus.REFUNDED
    ) {
      return NextResponse.json(
        { success: false, message: "This registration is already cancelled." },
        { status: 409 }
      );
    }

    // Rate-limit: don't re-send if a valid OTP already exists
    if (
      registration.cancellationOtp &&
      registration.cancellationOtpExpiresAt &&
      registration.cancellationOtpExpiresAt > Date.now()
    ) {
      const remainingSeconds = Math.ceil(
        (registration.cancellationOtpExpiresAt - Date.now()) / 1_000
      );
      return NextResponse.json(
        {
          success: false,
          message: `A cancellation code was already sent. Please wait ${remainingSeconds}s before requesting another.`,
        },
        { status: 429 }
      );
    }

    // Generate and save OTP
    const otp = generateOtp();
    registration.cancellationOtp = otp;
    registration.cancellationOtpExpiresAt = Date.now() + OTP_TTL_MS;
    await registration.save();

    // Get event details for email
    const Event = mongoose.model("Event");
    const event = await Event.findById(eventId).select("title date venue").lean();

    // Send email with OTP
    await sendCancellationOtpEmail({
      email: registration.attendeeEmail,
      name: registration.attendeeName,
      otp,
      eventTitle: (event as any)?.title ?? "the event",
      eventDate: (event as any)?.date ?? new Date().toISOString(),
      registrationNumber: registration.registrationNumber,
      expiresInMinutes: 15,
    });

    return NextResponse.json(
      { 
        success: true, 
        message: "A cancellation code has been sent to your email.",
        data: {
          isMember: false,
          registrationNumber: registration.registrationNumber,
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[request-cancellation] error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}