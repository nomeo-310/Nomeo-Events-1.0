"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  CalendarIcon,
  ClockIcon,
  StarIcon,
  ArrowRightIcon,
  UserGroup03Icon as UsersIcon,
  Video01Icon as VideoCameraIcon,
  MapsLocation01Icon as LocationIcon,
} from "@hugeicons/core-free-icons";
import { EventCardProps, WebinarEvent, InPersonEvent } from "../../../../types/event-type";

const isWebinar = (event: any): event is WebinarEvent => {
  return 'platform' in event;
};

const EventCardGrid = ({ event, activeTab, router }: EventCardProps) => {
  return (
    <div className="group bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
        <div className={`absolute inset-0 bg-gradient-to-br ${event.gradient} opacity-90`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <HugeiconsIcon icon={event.icon} size={48} className="text-white/30" />
        </div>
        <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
          <HugeiconsIcon icon={event.categoryIcon} size={12} />
          {event.category}
        </span>
        {event.attendees && event.capacity && (
          <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-xs font-medium">
            {event.attendees}/{event.capacity}
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {event.title}
          </h3>
          {event.featured && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
              <HugeiconsIcon icon={StarIcon} size={12} />
              Featured
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <HugeiconsIcon icon={CalendarIcon} size={14} />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <HugeiconsIcon icon={ClockIcon} size={14} />
            <span>{event.time}</span>
          </div>
          {isWebinar(event) ? (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <HugeiconsIcon icon={VideoCameraIcon} size={14} />
                <span>{event.platform}</span>
              </div>
              {event.speaker && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <HugeiconsIcon icon={UsersIcon} size={14} />
                  <span>{event.speaker}</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <HugeiconsIcon icon={LocationIcon} size={14} />
                <span>{(event as InPersonEvent).location}</span>
              </div>
              {(event as InPersonEvent).venue && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <HugeiconsIcon icon={LocationIcon} size={14} />
                  <span className="line-clamp-1">{(event as InPersonEvent).venue}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {event.price}
          </span>
          <button
            onClick={() => router.push(`/${activeTab}/${event.slug}`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors duration-200"
          >
            View Event
            <HugeiconsIcon icon={ArrowRightIcon} size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCardGrid;