// payments-components.tsx
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CalendarIcon,
  CancelCircleIcon as XCircleIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { DropdownItem, statusIcon, statusTone } from "./payments-types";
import type { PaymentGatewayStatus } from "@/hooks/use-payments";

// ─── Tab Button ──────────────────────────────────────────────────────────────
export function TabButton({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}) {
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
        <span
          className={cn(
            "ml-2 px-2 py-0.5 text-xs rounded-full",
            isActive
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Action Dropdown ─────────────────────────────────────────────────────────
export function ActionDropdown({
  items,
  trigger,
}: {
  items: (DropdownItem | { divider: true; section?: string })[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuWidth = 224;

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = 300;
    const offset = 6;
    let left = rect.right - menuWidth;

    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;

    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= menuHeight || spaceBelow >= rect.top
      ? rect.bottom + offset
      : rect.top - menuHeight - offset;

    setCoords({ top, left });
  };

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => updateCoords();

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          if (!open) updateCoords();
          setOpen((prev) => !prev);
        }}
      >
        {trigger}
      </div>

      {open &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
            style={{
              top: coords.top,
              left: coords.left,
              width: menuWidth,
              boxShadow: "0 4px 24px -4px rgba(0,0,0,0.12), 0 1px 4px -1px rgba(0,0,0,0.08)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          >
            {items.map((item, index) => {
              if ("divider" in item && item.divider) {
                return item.section ? (
                  <p
                    key={index}
                    className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500"
                  >
                    {item.section}
                  </p>
                ) : (
                  <div key={index} className="my-1 border-t border-gray-100 dark:border-gray-800" />
                );
              }

              const { label, icon: Icon, onClick, danger } = item as DropdownItem;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={onClick}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                    danger
                      ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                >
                  <HugeiconsIcon
                    icon={Icon}
                    className={cn("h-3.5 w-3.5 flex-shrink-0", danger ? "text-red-500" : "text-gray-400 dark:text-gray-500")}
                  />
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

// ─── Payment Status Badge ────────────────────────────────────────────────────
export function PaymentStatusBadge({ status }: { status: PaymentGatewayStatus }) {
  const Icon = statusIcon[status] ?? AlertCircleIcon;

  return (
    <Badge variant={statusTone[status] ?? "secondary"} className="gap-1 capitalize">
      <HugeiconsIcon icon={Icon} size={12} />
      {status}
    </Badge>
  );
}

// ─── Detail Field ────────────────────────────────────────────────────────────
export function DetailField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <div className="mt-1 break-words text-sm font-medium text-gray-900 dark:text-white">{value || "N/A"}</div>
    </div>
  );
}

// ─── Date Range Picker ───────────────────────────────────────────────────────
export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
}: {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
}) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const startDateObj = startDate ? new Date(startDate) : undefined;
  const endDateObj = endDate ? new Date(endDate) : undefined;

  const triggerClass = cn(
    "flex h-10 lg:h-11 w-[160px] items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm font-normal shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none cursor-pointer",
    "dark:border-gray-800 dark:bg-gray-900 dark:text-white"
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={startOpen} onOpenChange={setStartOpen}>
        <PopoverTrigger>
          <div className={cn(triggerClass, !startDateObj && "text-muted-foreground")}>
            <HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5 shrink-0" />
            {startDateObj ? format(startDateObj, "dd MMM yyyy") : "Start date"}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 dark:bg-gray-900 dark:border-gray-800" align="start">
          <Calendar
            mode="single"
            selected={startDateObj}
            onSelect={(date) => {
              onStartDateChange(date ? format(date, "yyyy-MM-dd") : "");
              setStartOpen(false);
            }}
            disabled={(date) => (endDateObj ? date > endDateObj : false)}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>

      <span className="text-xs text-gray-400">to</span>

      <Popover open={endOpen} onOpenChange={setEndOpen}>
        <PopoverTrigger>
          <div className={cn(triggerClass, !endDateObj && "text-muted-foreground")}>
            <HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5 shrink-0" />
            {endDateObj ? format(endDateObj, "dd MMM yyyy") : "End date"}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 dark:bg-gray-900 dark:border-gray-800" align="start">
          <Calendar
            mode="single"
            selected={endDateObj}
            onSelect={(date) => {
              onEndDateChange(date ? format(date, "yyyy-MM-dd") : "");
              setEndOpen(false);
            }}
            disabled={(date) => (startDateObj ? date < startDateObj : false)}
            captionLayout="dropdown"
          />
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

import { AlertCircleIcon } from "@hugeicons/core-free-icons";