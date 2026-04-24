"use client";

import { useState, type JSX } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Location01Icon as LocationIcon,
  Video01Icon as VideoCameraIcon,
  ArrowLeft02Icon,
} from "@hugeicons/core-free-icons";
import { useEvents } from "@/hooks/use-events";
import { PublicEventSkeleton, PublicEventNotFound } from "./public-event-state";
import { PublicEventHero } from "./public-event-hero";
import { PublicEventLeftColumn } from "./public-event-left-column";
import { PublicEventRightColumn } from "./public-event-right-column";
import { RegistrationModal } from "./registration-modal";
import { HugeiconsIcon } from "@hugeicons/react";

export default function PublicEventPage(): JSX.Element {
  const params  = useParams();
  const router = useRouter();

  const slug    = params.slug as string;

  const { useGetEventBySlug } = useEvents();
  const { data: event, isLoading, isError } = useGetEventBySlug(slug);

  const [showModal, setShowModal] = useState(false);

  if (isLoading) return <PublicEventSkeleton />;
  if (isError || !event) return <PublicEventNotFound />;

  // ── Derived values ─────────────────────────────────────────────────────────
  const loc        = event.location as any;
  const hasVenue   = Boolean(loc?.venue);
  const hasPlatform = Boolean(loc?.platform);
  const isVirtual  = !hasVenue && hasPlatform;
  const isHybrid   = hasVenue && hasPlatform;
  const isPhysical = hasVenue && !hasPlatform;

  const ageReq     = (event as any).ageRequirement;
  const speakers   = (event as any).speakers      ?? [];
  const tags       = (event as any).tags          ?? [];
  const regDeadline = (event as any).registrationDeadline;
  const timezone   = (event as any).timezone      ?? "";

  const seatsUsed  = event.totalSeats - (event.availableSeats ?? event.totalSeats);
  const seatPct    = event.totalSeats > 0 ? Math.round((seatsUsed / event.totalSeats) * 100) : 0;

  const locationTitle = isHybrid  ? "Location & Online" : isVirtual ? "Online Details" : "Location";
  const locationIcon  = isVirtual ? VideoCameraIcon : LocationIcon;

  // Registration is open when: event is published, not deleted/archived, deadline not passed
  const deadlinePassed = regDeadline ? new Date(regDeadline) < new Date() : false;
  const registrationOpen =
    event.status === "published" &&
    !event.isDeleted &&
    !event.isArchived &&
    !deadlinePassed;

  const colProps = { event, loc, isPhysical, isVirtual, isHybrid, locationTitle, locationIcon };

  return (
    <>
      <div className="container mx-auto py-12 w-full px-4">

        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Go back"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="w-5 h-5" />
          <span>Back</span>
        </button>

        <PublicEventHero
          event={event}
          loc={loc}
          isVirtual={isVirtual}
          isHybrid={isHybrid}
          onRegister={() => setShowModal(true)}
          registrationOpen={registrationOpen}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PublicEventLeftColumn
            {...colProps}
            speakers={speakers}
            tags={tags}
            ageReq={ageReq}
            regDeadline={regDeadline}
            timezone={timezone}
          />
          <PublicEventRightColumn
            event={event}
            seatsUsed={seatsUsed}
            seatPct={seatPct}
            waitlistEnabled={Boolean((event as any).waitlistEnabled)}
            regDeadline={regDeadline}
            ageReq={ageReq}
            onRegister={() => setShowModal(true)}
            registrationOpen={registrationOpen}
          />
        </div>
      </div>

      {showModal && (
        <RegistrationModal event={event} onClose={() => setShowModal(false)} isVirtual={isVirtual} eventVenue={loc?.venue} />
      )}
    </>
  );
}