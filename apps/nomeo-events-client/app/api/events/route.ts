import { connectDB } from "@/lib/mongoose";
import { Event, EventStatus } from "@/models/event";
import { NextRequest, NextResponse } from "next/server";
import { withGroupingBatch } from "@/lib/event-grouping";

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
        // If your schema stores location as a plain string field instead:
        // { location: regex },
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
    // e.g. upcoming + startDate=2025-06-01 → events starting on/after June 1
    // These safely merge with the startDate/endDate set by status above.
    if (startDateParam) {
      const from = new Date(startDateParam);
      if (query.startDate) {
        // Already set by `upcoming` or `ongoing` — take the stricter bound
        query.startDate.$gte = query.startDate.$gte && from > query.startDate.$gte
          ? from
          : from;
      } else {
        query.startDate = { $gte: from };
      }
    }

    if (endDateParam) {
      // Include the full selected end day (up to 23:59:59.999)
      const to = new Date(endDateParam);
      to.setHours(23, 59, 59, 999);

      if (query.endDate) {
        // Already set by `ongoing` or `completed` — take the stricter bound
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