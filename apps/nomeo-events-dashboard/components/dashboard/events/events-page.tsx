// events-page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  RefreshIcon,
  FilterHorizontalIcon,
  TicketIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginationWithInfo } from "@/components/ui/pagination";
import { ReusableModal, ConfirmModal } from "@/components/ui/reusable-modal";

import {
  useAdminEvents,
  useAdminEventsStats,
  useAdminEvent,
  useAdminEventRegistrations,
  useAdminEventAction,
  useCancelEvent,
  useArchiveEvent,
  useSoftDeleteEvent,
  useConfirmAllRegistrations,
  useCancelAllRegistrations,
  useIssueAllCertificates,
  useUpdateSeats,
  type AdminEventRow,
  type FetchEventsParams,
  type FetchRegistrationsParams,
  type EventAction,
  EventStatus,
  EventCategory,
} from "@/hooks/use-events";

import { ViewTab, ConfirmAction, confirmConfig } from "./events-types";
import { TableSkeleton } from "./events-skeletons";
import { TabButton, DateRangePicker } from "./events-components";
import { StatsOverview } from "./events-stats";
import { EventsTable } from "./events-table";
import { MobileEventCard } from "./events-mobile-card";
import { EventDetailContent } from "./events-detail-content";
import { UpdateSeatsModal } from "./events-update-seats-modal";

