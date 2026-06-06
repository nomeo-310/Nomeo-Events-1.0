// events-components.tsx
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CalendarIcon,
  CancelCircleIcon as XCircleIcon,
  Search01Icon,
  ClockIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { DropdownItem, statusIcon, statusTone, modeTone, categoryColors, getGroupingLabel, formatMoney, formatDate } from "./events-types";
import type { AdminEventRow } from "@/hooks/use-events";

// ─── Detail Field ─────────────────────────────────────────────────────────────
export function DetailField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
      <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
      <div className="mt-0.5 break-words text-xs font-medium text-gray-900 dark:text-white">
        {value ?? "N/A"}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className={cn("mt-0.5 text-base font-bold", accent ?? "text-gray-900 dark:text-white")}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── Tab Button ──────────────────────────────────────────────────────────────
export function TabButton({ label, count, isActive, onClick }: { label: string; count?: number; isActive: boolean; onClick: () => void }) {
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

// ─── Action Dropdown ─────────────────────────────────────────────────────────
export function ActionDropdown({ items, trigger }: { items: (DropdownItem | { divider: true; section?: string })[]; trigger: React.ReactNode }) {
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

// ─── Event Status Badge ───────────────────────────────────────────────────────
export function EventStatusBadge({ status }: { status: string }) {
  const Icon = statusIcon[status] ?? ClockIcon;
  return (
    <Badge variant={statusTone[status] ?? "secondary"} className="gap-1 capitalize text-xs">
      <HugeiconsIcon icon={Icon} size={10} />
      {status}
    </Badge>
  );
}

// ─── Date Range Picker ───────────────────────────────────────────────────────
export function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange, onClear }: {
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

// ─── Registration Filters ─────────────────────────────────────────────────────
export function RegistrationFilters({ search, onSearchChange, status, onStatusChange }: {
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