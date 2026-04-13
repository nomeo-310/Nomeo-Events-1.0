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
  ArrowDown01Icon as ChevronDownIcon,
} from "@hugeicons/core-free-icons";
import { EventAccordionProps, WebinarEvent, InPersonEvent } from "../../../../types/event-type";

const isWebinar = (event: any): event is WebinarEvent => {
  return 'platform' in event;
};

const EventAccordion = ({ event, activeTab, router, isOpen, onToggle }: EventAccordionProps) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left flex items-start gap-3"
      >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${event.gradient} flex items-center justify-center flex-shrink-0`}>
          <HugeiconsIcon icon={event.icon} size={18} className="text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">
              {event.title}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {event.featured && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                  <HugeiconsIcon icon={StarIcon} size={10} />
                </span>
              )}
              <HugeiconsIcon 
                icon={ChevronDownIcon} 
                size={18} 
                className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon icon={CalendarIcon} size={12} />
              {event.date}
            </span>
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon icon={ClockIcon} size={12} />
              {event.time}
            </span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {event.price}
            </span>
          </div>
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-4 pb-4 space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {event.description}
          </p>
          
          <div className="space-y-1.5">
            {isWebinar(event) ? (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <HugeiconsIcon icon={VideoCameraIcon} size={14} />
                  <span>Platform: {event.platform}</span>
                </div>
                {event.speaker && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <HugeiconsIcon icon={UsersIcon} size={14} />
                    <span>Speaker: {event.speaker}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <HugeiconsIcon icon={LocationIcon} size={14} />
                  <span>Location: {(event as InPersonEvent).location}</span>
                </div>
                {(event as InPersonEvent).venue && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <HugeiconsIcon icon={LocationIcon} size={14} />
                    <span>Venue: {(event as InPersonEvent).venue}</span>
                  </div>
                )}
              </>
            )}
            {event.attendees && event.capacity && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <HugeiconsIcon icon={UsersIcon} size={14} />
                <span>{event.attendees}/{event.capacity} attending</span>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push(`/${activeTab}/${event.slug}`)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors duration-200"
          >
            View Event Details
            <HugeiconsIcon icon={ArrowRightIcon} size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventAccordion;