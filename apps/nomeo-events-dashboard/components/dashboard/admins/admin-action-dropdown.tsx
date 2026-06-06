// admin-action-dropdown.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from "@hugeicons/react";

export interface DropdownItem {
  label: string;
  icon: any;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export const ActionDropdown = ({
  items,
  trigger,
}: {
  items: DropdownItem[];
  trigger: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const MENU_WIDTH = 200;

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const MENU_HEIGHT = Math.min(items.length * 40 + 16, 400);
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
            className="fixed bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden z-[9999] p-1"
            style={{
              top: coords.top,
              left: coords.left,
              width: MENU_WIDTH,
              boxShadow: '0 4px 24px -4px rgba(0,0,0,0.12), 0 1px 4px -1px rgba(0,0,0,0.08)',
            }}
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          >
            {items.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={item.onClick}
                disabled={item.disabled}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                  item.disabled ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  item.danger
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  className={`h-3.5 w-3.5 flex-shrink-0 ${item.danger ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}
                />
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};

export const SkeletonLine = ({ className }: { className?: string }) => {
  return (
    <div className={`rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] ${className ?? ''}`} />
  );
};

export const AdminsSkeleton = () => (
  <div className="space-y-3">
    <div className="flex gap-3 mb-6">
      <SkeletonLine className="h-10 flex-1" />
      <SkeletonLine className="h-10 w-36" />
      <SkeletonLine className="h-10 w-36" />
    </div>
    <div className="flex gap-4 px-4 pb-3 border-b border-gray-100 dark:border-gray-800">
      <SkeletonLine className="h-3 w-3" />
      <SkeletonLine className="h-3 w-32" />
      <SkeletonLine className="h-3 w-28" />
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="h-3 w-20" />
      <SkeletonLine className="h-3 w-24 ml-auto" />
    </div>
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800" style={{ opacity: 1 - i * 0.1 }}>
        <SkeletonLine className="h-4 w-4 rounded" />
        <div className="flex items-center gap-3 flex-1">
          <SkeletonLine className="h-9 w-9 rounded-full" />
          <div className="space-y-1 flex-1">
            <SkeletonLine className="h-3 w-32" />
            <SkeletonLine className="h-2 w-24" />
          </div>
        </div>
        <SkeletonLine className="h-3 w-28" />
        <SkeletonLine className="h-5 w-20 rounded-full" />
        <SkeletonLine className="h-7 w-7 rounded-lg" />
      </div>
    ))}
  </div>
);