// newsletter-components.tsx
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionModal } from "@/components/ui/reusable-modal";
import { DropdownItem, BulkEmailRecipient } from "./newsletter-types";

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

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className={cn("mt-1 text-xl font-bold", accent ?? "text-gray-900 dark:text-white")}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── Add Recipient Modal ──────────────────────────────────────────────────────
interface AddRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (recipient: BulkEmailRecipient) => void;
  currentCount: number;
}

export function AddRecipientModal({ isOpen, onClose, onAdd, currentCount }: AddRecipientModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Please enter a valid email address");
      return;
    }
    onAdd({ email, name: name || undefined });
    setEmail("");
    setName("");
    onClose();
  };

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={() => {
        setEmail("");
        setName("");
        onClose();
      }}
      onAction={handleSubmit}
      title="Add Recipient"
      description={`Add a single recipient (${currentCount}/5 max before using CSV)`}
      actionLabel="Add Recipient"
      cancelLabel="Cancel"
      actionVariant="primary"
      size="md"
    >
      <div className="space-y-4">
        {currentCount >= 5 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              You've reached the maximum of 5 manual entries. Please use CSV upload for more recipients.
            </p>
          </div>
        )}
        <div>
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address *</Label>
          <Input
            type="email"
            placeholder="recipient@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            disabled={currentCount >= 5}
          />
        </div>
        <div>
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Name (Optional)</Label>
          <Input
            placeholder="Recipient Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            disabled={currentCount >= 5}
          />
        </div>
      </div>
    </ActionModal>
  );
}

import { toast } from "sonner";