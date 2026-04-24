"use client";

import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { MonitorIcon, MapPinIcon } from "lucide-react";

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-sm text-muted-foreground">{label}</span>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-background border rounded-lg p-4 space-y-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}

export function SummaryStep() {
  const { watch } = useFormContext();
  const data = watch();

  const {
    title, shortDescription, category, type,
    startDate, endDate, timezone,
    eventMode, location,
    totalSeats, waitlistEnabled, plans,
    ageRequirement,
    speakers,
    banner,
    isPublic, requiresApproval, featured, tags,
    registrationDeadline, seoTitle,
  } = data;

  const formatDate = (d?: Date | null) =>
    d ? format(new Date(d), "PPP · h:mm a") : "—";

  const locationSummary = () => {
    if (eventMode === "virtual") return location?.platform || "Online";
    if (eventMode === "hybrid")
      return `${location?.venue || ""}, ${location?.city || ""} + ${location?.platform || "online"}`;
    return [location?.venue, location?.city, location?.country].filter(Boolean).join(", ");
  };

  return (
    <div className="space-y-3">
      {/* Basic info */}
      <SummaryCard title="Basic info">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SummaryRow label="Title" value={title} />
          <SummaryRow
            label="Category"
            value={`${category?.replace(/_/g, " ")} · ${type?.replace(/_/g, " ")}`}
          />
          <div className="md:col-span-2">
            <SummaryRow label="Short description" value={shortDescription} />
          </div>
        </div>
      </SummaryCard>

      {/* Date & time */}
      <SummaryCard title="Date & time">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SummaryRow label="Start" value={formatDate(startDate)} />
          <SummaryRow label="End" value={formatDate(endDate)} />
          <SummaryRow label="Timezone" value={timezone} />
          {registrationDeadline && (
            <SummaryRow label="Registration deadline" value={formatDate(registrationDeadline)} />
          )}
        </div>
      </SummaryCard>

      {/* Location */}
      <SummaryCard title={eventMode === "virtual" ? "Online details" : "Location"}>
        <div className="flex items-center gap-2 text-sm">
          {eventMode === "virtual"
            ? <MonitorIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            : <MapPinIcon className="w-4 h-4 text-muted-foreground shrink-0" />}
          <span>{locationSummary()}</span>
        </div>
        {location?.notes && (
          <SummaryRow label="Notes" value={location.notes} />
        )}
      </SummaryCard>

      {/* Tickets */}
      <SummaryCard title="Tickets">
        <div className="text-sm text-muted-foreground mb-2">
          {totalSeats} total seats{waitlistEnabled ? " · waitlist enabled" : ""}
        </div>
        <div className="space-y-2">
          {plans?.map((plan: any, i: number) => (
            <div
              key={i}
              className="flex justify-between items-center px-3 py-2 bg-muted/50 rounded-md"
            >
              <span className="text-sm font-medium">{plan.name}</span>
              <span className="text-sm text-muted-foreground">
                {plan.price === 0 ? "Free" : `${plan.currency} ${plan.price}`}
                {plan.maxSeats ? ` · ${plan.maxSeats} seats` : ""}
              </span>
            </div>
          ))}
        </div>
      </SummaryCard>

      {/* Age & speakers in a grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SummaryCard title="Age requirements">
          {ageRequirement?.required ? (
            <div className="text-sm space-y-1">
              {ageRequirement.minAge && <p>Min age: {ageRequirement.minAge}</p>}
              {ageRequirement.maxAge && <p>Max age: {ageRequirement.maxAge}</p>}
              {ageRequirement.requiresParentalConsent && (
                <p className="text-muted-foreground">Parental consent required</p>
              )}
              {ageRequirement.ageVerificationRequired && (
                <p className="text-muted-foreground">
                  Verification: {ageRequirement.ageVerificationMethod?.replace(/_/g, " ")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No age restrictions</p>
          )}
        </SummaryCard>

        <SummaryCard title="Speakers">
          {speakers?.length > 0 ? (
            <div className="space-y-1">
              {speakers.map((s: any, i: number) => (
                <p key={i} className="text-sm font-medium">
                  {s.name}
                  {s.company && (
                    <span className="text-muted-foreground font-normal"> · {s.company}</span>
                  )}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No speakers added</p>
          )}
        </SummaryCard>
      </div>

      {/* Banner */}
      {banner?.secure_url && (
        <SummaryCard title="Banner">
          <img
            src={banner.secure_url}
            alt="Event banner"
            className="w-full h-32 object-cover rounded-md"
          />
        </SummaryCard>
      )}

      {/* Visibility & settings */}
      <SummaryCard title="Visibility & settings">
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs px-3 py-1 rounded-full ${
            isPublic
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              : "bg-muted text-muted-foreground"
          }`}>
            {isPublic ? "Public" : "Private"}
          </span>
          {requiresApproval && (
            <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              Approval required
            </span>
          )}
          {featured && (
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
              Featured
            </span>
          )}
        </div>
        {tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.map((tag: string) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground border"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {seoTitle && <SummaryRow label="SEO title" value={seoTitle} />}
      </SummaryCard>
    </div>
  );
}