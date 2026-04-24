"use client";

import { useFormContext } from "react-hook-form";
import { MapPinIcon, MonitorIcon, GlobeIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EventCategory, EventMode, HYBRID_CATEGORIES, VIRTUAL_CATEGORIES } from "@/types/create-event-type";

// ─── Virtual fields ───────────────────────────────────────────────────────────
// Shown when eventMode === "virtual"
function VirtualLocationFields() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
        <MonitorIcon className="w-4 h-4 text-indigo-600 shrink-0" />
        <p className="text-sm text-indigo-700 dark:text-indigo-300">
          This is an online event — no physical venue needed.
        </p>
      </div>

      <div>
        <Label htmlFor="platform">Platform *</Label>
        <Input
          id="platform"
          {...register("location.platform")}
          placeholder="e.g., Zoom, Google Meet, Microsoft Teams, YouTube Live"
          className="mt-1.5"
        />
        {(errors.location as any)?.platform && (
          <p className="text-sm text-red-500 mt-1">
            {(errors.location as any).platform.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="streamUrl">Meeting / Stream URL</Label>
        <Input
          id="streamUrl"
          {...register("location.streamUrl")}
          placeholder="https://zoom.us/j/..."
          className="mt-1.5"
        />
        {(errors.location as any)?.streamUrl && (
          <p className="text-sm text-red-500 mt-1">
            {(errors.location as any).streamUrl.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          You can add this later — registrants will receive it via email before the event.
        </p>
      </div>

      <div>
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          {...register("location.notes")}
          placeholder="Access instructions, password, waiting room info, etc."
          rows={3}
          className="mt-1.5 h-20 resize-none"
        />
      </div>
    </div>
  );
}

// ─── Physical fields ──────────────────────────────────────────────────────────
// Shown when eventMode === "physical"
function PhysicalLocationFields() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="venue">Venue *</Label>
        <Input
          id="venue"
          {...register("location.venue")}
          placeholder="e.g., Convention Center"
          className="mt-1.5"
        />
        {(errors.location as any)?.venue && (
          <p className="text-sm text-red-500 mt-1">
            {(errors.location as any).venue.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          {...register("location.address")}
          placeholder="Street address"
          className="mt-1.5"
        />
        {(errors.location as any)?.address && (
          <p className="text-sm text-red-500 mt-1">
            {(errors.location as any).address.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            {...register("location.city")}
            placeholder="City"
            className="mt-1.5"
          />
          {(errors.location as any)?.city && (
            <p className="text-sm text-red-500 mt-1">
              {(errors.location as any).city.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            {...register("location.country")}
            placeholder="Country"
            className="mt-1.5"
          />
          {(errors.location as any)?.country && (
            <p className="text-sm text-red-500 mt-1">
              {(errors.location as any).country.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          {...register("location.notes")}
          placeholder="Parking info, accessibility details, etc."
          rows={3}
          className="mt-1.5 h-14 resize-none"
        />
      </div>

      <div>
        <Label htmlFor="googleMapsLink">Google Maps Link</Label>
        <Input
          id="googleMapsLink"
          {...register("location.googleMapsLink")}
          placeholder="https://maps.google.com/..."
          className="mt-1.5"
        />
        {(errors.location as any)?.googleMapsLink && (
          <p className="text-sm text-red-500 mt-1">
            {(errors.location as any).googleMapsLink.message}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Hybrid fields ────────────────────────────────────────────────────────────
// Shown when eventMode === "hybrid" — both sets of fields, clearly sectioned
function HybridLocationFields() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <MapPinIcon className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Physical Venue</h4>
        </div>
        <PhysicalLocationFields />
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center gap-2 mb-3">
          <MonitorIcon className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Online Stream</h4>
          <span className="text-xs text-muted-foreground">(optional)</span>
        </div>
        <div className="space-y-4">
          <HybridOnlineFields />
        </div>
      </div>
    </div>
  );
}

function HybridOnlineFields() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <>
      <div>
        <Label htmlFor="platform">Streaming Platform</Label>
        <Input
          id="platform"
          {...register("location.platform")}
          placeholder="e.g., YouTube Live, Zoom, Twitch"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="streamUrl">Stream URL</Label>
        <Input
          id="streamUrl"
          {...register("location.streamUrl")}
          placeholder="https://..."
          className="mt-1.5"
        />
        {(errors.location as any)?.streamUrl && (
          <p className="text-sm text-red-500 mt-1">
            {(errors.location as any).streamUrl.message}
          </p>
        )}
      </div>
    </>
  );
}

// ─── Mode toggle ──────────────────────────────────────────────────────────────
// Only shown for HYBRID_CATEGORIES so users can switch between physical/virtual/hybrid
const MODE_OPTIONS: { value: EventMode; label: string; icon: typeof MapPinIcon }[] = [
  { value: "physical", label: "In-Person",  icon: MapPinIcon   },
  { value: "virtual",  label: "Online",     icon: MonitorIcon  },
  { value: "hybrid",   label: "Hybrid",     icon: GlobeIcon    },
];

function ModeToggle() {
  const { watch, setValue } = useFormContext();
  const eventMode = watch("eventMode") as EventMode;

  return (
    <div>
      <Label className="mb-2 block">Event Format</Label>
      <div className="flex gap-2">
        {MODE_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setValue("eventMode", value)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors",
              eventMode === value
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-background text-muted-foreground border-input hover:border-indigo-400 hover:text-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── LocationStep ─────────────────────────────────────────────────────────────

export function LocationStep() {
  const { watch } = useFormContext();
  const category = watch("category") as EventCategory;
  const eventMode = watch("eventMode") as EventMode;

  const isVirtual  = VIRTUAL_CATEGORIES.has(category);
  const isHybridCat = HYBRID_CATEGORIES.has(category);

  return (
    <div className="space-y-6">
      {/* Show mode toggle only for hybrid-capable categories.
          Pure virtual categories (webinar) skip the toggle entirely — they're
          always online. Pure physical categories also skip it. */}
      {isHybridCat && <ModeToggle />}

      {/* Badge showing current mode for non-hybrid categories */}
      {!isHybridCat && (
        <div className="flex items-center gap-2">
          <Badge variant={isVirtual ? "secondary" : "outline"} className="gap-1.5">
            {isVirtual
              ? <><MonitorIcon className="w-3 h-3" /> Online Event</>
              : <><MapPinIcon className="w-3 h-3" /> In-Person Event</>
            }
          </Badge>
        </div>
      )}

      {/* Render the correct field set based on resolved mode */}
      {eventMode === "virtual"  && <VirtualLocationFields  />}
      {eventMode === "physical" && <PhysicalLocationFields />}
      {eventMode === "hybrid"   && <HybridLocationFields   />}
    </div>
  );
}