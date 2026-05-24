"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  RefreshIcon,
  FilterHorizontalIcon,
  UserIcon,
  Building02Icon,
  CalendarIcon,
  ViewIcon,
  IdIcon as IdCardIcon,
  CheckmarkBadge02Icon as BadgeCheckIcon,
  CancelCircleIcon as XCircleIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Tick02Icon,
  Cancel01Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  ClockIcon,
  File01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PaginationWithInfo } from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ReusableModal, ConfirmModal, ActionModal } from "@/components/ui/reusable-modal";
import {
  useGetPendingVerification,
  type GetPendingVerificationParams,
} from "@/hooks/use-pending-verification";
import {
  useVerifyProfiles,
  useRejectProfiles,
} from "@/hooks/use-verification-action";
import { useVerificationDetails } from "@/hooks/use-verification-details";
import { cn } from "@/lib/utils";
import { ImageViewerModal } from "./image-viewer-modal";

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const formatDate = (d: Date | string) =>
  d ? format(new Date(d), "dd MMM yyyy") : "N/A";

const formatDateTime = (d: Date | string) =>
  d ? format(new Date(d), "dd MMM yyyy, HH:mm") : "N/A";

const hasValidValue = (value: any): boolean => {
  // Check if value exists and is not null/undefined
  if (value === null || value === undefined) return false;
  // Handle number 0 - treat as invalid/not meaningful
  if (typeof value === 'number') return value !== 0;
  // Handle string numbers like "0"
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (!isNaN(num)) return num !== 0;
    return value.trim().length > 0;
  }
  // Handle arrays
  if (Array.isArray(value)) return value.length > 0;
  // For booleans or other types that are truthy
  return true;
};

const DOCUMENT_LABELS: Record<string, string> = {
  id_card: "National ID Card",
  passport: "International Passport",
  drivers_license: "Driver's License",
  cac_document: "CAC Document",
  proof_of_address: "Proof of Address",
};

const DOCUMENT_COLORS: Record<string, string> = {
  id_card: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  passport: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  drivers_license: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cac_document: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  proof_of_address: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
};

// ─────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] ${className ?? ""}`}
    />
  );
}

