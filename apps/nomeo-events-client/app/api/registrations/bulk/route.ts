import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Registration, RegistrationStatus, PaymentStatus } from "@/models/registration";
import { Event } from "@/models/event";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

// POST for bulk operations
export async function POST(request: Request) {
  await connectDB();

  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, registrationIds, eventId, data } = body;

  if (!registrationIds || !registrationIds.length) {
    return NextResponse.json({ success: false, error: "No registration IDs provided" }, { status: 400 });
  }

  // Verify user is organizer for this event
  const event = await Event.findById(eventId);
  if (!event) {
    return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
  }

  const isOrganizer = event.organizerId?.toString() === user.id;
  if (!isOrganizer && user.role !== 'admin') {
    return NextResponse.json({ success: false, error: "Forbidden - Only organizers can perform bulk operations" }, { status: 403 });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const registrations = await Registration.find({
      _id: { $in: registrationIds }
    }).session(session);

    if (registrations.length === 0) {
      await session.abortTransaction();
      return NextResponse.json({ success: false, error: "No valid registrations found" }, { status: 404 });
    }

    const results = [];
    const errors = [];

    for (const registration of registrations) {
      try {
        switch (action) {
          case 'checkin':
            await registration.checkIn(user.email);
            results.push({
              id: registration._id,
              registrationNumber: registration.registrationNumber,
              status: 'checked_in'
            });
            break;

          case 'cancel':
            await registration.cancel(data?.reason || 'Bulk cancelled by organizer');
            results.push({
              id: registration._id,
              registrationNumber: registration.registrationNumber,
              status: 'cancelled'
            });
            break;

          case 'delete':
            // Permanent delete (use with caution)
            await registration.deleteOne();
            results.push({
              id: registration._id,
              registrationNumber: registration.registrationNumber,
              status: 'deleted'
            });
            break;

          case 'verify-age':
            registration.ageVerified = true;
            registration.ageVerifiedAt = new Date();
            registration.ageVerifiedBy = new mongoose.Types.ObjectId(user.id);
            await registration.save();
            results.push({
              id: registration._id,
              registrationNumber: registration.registrationNumber,
              status: 'age_verified'
            });
            break;

          case 'update-payment-status':
            registration.paymentStatus = data?.paymentStatus;
            if (registration.paymentStatus === PaymentStatus.COMPLETED) {
              registration.status = RegistrationStatus.CONFIRMED;
            } else if (registration.paymentStatus === PaymentStatus.REFUNDED) {
              registration.status = RegistrationStatus.REFUNDED;
            }
            await registration.save();
            results.push({
              id: registration._id,
              registrationNumber: registration.registrationNumber,
              status: `payment_status_updated_to_${data?.paymentStatus}`
            });
            break;

          case 'issue-certificate':
            registration.certificateIssued = true;
            await registration.save();
            results.push({
              id: registration._id,
              registrationNumber: registration.registrationNumber,
              status: 'certificate_issued'
            });
            break;

          case 'mark-attended':
            registration.status = RegistrationStatus.ATTENDED;
            await registration.save();
            results.push({
              id: registration._id,
              registrationNumber: registration.registrationNumber,
              status: 'marked_attended'
            });
            break;

          default:
            errors.push({
              id: registration._id,
              error: `Unknown action: ${action}`
            });
        }
      } catch (error: any) {
        errors.push({
          id: registration._id,
          error: error.message
        });
      }
    }

    await session.commitTransaction();

    return NextResponse.json({
      success: true,
      message: `Bulk ${action} completed`,
      data: {
        total: registrationIds.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      }
    });
  } catch (error: any) {
    await session.abortTransaction();
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    session.endSession();
  }
}