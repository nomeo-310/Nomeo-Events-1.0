// users-components.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CalendarIcon,
  CancelCircleIcon as XCircleIcon,
} from "@hugeicons/core-free-icons";
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import type { DropdownItem } from './users-types';

// ─── Tab Button ──────────────────────────────────────────────────────────────
interface TabButtonProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

export const TabButton = ({ label, count, isActive, onClick }: TabButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2 lg:py-3 text-sm font-medium rounded-md transition-all",
      isActive 
        ? "bg-blue-600 text-white shadow-sm" 
        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
    )}
  >
    {label}
    {count > 0 && (
      <span className={cn(
        "ml-2 px-2 py-0.5 text-xs rounded-full",
        isActive 
          ? "bg-blue-500 text-white" 
          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
      )}>
        {count}
      </span>
    )}
  </button>
);

// ─── Action Dropdown ─────────────────────────────────────────────────────────
interface ActionDropdownProps {
  items: (DropdownItem | { divider: true; section?: string })[];
  trigger: React.ReactNode;
}

export const ActionDropdown = ({ items, trigger }: ActionDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const MENU_WIDTH = 224;

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const MENU_HEIGHT = 320;
    const OFFSET = 6;

    let left = rect.right - MENU_WIDTH;
    if (left < 8) left = 8;
    if (left + MENU_WIDTH > window.innerWidth - 8) left = window.innerWidth - MENU_WIDTH - 8;

    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= MENU_HEIGHT || spaceBelow >= rect.top
      ? rect.bottom + OFFSET
      : rect.top - MENU_HEIGHT - OFFSET;

    setCoords({ top, left });
  };

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onScroll = () => updateCoords();

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open) updateCoords();
    setOpen((p) => !p);
  };

  return (
    <>
      <div ref={triggerRef} onClick={handleTriggerClick}>
        {trigger}
      </div>

      {open && typeof window !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden z-[9999]"
            style={{
              top: coords.top,
              left: coords.left,
              width: MENU_WIDTH,
              boxShadow: '0 4px 24px -4px rgba(0,0,0,0.12), 0 1px 4px -1px rgba(0,0,0,0.08)',
            }}
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          >
            {items.map((item, i) => {
              if ('divider' in item && item.divider) {
                return (
                  <div key={i}>
                    {item.section ? (
                      <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        {item.section}
                      </p>
                    ) : (
                      <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                    )}
                  </div>
                );
              }
              const { label, icon: Icon, onClick, danger } = item as DropdownItem;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={onClick}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                    danger
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <HugeiconsIcon
                    icon={Icon}
                    className={`h-3.5 w-3.5 flex-shrink-0 ${danger ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}
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
};

// ─── Date Range Picker ───────────────────────────────────────────────────────
interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
}

export const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
}: DateRangePickerProps) => {
  const [startDateObj, setStartDateObj] = useState<Date | undefined>(
    startDate ? new Date(startDate) : undefined
  );
  const [endDateObj, setEndDateObj] = useState<Date | undefined>(
    endDate ? new Date(endDate) : undefined
  );
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDateObj(date);
    onStartDateChange(date ? format(date, 'yyyy-MM-dd') : "");
    setIsStartOpen(false);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDateObj(date);
    onEndDateChange(date ? format(date, 'yyyy-MM-dd') : "");
    setIsEndOpen(false);
  };

  const handleClear = () => {
    setStartDateObj(undefined);
    setEndDateObj(undefined);
    onClear();
  };

  const hasDates = startDate || endDate;

  const triggerClass = cn(
    "flex h-10 lg:h-11 w-[160px] items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm font-normal shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none cursor-pointer",
    "dark:border-gray-800 dark:bg-gray-900 dark:text-white"
  );

  return (
    <div className="flex items-center gap-2">
      <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
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
            onSelect={handleStartDateSelect}
            className="dark:bg-gray-900"
            disabled={(date) => endDateObj ? date > endDateObj : false}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>

      <span className="text-gray-400 text-xs">to</span>

      <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
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
            onSelect={handleEndDateSelect}
            className="dark:bg-gray-900"
            disabled={(date) => startDateObj ? date < startDateObj : false}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>

      {hasDates && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-8 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          <HugeiconsIcon icon={XCircleIcon} className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};