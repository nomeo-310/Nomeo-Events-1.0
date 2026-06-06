"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  CalendarIcon,
  CancelCircleIcon as XCircleIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  ClockIcon,
  File01Icon,
  FilterHorizontalIcon,
  MoreHorizontalCircle01Icon,
  RefreshIcon,
  Search01Icon,
  ViewIcon,
  UnavailableIcon as BanIcon,
  StarIcon,
  Delete01Icon,
  Archive01Icon,
  ArrowReloadHorizontalIcon,
  CheckListIcon,
  UserGroupIcon,
  CertificateIcon,
  GlobalIcon,
  LockIcon,
  AddCircleIcon,
  MinusSignCircleIcon,
  ChartAverageIcon,
  TicketIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationWithInfo } from "@/components/ui/pagination";
import { ReusableModal, ConfirmModal } from "@/components/ui/reusable-modal";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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
  type AdminEventDetail,
  type FetchEventsParams,
  type FetchRegistrationsParams,
  type AdminRegistrationRow,
  type EventAction,
  EventStatus,
  EventCategory,
} from "@/hooks/use-events";
import { useQueryClient } from "@tanstack/react-query";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type HugeIcon = typeof ViewIcon;

interface DropdownItem {
  label: string;
  icon: HugeIcon;
  onClick: () => void;
  danger?: boolean;
}

type ConfirmAction =
  | "cancel"
  | "archive"
  | "soft-delete"
  | "confirm-all"
  | "cancel-all"
  | "issue-certs"
  | null;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function formatMoney(amount: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date?: string | Date) {
  if (!date) return "N/A";
  return format(new Date(date), "dd MMM yyyy");
}

function formatDateTime(date?: string | Date) {
  if (!date) return "N/A";
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

function getInitials(name?: string, fallback = "E") {
  const trimmed = name?.trim();
  if (!trimmed) return fallback;
  return (
    trimmed
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || fallback
  );
}

function getGroupingLabel(startDate: string, endDate: string) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "completed";
}

// ─── BADGE CONFIGS ────────────────────────────────────────────────────────────

const statusTone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  published: "default",
  draft: "secondary",
  cancelled: "destructive",
  archived: "outline",
};

const statusIcon: Record<string, HugeIcon> = {
  published: CheckCircleIcon,
  draft: ClockIcon,
  cancelled: XCircleIcon,
  archived: BanIcon,
};

const groupingTone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  upcoming: "default",
  ongoing: "secondary",
  completed: "outline",
};

const modeTone: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  physical: "default",
  virtual: "secondary",
  hybrid: "outline",
};

const categoryColors: Record<string, string> = {
  webinar: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  seminar: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  entertainment: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  film_show: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  science_tech: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  school_activities: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  spirituality: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  fashion: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  business: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  sports: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  health_wellness: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  art_culture: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  food_drink: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  networking: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  charity: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// ─── SKELETON ─────────────────────────────────────────────────────────────────

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] dark:from-gray-800 dark:via-gray-700 dark:to-gray-800",
        className
      )}
    />
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-3 mb-6">
        <SkeletonLine className="h-10 flex-1" />
        <SkeletonLine className="h-10 w-36" />
        <SkeletonLine className="h-10 w-36" />
      </div>
      <SkeletonLine className="h-10 w-full" />
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <SkeletonLine className="h-4 w-4 rounded" />
          <div className="space-y-1 flex-1">
            <SkeletonLine className="h-3 w-48" />
            <SkeletonLine className="h-2 w-32" />
          </div>
          <SkeletonLine className="h-5 w-20 rounded-full" />
          <SkeletonLine className="h-5 w-16 rounded-full" />
          <SkeletonLine className="h-3 w-24" />
          <SkeletonLine className="h-7 w-7 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="mt-2 h-7 w-32" />
          <SkeletonLine className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

function ModalSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonLine className="h-48 w-full rounded-xl" />
      <div className="flex items-start gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-6 w-48" />
          <SkeletonLine className="h-4 w-64" />
          <div className="flex gap-2 mt-2">
            <SkeletonLine className="h-6 w-20 rounded-full" />
            <SkeletonLine className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <SkeletonLine key={i} className="h-20 rounded-lg" />)}
      </div>
      <div className="space-y-3">
        <SkeletonLine className="h-5 w-40" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <SkeletonLine key={i} className="h-16 rounded-lg" />)}
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL FIELD ─────────────────────────────────────────────────────────────

