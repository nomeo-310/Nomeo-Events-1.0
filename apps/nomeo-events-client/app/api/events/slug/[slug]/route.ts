import { connectDB } from "@/lib/mongoose";
import { User } from "@/models/user";
import { Event } from "@/models/event";
import { Profile } from "@/models/profile";
import { NextResponse } from "next/server";
import { withGrouping } from "@/lib/event-grouping";

export async function GET( request: Request, { params }: { params: Promise<{ slug: string }> }) {
  await connectDB();
  
  const { slug } = await params;

  try {
    const event = await Event.findOne({ slug })
      .populate({
        path: 'organizerId',
        model: User,
        select: 'name email image',
      })
      .populate({
        path: 'createdBy',
        model: User,
        select: 'name email',
      });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Fetch the organizer's profile separately —
    // Profile lives in its own collection with userId as the foreign key
    const organizerProfile = await Profile.findOne(
      { userId: event.organizerId },
      { 'publicProfile.slug': 1, fullName: 1, displayName: 1, profilePicture: 1 }
    ).lean();

    const eventWithGrouping = withGrouping(event.toObject());

    return NextResponse.json({
      success: true,
      data: {
        ...eventWithGrouping,
        organizerProfile: organizerProfile
          ? {
              slug: organizerProfile.publicProfile?.slug ?? null,
              fullName: organizerProfile.fullName,
              displayName: organizerProfile.displayName ?? null,
              profilePicture: organizerProfile.profilePicture ?? null,
            }
          : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}