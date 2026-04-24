"use client"

import { Event, useEvents } from "@/hooks/use-events";
import { LoadingSkeleton } from "./loading-skeleton";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon as Calendar02, UserGroupIcon, LocationIcon, ClockIcon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatEventDate(startDate: string, endDate?: string) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  
  if (end && start.toDateString() !== end.toDateString()) {
    const startDay = start.getDate();
    const startMonth = MONTHS[start.getMonth()];
    const endDay = end.getDate();
    const endMonth = MONTHS[end.getMonth()];
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
  
  const startDay = start.getDate();
  const startMonth = MONTHS[start.getMonth()];
  return `${startMonth} ${startDay}`;
}

export function UpcomingEvents() {
  const { useOrganizerAllEvents } = useEvents();

  const { data, isLoading, isError } = useOrganizerAllEvents("published", false, false, true, 1, 4);
  const upcomingEvents = data?.data ?? [];

  const router = useRouter();

  return (
    <div className="rounded-xl border border-border bg-background p-6 md:p-5">
      <p className="text-xs md:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 md:mb-3">
        Upcoming events
      </p>

      {isLoading && (
        <LoadingSkeleton />
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
            <HugeiconsIcon icon={Calendar02} size={28} className="text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Failed to load upcoming events</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Please try again later.</p>
        </div>
      )}

      {!isLoading && !isError && upcomingEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <HugeiconsIcon icon={Calendar02} size={28} className="text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No upcoming events</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Events you publish will appear here.</p>
        </div>
      )}

      {!isLoading && !isError && upcomingEvents.length > 0 && (
        <>
          <div className="flex flex-col divide-y divide-border">
            {upcomingEvents.map((ev:Event) => {
              const registeredCount = ev.totalSeats - ev.availableSeats;
              return (
                <div key={ev._id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    {/* Date */}
                    <div className="min-w-[60px] text-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg py-2 px-3">
                      <p className="text-xl font-bold text-primary leading-none">
                        {new Date(ev.startDate).getDate()}
                      </p>
                      <p className="text-xs font-semibold text-primary/80 mt-1">
                        {MONTHS[new Date(ev.startDate).getMonth()]}
                      </p>
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {ev.title}
                      </p>
                      {ev.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {ev.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1">
                          <HugeiconsIcon icon={ClockIcon} size={12} className="text-muted-foreground" />
                          <span className="text-[11px] text-muted-foreground">
                            {formatEventDate(ev.startDate, ev.endDate)}
                          </span>
                        </div>
                        {ev.location?.city && (
                          <div className="flex items-center gap-1">
                            <HugeiconsIcon icon={LocationIcon} size={12} className="text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground truncate">
                              {ev.location.city}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Registered */}
                    <div className="text-right">
                      <p className="text-base font-bold text-foreground">
                        {registeredCount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        registered
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="font-semibold mt-6 w-full uppercase inline-flex items-center justify-center gap-1.5 px-3 py-3 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-800 transition-colors" onClick={() => router.push("/dashboard/events")}  >
            view all events
          </button>
        </>
      )}
    </div>
  );
}