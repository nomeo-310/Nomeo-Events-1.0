// app/api/user/events/route.ts
import { withGroupingBatch } from "@/lib/event-grouping";
import { connectDB } from "@/lib/mongoose";
import { getCurrentUser } from "@/lib/session";
import { Event, EventStatus } from "@/models/event";
import { User } from "@/models/user";
import { Subscription } from "@/models/subscription"; // Import your subscription model
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB();

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    // Filters
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';
    const isDeleted = searchParams.get('isDeleted') === 'true';
    const isArchived = searchParams.get('isArchived') === 'true';

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get user's subscription to determine plan limits
    const subscription = await Subscription.findActiveByUser(user.id)

    const planTier = subscription?.planTier || 'free';
    const maxEvents = subscription?.maxEvents ?? (planTier === 'free' ? 3 : 0); // 0 means unlimited

    // Query for events list (paginated)
    const query: any = {
      organizerId: user.id,
    };

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Show deleted events only if explicitly requested
    if (isDeleted) {
      query.isDeleted = true;
    } else {
      query.isDeleted = false;
    }

    // Archived filter
    if (isArchived !== null) {
      query.isArchived = isArchived;
    }

    // Upcoming filter
    if (upcoming) {
      query.startDate = { $gte: new Date() };
      query.status = EventStatus.PUBLISHED;
    }

    // Count total documents for pagination
    const totalCount = await Event.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Consistent sorting: by startDate descending (newest first) then createdAt descending
    const events = await Event.find(query)
      .sort({ startDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'organizerId',
        model: User,
        select: 'name email image'
      })
      .lean({ virtuals: true });

    const eventsWithGrouping = withGroupingBatch(events);

    // ─── Calculate event count based on subscription tier ───────────────────
    let eventCount = 0;
    
    if (planTier === 'free') {
      // For free plan: count ALL events (published, draft, archived, but not deleted)
      eventCount = await Event.countDocuments({
        organizerId: user.id,
        isDeleted: false,
      });
    } else {
      // For paid plans: only count PUBLISHED events (active events)
      eventCount = await Event.countDocuments({
        organizerId: user.id,
        status: EventStatus.PUBLISHED,
        isDeleted: false,
        isArchived: false, // Only active published events
      });
    }

    // Calculate if user can create more events
    const canCreateMore = maxEvents === 0 ? true : eventCount < maxEvents;
    const remainingEvents = maxEvents === 0 ? -1 : Math.max(0, maxEvents - eventCount);

    return NextResponse.json({
      success: true,
      data: eventsWithGrouping,
      eventCount: {
        total: eventCount,
        maxAllowed: maxEvents,
        remaining: remainingEvents,
        canCreateMore,
        planTier,
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      count: events.length,
    });
  } catch (error: any) {
    console.error('Error fetching organizer events:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch events' },
      { status: 500 }
    );
  }
}