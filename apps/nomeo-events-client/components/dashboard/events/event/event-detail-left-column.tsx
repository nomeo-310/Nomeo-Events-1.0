import type { JSX } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon as CalendarIcon,
  Location01Icon as LocationIcon,
  Video01Icon as VideoCameraIcon,
  Tag01Icon as TagIcon,
  InformationCircleIcon,
  ShieldUserIcon,
  Mic01Icon as MicrophoneIcon,
  GlobalIcon as GlobeIcon,
  MoneyBagIcon,
  TicketIcon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import { Section, InfoRow, ExternalLink } from "./event-detail-primitives";
import { formatDate, formatTime, formatDateTime, toTitleCase } from "./event-detail-helpers";

// ─── Location ─────────────────────────────────────────────────────────────────

interface LocationContentProps {
  loc: any; isPhysical: boolean; isVirtual: boolean; isHybrid: boolean;
}

function LocationContent({ loc, isPhysical, isVirtual, isHybrid }: LocationContentProps): JSX.Element {
  const mapsLink   = loc?.googleMapsLink ? <ExternalLink href={String(loc.googleMapsLink)} label="Open in Google Maps" /> : null;
  const streamLink = loc?.streamUrl      ? <ExternalLink href={String(loc.streamUrl)} label={String(loc.streamUrl)} />     : null;

  if (isPhysical) return (
    <>
      <InfoRow label="Venue"   value={loc?.venue}   />
      <InfoRow label="Address" value={loc?.address} />
      <InfoRow label="City"    value={loc?.city}    />
      <InfoRow label="Country" value={loc?.country} />
      <InfoRow label="Notes"   value={loc?.notes}   />
      {mapsLink && <InfoRow label="Maps" value={mapsLink} />}
    </>
  );

  if (isVirtual) return (
    <>
      <InfoRow label="Platform" value={loc?.platform} />
      {streamLink && <InfoRow label="Stream URL" value={streamLink} />}
      <InfoRow label="Notes" value={loc?.notes} />
    </>
  );

  return (
    <>
      <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Physical Venue</p>
        <InfoRow label="Venue"   value={loc?.venue}   />
        <InfoRow label="Address" value={loc?.address} />
        <InfoRow label="City"    value={loc?.city}    />
        <InfoRow label="Country" value={loc?.country} />
        <InfoRow label="Notes"   value={loc?.notes}   />
        {mapsLink && <InfoRow label="Maps" value={mapsLink} />}
      </div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Online Stream</p>
      <InfoRow label="Platform" value={loc?.platform} />
      {streamLink && <InfoRow label="Stream URL" value={streamLink} />}
    </>
  );
}

// ─── Ticket Plans ─────────────────────────────────────────────────────────────

