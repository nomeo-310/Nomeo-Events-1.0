import { NextRequest, NextResponse } from 'next/server';
import { Event, EventStatus } from '@/models/event';
import { Registration, RegistrationStatus } from '@/models/registration';
import { connectDB } from '@/lib/mongoose';
import { requireSuperAdmin } from '@/lib/admin/authorization';
// import { requireAdmin } from '@/lib/auth';

type Params = { params: Promise<{ eventId: string; action: string }>};

/**
 * POST /api/admin/events/[eventId]/actions/[action]
 *
 * Supported actions (derived from schema capabilities):
 *  Status transitions
 *  ─────────────────
 *  publish          DRAFT → PUBLISHED
 *  unpublish        PUBLISHED → DRAFT
 *  cancel           any → CANCELLED  (optionally bulk-cancel all registrations)
 *  archive          any → ARCHIVED   (calls event.archive())
 *  restore          soft-deleted → active (calls event.restore())
 *  soft-delete      marks isDeleted = true
 *
 *  Visibility & discovery
 *  ──────────────────────
 *  feature          set featured = true
 *  unfeature        set featured = false
 *  make-public      set isPublic = true
 *  make-private     set isPublic = false
 *
 *  Registration controls
 *  ─────────────────────
 *  enable-waitlist  set waitlistEnabled = true
 *  disable-waitlist set waitlistEnabled = false
 *  enable-approval  set requiresApproval = true
 *  disable-approval set requiresApproval = false
 *  update-seats     update totalSeats / availableSeats (body: { totalSeats, availableSeats })
 *
 *  Bulk registration actions
 *  ─────────────────────────
 *  confirm-all-registrations   set all PENDING registrations → CONFIRMED
 *  cancel-all-registrations    cancel all non-cancelled registrations
 *  issue-all-certificates      set certificateIssued = true for all ATTENDED registrations
 */
