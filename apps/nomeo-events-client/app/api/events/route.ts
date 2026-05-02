// app/api/events/route.ts
import { connectDB } from "@/lib/mongoose";
import { Event, EventStatus } from "@/models/event";
import { NextRequest, NextResponse } from "next/server";
import { withGroupingBatch } from "@/lib/event-grouping";
import { getCurrentUser } from "@/lib/session";


export async function GET(request: NextRequest) {
  await connectDB();

  try {
    const { searchParams } = new URL(request.url);

    const category        = searchParams.get('category');
    const type            = searchParams.get('type');
    const search          = searchParams.get('search');
    const startDateParam  = searchParams.get('startDate');  // yyyy-MM-dd
    const endDateParam    = searchParams.get('endDate');    // yyyy-MM-dd
    const upcoming        = searchParams.get('upcoming')  === 'true';
    const ongoing         = searchParams.get('ongoing')   === 'true';
    const completed       = searchParams.get('completed') === 'true';
    const featured        = searchParams.get('featured')  === 'true';
    const includeGrouping = searchParams.get('includeGrouping') === 'true';

    const page  = parseInt(searchParams.get('page')  || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip  = (page - 1) * limit;

    const query: any = {
      isPublic:   true,
      isDeleted:  false,
      isArchived: false,
      status:     EventStatus.PUBLISHED,
    };

    // ── Category & type ────────────────────────────────────────────────────
    if (category) query.category = category;
    if (type)     query.type     = type;

    // ── Full-text search across title, description, location ───────────────
    if (search?.trim()) {
      const regex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { title:              regex },
        { description:        regex },
        { 'location.address': regex },
        { 'location.city':    regex },
        { 'location.state':   regex },
        { 'location.country': regex },
      ];
    }

    // ── Status filters (mutually exclusive — only one sent at a time) ──────
    if (upcoming) {
      query.startDate = { $gte: new Date() };
    }

    if (ongoing) {
      query.startDate = { $lte: new Date() };
      query.endDate   = { $gte: new Date() };
    }

    if (completed) {
      query.endDate = { $lte: new Date() };
    }

    // ── Date range — narrows within the active status ──────────────────────
    if (startDateParam) {
      const from = new Date(startDateParam);
      if (query.startDate) {
        query.startDate.$gte = query.startDate.$gte && from > query.startDate.$gte
          ? from
          : from;
      } else {
        query.startDate = { $gte: from };
      }
    }

    if (endDateParam) {
      const to = new Date(endDateParam);
      to.setHours(23, 59, 59, 999);

      if (query.endDate) {
        query.endDate.$lte = query.endDate.$lte && to < query.endDate.$lte
          ? to
          : to;
      } else {
        query.endDate = { $lte: to };
      }
    }

    if (featured) query.featured = true;

    // ── Execute ────────────────────────────────────────────────────────────
    const totalCount = await Event.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    let events = await Event.find(query)
      .sort({ startDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('organizerId', 'name email image')
      .lean();

    if (includeGrouping) events = withGroupingBatch(events);

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage:     page < totalPages,
        hasPreviousPage: page > 1,
      },
      count: events.length,
    });

  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while fetching events.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  await connectDB();

  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not Authenticated" }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Create event with organizerId from session
    const event = await Event.create({
      ...body,
      organizerId: currentUser.id,
      createdBy: currentUser.id,
      status: EventStatus.DRAFT,
      isPublic: false,
      isDeleted: false,
      isArchived: false,
    });

    const populatedEvent = await Event.findById(event._id)
      .populate('organizerId', 'name email image')
      .populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      data: populatedEvent,
      message: "Event created successfully as draft"
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create event" },
      { status: 500 }
    );
  }
}