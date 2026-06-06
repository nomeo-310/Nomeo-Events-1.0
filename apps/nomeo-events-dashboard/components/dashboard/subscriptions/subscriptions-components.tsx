// subscriptions-components.tsx
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

import { type DropdownItem } from './subscriptions-types';

// ─── Tab Button ──────────────────────────────────────────────────────────────
export const TabButton = ({ label, count, isActive, onClick }: { label: string; count: number; isActive: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2 lg:py-3 text-sm font-medium rounded-md transition-all",
      isActive ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
    )}
  >
    {label}
    {count > 0 && (
      <span className={cn("ml-2 px-2 py-0.5 text-xs rounded-full", isActive ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400")}>
        {count}
      </span>
    )}
  </button>
);

// ─── Stats Tab Button ────────────────────────────────────────────────────────
export const StatsTabButton = ({ label, icon, isActive, onClick }: { label: string; icon?: any; isActive: boolean; onClick: () => void }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 lg:py-3 text-sm font-medium rounded-md transition-all inline-flex items-center gap-2",
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      )}
    >
      {icon && <HugeiconsIcon icon={icon} className="h-4 w-4" />}
      {label}
    </button>
  );
};

// ─── Action Dropdown ─────────────────────────────────────────────────────────
export const ActionDropdown = ({ items, trigger }: { items: (DropdownItem | { divider: true; section?: string })[]; trigger: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const W = 224;
  
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!triggerRef.current?.contains(e.target as Node) && !menuRef.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  
  const update = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    let l = r.right - W; if (l < 8) l = 8; if (l + W > window.innerWidth - 8) l = window.innerWidth - W - 8;
    const t = window.innerHeight - r.bottom >= 320 || window.innerHeight - r.bottom >= r.top ? r.bottom + 6 : r.top - 320 - 6;
    setCoords({ top: t, left: l });
  };
  
  return (
    <>
      <div ref={triggerRef} onClick={(e) => { e.stopPropagation(); if (!open) update(); setOpen(p => !p); }}>{trigger}</div>
      {open && typeof window !== 'undefined' && createPortal(
        <div ref={menuRef} className="fixed bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden z-[9999] p-1" style={{ top: coords.top, left: coords.left, width: W, boxShadow: '0 4px 24px -4px rgba(0,0,0,0.12)' }} onClick={(e) => { e.stopPropagation(); setOpen(false); }}>
          {items.map((item, i) => {
            if ('divider' in item && item.divider) return item.section ? <p key={i} className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{item.section}</p> : <div key={i} className="my-1 border-t border-gray-100 dark:border-gray-800" />;
            const { label, icon: Icon, onClick, danger, disabled } = item as DropdownItem;
            return (
              <button 
                key={i} 
                type="button" 
                onClick={onClick} 
                disabled={disabled}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors rounded-lg ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  danger ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <HugeiconsIcon icon={Icon} className={`h-3.5 w-3.5 flex-shrink-0 ${danger ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`} />
                {label}
              </button>
            );
          })}
        </div>, document.body
      )}
    </>
  );
};

// ─── Date Range Picker ───────────────────────────────────────────────────────
export const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange, onClear }: {
  startDate: string; endDate: string;
  onStartDateChange: (d: string) => void; onEndDateChange: (d: string) => void; onClear: () => void;
}) => {
  const [startObj, setStartObj] = useState<Date | undefined>(startDate ? new Date(startDate) : undefined);
  const [endObj, setEndObj] = useState<Date | undefined>(endDate ? new Date(endDate) : undefined);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const btn = "flex h-10 lg:h-11 w-[160px] items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm font-normal shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none cursor-pointer dark:border-gray-800 dark:bg-gray-900 dark:text-white";
  return (
    <div className="flex items-center gap-2">
      <Popover open={startOpen} onOpenChange={setStartOpen}>
        <PopoverTrigger><div className={cn(btn, !startObj && "text-muted-foreground")}><HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5 shrink-0" />{startObj ? format(startObj, "dd MMM yyyy") : "Start date"}</div></PopoverTrigger>
        <PopoverContent className="w-auto p-0 dark:bg-gray-900 dark:border-gray-800" align="start">
          <Calendar mode="single" selected={startObj} onSelect={(d) => { setStartObj(d); onStartDateChange(d ? format(d, 'yyyy-MM-dd') : ""); setStartOpen(false); }} className="dark:bg-gray-900" disabled={(d) => endObj ? d > endObj : false} captionLayout="dropdown" />
        </PopoverContent>
      </Popover>
      <span className="text-gray-400 text-xs">to</span>
      <Popover open={endOpen} onOpenChange={setEndOpen}>
        <PopoverTrigger><div className={cn(btn, !endObj && "text-muted-foreground")}><HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5 shrink-0" />{endObj ? format(endObj, "dd MMM yyyy") : "End date"}</div></PopoverTrigger>
        <PopoverContent className="w-auto p-0 dark:bg-gray-900 dark:border-gray-800" align="start">
          <Calendar mode="single" selected={endObj} onSelect={(d) => { setEndObj(d); onEndDateChange(d ? format(d, 'yyyy-MM-dd') : ""); setEndOpen(false); }} className="dark:bg-gray-900" disabled={(d) => startObj ? d < startObj : false} captionLayout="dropdown" />
        </PopoverContent>
      </Popover>
      {(startDate || endDate) && <Button type="button" variant="ghost" size="sm" onClick={onClear} className="h-8 px-2 text-gray-500"><HugeiconsIcon icon={XCircleIcon} className="h-3.5 w-3.5" /></Button>}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard = ({ title, value, subtitle, icon, valueColor = 'gray' }: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon?: any;
  valueColor?: 'gray' | 'green' | 'red' | 'blue' | 'purple' | 'orange';
}) => {
  const colorClasses = {
    gray: 'text-gray-900 dark:text-white',
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    orange: 'text-orange-600 dark:text-orange-400',
  };
  
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
          <p className={`text-2xl font-bold ${colorClasses[valueColor]}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
            <HugeiconsIcon icon={icon} className={`h-4 w-4 ${colorClasses[valueColor]}`} />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Custom Progress Bar ─────────────────────────────────────────────────────
export const CustomProgress = ({ value, className }: { value: number; className?: string }) => {
  return (
    <div className={cn("h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden", className)}>
      <div 
        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
};