"use client";

import type { JSX } from "react";
import { useRouter, useParams } from "next/navigation";
import { Location01Icon as LocationIcon, Video01Icon as VideoCameraIcon } from "@hugeicons/core-free-icons";
import { useEvents } from "@/hooks/use-events";
import { EventTabs } from "../event-tabs";
import { PageSkeleton, EventNotFound } from "./event-detail-states";
import { EventHero } from "./event-hero";
import { EventActionBar } from "./event-action-bar";
import { EventDetailLeftColumn } from "./event-detail-left-column";
import { EventDetailRightColumn } from "./event-detail-right-column";
import { getStatusConfig, toTitleCase } from "./event-detail-helpers";

export default function EventDetailPage(): JSX.Element {
  const router  = useRouter();
  const params  = useParams();
  const eventId = params.id as string;

  const { useGetEvent, usePublishEvent, useArchiveEvent, useSoftDeleteEvent, useRestoreEvent } = useEvents();

  const { data: event, isLoading, isError } = useGetEvent(eventId);

  const publishMutation = usePublishEvent();
  const archiveMutation = useArchiveEvent();
  const deleteMutation  = useSoftDeleteEvent();
  const restoreMutation = useRestoreEvent();

  const isMutating =
    publishMutation.isPending || archiveMutation.isPending ||
    deleteMutation.isPending  || restoreMutation.isPending;

  if (isLoading) return <PageSkeleton />;
  if (isError || !event) return <EventNotFound />;

  // ── Derived values ─────────────────────────────────────────────────────────
  const statusConfig    = getStatusConfig(event);
  const loc             = event.location as any;
  const hasVenue        = Boolean(loc?.venue);
  const hasPlatform     = Boolean(loc?.platform);
  const isVirtual       = !hasVenue && hasPlatform;
  const isHybrid        = hasVenue && hasPlatform;
  const isPhysical      = hasVenue && !hasPlatform;

  const ageReq          = (event as any).ageRequirement;
  const speakers        = (event as any).speakers       ?? [];
  const tags            = (event as any).tags           ?? [];
  const seoTitle        = (event as any).seoTitle       ?? "";
  const seoDescription  = (event as any).seoDescription ?? "";
  const regDeadline     = (event as any).registrationDeadline;
  const shortDescription = (event as any).shortDescription ?? "";
  const timezone        = (event as any).timezone ?? "";

  const seatsUsed = event.totalSeats - (event.availableSeats ?? event.totalSeats);
  const seatPct   = event.totalSeats > 0 ? Math.round((seatsUsed / event.totalSeats) * 100) : 0;

  const locationTitle = isHybrid ? "Location & Online" : isVirtual ? "Online Details" : "Location";
  const locationIcon  = isVirtual ? VideoCameraIcon : LocationIcon;

  const ageVerifLabel = ageReq?.ageVerificationRequired
    ? toTitleCase(String(ageReq.ageVerificationMethod ?? ""))
    : "Not required";

  const mutations = { publishMutation, archiveMutation, deleteMutation, restoreMutation };

  return (
    <>
      <EventTabs />
      <div className="container mx-auto pb-8 w-full">

        <EventHero
          event={event} statusConfig={statusConfig}
          loc={loc} isVirtual={isVirtual} isHybrid={isHybrid}
        />

        <EventActionBar event={event} eventId={eventId} isMutating={isMutating} {...mutations} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <EventDetailLeftColumn
            event={event} loc={loc}
            isPhysical={isPhysical} isVirtual={isVirtual} isHybrid={isHybrid}
            locationTitle={locationTitle} locationIcon={locationIcon}
            speakers={speakers} tags={tags}
            ageReq={ageReq} ageVerifLabel={ageVerifLabel}
            regDeadline={regDeadline}
            seoTitle={seoTitle} seoDescription={seoDescription}
            timezone={timezone} shortDescription={shortDescription}
          />
          <EventDetailRightColumn
            event={event} seatsUsed={seatsUsed} seatPct={seatPct}
            waitlistEnabled={Boolean((event as any).waitlistEnabled)}
            requiresApproval={Boolean((event as any).requiresApproval)}
            regDeadline={regDeadline} ageReq={ageReq}
          />
        </div>
      </div>
    </>
  );
}