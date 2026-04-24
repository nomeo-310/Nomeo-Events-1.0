"use client";

import type { JSX } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon as CalendarIcon,
  Clock01Icon as ClockIcon,
  StarIcon,
  ArrowRightIcon,
  UserGroup03Icon as UsersIcon,
  Video01Icon as VideoCameraIcon,
  MapsLocation01Icon as LocationIcon,
} from "@hugeicons/core-free-icons";
import type { Event } from "@/hooks/use-events";
import { formatCardDate, formatCardTime, getCardPrice, getCardLocation } from "./event-helpers";

interface Props { event: Event }

export function UpcomingEventListCard({ event }: Props): JSX.Element {
  const router    = useRouter();
  const price     = getCardPrice(event.plans);
  const loc       = getCardLocation(event);
  const seatsLeft = event.availableSeats ?? event.totalSeats;

  return (
    <div className="group bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
      <div className="flex flex-col sm:flex-row">

        {/* Banner */}
        <div className="relative sm:w-56 h-40 sm:h-auto shrink-0 overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600">
          {event.banner?.secure_url ? (
            <img
              src={event.banner.secure_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <HugeiconsIcon icon={CalendarIcon} size={44} className="text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white text-xs font-medium">
            {event.category}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 flex-1">
              {event.title}
            </h3>
            {event.featured && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium shrink-0">
                <HugeiconsIcon icon={StarIcon} size={10} /> Featured
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 flex-1">
            {event.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <HugeiconsIcon icon={CalendarIcon} size={13} className="shrink-0" />
              <span className="truncate">{formatCardDate(event.startDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <HugeiconsIcon icon={ClockIcon} size={13} className="shrink-0" />
              <span>{formatCardTime(event.startDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <HugeiconsIcon icon={loc.isVirtual ? VideoCameraIcon : LocationIcon} size={13} className="shrink-0" />
              <span className="truncate">{loc.label}</span>
            </div>
            {event.totalSeats > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <HugeiconsIcon icon={UsersIcon} size={13} className="shrink-0" />
                <span>{seatsLeft} / {event.totalSeats} seats left</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-800 mt-auto">
            <span className="text-sm font-bold text-gray-900 dark:text-white">{price}</span>
            <button
              type="button"
              onClick={() => router.push(`/events/${event.slug}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors"
            >
              View Event <HugeiconsIcon icon={ArrowRightIcon} size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}