// app/api/events/[id]/action/route.ts
import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Event, EventStatus } from "@/models/event";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH( request: NextRequest, { params }: { params: Promise<{ id: string; }> }) {

  await connectDB();

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;
  const { action } = await request.json();

  if (!action) {
    return NextResponse.json({ success: false, error: "Action is required" }, { status: 400 });
  }

  try {
    const event = await Event.findOne({ _id: eventId, createdBy: user.id });

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found or unauthorized" }, { status: 404 });
    }

    let message = "";

    switch (action) {
      case "publish":
        event.status = EventStatus.PUBLISHED;
        event.isPublic = true;
        message = "Event published successfully";
        break;

      case "unpublish":
        event.isPublic = false;
        message = "Event unpublished (now private)";
        break;

      case "soft-delete":
        event.isDeleted = true;
        event.deletedAt = new Date();
        message = "Event moved to trash";
        break;

      case "restore":
        event.isDeleted = false;
        event.deletedAt = null;
        event.isArchived = false;
        event.archivedAt = null;
        event.status = EventStatus.DRAFT;
        message = "Event restored successfully";
        break;

      case "archive":
        event.isArchived = true;
        event.archivedAt = new Date();
        event.status = EventStatus.ARCHIVED;
        message = "Event archived successfully";
        break;

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    await event.save();

    return NextResponse.json({
      success: true,
      message,
      data: event
    });

  } catch (error: any) {
    console.error("Event action error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Something went wrong"
    }, { status: 500 });
  }
}