const TableSkeleton = () => (
  <div className="space-y-0">
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800"
        style={{ opacity: 1 - i * 0.1 }}
      >
        <SkeletonLine className="h-4 w-4 rounded" />
        <div className="flex items-center gap-3 flex-1">
          <SkeletonLine className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5">
            <SkeletonLine className="h-3 w-36" />
            <SkeletonLine className="h-2.5 w-24" />
          </div>
        </div>
        <SkeletonLine className="h-3 w-40" />
        <SkeletonLine className="h-6 w-24 rounded-full" />
        <SkeletonLine className="h-6 w-28 rounded-full" />
        <SkeletonLine className="h-3 w-24" />
        <SkeletonLine className="h-8 w-20 rounded-lg" />
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────────────────
// DATE RANGE PICKER
// ─────────────────────────────────────────────────────────

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange, onClear }: { startDate: string; endDate: string; onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void; onClear: () => void }) => {
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

// ─────────────────────────────────────────────────────────
// MOBILE CARD
// ─────────────────────────────────────────────────────────

const MobileVerificationCard = ({
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

// ─────────────────────────────────────────────────────────
// ACTION DROPDOWN COMPONENT
// ─────────────────────────────────────────────────────────

interface DropdownItem {
  label: string;
  icon: any;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
  section?: string;
}

const ActionDropdown = ({
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

// ─────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => {
  // Don't render if value is 0 or invalid
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

// ─────────────────────────────────────────────────────────
// DETAIL MODAL CONTENT (Enhanced with actual document images)
// ─────────────────────────────────────────────────────────

const VerificationDetailModal = ({
  profile,
  isOpen,
  onClose,
  onVerify,
  onReject,
  isVerifying,
  isRejecting,
}: {
  profile: any | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
  onReject: (reason: string) => void;
  isVerifying: boolean;
  isRejecting: boolean;
}) => {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"documents" | "profile">("documents");
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  const {
    data: detailsData,
    isLoading: isLoadingDetails,
    refetch: refetchDetails,
  } = useVerificationDetails(isOpen ? profile?._id : null);

  const details = detailsData?.data;

  useEffect(() => {
    if (!isOpen) {
      setRejectReason("");
      setShowRejectForm(false);
      setActiveTab("documents");
      setImageViewerOpen(false);
    } else if (profile?._id) {
      refetchDetails();
    }
  }, [isOpen, profile?._id, refetchDetails]);

  const documents = details?.profile?.verificationDocuments || [];
  const hasDocuments = documents.length > 0;

  if (!profile) return null;

  const displayProfile = details?.profile || profile;
  const displayContact = details?.contact;
  const displayLocation = details?.location;
  const displayUserAccount = details?.userAccount;
  const verificationRequest = details?.verificationRequest;

  const openImageViewer = (index: number) => {
    setImageViewerIndex(index);
    setImageViewerOpen(true);
  };

  return (
    <>
      <ReusableModal
        isOpen={isOpen}
        onClose={onClose}
        title="Verification Review"
        description={`Reviewing submission from ${displayProfile.fullName}`}
        size="xl"
        maxHeight="85vh"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={onClose} className="dark:border-gray-700">
              Close
            </Button>
            <div className="flex gap-2">
              {!showRejectForm ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(true)}
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                    disabled={isVerifying || isRejecting}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4 mr-1.5" />
                    Reject
                  </Button>
                  <Button
                    onClick={onVerify}
                    disabled={isVerifying || isRejecting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isVerifying ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                    ) : (
                      <HugeiconsIcon icon={Tick02Icon} className="h-4 w-4 mr-1.5" />
                    )}
                    Verify Account
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(false)}
                    className="dark:border-gray-700"
                  >
                    Back
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => onReject(rejectReason)}
                    disabled={!rejectReason.trim() || isRejecting}
                  >
                    {isRejecting ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                    ) : (
                      <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4 mr-1.5" />
                    )}
                    Confirm Rejection
                  </Button>
                </>
              )}
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {isLoadingDetails && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading verification details...</p>
              </div>
            </div>
          )}

          {!isLoadingDetails && (
            <>
              <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setActiveTab("documents")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-all relative",
                    activeTab === "documents"
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  )}
                >
                  Documents ({documents.length})
                  {activeTab === "documents" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-all relative",
                    activeTab === "profile"
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  )}
                >
                  Profile Details
                  {activeTab === "profile" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </button>
              </div>

              {activeTab === "documents" && (
                <div>
                  {hasDocuments ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {documents.map((doc: any, idx: number) => (
                        <div
                          key={idx}
                          className="group relative border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
                          onClick={() => openImageViewer(idx)}
                        >
                          <div className="relative bg-gray-100 dark:bg-gray-800 aspect-[4/3] overflow-hidden">
                            {doc.thumbnail_url || doc.secure_url ? (
                              <>
                                <img
                                  src={doc.thumbnail_url || doc.secure_url}
                                  alt={doc.documentTypeLabel}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                
                                <div className="absolute top-2 right-2">
                                  <span className={cn(
                                    "px-2 py-1 text-[10px] rounded-full font-medium shadow-md",
                                    DOCUMENT_COLORS[doc.documentType]
                                  )}>
                                    {doc.documentTypeLabel}
                                  </span>
                                </div>
                                
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="bg-black/70 backdrop-blur-sm rounded-full p-2">
                                    <HugeiconsIcon icon={ViewIcon} className="h-5 w-5 text-white" />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-gray-400">No preview available</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="p-3 bg-white dark:bg-gray-900">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                              {doc.documentTypeLabel}
                            </p>
                            {doc.verified && (
                              <Badge variant="outline" className="mt-1 text-[10px] bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200">
                                <HugeiconsIcon icon={CheckCircleIcon} className="h-3 w-3 mr-0.5" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/30 rounded-lg">
                      <HugeiconsIcon icon={File01Icon} className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No documents found for this verification request</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4 pb-5 border-b border-gray-100 dark:border-gray-800">
                    <Avatar className="h-16 w-16 rounded-xl flex-shrink-0 ring-2 ring-white dark:ring-gray-900 shadow-md">
                      {displayProfile.profilePicture?.secure_url && (
                        <AvatarImage src={displayProfile.profilePicture.secure_url} alt={displayProfile.fullName} />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-lg font-bold rounded-xl">
                        {getInitials(displayProfile.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {displayProfile.fullName}
                        </h3>
                        <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium capitalize", 
                          displayProfile.accountType === "organization"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        )}>
                          {displayProfile.accountType}
                        </span>
                      </div>
                      {displayUserAccount?.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{displayUserAccount.email}</p>
                      )}
                      {hasValidValue(displayProfile.organizationName) && (
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                          {displayProfile.organizationName}
                        </p>
                      )}
                      {verificationRequest && verificationRequest.daysPending && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                          <HugeiconsIcon icon={ClockIcon} className="h-3.5 w-3.5" />
                          <span>Pending for {verificationRequest.daysPending} days</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {showRejectForm && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <p className="text-sm font-semibold text-red-800 dark:text-red-300">Provide a rejection reason</p>
                      </div>
                      <Textarea
                        placeholder="Explain why this verification is being rejected (required)..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                      <p className="text-xs text-red-500 dark:text-red-400">
                        This reason will be sent to the user via email and notification.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h4>
                      <div className="space-y-2">
                        <div>
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide">Email</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {displayContact?.email || displayUserAccount?.email || profile.email}
                          </p>
                        </div>
                        {displayContact && hasValidValue(displayContact.phoneNumber) && (
                          <div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Phone Number</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{displayContact.phoneNumber}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide">Role</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {displayUserAccount?.role || profile.role || "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Location</h4>
                      <div className="space-y-2">
                        {displayLocation && hasValidValue(displayLocation.fullAddress) && (
                          <div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Full Address</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{displayLocation.fullAddress}</p>
                          </div>
                        )}
                        {(displayLocation && hasValidValue(displayLocation.city)) || hasValidValue(profile.city) ? (
                          <div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-wide">City</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {displayLocation?.city || profile.city || "—"}
                            </p>
                          </div>
                        ) : null}
                        {(displayLocation && hasValidValue(displayLocation.state)) || hasValidValue(profile.state) ? (
                          <div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-wide">State</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {displayLocation?.state || profile.state || "—"}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {hasValidValue(displayProfile.specialties) && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Specialties</h4>
                      <div className="flex flex-wrap gap-2">
                        {displayProfile.specialties.map((specialty: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasValidValue(displayProfile.bio) && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Bio</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{displayProfile.bio}</p>
                    </div>
                  )}

                  {verificationRequest && hasValidValue(verificationRequest.submittedAt) && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        Submission Timeline
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[11px] text-gray-400 uppercase tracking-wide">Submitted</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDateTime(verificationRequest.submittedAt)}
                          </p>
                        </div>
                        {hasValidValue(verificationRequest.daysPending) && verificationRequest.daysPending > 0 && (
                          <div>
                            <p className="text-[11px] text-gray-400 uppercase tracking-wide">Days Pending</p>
                            <p className={cn("text-sm font-bold",
                              verificationRequest.daysPending > 7
                                ? "text-red-600 dark:text-red-400"
                                : verificationRequest.daysPending > 3
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-emerald-600 dark:text-emerald-400"
                            )}>
                              {verificationRequest.daysPending} days
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </ReusableModal>

      {/* Image Viewer Modal - Outside ReusableModal to avoid z-index issues */}
      <ImageViewerModal
        images={documents.map((doc: any, idx: number) => ({
          url: doc.secure_url,
          alt: doc.documentTypeLabel,
          label: `${doc.documentTypeLabel} (${idx + 1}/${documents.length})`,
        }))}
        currentIndex={imageViewerIndex}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        onNavigate={(newIndex) => setImageViewerIndex(newIndex)}
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────

export default function VerificationsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [documentType, setDocumentType] = useState("all");
  const [accountType, setAccountType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Bulk selection state
  const [selectedVerifications, setSelectedVerifications] = useState<Set<string>>(new Set());
  
  // Bulk action modals
  const [isBulkVerifyModalOpen, setIsBulkVerifyModalOpen] = useState(false);
  const [isBulkRejectModalOpen, setIsBulkRejectModalOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
      setSelectedVerifications(new Set());
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedVerifications(new Set());
  }, [accountType, documentType, startDate, endDate, debouncedSearch]);

  const queryParams: GetPendingVerificationParams = {
    page: currentPage,
    limit: 20,
    sortBy: "updatedAt",
    sortOrder: "desc",
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(documentType !== "all" && { documentType }),
    ...(accountType !== "all" && { accountType }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  };

  const { data, isLoading, isFetching, refetch } = useGetPendingVerification(queryParams);
  const verifyMutation = useVerifyProfiles();
  const rejectMutation = useRejectProfiles();

  const profiles = data?.data || [];
  const pagination = data?.pagination;
  const stats = data?.stats;
  const showSkeleton = isLoading || (isFetching && profiles.length === 0);
  const hasFilters = debouncedSearch || documentType !== "all" || accountType !== "all" || startDate || endDate;

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedVerifications.size === profiles.length && profiles.length > 0) {
      setSelectedVerifications(new Set());
    } else {
      setSelectedVerifications(new Set(profiles.map((p: any) => p._id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedVerifications);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedVerifications(next);
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setDocumentType("all");
    setAccountType("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    setSelectedVerifications(new Set());
  };

  const openDetail = (profile: any) => {
    setSelectedProfile(profile);
    setIsDetailOpen(true);
  };

  // Bulk actions
  const handleBulkVerify = async () => {
    const profileIds = Array.from(selectedVerifications);
    try {
      await verifyMutation.mutateAsync({
        profileIds,
        sendEmail: true,
        sendNotification: true,
      });
      setIsBulkVerifyModalOpen(false);
      setSelectedVerifications(new Set());
      toast.success(`Successfully verified ${profileIds.length} profile${profileIds.length !== 1 ? 's' : ''}`);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleBulkReject = async () => {
    const profileIds = Array.from(selectedVerifications);
    try {
      await rejectMutation.mutateAsync({
        profileIds,
        reason: bulkRejectReason,
      });
      setIsBulkRejectModalOpen(false);
      setBulkRejectReason("");
      setSelectedVerifications(new Set());
      toast.success(`Successfully rejected ${profileIds.length} profile${profileIds.length !== 1 ? 's' : ''}`);
    } catch (error) {
      // Error handled in hook
    }
  };

  const clearSelection = () => setSelectedVerifications(new Set());

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      <div className="px-4 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Pending Verifications
              </h1>
              {stats && hasValidValue(stats.totalPending) && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
                  {stats.totalPending} pending
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Review and action identity verification requests submitted by users.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => { refetch(); toast.success("Refreshed"); }}
            variant="outline"
            className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 flex-shrink-0 px-4 h-10"
            disabled={isFetching}
          >
            <HugeiconsIcon icon={RefreshIcon} className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Pending" value={stats.totalPending} color="bg-amber-400" />
            <StatCard label="Individual" value={stats.individualAccounts} color="bg-green-400" />
            <StatCard label="Organization" value={stats.organizationAccounts} color="bg-purple-400" />
            <StatCard
              label="ID / Passport / License"
              value={stats.withIdCard + stats.withPassport + stats.withDriversLicense}
              color="bg-blue-400"
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 items-center">
          <div className="relative flex-1 min-w-[200px] h-10">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          <Select value={accountType} onValueChange={(v) => setAccountType(v ?? "all")}>
            <SelectTrigger className="w-36 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10 lg:h-11 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={Building02Icon} className="h-4 w-4" />
                <SelectValue placeholder="Account type" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="organization">Organization</SelectItem>
            </SelectContent>
          </Select>

          <Select value={documentType} onValueChange={(v) => setDocumentType(v ?? "all")}>
            <SelectTrigger className="w-40 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10 lg:h-11 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={IdCardIcon} className="h-4 w-4" />
                <SelectValue placeholder="Document type" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="id_card">National ID Card</SelectItem>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="drivers_license">Driver's License</SelectItem>
              <SelectItem value="cac_document">CAC Document</SelectItem>
              <SelectItem value="proof_of_address">Proof of Address</SelectItem>
            </SelectContent>
          </Select>

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={() => { setStartDate(""); setEndDate(""); }}
          />
        </div>

        {/* Bulk Actions Bar */}
        {selectedVerifications.size > 0 && !showSkeleton && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center">
                {selectedVerifications.size}
              </span>
              <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
                verification request{selectedVerifications.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
              >
                Clear Selection
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setIsBulkVerifyModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <HugeiconsIcon icon={Tick02Icon} className="h-3.5 w-3.5 mr-1.5" />
                Bulk Verify ({selectedVerifications.size})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsBulkRejectModalOpen(true)}
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5 mr-1.5" />
                Bulk Reject ({selectedVerifications.size})
              </Button>
            </div>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden md:block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {showSkeleton ? (
            <TableSkeleton />
          ) : profiles.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <HugeiconsIcon icon={BadgeCheckIcon} className="h-6 w-6 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                No pending verifications
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {hasFilters ? "No submissions match your filters" : "All verification requests have been processed"}
              </p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <HugeiconsIcon icon={FilterHorizontalIcon} className="h-4 w-4 mr-2" />
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="flex items-center px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <div className="w-12">
                  <Checkbox
                    checked={selectedVerifications.size === profiles.length && profiles.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </div>
                <div className="flex-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">User</div>
                <div className="w-52 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Location</div>
                <div className="w-40 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Account</div>
                <div className="w-56 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Documents</div>
                <div className="w-28 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Submitted</div>
                <div className="w-24 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pending</div>
                <div className="w-24 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Action</div>
              </div>

              {/* Table body */}
              <div className="divide-y divide-gray-100 dark:divide-gray-800 relative">
                {isFetching && !isLoading && profiles.length > 0 && (
                  <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 z-10 flex items-start justify-center pt-16">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                      <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4 animate-spin text-indigo-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">Refreshing…</span>
                    </div>
                  </div>
                )}

                {profiles.map((profile: any) => (
                  <div
                    key={profile._id}
                    className="flex items-center px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <div className="w-12">
                      <Checkbox
                        checked={selectedVerifications.has(profile._id)}
                        onCheckedChange={() => toggleSelect(profile._id)}
                      />
                    </div>
                    
                    {/* User */}
                    <div className="flex-1 flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-full flex-shrink-0">
                        {profile.avatar && <AvatarImage src={profile.avatar} alt={profile.fullName} />}
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-xs font-bold">
                          {getInitials(profile.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {profile.fullName}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{profile.email}</p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="w-52">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {profile.city || "—"}
                      </p>
                      <p className="text-[11px] text-gray-400">{profile.state || "—"}</p>
                    </div>

                    {/* Account type */}
                    <div className="w-40">
                      <div className="flex items-center gap-1.5">
                        <HugeiconsIcon
                          icon={profile.accountType === "organization" ? Building02Icon : UserIcon}
                          className={cn("h-3.5 w-3.5",
                            profile.accountType === "organization" ? "text-purple-500" : "text-green-500"
                          )}
                        />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                          {profile.accountType}
                        </span>
                      </div>
                      {hasValidValue(profile.organizationName) && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[130px]">
                          {profile.organizationName}
                        </p>
                      )}
                    </div>

                    {/* Documents */}
                    <div className="w-56 flex flex-wrap gap-1">
                      {hasValidValue(profile.documentTypes) && profile.documentTypes?.map((dt: string) => (
                        <span key={dt} className={cn("px-2 py-0.5 text-[10px] rounded-full font-medium", DOCUMENT_COLORS[dt])}>
                          {DOCUMENT_LABELS[dt] || dt}
                        </span>
                      ))}
                    </div>

                    {/* Submitted */}
                    <div className="w-28">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(profile.submittedAt)}</p>
                    </div>

                    {/* Days pending */}
                    <div className="w-24">
                      {hasValidValue(profile.daysPending) && profile.daysPending > 0 && (
                        <span className={cn("text-xs font-semibold",
                          profile.daysPending > 7
                            ? "text-red-600 dark:text-red-400"
                            : profile.daysPending > 3
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        )}>
                          {profile.daysPending}d
                        </span>
                      )}
                    </div>

                    {/* Action */}
                    <div className="w-24 flex justify-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetail(profile)}
                        className="h-8 text-xs dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        <HugeiconsIcon icon={ViewIcon} className="h-3.5 w-3.5 mr-1.5" />
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="border-t border-gray-200 dark:border-gray-800 px-5 py-4">
                  <PaginationWithInfo
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={setCurrentPage}
                    showInfo
                    showPageNumbers
                    maxVisiblePages={5}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {showSkeleton ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-center gap-3">
                    <SkeletonLine className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <SkeletonLine className="h-3 w-32" />
                      <SkeletonLine className="h-2.5 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-10 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No pending verifications</p>
            </div>
          ) : (
            <>
              {profiles.map((profile: any) => (
                <MobileVerificationCard
                  key={profile._id}
                  profile={profile}
                  isSelected={selectedVerifications.has(profile._id)}
                  onToggleSelect={() => toggleSelect(profile._id)}
                  isExpanded={expandedCardId === profile._id}
                  onToggleExpand={() => setExpandedCardId((prev) => (prev === profile._id ? null : profile._id))}
                  onView={() => openDetail(profile)}
                />
              ))}
              {pagination && pagination.totalPages > 1 && (
                <PaginationWithInfo
                  currentPage={currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={setCurrentPage}
                  showInfo
                  showPageNumbers={false}
                  maxVisiblePages={3}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail / Review modal */}
      <VerificationDetailModal
        profile={selectedProfile}
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedProfile(null); }}
        onVerify={async () => {
          if (!selectedProfile) return;
          await verifyMutation.mutateAsync({
            profileIds: [selectedProfile._id],
            sendEmail: true,
            sendNotification: true,
          });
          setIsDetailOpen(false);
          setSelectedProfile(null);
        }}
        onReject={async (reason) => {
          if (!selectedProfile) return;
          await rejectMutation.mutateAsync({
            profileIds: [selectedProfile._id],
            reason,
          });
          setIsDetailOpen(false);
          setSelectedProfile(null);
        }}
        isVerifying={verifyMutation.isPending}
        isRejecting={rejectMutation.isPending}
      />

      {/* Bulk Verify Confirmation Modal */}
      <ConfirmModal
        isOpen={isBulkVerifyModalOpen}
        onClose={() => setIsBulkVerifyModalOpen(false)}
        onConfirm={handleBulkVerify}
        title="Bulk Verification"
        description={`You are about to verify ${selectedVerifications.size} pending verification request${selectedVerifications.size !== 1 ? 's' : ''}.`}
        confirmLabel={`Verify ${selectedVerifications.size} Account${selectedVerifications.size !== 1 ? 's' : ''}`}
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={verifyMutation.isPending}
        size="md"
      >
        <div className="flex gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-lg mt-4">
          <HugeiconsIcon icon={CheckCircleIcon} className="h-4 w-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-1.5">Verifying these accounts will:</p>
            <ul className="space-y-1 text-xs text-emerald-700 dark:text-emerald-400">
              <li>• Mark their verification status as "verified"</li>
              <li>• Send email notifications to all verified users</li>
              <li>• Allow them to create and publish events</li>
              <li>• Update their document verification status</li>
            </ul>
          </div>
        </div>
      </ConfirmModal>

      {/* Bulk Reject Confirmation Modal */}
      <ActionModal
        isOpen={isBulkRejectModalOpen}
        onClose={() => {
          setIsBulkRejectModalOpen(false);
          setBulkRejectReason("");
        }}
        onAction={handleBulkReject}
        title="Bulk Rejection"
        description={`You are about to reject ${selectedVerifications.size} pending verification request${selectedVerifications.size !== 1 ? 's' : ''}.`}
        actionLabel={`Reject ${selectedVerifications.size} Account${selectedVerifications.size !== 1 ? 's' : ''}`}
        cancelLabel="Cancel"
        actionVariant="danger"
        isLoading={rejectMutation.isPending}
        disabled={!bulkRejectReason.trim()}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-lg">
            <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1.5">Rejecting these accounts will:</p>
              <ul className="space-y-1 text-xs text-red-700 dark:text-red-400">
                <li>• Mark their verification status as "rejected"</li>
                <li>• Send rejection emails with the provided reason</li>
                <li>• Require users to resubmit verification documents</li>
              </ul>
            </div>
          </div>
          
          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Reason for Rejection (will be sent to all selected users)
            </Label>
            <Textarea
              placeholder="Enter the reason why these verification requests are being rejected..."
              value={bulkRejectReason}
              onChange={(e) => setBulkRejectReason(e.target.value)}
              className="mt-1.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              rows={4}
            />
            <p className="text-xs text-red-500 dark:text-red-400 mt-2">
              This reason will be sent to all {selectedVerifications.size} user{selectedVerifications.size !== 1 ? 's' : ''} via email and notification.
            </p>
          </div>
        </div>
      </ActionModal>
    </div>
  );
}