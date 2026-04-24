import type { JSX } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon as CalendarIcon,
  Clock01Icon as ClockIcon,
  Location01Icon as LocationIcon,
  Video01Icon as VideoCameraIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "./event-detail-helpers";

interface EventHeroProps {
  event:       any;
  statusConfig: { label: string; bg: string; text: string };
  loc:         any;
  isVirtual:   boolean;
  isHybrid:    boolean;
}

export function EventHero({ event, statusConfig, loc, isVirtual, isHybrid }: EventHeroProps): JSX.Element {
  const locationLabel = isHybrid    ? "Hybrid Event"
                      : isVirtual  ? "Online Event"
                      : `${loc?.city ?? ""}, ${loc?.country ?? ""}`;

  return (
    <div className="relative rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-indigo-500 to-purple-600">
      {event.banner?.secure_url ? (
        <img src={event.banner.secure_url} alt={event.title} className="w-full h-56 sm:h-96 object-cover" />
      ) : (
        <div className="w-full h-56 sm:h-96 flex items-center justify-center">
          <HugeiconsIcon icon={CalendarIcon} size={96} className="text-white/20" />
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Top badges */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {[event.category, event.type].map((label) => (
            <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-xs font-medium">
              {label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {event.featured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-500/80 backdrop-blur-sm text-white text-xs font-medium">
              <HugeiconsIcon icon={StarIcon} size={11} /> Featured
            </span>
          )}
          <span className={cn("inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm", statusConfig.bg, statusConfig.text)}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 line-clamp-2">{event.title}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-white/80">
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
        </div>
      </div>
    </div>
  );
}