function TicketPlans({ plans }: { plans: any[] }): JSX.Element {
  return (
    <Section icon={TicketIcon} title="Ticket Plans">
      <div className="space-y-3">
        {plans.map((plan: any, i: number) => {
          const planPrice      = plan.price === 0 ? "Free" : `${plan.currency ?? "USD"} ${Number(plan.price).toLocaleString()}`;
          const earlyBirdLabel = plan.earlyBirdDeadline ? formatDateTime(String(plan.earlyBirdDeadline)) : null;

          return (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={MoneyBagIcon} size={14} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{plan.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{toTitleCase(plan.type ?? "")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{planPrice}</p>
                  {plan.maxSeats ? <p className="text-xs text-gray-400">{plan.maxSeats} seats</p> : null}
                </div>
              </div>

              {plan.benefits?.length > 0 && (
                <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-1.5">
                  {(plan.benefits as string[]).map((b, bi) => (
                    <span key={bi} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} size={9} className="text-green-500 shrink-0" />
                      {b}
                    </span>
                  ))}
                </div>
              )}

              {earlyBirdLabel && (
                <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-400">Early bird deadline: {earlyBirdLabel}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ─── Speakers ─────────────────────────────────────────────────────────────────

function Speakers({ speakers }: { speakers: any[] }): JSX.Element | null {
  if (!speakers.length) return null;
  return (
    <Section icon={MicrophoneIcon} title="Speakers">
      <div className="space-y-3">
        {speakers.map((speaker: any, i: number) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {String(speaker.name ?? "?").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{speaker.name}</p>
              {speaker.company && <p className="text-xs text-gray-500 dark:text-gray-400">{speaker.company}</p>}
              {speaker.email   && <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">{speaker.email}</p>}
              {speaker.bio     && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">{speaker.bio}</p>}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ─── Left column composite ────────────────────────────────────────────────────

interface EventDetailLeftColumnProps {
  event:      any;
  loc:        any;
  isPhysical: boolean;
  isVirtual:  boolean;
  isHybrid:   boolean;
  locationTitle: string;
  locationIcon:  any;
  speakers:   any[];
  tags:       string[];
  ageReq:     any;
  ageVerifLabel: string;
  regDeadline:   string | undefined;
  seoTitle:      string;
  seoDescription: string;
  timezone:      string;
  shortDescription: string;
}

export function EventDetailLeftColumn({
  event, loc, isPhysical, isVirtual, isHybrid,
  locationTitle, locationIcon,
  speakers, tags, ageReq, ageVerifLabel,
  regDeadline, seoTitle, seoDescription, timezone, shortDescription,
}: EventDetailLeftColumnProps): JSX.Element {
  return (
    <div className="lg:col-span-2 space-y-5">

      {/* Description */}
      <Section icon={InformationCircleIcon} title="Event Details">
        {shortDescription && (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 pb-3 border-b border-gray-100 dark:border-gray-800 italic">
            {shortDescription}
          </p>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{event.description}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium border border-indigo-100 dark:border-indigo-800">
                <HugeiconsIcon icon={TagIcon} size={10} /> {tag}
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* Date & Time */}
      <Section icon={CalendarIcon} title="Date & Time">
        <InfoRow label="Start"         value={`${formatDate(event.startDate)} at ${formatTime(event.startDate)}`} />
        <InfoRow label="End"           value={`${formatDate(event.endDate)} at ${formatTime(event.endDate)}`} />
        <InfoRow label="Timezone"      value={timezone} />
        {regDeadline && <InfoRow label="Reg. Deadline" value={formatDateTime(regDeadline)} />}
      </Section>

      {/* Location */}
      <Section icon={locationIcon} title={locationTitle}>
        <LocationContent loc={loc} isPhysical={isPhysical} isVirtual={isVirtual} isHybrid={isHybrid} />
      </Section>

      {/* Tickets */}
      <TicketPlans plans={event.plans ?? []} />

      {/* Speakers */}
      <Speakers speakers={speakers} />

      {/* Age requirements */}
      {ageReq?.required && (
        <Section icon={ShieldUserIcon} title="Age Requirements">
          {ageReq.minAge && <InfoRow label="Minimum Age" value={`${ageReq.minAge} years`} />}
          {ageReq.maxAge && <InfoRow label="Maximum Age" value={`${ageReq.maxAge} years`} />}
          <InfoRow label="Parental Consent" value={ageReq.requiresParentalConsent ? "Required" : "Not required"} />
          {ageReq.requiresParentalConsent && ageReq.parentalConsentMessage && (
            <InfoRow label="Consent Message" value={String(ageReq.parentalConsentMessage)} />
          )}
          <InfoRow label="Age Verification" value={ageVerifLabel} />
        </Section>
      )}

      {/* SEO */}
      {(seoTitle || seoDescription) && (
        <Section icon={GlobeIcon} title="SEO">
          {seoTitle        && <InfoRow label="SEO Title"       value={seoTitle} />}
          {seoDescription  && <InfoRow label="SEO Description" value={seoDescription} />}
        </Section>
      )}
    </div>
  );
}