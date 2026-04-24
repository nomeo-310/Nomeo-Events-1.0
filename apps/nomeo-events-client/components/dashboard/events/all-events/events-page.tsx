"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { GridViewIcon, ListViewIcon, PlusSignIcon, Search01Icon as SearchIcon, Calendar03Icon as CalendarIcon } from "@hugeicons/core-free-icons";
import { Event, useEvents } from "@/hooks/use-events";
import { cn } from "@/lib/utils";
import { PaginationWithInfo } from "@/components/ui/pagination";
import { EventTabs } from "../event-tabs";
import { EventGridCard } from "./event-grid-card";
import { EventListCard } from "./event-list-card";
import { SkeletonCard } from "./event-skeleton";
import { EmptyState } from "./empty-state";
import { STATUS_TABS, ITEMS_PER_PAGE, StatusTab, ViewMode } from "./event-helpers";

// ─── Query params helper ───────────────────────────────────────────────────────

function tabToQueryParams(tab: StatusTab) {
  if (tab === "deleted")   return { status: undefined,   isDeleted: true,  isArchived: false };
  if (tab === "archived")  return { status: undefined,   isDeleted: false, isArchived: true  };
  if (tab === "published") return { status: "published", isDeleted: false, isArchived: false };
  if (tab === "draft")     return { status: "draft",     isDeleted: false, isArchived: false };
  return                          { status: undefined,   isDeleted: false, isArchived: false };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const router = useRouter();
  const [activeTab,   setActiveTab]   = useState<StatusTab>("all");
  const [viewMode,    setViewMode]    = useState<ViewMode>("grid");
  const [search,      setSearch]      = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { useOrganizerAllEvents, usePublishEvent, useArchiveEvent, useSoftDeleteEvent, useRestoreEvent } = useEvents();

  const { status, isDeleted, isArchived } = tabToQueryParams(activeTab);
  const { data, isLoading, isError } = useOrganizerAllEvents(status, isDeleted, isArchived, undefined, currentPage, ITEMS_PER_PAGE);

  console.log("Fetched events data:", data);

  const publishMutation = usePublishEvent();
  const archiveMutation = useArchiveEvent();
  const deleteMutation  = useSoftDeleteEvent();
  const restoreMutation = useRestoreEvent();

  const events     = data?.data       ?? [];
  const pagination = data?.pagination;
  const totalCount = pagination?.totalCount ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  const filtered = search.trim()
    ? events.filter((e: Event) =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.description?.toLowerCase().includes(search.toLowerCase()) ||
        e.category?.toLowerCase().includes(search.toLowerCase())
      )
    : events;

  const handleTabChange = (tab: StatusTab) => { setActiveTab(tab); setCurrentPage(1); setSearch(""); };
  const handlePageChange = (page: number)  => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const handleCreateClick = () => {
    if (activeTab === "published") { setActiveTab("draft"); return; }
    router.push("/dashboard/events/create-event");
  };

  const cardProps = {
    onPublish: (id: string) => publishMutation.mutate(id),
    onArchive: (id: string) => archiveMutation.mutate(id),
    onDelete:  (id: string) => deleteMutation.mutate(id),
    onRestore: (id: string) => restoreMutation.mutate(id),
  };

  const gridClass = cn(
    "gap-4",
    viewMode === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : "flex flex-col"
  );

  return (
    <>
      <EventTabs />
      <div className="w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Events</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {totalCount} event{totalCount !== 1 ? "s" : ""} total
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/events/create-event")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 self-start sm:self-auto"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} /> Create Event
          </button>
        </div>

        {/* Tabs + view toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg shrink-0">
            {(["grid", "list"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-label={`${mode} view`}
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

        {/* Search */}
        <div className="relative mb-6">
          <HugeiconsIcon icon={SearchIcon} size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, category, description..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className={gridClass}>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} view={viewMode} />)}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <HugeiconsIcon icon={CalendarIcon} size={28} className="text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Failed to load events</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Something went wrong. Please try refreshing.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Refresh page
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState tab={activeTab} onCreateClick={handleCreateClick} />
        ) : (
          <>
            <div className={gridClass}>
              {filtered.map((event:Event) =>
                viewMode === "grid"
                  ? <EventGridCard key={event._id} event={event} {...cardProps} />
                  : <EventListCard key={event._id} event={event} {...cardProps} />
              )}
            </div>

            {!search.trim() && totalPages > 1 && (
              <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800">
                <PaginationWithInfo
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalCount}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={handlePageChange}
                  showInfo
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}