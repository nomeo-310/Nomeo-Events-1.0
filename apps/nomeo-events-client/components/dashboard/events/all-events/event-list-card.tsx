"use client";

import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon as CalendarIcon, Clock01Icon as ClockIcon, Location01Icon as LocationIcon, UserGroup03Icon as UsersIcon, Video01Icon as VideoCameraIcon, StarIcon, ArrowRightIcon } from "@hugeicons/core-free-icons";
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

export function EventListCard({ event, onPublish, onArchive, onDelete, onRestore }: Props) {
  const router    = useRouter();
  const grouping  = getGroupingLabel(event.grouping);
  const isVirtual = !event.location?.venue;

  return (
    <div
      className="group bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 cursor-pointer"
      onClick={() => router.push(`/dashboard/events/${event._id}`)}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Banner */}
        <div className="relative sm:w-52 h-40 sm:h-auto shrink-0 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
          {event.banner?.secure_url ? (
            <img src={event.banner.secure_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <HugeiconsIcon icon={CalendarIcon} size={48} className="text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white text-xs font-medium">
            {event.category}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {event.title}
                </h3>
                {event.featured && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium shrink-0">
                    <HugeiconsIcon icon={StarIcon} size={10} /> Featured
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{event.description}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <EventStatusBadge event={event} />
              <div onClick={(e) => e.stopPropagation()}>
                <EventActionsMenu event={event} onPublish={onPublish} onArchive={onArchive} onDelete={onDelete} onRestore={onRestore} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 mb-3">
            {[
              { icon: CalendarIcon,                            label: formatEventDate(event.startDate) },
              { icon: ClockIcon,                               label: formatEventTime(event.startDate) },
              { icon: isVirtual ? VideoCameraIcon : LocationIcon, label: isVirtual ? "Online Event" : `${event.location?.city}, ${event.location?.country}` },
              { icon: UsersIcon,                               label: `${event.availableSeats ?? event.totalSeats} / ${event.totalSeats} seats` },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <HugeiconsIcon icon={icon} size={13} className="shrink-0" />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800 mt-auto">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">From</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{getLowestPrice(event.plans)}</p>
              </div>
              <span className={cn("text-xs font-medium", grouping.color)}>· {grouping.label}</span>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/events/${event._id}`); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
            >
              View Details <HugeiconsIcon icon={ArrowRightIcon} size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}