export default function EventsPage() {
  const qc = useQueryClient();

  // UI state
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [startAfter, setStartAfter] = useState("");
  const [startBefore, setStartBefore] = useState("");
  const [viewTab, setViewTab] = useState<ViewTab>("upcoming");

  // Modal state
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [regsPage, setRegsPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmEventId, setConfirmEventId] = useState<string>("");
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [seatTarget, setSeatTarget] = useState<AdminEventRow | null>(null);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchTerm); setCurrentPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Query params
  const listParams = useMemo<FetchEventsParams>(() => {
    const p: FetchEventsParams = {
      page: currentPage, limit: 20,
      ...(statusFilter !== "all"   ? { status: statusFilter as EventStatus } : {}),
      ...(categoryFilter !== "all" ? { category: categoryFilter as EventCategory } : {}),
      ...(modeFilter !== "all"     ? { eventMode: modeFilter as any } : {}),
      ...(debouncedSearch          ? { search: debouncedSearch } : {}),
      ...(startAfter               ? { startAfter } : {}),
      ...(startBefore              ? { startBefore } : {}),
    };

    if (viewTab === "upcoming") {
      p.startAfter = new Date().toISOString();
    } else if (viewTab === "completed") {
      p.startBefore = new Date(Date.now() - 86400000).toISOString();
    }

    return p;
  }, [currentPage, statusFilter, categoryFilter, modeFilter, debouncedSearch, startAfter, startBefore, viewTab]);

  const regsParams = useMemo<FetchRegistrationsParams>(
    () => ({ page: regsPage, limit: 10 }),
    [regsPage]
  );

  const hasFilters = !!(debouncedSearch || statusFilter !== "all" || categoryFilter !== "all" || modeFilter !== "all" || startAfter || startBefore);

  // React Query
  const eventsQuery = useAdminEvents(listParams);
  const statsQuery = useAdminEventsStats();
  const detailQuery = useAdminEvent(isDetailOpen && selectedEventId ? selectedEventId : null);
  const regsQuery = useAdminEventRegistrations(
    isDetailOpen && selectedEventId ? selectedEventId : null,
    regsParams
  );

  const events = eventsQuery.data?.data ?? [];
  const pagination = eventsQuery.data?.pagination;

  // Mutations
  const actionMutation = useAdminEventAction({
    onSuccess: (data) => toast.success(data.message ?? "Done"),
    onError: (err) => toast.error(err.message),
  });

  const cancelMutation = useCancelEvent({
    onSuccess: (data) => { toast.success(data.message ?? "Done"); closeConfirm(); },
    onError: (err) => toast.error(err.message),
  });
  const archiveMutation = useArchiveEvent({
    onSuccess: (data) => { toast.success(data.message ?? "Done"); closeConfirm(); },
    onError: (err) => toast.error(err.message),
  });
  const softDeleteMutation = useSoftDeleteEvent({
    onSuccess: (data) => { toast.success(data.message ?? "Done"); closeConfirm(); },
    onError: (err) => toast.error(err.message),
  });
  const confirmAllMutation = useConfirmAllRegistrations({
    onSuccess: (data) => { toast.success(data.message ?? "Done"); closeConfirm(); },
    onError: (err) => toast.error(err.message),
  });
  const cancelAllMutation = useCancelAllRegistrations({
    onSuccess: (data) => { toast.success(data.message ?? "Done"); closeConfirm(); },
    onError: (err) => toast.error(err.message),
  });
  const certsMutation = useIssueAllCertificates({
    onSuccess: (data) => { toast.success(data.message ?? "Done"); closeConfirm(); },
    onError: (err) => toast.error(err.message),
  });
  const seatsMutation = useUpdateSeats({
    onSuccess: (data) => { toast.success(data.message ?? "Seats updated"); setIsSeatModalOpen(false); setSeatTarget(null); },
    onError: (err) => toast.error(err.message),
  });

  const anyActionPending =
    actionMutation.isPending || cancelMutation.isPending || archiveMutation.isPending ||
    softDeleteMutation.isPending || confirmAllMutation.isPending || cancelAllMutation.isPending ||
    certsMutation.isPending || seatsMutation.isPending;

  // Helpers
  const closeConfirm = () => { setConfirmAction(null); setConfirmEventId(""); };
  const resetPage = () => { setCurrentPage(1); setSelectedEvents(new Set()); };

  const openDetail = (event: AdminEventRow) => {
    setSelectedEventId(event._id);
    setRegsPage(1);
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedEventId(""), 200);
  };

  const CONFIRM_ACTIONS = ["cancel", "archive", "soft-delete", "cancel-all-registrations"];

  const handleModalAction = (action: string) => {
    if (!selectedEventId) return;
    if (CONFIRM_ACTIONS.includes(action)) {
      setConfirmAction(
        action === "cancel" ? "cancel"
        : action === "archive" ? "archive"
        : action === "soft-delete" ? "soft-delete"
        : "cancel-all"
      );
      setConfirmEventId(selectedEventId);
      return;
    }
    actionMutation.mutate({ eventId: selectedEventId, action: action as EventAction });
  };

  const handleQuickAction = (event: AdminEventRow, action: string) => {
    if (CONFIRM_ACTIONS.includes(action)) {
      setConfirmAction(action as ConfirmAction);
      setConfirmEventId(event._id);
      return;
    }
    actionMutation.mutate({ eventId: event._id, action: action as EventAction });
  };

  const handleConfirm = () => {
    if (!confirmAction || !confirmEventId) return;
    if (confirmAction === "cancel") cancelMutation.mutateAsync(confirmEventId, { cancelRegistrations: true });
    else if (confirmAction === "archive") archiveMutation.mutate(confirmEventId);
    else if (confirmAction === "soft-delete") softDeleteMutation.mutate(confirmEventId);
    else if (confirmAction === "confirm-all") confirmAllMutation.mutate(confirmEventId);
    else if (confirmAction === "cancel-all") cancelAllMutation.mutateAsync(confirmEventId);
    else if (confirmAction === "issue-certs") certsMutation.mutate(confirmEventId);
  };

  const handleSelectAll = () =>
    setSelectedEvents(selectedEvents.size === events.length && events.length > 0 ? new Set() : new Set(events.map((e) => e._id)));

  const toggleSelect = (id: string) => {
    const next = new Set(selectedEvents);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedEvents(next);
  };

  const clearFilters = () => {
    setSearchTerm(""); setDebouncedSearch(""); setStatusFilter("all"); setCategoryFilter("all");
    setModeFilter("all"); setStartAfter(""); setStartBefore(""); setCurrentPage(1); setSelectedEvents(new Set());
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 dark:bg-gray-900">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div className="px-4">

        {/* Page header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Events Management</h1>
            {(pagination?.total ?? 0) > 0 && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {pagination!.total} events
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monitor all events, manage registrations, view revenue stats, and perform admin actions.
          </p>
        </div>

        {/* Stats */}
        <StatsOverview data={statsQuery.data} isLoading={statsQuery.isLoading} />

        {/* Toolbar */}
        <div className="mb-4 mt-6 flex justify-end">
          <Button type="button" onClick={() => eventsQuery.refetch()} variant="outline" className="h-10 px-4 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800" disabled={eventsQuery.isFetching}>
            <HugeiconsIcon icon={RefreshIcon} className={cn("mr-2 h-4 w-4", eventsQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* View tabs */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <TabButton label="Upcoming" isActive={viewTab === "upcoming"} onClick={() => { setViewTab("upcoming"); resetPage(); }} />
          <TabButton label="Ongoing" isActive={viewTab === "ongoing"} onClick={() => { setViewTab("ongoing"); resetPage(); }} />
          <TabButton label="Completed" isActive={viewTab === "completed"} onClick={() => { setViewTab("completed"); resetPage(); }} />
          {eventsQuery.isFetching && !eventsQuery.isLoading && <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4 animate-spin text-blue-500" />}
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <div className="relative h-10 min-w-[220px] flex-1 lg:h-11">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <Input placeholder="Search title, slug..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); resetPage(); }}>
            <SelectTrigger className="h-10 w-full sm:w-36 lg:h-11 dark:border-gray-800 dark:bg-gray-900 dark:text-white"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="p-1 dark:border-gray-800 dark:bg-gray-900">
              <SelectItem value="all">All Status</SelectItem>
              {Object.values(EventStatus).map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v ?? "all"); resetPage(); }}>
            <SelectTrigger className="h-10 w-full sm:w-40 lg:h-11 dark:border-gray-800 dark:bg-gray-900 dark:text-white"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent className="p-1 dark:border-gray-800 dark:bg-gray-900">
              <SelectItem value="all">All Categories</SelectItem>
              {Object.values(EventCategory).map((c) => <SelectItem key={c} value={c} className="capitalize">{c.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={modeFilter} onValueChange={(v) => { setModeFilter(v ?? "all"); resetPage(); }}>
            <SelectTrigger className="h-10 w-full sm:w-36 lg:h-11 dark:border-gray-800 dark:bg-gray-900 dark:text-white"><SelectValue placeholder="Mode" /></SelectTrigger>
            <SelectContent className="p-1 dark:border-gray-800 dark:bg-gray-900">
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="virtual">Virtual</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker startDate={startAfter} endDate={startBefore}
            onStartDateChange={(d) => { setStartAfter(d); resetPage(); }}
            onEndDateChange={(d) => { setStartBefore(d); resetPage(); }}
            onClear={() => { setStartAfter(""); setStartBefore(""); resetPage(); }} />
        </div>

        {/* Selection bar */}
        {selectedEvents.size > 0 && (
          <div className="mb-5 flex flex-col items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/50 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">{selectedEvents.size}</span>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">events selected</span>
            </div>
            <Button type="button" variant="outline" size="sm" className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:bg-gray-900 dark:text-blue-300" onClick={() => setSelectedEvents(new Set())}>
              Deselect All
            </Button>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:block">
          {eventsQuery.isLoading ? (
            <div className="p-6"><TableSkeleton /></div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <HugeiconsIcon icon={TicketIcon} className="h-6 w-6 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">No {viewTab} events found</h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{hasFilters ? "No events match your filters" : `No ${viewTab} events found`}</p>
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                  <HugeiconsIcon icon={FilterHorizontalIcon} className="mr-2 h-4 w-4" /> Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="relative">
                {eventsQuery.isFetching && !eventsQuery.isLoading && (
                  <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/50 pt-20 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      <HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                  </div>
                )}
                <EventsTable events={events} selectedEvents={selectedEvents} onSelectAll={handleSelectAll} onToggleSelect={toggleSelect} onView={openDetail} onQuickAction={handleQuickAction} />
              </div>
              {pagination && pagination.totalPages > 1 && (
                <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-800">
                  <PaginationWithInfo currentPage={currentPage} totalPages={pagination.totalPages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={(p) => setCurrentPage(p)} showInfo showPageNumbers maxVisiblePages={5} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {eventsQuery.isLoading ? <TableSkeleton /> : events.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
              <HugeiconsIcon icon={TicketIcon} className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500">No {viewTab} events found</p>
            </div>
          ) : events.map((event) => (
            <MobileEventCard key={event._id} event={event} selected={selectedEvents.has(event._id)} expanded={expandedCardId === event._id}
              onToggleSelect={() => toggleSelect(event._id)}
              onToggleExpand={() => setExpandedCardId((p) => p === event._id ? null : event._id)}
              onView={() => openDetail(event)} onAction={(a) => handleQuickAction(event, a)} />
          ))}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4">
              <PaginationWithInfo currentPage={currentPage} totalPages={pagination.totalPages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={(p) => setCurrentPage(p)} showInfo showPageNumbers={false} maxVisiblePages={3} />
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      <ReusableModal isOpen={isDetailOpen} onClose={closeDetail}
        title="Event Details" description="Full event information, registration statistics, and admin actions" size="xxl"
        actions={[
          { label: "Close", onClick: closeDetail, variant: "outline" },
          ...(selectedEventId && !detailQuery.isLoading
            ? [{ label: "Update Seats", onClick: () => { const ev = detailQuery.data?.event; if (ev) setSeatTarget(ev as unknown as AdminEventRow); setIsSeatModalOpen(true); }, variant: "outline" as const }]
            : []),
        ]}
      >
        <EventDetailContent
          detail={detailQuery.data ?? null}
          isLoading={detailQuery.isLoading}
          registrations={regsQuery.data?.data ?? []}
          regsLoading={regsQuery.isLoading || regsQuery.isFetching}
          regsPagination={regsQuery.data?.pagination ?? null}
          regsPage={regsPage}
          onRegsPageChange={(p) => setRegsPage(p)}
          onAction={handleModalAction}
          actionLoading={anyActionPending}
        />
      </ReusableModal>

      {/* Confirm dialog */}
      {confirmAction && (
        <ConfirmModal isOpen={!!confirmAction} onClose={closeConfirm} onConfirm={handleConfirm}
          title={confirmConfig[confirmAction].title} description={confirmConfig[confirmAction].description}
          confirmLabel={confirmConfig[confirmAction].label} cancelLabel="Cancel"
          confirmVariant={confirmConfig[confirmAction].variant} isLoading={anyActionPending} size="md" />
      )}

      {/* Update seats modal */}
      {seatTarget && (
        <UpdateSeatsModal isOpen={isSeatModalOpen} onClose={() => { setIsSeatModalOpen(false); setSeatTarget(null); }}
          isLoading={seatsMutation.isPending} currentTotal={seatTarget.totalSeats} currentAvailable={seatTarget.availableSeats}
          onConfirm={(total, available) => {
            if (!seatTarget) return;
            seatsMutation.mutate(seatTarget._id, {
              ...(total !== undefined ? { totalSeats: total } : {}),
              ...(available !== undefined ? { availableSeats: available } : {}),
            });
          }} />
      )}
    </div>
  );
}