export async function POST(req: NextRequest, { params }: Params) {
  
  const { eventId, action } = await params;

  try {
    await connectDB();

    const admin = await requireSuperAdmin();

    if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });


    const body = await req.json().catch(() => ({}));

    const event = await Event.findById(eventId);
    if (!event) return NextResponse.json({ message: 'Event not found' }, { status: 404 });

    // ── Status transitions ────────────────────────────────────────────────────
    if (action === 'publish') {
      if (event.isDeleted || event.isArchived)
        return NextResponse.json({ message: 'Cannot publish a deleted or archived event' }, { status: 400 });
      event.status = EventStatus.PUBLISHED;
      event.isPublic = true;
      await event.save();
      return NextResponse.json({ message: 'Event published', event });
    }

    if (action === 'unpublish') {
      event.status = EventStatus.DRAFT;
      await event.save();
      return NextResponse.json({ message: 'Event unpublished', event });
    }

    if (action === 'cancel') {
      event.status = EventStatus.CANCELLED;
      await event.save();

      // Optionally cancel all pending / confirmed registrations
      if (body.cancelRegistrations) {
        const regs = await Registration.find({
          eventId,
          status: { $nin: [RegistrationStatus.CANCELLED, RegistrationStatus.REFUNDED] },
        });
        await Promise.all(regs.map((r) => r.cancel('Event cancelled by admin', 'by_admin')));
      }

      return NextResponse.json({
        message: 'Event cancelled',
        registrationsCancelled: !!body.cancelRegistrations,
      });
    }

    if (action === 'archive') {
      await event.archive(); // sets isArchived, archivedAt, status = ARCHIVED
      return NextResponse.json({ message: 'Event archived', event });
    }

    if (action === 'restore') {
      await event.restore(); // clears isDeleted, deletedAt
      return NextResponse.json({ message: 'Event restored', event });
    }

    if (action === 'soft-delete') {
      if (event.status === EventStatus.PUBLISHED) {
        return NextResponse.json(
          { message: 'Unpublish the event before deleting it' },
          { status: 400 }
        );
      }
      await event.softDelete();
      return NextResponse.json({ message: 'Event deleted', event });
    }

    // ── Visibility & discovery ────────────────────────────────────────────────
    if (action === 'feature') {
      event.featured = true;
      await event.save();
      return NextResponse.json({ message: 'Event featured', event });
    }

    if (action === 'unfeature') {
      event.featured = false;
      await event.save();
      return NextResponse.json({ message: 'Event unfeatured', event });
    }

    if (action === 'make-public') {
      event.isPublic = true;
      await event.save();
      return NextResponse.json({ message: 'Event is now public', event });
    }

    if (action === 'make-private') {
      event.isPublic = false;
      await event.save();
      return NextResponse.json({ message: 'Event is now private', event });
    }

    // ── Registration controls ─────────────────────────────────────────────────
    if (action === 'enable-waitlist') {
      event.waitlistEnabled = true;
      await event.save();
      return NextResponse.json({ message: 'Waitlist enabled', event });
    }

    if (action === 'disable-waitlist') {
      event.waitlistEnabled = false;
      await event.save();
      return NextResponse.json({ message: 'Waitlist disabled', event });
    }

    if (action === 'enable-approval') {
      event.requiresApproval = true;
      await event.save();
      return NextResponse.json({ message: 'Manual approval enabled', event });
    }

    if (action === 'disable-approval') {
      event.requiresApproval = false;
      await event.save();
      return NextResponse.json({ message: 'Manual approval disabled', event });
    }

    if (action === 'update-seats') {
      const { totalSeats, availableSeats } = body as { totalSeats?: number; availableSeats?: number };
      if (totalSeats !== undefined) {
        if (totalSeats < 1) return NextResponse.json({ message: 'totalSeats must be ≥ 1' }, { status: 400 });
        event.totalSeats = totalSeats;
      }
      if (availableSeats !== undefined) {
        if (availableSeats < 0) return NextResponse.json({ message: 'availableSeats must be ≥ 0' }, { status: 400 });
        event.availableSeats = availableSeats;
      }
      // Pre-save hook validates availableSeats <= totalSeats
      await event.save();
      return NextResponse.json({ message: 'Seats updated', event });
    }

    // ── Bulk registration actions ─────────────────────────────────────────────
    if (action === 'confirm-all-registrations') {
      const result = await Registration.updateMany(
        { eventId, status: RegistrationStatus.PENDING },
        { $set: { status: RegistrationStatus.CONFIRMED } }
      );
      return NextResponse.json({
        message: `${result.modifiedCount} registration(s) confirmed`,
        modifiedCount: result.modifiedCount,
      });
    }

    if (action === 'cancel-all-registrations') {
      const regs = await Registration.find({
        eventId,
        status: { $nin: [RegistrationStatus.CANCELLED, RegistrationStatus.REFUNDED] },
      });
      await Promise.all(
        regs.map((r) => r.cancel(body.reason || 'Bulk cancellation by admin', 'by_admin'))
      );
      return NextResponse.json({
        message: `${regs.length} registration(s) cancelled`,
        cancelledCount: regs.length,
      });
    }

    if (action === 'issue-all-certificates') {
      const result = await Registration.updateMany(
        { eventId, status: RegistrationStatus.ATTENDED, certificateIssued: false },
        { $set: { certificateIssued: true } }
      );
      return NextResponse.json({
        message: `${result.modifiedCount} certificate(s) issued`,
        modifiedCount: result.modifiedCount,
      });
    }

    // ── Unknown action ────────────────────────────────────────────────────────
    return NextResponse.json(
      {
        message: `Unknown action: "${action}"`,
        availableActions: [
          'publish', 'unpublish', 'cancel', 'archive', 'restore', 'soft-delete',
          'feature', 'unfeature', 'make-public', 'make-private',
          'enable-waitlist', 'disable-waitlist',
          'enable-approval', 'disable-approval',
          'update-seats',
          'confirm-all-registrations', 'cancel-all-registrations', 'issue-all-certificates',
        ],
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error(`[ADMIN] POST /api/admin/events/${eventId}/actions/${action}`, error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}