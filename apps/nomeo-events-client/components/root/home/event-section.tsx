"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query"; // You'll need to create this
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRightIcon, GridViewIcon, ListViewIcon, Calendar03Icon as CalendarIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Event, useEvents } from "@/hooks/use-events";
import { UpcomingEventGridCard } from "./events/event-card-grid";
import { UpcomingEventListCard } from "./events/event-card-list";
import { GridCardSkeleton, ListCardSkeleton } from "./events/event-skeletons";

// Responsive limits based on actual visible items
const getLimitByBreakpoint = (breakpoint: string): number => {
  switch (breakpoint) {
    case "xl": return 8;      // 4 columns x 2 rows
    case "lg": return 6;      // 3 columns x 2 rows  
    case "md": return 4;      // 2 columns x 2 rows
    default: return 4;        // mobile: 1 column x 4 rows
  }
};

type ViewMode = "grid" | "list";
type Breakpoint = "mobile" | "md" | "lg" | "xl";

export default function UpcomingEventsSection() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  
  // Detect current breakpoint
  const isMobile = useMediaQuery("(max-width: 639px)");
  const isMd = useMediaQuery("(min-width: 640px) and (max-width: 767px)");
  const isLg = useMediaQuery("(min-width: 768px) and (max-width: 1279px)");
  const isXl = useMediaQuery("(min-width: 1280px)");
  
  const currentBreakpoint: Breakpoint = isXl ? "xl" : isLg ? "lg" : isMd ? "md" : "mobile";
  const currentLimit = getLimitByBreakpoint(currentBreakpoint);
  
  const { usePublicEvents } = useEvents();
  const { data, isLoading, isError } = usePublicEvents(
    undefined, // category
    undefined, // type
    true,      // upcoming
    undefined, // featured
    1,
    currentLimit
  );

  // Optional: Refetch when breakpoint changes
  useEffect(() => {
    // The hook should automatically refetch when dependencies change
    // but you might need to trigger a refetch here depending on your usePublicEvents implementation
  }, [currentLimit]);

  const events = data?.data ?? [];
  const hasMore = (data?.total || 0) > currentLimit;

  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section heading ──────────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-indigo-500 dark:text-indigo-400 mb-3">
            Don't Miss Out
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Upcoming{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Events
            </span>
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Discover and register for events happening soon. Secure your spot today.
          </p>
        </div>

        {/* ── View toggle ──────────────────────────────────────────────────── */}
        <div className="flex justify-end mb-6">
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {(["grid", "list"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-label={`${mode} view`}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "p-2 rounded-md transition-colors duration-200",
                  viewMode === mode
                    ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
              >
                <HugeiconsIcon icon={mode === "grid" ? GridViewIcon : ListViewIcon} size={18} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Event cards ──────────────────────────────────────────────────── */}
        {isLoading ? (
          <LoadingState viewMode={viewMode} currentBreakpoint={currentBreakpoint} />
        ) : isError ? (
          <ErrorState />
        ) : events.length === 0 ? (
          <EmptyState />
        ) : viewMode === "grid" ? (
          <ResponsiveGridLayout events={events} currentBreakpoint={currentBreakpoint} />
        ) : (
          <ResponsiveListLayout events={events} currentBreakpoint={currentBreakpoint} />
        )}

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push("/events")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-xl font-medium border border-gray-300 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
          >
            See All Upcoming Events
            <HugeiconsIcon icon={ArrowRightIcon} size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Responsive Grid Layout ────────────────────────────────────────────────────

function ResponsiveGridLayout({ events, currentBreakpoint }: { events: Event[], currentBreakpoint: Breakpoint }) {
  const getGridCols = () => {
    switch (currentBreakpoint) {
      case "xl": return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
      case "lg": return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case "md": return "grid-cols-1 sm:grid-cols-2";
      default: return "grid-cols-1";
    }
  };

  const getRowsToShow = () => {
    switch (currentBreakpoint) {
      case "xl": return 2; // 4 cols x 2 rows = 8 items
      case "lg": return 2; // 3 cols x 2 rows = 6 items  
      case "md": return 2; // 2 cols x 2 rows = 4 items
      default: return 4;   // 1 col x 4 rows = 4 items
    }
  };

  const itemsToShow = getRowsToShow() * (currentBreakpoint === "xl" ? 4 : currentBreakpoint === "lg" ? 3 : currentBreakpoint === "md" ? 2 : 1);
  const visibleEvents = events.slice(0, itemsToShow);

  return (
    <div className={`grid ${getGridCols()} gap-5 mb-10`}>
      {visibleEvents.map((event: Event) => (
        <UpcomingEventGridCard key={event._id} event={event} />
      ))}
    </div>
  );
}

// ─── Responsive List Layout ────────────────────────────────────────────────────

function ResponsiveListLayout({ events, currentBreakpoint }: { events: Event[], currentBreakpoint: Breakpoint }) {
  const getItemsToShow = () => {
    switch (currentBreakpoint) {
      case "xl": return 8;
      case "lg": return 6;
      case "md": return 4;
      default: return 4;
    }
  };

  const visibleEvents = events.slice(0, getItemsToShow());

  return (
    <div className="space-y-4 mb-10">
      {visibleEvents.map((event: Event) => (
        <UpcomingEventListCard key={event._id} event={event} />
      ))}
    </div>
  );
}

// ─── Loading States ────────────────────────────────────────────────────────────

function LoadingState({ viewMode, currentBreakpoint }: { viewMode: ViewMode, currentBreakpoint: Breakpoint }) {
  if (viewMode === "list") {
    const skeletonCount = getLimitByBreakpoint(currentBreakpoint);
    return (
      <div className="space-y-4 mb-10">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ListCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const getSkeletonGrid = () => {
    switch (currentBreakpoint) {
      case "xl": return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
      case "lg": return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case "md": return "grid-cols-1 sm:grid-cols-2";
      default: return "grid-cols-1";
    }
  };

  const skeletonCount = getLimitByBreakpoint(currentBreakpoint);
  
  return (
    <div className={`grid ${getSkeletonGrid()} gap-6 mb-10`}>
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <GridCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Error & Empty States ────────────────────────────────────────────────────

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center mb-10">
      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <HugeiconsIcon icon={CalendarIcon} size={24} className="text-red-400" />
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Failed to load events</p>
      <p className="text-xs text-gray-400 dark:text-gray-500">Please try refreshing the page.</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center mb-10">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <HugeiconsIcon icon={CalendarIcon} size={24} className="text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No upcoming events</p>
      <p className="text-xs text-gray-400 dark:text-gray-500">Check back soon for new events.</p>
    </div>
  );
}