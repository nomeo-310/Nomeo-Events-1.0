// verifications-components.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CalendarIcon,
  ViewIcon,
  CancelCircleIcon as XCircleIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { getInitials, hasValidValue, DOCUMENT_LABELS, DOCUMENT_COLORS, type DropdownItem } from './verifications-types';

// ─── Date Range Picker ───────────────────────────────────────────────────────
export const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange, onClear }: { 
  startDate: string; endDate: string; 
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void; 
  onClear: () => void 
}) => {
  const [startObj, setStartObj] = useState<Date | undefined>(
    startDate ? new Date(startDate) : undefined
  );
  const [endObj, setEndObj] = useState<Date | undefined>(
    endDate ? new Date(endDate) : undefined
  );
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const triggerCls = cn(
    "flex h-10 w-[150px] items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm font-normal shadow-xs transition-colors hover:bg-accent cursor-pointer",
    "dark:border-gray-800 dark:bg-gray-900 dark:text-white"
  );

  return (
    <div className="flex items-center gap-2">
      <Popover open={startOpen} onOpenChange={setStartOpen}>
        <PopoverTrigger>
          <div className={cn(triggerCls, !startObj && "text-muted-foreground h-10 lg:h-11")}>
            <HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5 shrink-0" />
            {startObj ? format(startObj, "dd MMM yyyy") : "Start date"}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 dark:bg-gray-900 dark:border-gray-800" align="start">
          <Calendar
            mode="single"
            selected={startObj}
            onSelect={(d) => {
              setStartObj(d);
              onStartDateChange(d ? format(d, "yyyy-MM-dd") : "");
              setStartOpen(false);
            }}
            disabled={(d) => (endObj ? d > endObj : false)}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>

      <span className="text-gray-400 text-xs">to</span>

      <Popover open={endOpen} onOpenChange={setEndOpen}>
        <PopoverTrigger>
          <div className={cn(triggerCls, !endObj && "text-muted-foreground h-10 lg:h-11")}>
            <HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5 shrink-0" />
            {endObj ? format(endObj, "dd MMM yyyy") : "End date"}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 dark:bg-gray-900 dark:border-gray-800" align="start">
          <Calendar
            mode="single"
            selected={endObj}
            onSelect={(d) => {
              setEndObj(d);
              onEndDateChange(d ? format(d, "yyyy-MM-dd") : "");
              setEndOpen(false);
            }}
            disabled={(d) => (startObj ? d < startObj : false)}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>

      {(startDate || endDate) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setStartObj(undefined);
            setEndObj(undefined);
            onClear();
          }}
          className="h-8 px-2 text-gray-500"
        >
          <HugeiconsIcon icon={XCircleIcon} className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};

// ─── Action Dropdown ─────────────────────────────────────────────────────────
export const ActionDropdown = ({
  items,
  trigger,
}: {
  items: (DropdownItem | { divider: true; section?: string })[];
  trigger: React.ReactNode;
}) => {
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

// ─── Stat Card ───────────────────────────────────────────────────────────────
export const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => {
  if (!hasValidValue(value)) return null;
  
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 flex items-center gap-3">
      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", color)} />
      <div>
        <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{value}</p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
};

// ─── Mobile Verification Card ────────────────────────────────────────────────
export const MobileVerificationCard = ({
  profile,
  isSelected,
  onToggleSelect,
  isExpanded,
  onToggleExpand,
  onView,
}: {
  profile: any;
  isSelected: boolean;
  onToggleSelect: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onView: () => void;
}) => (
  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
    <div className="flex items-center gap-3 p-4">
      <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
      <Avatar className="h-10 w-10 rounded-full flex-shrink-0">
        {profile.avatar && <AvatarImage src={profile.avatar} alt={profile.fullName} />}
        <AvatarFallback className="bg-indigo-500 text-white text-xs font-bold">
          {getInitials(profile.fullName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {profile.fullName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile.email}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={cn(
            "px-2 py-0.5 text-[10px] font-medium rounded-full capitalize",
            profile.accountType === "organization"
              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
          )}
        >
          {profile.accountType}
        </span>
        <button
          onClick={onToggleExpand}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <HugeiconsIcon
            icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
            className="h-4 w-4"
          />
        </button>
      </div>
    </div>

    {isExpanded && (
      <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {hasValidValue(profile.organizationName) && (
            <div className="col-span-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Organization</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {profile.organizationName}
              </p>
            </div>
          )}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Location</p>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {profile.city || "—"}, {profile.state || "—"}
            </p>
          </div>
          {hasValidValue(profile.daysPending) && profile.daysPending > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Days Pending</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {profile.daysPending}d
              </p>
            </div>
          )}
          {hasValidValue(profile.documentTypes) && (
            <div className="col-span-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Documents</p>
              <div className="flex flex-wrap gap-1">
                {profile.documentTypes?.map((dt: string) => (
                  <span
                    key={dt}
                    className={cn("px-2 py-0.5 text-[10px] rounded-full font-medium", DOCUMENT_COLORS[dt])}
                  >
                    {DOCUMENT_LABELS[dt] || dt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs dark:border-gray-700"
          onClick={onView}
        >
          <HugeiconsIcon icon={ViewIcon} className="h-3 w-3 mr-1" />
          View & Review
        </Button>
      </div>
    )}
  </div>
);