function DetailField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
      <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
      <div className="mt-0.5 break-words text-xs font-medium text-gray-900 dark:text-white">
        {value ?? "N/A"}
      </div>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className={cn("mt-0.5 text-base font-bold", accent ?? "text-gray-900 dark:text-white")}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── TAB BUTTON ──────────────────────────────────────────────────────────────

function TabButton({ label, count, isActive, onClick }: { label: string; count?: number; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 lg:py-3 text-sm font-medium rounded-md transition-all",
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn("ml-2 px-2 py-0.5 text-xs rounded-full", isActive ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400")}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── ACTION DROPDOWN ─────────────────────────────────────────────────────────

function ActionDropdown({ items, trigger }: { items: (DropdownItem | { divider: true; section?: string })[]; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuWidth = 224;

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    let left = rect.right - menuWidth;
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= 300 || spaceBelow >= rect.top ? rect.bottom + 6 : rect.top - 300 - 6;
    setCoords({ top, left });
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", updateCoords, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [open]);

  return (
    <>
      <div ref={triggerRef} onClick={(e) => { e.stopPropagation(); if (!open) updateCoords(); setOpen((p) => !p); }}>
        {trigger}
      </div>
      {open && typeof window !== "undefined" && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
          style={{ top: coords.top, left: coords.left, width: menuWidth, boxShadow: "0 4px 24px -4px rgba(0,0,0,0.12), 0 1px 4px -1px rgba(0,0,0,0.08)" }}
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
        >
          {items.map((item, i) => {
            if ("divider" in item && item.divider) {
              return item.section
                ? <p key={i} className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{item.section}</p>
                : <div key={i} className="my-1 border-t border-gray-100 dark:border-gray-800" />;
            }
            const { label, icon: Icon, onClick, danger } = item as DropdownItem;
            return (
              <button key={i} type="button" onClick={onClick}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                  danger ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                         : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800")}
              >
                <HugeiconsIcon icon={Icon} className={cn("h-3.5 w-3.5 flex-shrink-0", danger ? "text-red-500" : "text-gray-400 dark:text-gray-500")} />
                {label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

// ─── DATE RANGE PICKER ────────────────────────────────────────────────────────

function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange, onClear }: {
  startDate: string; endDate: string;
  onStartDateChange: (d: string) => void; onEndDateChange: (d: string) => void; onClear: () => void;
}) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const startObj = startDate ? new Date(startDate) : undefined;
  const endObj = endDate ? new Date(endDate) : undefined;
  const cls = "flex h-10 lg:h-11 w-[160px] items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm font-normal shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none cursor-pointer dark:border-gray-800 dark:bg-gray-900 dark:text-white";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={startOpen} onOpenChange={setStartOpen}>
        <PopoverTrigger>
          <div className={cn(cls, !startObj && "text-muted-foreground")}>
            <HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5 shrink-0" />
            {startObj ? format(startObj, "dd MMM yyyy") : "Start date"}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 dark:bg-gray-900 dark:border-gray-800" align="start">
          <Calendar mode="single" selected={startObj} onSelect={(d) => { onStartDateChange(d ? format(d, "yyyy-MM-dd") : ""); setStartOpen(false); }} disabled={(d) => endObj ? d > endObj : false} captionLayout="dropdown" />
        </PopoverContent>
      </Popover>
      <span className="text-xs text-gray-400">to</span>
      <Popover open={endOpen} onOpenChange={setEndOpen}>
        <PopoverTrigger>
          <div className={cn(cls, !endObj && "text-muted-foreground")}>
            <HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5 shrink-0" />
            {endObj ? format(endObj, "dd MMM yyyy") : "End date"}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 dark:bg-gray-900 dark:border-gray-800" align="start">
          <Calendar mode="single" selected={endObj} onSelect={(d) => { onEndDateChange(d ? format(d, "yyyy-MM-dd") : ""); setEndOpen(false); }} disabled={(d) => startObj ? d < startObj : false} captionLayout="dropdown" />
        </PopoverContent>
      </Popover>
      {(startDate || endDate) && (
        <Button type="button" variant="ghost" size="sm" onClick={onClear} className="h-8 px-2 text-gray-500">
          <HugeiconsIcon icon={XCircleIcon} className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

// ─── BADGES ───────────────────────────────────────────────────────────────────

function EventStatusBadge({ status }: { status: string }) {
  const Icon = statusIcon[status] ?? ClockIcon;
  return (
    <Badge variant={statusTone[status] ?? "secondary"} className="gap-1 capitalize text-xs">
      <HugeiconsIcon icon={Icon} size={10} />
      {status}
    </Badge>
  );
}

// ─── REGISTRATION FILTERS ─────────────────────────────────────────────────────

function RegistrationFilters({ search, onSearchChange, status, onStatusChange }: {
  search: string;
  onSearchChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
      <div className="relative flex-1 min-w-[200px]">
        <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by name, email, or reg no..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-8 text-sm dark:border-gray-700"
        />
      </div>
      <Select value={status} onValueChange={(value) => onStatusChange(value ?? "all")}>
        <SelectTrigger className="h-10 lg:h-11 w-full sm:w-32 text-sm dark:border-gray-700">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent className="dark:border-gray-700 p-1">
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="attended">Attended</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
          <SelectItem value="refunded">Refunded</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// ─── STATS OVERVIEW ───────────────────────────────────────────────────────────

function StatsOverview({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) return <StatsSkeleton />;
  if (!data) return null;
  const { events, registrations, revenue, categoryBreakdown } = data;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Events" value={events?.total ?? 0}
          sub={`${events?.grouping?.upcoming ?? 0} upcoming · ${events?.grouping?.ongoing ?? 0} live`} />
        <StatCard label="Total Registrations" value={registrations?.total ?? 0}
          sub={`${registrations?.byStatus?.confirmed ?? 0} confirmed · ${registrations?.byStatus?.pending ?? 0} pending`} />
        <StatCard label="Confirmed Revenue" value={formatMoney(revenue?.confirmed ?? 0)}
          sub={`${formatMoney(revenue?.projected ?? 0)} projected`} accent="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Refunded" value={formatMoney(revenue?.refunded ?? 0)}
          sub={`${registrations?.byStatus?.refunded ?? 0} refunded`} accent="text-red-600 dark:text-red-400" />
      </div>
      {categoryBreakdown?.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Events by Category</h3>
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {categoryBreakdown.map((c: any) => (
              <span key={c._id} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize", categoryColors[c._id] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300")}>
                {c._id?.replace(/_/g, " ")} <span className="font-bold">{c.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MOBILE EVENT CARD ────────────────────────────────────────────────────────

function MobileEventCard({ event, selected, expanded, onToggleSelect, onToggleExpand, onView, onAction }: {
  event: AdminEventRow; selected: boolean; expanded: boolean;
  onToggleSelect: () => void; onToggleExpand: () => void; onView: () => void; onAction: (a: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3 p-4">
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{event.title}</p>
          <p className="truncate text-xs capitalize text-gray-500 dark:text-gray-400">{event.category?.replace(/_/g, " ")}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <EventStatusBadge status={event.status} />
          <button type="button" onClick={onToggleExpand} className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            <HugeiconsIcon icon={expanded ? ArrowUp01Icon : ArrowDown01Icon} className="h-4 w-4" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="space-y-3 border-t border-gray-100 px-4 pb-4 pt-3 dark:border-gray-800">
          <div className="grid grid-cols-2 gap-2">
            {([["Mode", event.eventMode], ["Seats", `${event.availableSeats}/${event.totalSeats}`],
               ["Revenue", formatMoney(event.registrationStats?.projectedRevenue ?? 0)],
               ["Starts", formatDate(event.startDate)]] as [string, string][]).map(([l, v]) => (
              <div key={l} className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">{l}</p>
                <p className="text-xs font-medium capitalize text-gray-700 dark:text-gray-300">{v}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 flex-1 text-xs dark:border-gray-700" onClick={onView}>
              <HugeiconsIcon icon={ViewIcon} className="mr-1 h-3 w-3" /> View
            </Button>
            {event.status === "draft" && (
              <Button size="sm" variant="outline" className="h-8 flex-1 border-green-200 text-xs text-green-600 dark:border-green-800" onClick={() => onAction("publish")}>
                <HugeiconsIcon icon={CheckCircleIcon} className="mr-1 h-3 w-3" /> Publish
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TABLE ACTIONS ────────────────────────────────────────────────────────────

function EventTableActions({ event, onView, onQuickAction }: {
  event: AdminEventRow; onView: (e: AdminEventRow) => void; onQuickAction: (e: AdminEventRow, a: string) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button type="button" onClick={() => onView(event)} className="rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" title="View">
        <HugeiconsIcon icon={ViewIcon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
      <ActionDropdown
        trigger={
          <button type="button" className="rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        }
        items={[
          { label: "View Details", icon: ViewIcon, onClick: () => onView(event) },
          { divider: true, section: "Status" } as const,
          ...(event.status === "draft" ? [{ label: "Publish", icon: CheckCircleIcon, onClick: () => onQuickAction(event, "publish") }] : []),
          ...(event.status === "published" ? [{ label: "Unpublish", icon: ClockIcon, onClick: () => onQuickAction(event, "unpublish") }] : []),
          ...(event.isDeleted ? [{ label: "Restore", icon: ArrowReloadHorizontalIcon, onClick: () => onQuickAction(event, "restore") }] : []),
          { divider: true, section: "Visibility" } as const,
          event.featured
            ? { label: "Unfeature", icon: StarIcon, onClick: () => onQuickAction(event, "unfeature") }
            : { label: "Feature", icon: StarIcon, onClick: () => onQuickAction(event, "feature") },
          event.isPublic
            ? { label: "Make Private", icon: LockIcon, onClick: () => onQuickAction(event, "make-private") }
            : { label: "Make Public", icon: GlobalIcon, onClick: () => onQuickAction(event, "make-public") },
          { divider: true, section: "Danger" } as const,
          ...(!event.isArchived ? [{ label: "Archive", icon: Archive01Icon, onClick: () => onQuickAction(event, "archive"), danger: true }] : []),
          ...(!event.isDeleted ? [{ label: "Delete", icon: Delete01Icon, onClick: () => onQuickAction(event, "soft-delete"), danger: true }] : []),
        ]}
      />
    </div>
  );
}

// ─── EVENTS TABLE ─────────────────────────────────────────────────────────────

function EventsTable({ events, selectedEvents, onSelectAll, onToggleSelect, onView, onQuickAction }: {
  events: AdminEventRow[]; selectedEvents: Set<string>;
  onSelectAll: () => void; onToggleSelect: (id: string) => void;
  onView: (e: AdminEventRow) => void; onQuickAction: (e: AdminEventRow, a: string) => void;
}) {
  return (
    <Table>
      <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
        <TableRow className="border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
          <TableHead className="w-12 pl-4">
            <Checkbox checked={selectedEvents.size === events.length && events.length > 0} onCheckedChange={onSelectAll} />
          </TableHead>
          <TableHead className="w-[28%]">Event</TableHead>
          <TableHead className="w-[10%]">Category</TableHead>
          <TableHead className="w-[9%]">Status</TableHead>
          <TableHead className="w-[8%]">Mode</TableHead>
          <TableHead className="w-[9%]">Seats</TableHead>
          <TableHead className="w-[12%]">Revenue</TableHead>
          <TableHead className="w-[10%]">Organizer</TableHead>
          <TableHead className="w-[8%]">Starts</TableHead>
          <TableHead className="w-16 text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => {
          const grouping = getGroupingLabel(event.startDate, event.endDate);
          const stats = event.registrationStats;
          return (
            <TableRow key={event._id}
              className={cn("border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50",
                event.isDeleted && "opacity-50", event.isArchived && "bg-amber-50/30 dark:bg-amber-900/10")}>
              <TableCell className="pl-4">
                <Checkbox checked={selectedEvents.has(event._id)} onCheckedChange={() => onToggleSelect(event._id)} />
              </TableCell>
              <TableCell>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{event.title}</p>
                  <p className="truncate text-xs text-gray-400 dark:text-gray-500">{event.slug}</p>
                  <div className="mt-0.5 flex gap-1">
                    {event.featured && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        <HugeiconsIcon icon={StarIcon} size={10} /> Featured
                      </span>
                    )}
                    {event.isPublic && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                        <HugeiconsIcon icon={GlobalIcon} size={10} /> Public
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", categoryColors[event.category] ?? "bg-gray-100 text-gray-700")}>
                  {event.category?.replace(/_/g, " ")}
                </span>
              </TableCell>
              <TableCell><EventStatusBadge status={event.status} /></TableCell>
              <TableCell>
                <Badge variant={modeTone[event.eventMode] ?? "outline"} className="capitalize text-xs">{event.eventMode}</Badge>
              </TableCell>
              <TableCell>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{event.availableSeats}/{event.totalSeats}</p>
                <p className="text-[10px] text-gray-400">{stats?.confirmed ?? 0} confirmed</p>
              </TableCell>
              <TableCell>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{formatMoney(stats?.projectedRevenue ?? 0)}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{formatMoney(stats?.confirmedRevenue ?? 0)} confirmed</p>
              </TableCell>
              <TableCell>
                <p className="truncate text-xs text-gray-600 dark:text-gray-400 max-w-[100px]">
                  {event.organizerId?.name ?? "N/A"}
                </p>
              </TableCell>
              <TableCell>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(event.startDate)}</p>
                <Badge variant={groupingTone[grouping] ?? "outline"} className="mt-0.5 text-[10px] capitalize px-1 py-0">{grouping}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <EventTableActions event={event} onView={onView} onQuickAction={onQuickAction} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ─── EVENT DETAIL MODAL CONTENT (UPDATED WITH SEARCH & COMPACT DESIGN) ────────

function EventDetailContent({ detail, isLoading, registrations, regsLoading, regsPagination, regsPage, onRegsPageChange, onAction, actionLoading }: {
  detail: AdminEventDetail | null; isLoading: boolean;
  registrations: AdminRegistrationRow[]; regsLoading: boolean; regsPagination: any; regsPage: number;
  onRegsPageChange: (p: number) => void; onAction: (a: string, b?: Record<string, unknown>) => void; actionLoading: boolean;
}) {
  const [registrationSearch, setRegistrationSearch] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState("all");
  
  // Filter registrations based on search and status
  const filteredRegistrations = useMemo(() => {
    let filtered = registrations;
    
    if (registrationSearch) {
      const searchLower = registrationSearch.toLowerCase();
      filtered = filtered.filter(reg => 
        reg.attendeeName?.toLowerCase().includes(searchLower) ||
        reg.attendeeEmail?.toLowerCase().includes(searchLower) ||
        reg.registrationNumber?.toLowerCase().includes(searchLower)
      );
    }
    
    if (registrationStatus !== "all") {
      filtered = filtered.filter(reg => reg.status === registrationStatus);
    }
    
    return filtered;
  }, [registrations, registrationSearch, registrationStatus]);

  if (isLoading || !detail) return <ModalSkeleton />;

  const event = detail.event;
  const stats = detail.statistics;
  const organizer = event.organizerId as any;
  const bannerImage = (event as any).banner?.secure_url ?? (event as any).coverImage ?? (event as any).image ?? null;
  const shortDescription = (event as any).shortDescription ?? (event as any).summary ?? null;

  return (
    <div className="space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto px-1">
      {/* Banner image */}
      {bannerImage && (
        <div className="-mx-6 -mt-2">
          <img
            src={bannerImage}
            alt={event.title}
            className="h-32 lg:h-60 w-full object-cover sm:h-40"
          />
        </div>
      )}

      {/* Header - more compact */}
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-3 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{event.title}</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">{event.slug}</p>
          {shortDescription && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{shortDescription}</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <EventStatusBadge status={event.status} />
            <Badge variant={modeTone[event.eventMode] ?? "outline"} className="capitalize text-xs">{event.eventMode}</Badge>
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize", categoryColors[event.category] ?? "bg-gray-100 text-gray-700")}>
              {event.category?.replace(/_/g, " ")}
            </span>
            {event.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <HugeiconsIcon icon={StarIcon} size={10} /> Featured
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {event.status === "draft" && (
            <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => onAction("publish")} disabled={actionLoading}>
              <HugeiconsIcon icon={CheckCircleIcon} className="mr-1 h-3 w-3" /> Publish
            </Button>
          )}
          <ActionDropdown
            trigger={
              <Button size="sm" variant="outline" className="h-7 text-xs dark:border-gray-700" disabled={actionLoading}>
                <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="mr-1 h-3 w-3" /> Actions
              </Button>
            }
            items={[
              event.status === "published" && { label: "Unpublish", icon: ClockIcon, onClick: () => onAction("unpublish") },
              { divider: true, section: "Visibility" } as const,
              event.featured ? { label: "Unfeature", icon: StarIcon, onClick: () => onAction("unfeature") } : { label: "Feature", icon: StarIcon, onClick: () => onAction("feature") },
              event.isPublic ? { label: "Make Private", icon: LockIcon, onClick: () => onAction("make-private") } : { label: "Make Public", icon: GlobalIcon, onClick: () => onAction("make-public") },
              { divider: true, section: "Registrations" } as const,
              { label: "Confirm All Pending", icon: CheckListIcon, onClick: () => onAction("confirm-all-registrations") },
              { label: "Issue All Certificates", icon: CertificateIcon, onClick: () => onAction("issue-all-certificates") },
              { divider: true, section: "Danger" } as const,
              { label: "Cancel Event", icon: XCircleIcon, onClick: () => onAction("cancel"), danger: true },
              { label: "Archive Event", icon: Archive01Icon, onClick: () => onAction("archive"), danger: true },
            ].filter(Boolean) as any}
          />
        </div>
      </div>

      {/* Stats in compact grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Projected" value={formatMoney(stats.revenue.projected)} />
        <StatCard label="Confirmed" value={formatMoney(stats.revenue.confirmed)} accent="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Refunded" value={formatMoney(stats.revenue.refunded)} accent="text-red-600 dark:text-red-400" />
        <StatCard label="Registrations" value={stats.totals.registrations} sub={`${stats.byStatus.confirmed.count} confirmed`} />
      </div>

      {/* Registration breakdown pills */}
      <div className="flex flex-wrap gap-1.5">
        {([
          ["Pending", stats.byStatus.pending.count, "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"],
          ["Confirmed", stats.byStatus.confirmed.count, "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"],
          ["Attended", stats.byStatus.attended.count, "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"],
          ["Cancelled", stats.byStatus.cancelled.count, "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"],
          ["Waitlisted", stats.byStatus.waitlisted.count, "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"],
        ] as [string, number, string][]).map(([label, count, color]) => (
          <span key={label} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", color)}>
            {label}: <span className="font-bold">{count}</span>
          </span>
        ))}
      </div>

      {/* Organizer - compact */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-800/50">
        <p className="text-[10px] text-gray-500 dark:text-gray-400">Organizer</p>
        <p className="text-xs font-medium text-gray-900 dark:text-white">{organizer?.name ?? "N/A"}</p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">{organizer?.email ?? "N/A"}</p>
      </div>

      {/* Event details - compact grid */}
      <div className="grid grid-cols-2 gap-2">
        <DetailField label="Start" value={formatDateTime(event.startDate)} />
        <DetailField label="End" value={formatDateTime(event.endDate)} />
        <DetailField label="Seats" value={`${event.availableSeats}/${event.totalSeats}`} />
        <DetailField label="Waitlist" value={(event as any).waitlistEnabled ? "Enabled" : "Disabled"} />
      </div>

      {/* Registrations section with search */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Registrations</h4>
          {regsPagination?.total > 0 && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {filteredRegistrations.length} of {regsPagination.total}
            </span>
          )}
        </div>

        {/* Search and filters */}
        <RegistrationFilters 
          search={registrationSearch}
          onSearchChange={setRegistrationSearch}
          status={registrationStatus}
          onStatusChange={setRegistrationStatus}
        />

        {regsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <SkeletonLine key={i} className="h-10 rounded-lg" />)}
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-xs text-gray-400 dark:border-gray-700">
            {registrationSearch || registrationStatus !== "all" ? "No registrations match your filters" : "No registrations yet"}
          </p>
        ) : (
          <>
            {/* Compact table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500">Attendee</th>
                    <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500">Reg No.</th>
                    <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500">Plan</th>
                    <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-500">Amount</th>
                    <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-2 py-1.5">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-gray-900 dark:text-white max-w-[120px]">{reg.attendeeName}</p>
                          <p className="truncate text-[9px] text-gray-400 max-w-[120px]">{reg.attendeeEmail}</p>
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="font-mono text-[9px] text-gray-500 dark:text-gray-400">{reg.registrationNumber}</span>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="text-[10px] capitalize text-gray-600 dark:text-gray-400">{reg.planName || reg.planType}</span>
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">{formatMoney(reg.price)}</span>
                      </td>
                      <td className="px-2 py-1.5">
                        <Badge variant={statusTone[reg.status] ?? "secondary"} className="capitalize text-[9px] px-1 py-0">
                          {reg.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination - only show if more than one page */}
            {regsPagination && regsPagination.totalPages > 1 && (
              <div className="mt-3">
                <PaginationWithInfo 
                  currentPage={regsPage} 
                  totalPages={regsPagination.totalPages} 
                  totalItems={regsPagination.total} 
                  itemsPerPage={regsPagination.limit} 
                  onPageChange={(p) => {
                    onRegsPageChange(p);
                    // Reset filters when changing pages (optional)
                    setRegistrationSearch("");
                    setRegistrationStatus("all");
                  }} 
                  showInfo 
                  showPageNumbers 
                  maxVisiblePages={3} 
                  className="text-xs"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── UPDATE SEATS MODAL ───────────────────────────────────────────────────────

function UpdateSeatsModal({ isOpen, onClose, onConfirm, isLoading, currentTotal, currentAvailable }: {
  isOpen: boolean; onClose: () => void; onConfirm: (t?: number, a?: number) => void;
  isLoading: boolean; currentTotal: number; currentAvailable: number;
}) {
  const [total, setTotal] = useState(String(currentTotal));
  const [available, setAvailable] = useState(String(currentAvailable));
  useEffect(() => { setTotal(String(currentTotal)); setAvailable(String(currentAvailable)); }, [currentTotal, currentAvailable]);

  return (
    <ConfirmModal isOpen={isOpen} onClose={onClose} onConfirm={() => onConfirm(total ? Number(total) : undefined, available ? Number(available) : undefined)}
      title="Update Seat Capacity" description="Adjust total and available seats. Available seats cannot exceed total seats."
      confirmLabel="Update Seats" cancelLabel="Cancel" confirmVariant="primary" isLoading={isLoading} size="md">
      <div className="mt-4 space-y-4">
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Total Seats</Label>
          <Input type="number" min={1} value={total} onChange={(e) => setTotal(e.target.value)} className="mt-1.5 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Available Seats</Label>
          <Input type="number" min={0} max={Number(total)} value={available} onChange={(e) => setAvailable(e.target.value)} className="mt-1.5 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
        </div>
      </div>
    </ConfirmModal>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

type ViewTab = "upcoming" | "ongoing" | "completed";

// FIX: confirmVariant uses "primary" | "secondary" | "danger" — map "default" → "primary"
const confirmConfig: Record<NonNullable<ConfirmAction>, { title: string; description: string; label: string; variant: "primary" | "danger" }> = {
  cancel:         { title: "Cancel Event",               description: "This will cancel the event and all active registrations. This cannot be easily undone.",                             label: "Cancel Event & Registrations", variant: "danger"  },
  archive:        { title: "Archive Event",              description: "The event will be archived and hidden from public listings. You can restore it later.",                              label: "Archive Event",                variant: "danger"  },
  "soft-delete":  { title: "Delete Event",               description: "The event will be soft-deleted and removed from all listings.",                                                      label: "Delete Event",                 variant: "danger"  },
  "confirm-all":  { title: "Confirm All Registrations",  description: "All pending registrations will be moved to confirmed status.",                                                       label: "Confirm All",                  variant: "primary" },
  "cancel-all":   { title: "Cancel All Registrations",   description: "All active registrations will be cancelled, seats restored, and payments reversed where applicable.",               label: "Cancel All Registrations",     variant: "danger"  },
  "issue-certs":  { title: "Issue All Certificates",     description: "Certificates will be marked as issued for all attended registrations.",                                             label: "Issue Certificates",           variant: "primary" },
};

export default function EventsPage() {
  const qc = useQueryClient();

  // ── UI-only state (filters, selection, modals) ───────────────────────────
  const [currentPage, setCurrentPage]         = useState(1);
  const [selectedEvents, setSelectedEvents]   = useState<Set<string>>(new Set());
  const [expandedCardId, setExpandedCardId]   = useState<string | null>(null);
  const [searchTerm, setSearchTerm]           = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // FIX: use plain `string` for filter state to avoid enum assignability errors
  const [statusFilter, setStatusFilter]       = useState<string>("all");
  const [categoryFilter, setCategoryFilter]   = useState<string>("all");
  const [modeFilter, setModeFilter]           = useState<string>("all");

  const [startAfter, setStartAfter]           = useState("");
  const [startBefore, setStartBefore]         = useState("");
  const [viewTab, setViewTab]                 = useState<ViewTab>("upcoming");

  // Modal / confirm state
  // FIX: use `string` instead of `string | null` so setState always receives a string
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isDetailOpen, setIsDetailOpen]       = useState(false);
  const [regsPage, setRegsPage]               = useState(1);
  const [confirmAction, setConfirmAction]     = useState<ConfirmAction>(null);
  const [confirmEventId, setConfirmEventId]   = useState<string>("");
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [seatTarget, setSeatTarget]           = useState<AdminEventRow | null>(null);

  // ── Debounce search (reset page on change) ───────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchTerm); setCurrentPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ── Build list query params ──────────────────────────────────────────────
  const listParams = useMemo<FetchEventsParams>(() => {
    const p: FetchEventsParams = {
      page: currentPage, limit: 20,
      ...(statusFilter !== "all"   ? { status: statusFilter as EventStatus }           : {}),
      ...(categoryFilter !== "all" ? { category: categoryFilter as EventCategory }     : {}),
      ...(modeFilter !== "all"     ? { eventMode: modeFilter as any }                  : {}),
      ...(debouncedSearch          ? { search: debouncedSearch }                       : {}),
      ...(startAfter               ? { startAfter }                                    : {}),
      ...(startBefore              ? { startBefore }                                   : {}),
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

  // ── React Query — reads ──────────────────────────────────────────────────
  const eventsQuery = useAdminEvents(listParams);
  const statsQuery  = useAdminEventsStats();
  // FIX: pass `selectedEventId || null` so the hook receives null when empty string
  const detailQuery = useAdminEvent(isDetailOpen && selectedEventId ? selectedEventId : null);
  const regsQuery   = useAdminEventRegistrations(
    isDetailOpen && selectedEventId ? selectedEventId : null,
    regsParams
  );

  const events     = eventsQuery.data?.data ?? [];
  const pagination = eventsQuery.data?.pagination;

  // ── React Query — mutations ──────────────────────────────────────────────
  const actionMutation = useAdminEventAction({
    onSuccess: (data) => toast.success(data.message ?? "Done"),
    onError:   (err)  => toast.error(err.message),
  });

  const cancelMutation     = useCancelEvent({
    onSuccess: (data) => { toast.success(data.message ?? "Done"); closeConfirm(); },
    onError:   (err)  => toast.error(err.message),
  });
  const archiveMutation    = useArchiveEvent({
    onSuccess: (data) => { toast.success(data.message ?? "Done"); closeConfirm(); },
    onError:   (err)  => toast.error(err.message),
  });
  const softDeleteMutation = useSoftDeleteEvent({
    onSuccess: (data) => { toast.success(data.message ?? "Done"); closeConfirm(); },
    onError:   (err)  => toast.error(err.message),
  });
  const confirmAllMutation = useConfirmAllRegistrations({
    onSuccess: (data) => { toast.success(data.message ?? "Done"); closeConfirm(); },
    onError:   (err)  => toast.error(err.message),
  });
  const cancelAllMutation  = useCancelAllRegistrations({
    onSuccess: (data) => { toast.success(data.message ?? "Done"); closeConfirm(); },
    onError:   (err)  => toast.error(err.message),
  });
  const certsMutation      = useIssueAllCertificates({
    onSuccess: (data) => { toast.success(data.message ?? "Done"); closeConfirm(); },
    onError:   (err)  => toast.error(err.message),
  });
  const seatsMutation      = useUpdateSeats({
    onSuccess: (data) => { toast.success(data.message ?? "Seats updated"); setIsSeatModalOpen(false); setSeatTarget(null); },
    onError:   (err)  => toast.error(err.message),
  });

  const anyActionPending =
    actionMutation.isPending || cancelMutation.isPending || archiveMutation.isPending ||
    softDeleteMutation.isPending || confirmAllMutation.isPending || cancelAllMutation.isPending ||
    certsMutation.isPending || seatsMutation.isPending;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const closeConfirm = () => { setConfirmAction(null); setConfirmEventId(""); };

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
        action === "cancel"                    ? "cancel"
        : action === "archive"                 ? "archive"
        : action === "soft-delete"             ? "soft-delete"
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
    if (confirmAction === "cancel")           cancelMutation.mutateAsync(confirmEventId, { cancelRegistrations: true });
    else if (confirmAction === "archive")     archiveMutation.mutate(confirmEventId);
    else if (confirmAction === "soft-delete") softDeleteMutation.mutate(confirmEventId);
    else if (confirmAction === "confirm-all") confirmAllMutation.mutate(confirmEventId);
    else if (confirmAction === "cancel-all")  cancelAllMutation.mutateAsync(confirmEventId);
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

  const resetPage = () => { setCurrentPage(1); setSelectedEvents(new Set()); };

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
          <TabButton label="Ongoing"  isActive={viewTab === "ongoing"}  onClick={() => { setViewTab("ongoing");  resetPage(); }} />
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
            <SelectTrigger className="h-10  w-full sm:w-36 lg:h-11 dark:border-gray-800 dark:bg-gray-900 dark:text-white"><SelectValue placeholder="Mode" /></SelectTrigger>
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
              ...(total     !== undefined ? { totalSeats: total }         : {}),
              ...(available !== undefined ? { availableSeats: available } : {}),
            });
          }} />
      )}
    </div>
  );
}