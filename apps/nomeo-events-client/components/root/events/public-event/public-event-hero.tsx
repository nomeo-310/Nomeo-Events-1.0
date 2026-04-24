import type { JSX } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon as CalendarIcon,  Clock01Icon as ClockIcon, Location01Icon as LocationIcon, Video01Icon as VideoCameraIcon, UserGroup03Icon as UsersIcon, StarIcon, TicketIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { formatDate, formatTime, getLowestPrice } from "./public-event-helpers";

interface PublicEventHeroProps {
  event:          any;
  loc:            any;
  isVirtual:      boolean;
  isHybrid:       boolean;
  onRegister:     () => void;
  registrationOpen: boolean;
}

export function PublicEventHero({
  event, loc, isVirtual, isHybrid, onRegister, registrationOpen,
}: PublicEventHeroProps): JSX.Element {
  const locationLabel = isHybrid   ? "Hybrid Event"
                      : isVirtual  ? "Online Event"
                      : [loc?.city, loc?.country].filter(Boolean).join(", ");

  const price       = getLowestPrice(event.plans ?? []);
  const isFree      = price === "Free";
  const seatsLeft   = event.availableSeats ?? event.totalSeats;
  const soldOut     = event.totalSeats > 0 && seatsLeft <= 0;
  const shortDesc   = (event as any).shortDescription ?? "";

  return (
    <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-indigo-600 to-purple-700">
      {/* Background image */}
      {event.banner?.secure_url ? (
        <img
          src={event.banner.secure_url}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}

      {/* Gradient overlay — heavier at bottom for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

      {/* Content sits on top */}
      <div className="relative z-10 px-6 sm:px-10 pt-10 pb-8 flex flex-col min-h-[480px] sm:min-h-[560px]">

        {/* Top row: badges */}
        <div className="flex items-start justify-between flex-wrap gap-3 mb-auto">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
              {event.category}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
              {event.type}
            </span>
          </div>
          {event.featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-500/80 backdrop-blur-sm text-white text-xs font-semibold">
              <HugeiconsIcon icon={StarIcon} size={11} /> Featured
            </span>
          )}
        </div>

        {/* Bottom block: title + meta + CTA */}
        <div className="mt-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-3 leading-tight">
            {event.title}
          </h1>

          {shortDesc && (
            <p className="text-white/80 text-sm sm:text-base max-w-2xl mb-5 leading-relaxed">
              {shortDesc}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/75 mb-7">
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon icon={CalendarIcon} size={13} />
              {formatDate(event.startDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon icon={ClockIcon} size={13} />
              {formatTime(event.startDate)} — {formatTime(event.endDate)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HugeiconsIcon icon={isVirtual ? VideoCameraIcon : LocationIcon} size={13} />
              {locationLabel}
            </span>
            {event.totalSeats > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <HugeiconsIcon icon={UsersIcon} size={13} />
                {seatsLeft} / {event.totalSeats} seats left
              </span>
            )}
          </div>

          {/* CTA row */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onRegister}
              disabled={!registrationOpen || soldOut}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg",
                soldOut || !registrationOpen
                  ? "bg-white/20 text-white/60 cursor-not-allowed backdrop-blur-sm"
                  : "bg-white text-indigo-700 hover:bg-indigo-50 hover:shadow-xl active:scale-95"
              )}
            >
              <HugeiconsIcon icon={TicketIcon} size={16} />
              {soldOut ? "Sold Out" : !registrationOpen ? "Registration Closed" : "Register Now"}
            </button>

            <div className="flex flex-col">
              <span className={cn(
                "text-xl font-bold",
                isFree ? "text-green-300" : "text-white"
              )}>
                {price}
              </span>
              <span className="text-xs text-white/60">Starting price</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}