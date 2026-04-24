"use client";

import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon as CalendarIcon, Clock01Icon as ClockIcon, Location01Icon as LocationIcon, UserGroup03Icon as UsersIcon, Video01Icon as VideoCameraIcon, StarIcon } from "@hugeicons/core-free-icons";
import { Event } from "@/hooks/use-events";
import { cn } from "@/lib/utils";
import { EventStatusBadge } from "./event-status-badge";
import { EventActionsMenu } from "./event-actions-menu";
import { getGroupingLabel, formatEventDate, formatEventTime, getLowestPrice } from "./event-helpers";

interface Props {
  event:     Event;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete:  (id: string) => void;
  onRestore: (id: string) => void;
}

export function EventGridCard({ event, onPublish, onArchive, onDelete, onRestore }: Props) {
  const router    = useRouter();
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  const grouping = getGroupingLabel(event.grouping);

  const isVirtual = !event.location?.venue;

  return (
    <div
      className="group bg-gray-50 dark:bg-background rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 cursor-pointer flex flex-col"
      onClick={() => router.push(`/dashboard/events/${event._id}`)}
    >
      {/* Banner */}
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 shrink-0">
        {event.banner?.secure_url ? (
          <img src={event.banner.secure_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <HugeiconsIcon icon={CalendarIcon} size={64} className="text-white" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white text-xs font-medium truncate max-w-[60%]">
            {event.category}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {event.featured && (
              <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-full bg-amber-500/80 backdrop-blur-sm text-white text-xs font-medium">
                <HugeiconsIcon icon={StarIcon} size={10} /> Featured
              </span>
            )}
            <div onClick={(e) => e.stopPropagation()}>
              <EventActionsMenu event={event} onPublish={onPublish} onArchive={onArchive} onDelete={onDelete} onRestore={onRestore} />
            </div>
          </div>
        </div>

        {event.totalSeats > 0 && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white text-xs">
            <HugeiconsIcon icon={UsersIcon} size={10} />
            {event.availableSeats ?? event.totalSeats} left
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 text-sm flex-1 min-w-0">
            {event.title}
          </h3>
          <EventStatusBadge event={event} />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 flex-1">{event.description}</p>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <HugeiconsIcon icon={CalendarIcon} size={12} className="shrink-0" />
            <span>{formatEventDate(event.startDate)}</span>
            <span className="text-gray-300 dark:text-gray-700">·</span>
            <HugeiconsIcon icon={ClockIcon} size={12} className="shrink-0" />
            <span>{formatEventTime(event.startDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <HugeiconsIcon icon={isVirtual ? VideoCameraIcon : LocationIcon} size={12} className="shrink-0" />
            <span className="truncate">
              {isVirtual ? "Online Event" : `${event.location?.city}, ${event.location?.country}`}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">From</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{getLowestPrice(event.plans)}</p>
          </div>
          <span className={cn("text-xs font-medium", grouping.color)}>{grouping.label}</span>
        </div>
      </div>
    </div>
  );
}