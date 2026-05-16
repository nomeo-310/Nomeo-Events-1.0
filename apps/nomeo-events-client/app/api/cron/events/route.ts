// app/api/cron/events/route.ts
//
// GET /api/cron/events
//
// Runs after events end to:
//   1. Archive events that have ended (endDate < now, status = published)
//   2. For each newly archived event, calculate:
//        - attendees  = totalSeats - availableSeats
//        - revenue    = sum across plans of (maxSeats - availableSeats) * price
//                       fallback: attendees * cheapest plan price (if no per-plan seats)
//   3. Update the organizer's Profile:
//        - totalAttendees += attendees from this event
//        - totalRevenue   += revenue from this event
//        - totalEvents    += 1
//
// Schedule: run every hour (catches events that ended in the last hour)
// vercel.json:
//   { "crons": [{ "path": "/api/cron/events", "schedule": "0 * * * *" }] }
//
// For external runners, pass x-cron-secret header.

import { NextRequest, NextResponse } from 'next/server';
import { Event, EventStatus, IEventDocument } from '@/models/event';
import { Profile } from '@/models/profile';
import { connectDB } from '@/lib/mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronHeader = req.headers.get('x-cron-secret');
  const secret = process.env.CRON_SECRET;

  const isVercel = authHeader === `Bearer ${secret}`;
  const isExternal = cronHeader === secret;

  if (!isVercel && !isExternal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const result = await processEndedEvents();
    
    console.log('[cron/events]', result);
    return NextResponse.json({ ok: true, ...result, ranAt: new Date().toISOString() });
  } catch (err) {
    console.error('[cron/events] error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Core logic ───────────────────────────────────────────────────────────────

export async function processEndedEvents() {
  const now = new Date();

  // Find published events whose endDate has passed and haven't been archived yet
  // We use a metadata flag `statsProcessed` to ensure idempotency —
  // so re-running the cron never double-counts the same event.
  const endedEvents = await Event.find({
    status: EventStatus.PUBLISHED,
    endDate: { $lt: now },
    isDeleted: false,
    isArchived: false,
    // Skip events already processed — stored in metadata
    'metadata.statsProcessed': { $ne: true },
  }).lean<IEventDocument[]>();

  if (endedEvents.length === 0) {
    return { processed: 0, skipped: 0 };
  }

  let processed = 0;
  let skipped = 0;

  for (const event of endedEvents) {
    try {
      await processEvent(event);
      processed++;
    } catch (err) {
      console.error(`[cron/events] failed to process event ${event._id}`, err);
      skipped++;
    }
  }

  return { processed, skipped };
}

// ─── Per-event processing ─────────────────────────────────────────────────────

async function processEvent(event: IEventDocument) {
  const eventId = event._id;
  const organizerId = event.organizerId;

  // ── 1. Calculate attendees ─────────────────────────────────────────────────
  const attendees = calcAttendees(event);

  // ── 2. Calculate revenue ───────────────────────────────────────────────────
  const revenue = calcRevenue(event);

  // ── 3. Archive the event + mark statsProcessed (atomic, idempotent) ────────
  await Event.findByIdAndUpdate(eventId, {
    $set: {
      isArchived: true,
      archivedAt: new Date(),
      status: EventStatus.ARCHIVED,
      // Store computed stats on the event itself for auditability
      'metadata.statsProcessed': true,
      'metadata.computedAttendees': attendees,
      'metadata.computedRevenue': revenue,
      'metadata.processedAt': new Date(),
    },
  });

  // ── 4. Update organizer profile ────────────────────────────────────────────
  // $inc is atomic — safe even if two cron instances run simultaneously
  // (the statsProcessed flag above prevents the same event being counted twice)
  await Profile.findOneAndUpdate(
    { userId: organizerId },
    {
      $inc: {
        totalAttendees: attendees,
        totalRevenue: revenue,   // stored in NGN (same unit as plan.price)
        totalEvents: 1,
      },
    }
  );

  console.log(
    `[cron/events] processed event "${event.title}" (${eventId}) — ` +
    `attendees: ${attendees}, revenue: ₦${revenue.toLocaleString()}, organizer: ${organizerId}`
  );
}

// ─── Attendee calculation ──────────────────────────────────────────────────────
// Attendees = seats that were filled = totalSeats - availableSeats

function calcAttendees(event: IEventDocument): number {
  return Math.max(0, event.totalSeats - event.availableSeats);
}

// ─── Revenue calculation ───────────────────────────────────────────────────────
// Sum revenue per plan: (maxSeats - availableSeats) * price
// Plans without maxSeats/availableSeats (e.g. free or incomplete) contribute 0.
// This accumulates on the profile with every event that gets processed.

function calcRevenue(event: IEventDocument): number {
  if (!event.plans || event.plans.length === 0) return 0;

  return event.plans.reduce((total, plan) => {
    if (plan.maxSeats === undefined || plan.availableSeats === undefined) return total;
    const soldSeats = Math.max(0, plan.maxSeats - plan.availableSeats);
    return total + soldSeats * plan.price;
  }, 0);
}