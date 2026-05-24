'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  UserIcon, 
  Building02Icon, 
  Mail01Icon, 
  SmartPhone02Icon as Phone01Icon, 
  Search01Icon, 
  FilterHorizontalIcon, 
  RefreshIcon, 
  File01Icon, 
  FileSpreadsheetIcon,
  MoreHorizontalCircle01Icon,
  Delete03Icon,
  ViewIcon,
  UnavailableIcon as BanIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  UserCheck01Icon,
  UserRemove01Icon,
  IdIcon as IdCardIcon,
  CheckmarkBadge02Icon as BadgeCheckIcon,
  CalendarIcon,
  CancelCircleIcon as XCircleIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  CircleUnlock02Icon as UnlockIcon,
  SecurityCheckIcon as ShieldCheckIcon
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationWithInfo } from "@/components/ui/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReusableModal, ConfirmModal, ActionModal } from '@/components/ui/reusable-modal';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { 
  useGetProfiles, 
  useDeactivateAccount, 
  useReactivateAccount,
  useSuspendAccount,
  useLiftSuspension,
  useDeleteAccount,
  type Profile,
  type GetProfilesParams
} from '@/hooks/use-profiles';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// ============================================
// HELPER FUNCTIONS
// ============================================

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    deactivated: "secondary",
    suspended: "destructive",
    pending: "outline",
  };
  return variants[status] || "secondary";
};

const getVerificationBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    verified: "default",
    pending: "secondary",
    rejected: "destructive",
    unverified: "outline",
    suspended: "destructive",
  };
  return variants[status] || "secondary";
};

const getStatusIcon = (status: string) => {
  const icons: Record<string, any> = {
    active: CheckCircleIcon,
    deactivated: UserRemove01Icon,
    suspended: BanIcon,
    pending: ClockIcon,
  };
  return icons[status] || AlertCircleIcon;
};

const formatDate = (date: Date | string) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy');
};

const formatDateTime = (date: Date | string) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy, HH:mm');
};

// ============================================
// TAB BUTTON COMPONENT
// ============================================

const TabButton = ({ 
  label, 
  count, 
  isActive, 
  onClick 
}: { 
  label: string; 
  count: number; 
  isActive: boolean; 
  onClick: () => void;
}) => (
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

// ============================================
// ACTION DROPDOWN COMPONENT
// ============================================

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

// ============================================
// SKELETON COMPONENT
// ============================================

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={`rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] ${className ?? ''}`} />
  );
}

const UsersSkeleton = () => (
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

// ============================================
// DATE RANGE PICKER COMPONENT (Shadcn UI Calendar)
// ============================================

const DateRangePicker = ({
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
}) => {
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

// ============================================
// MOBILE USER CARD COMPONENT 
// ============================================

const MobileUserCard = ({
  profile,
  isSelected,
  onToggleSelect,
  onView,
  onSuspend,
  onLiftSuspension,
  isExpanded,
  onToggleExpand,
  isScheduled,
}: {
  profile: Profile;
  isSelected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onSuspend: () => void;
  onLiftSuspension: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isScheduled: boolean;
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
        <Avatar className="h-9 w-9 rounded-full flex-shrink-0">
          {profile.profilePicture?.secure_url ? (
            <AvatarImage src={profile.profilePicture.secure_url} alt={profile.fullName} />
          ) : null}
          <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
            {getInitials(profile.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile.fullName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile.contact.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={getStatusBadge(profile.activeStatus)} className="gap-1">
            <HugeiconsIcon icon={getStatusIcon(profile.activeStatus)} size={12} />
            {profile.activeStatus}
          </Badge>
          <button
            onClick={onToggleExpand}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Phone</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{profile.contact.phoneNumber}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Type</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">{profile.accountType}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Joined</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatDate(profile.createdAt)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Verification</p>
              <Badge variant={getVerificationBadge(profile.verificationStatus)} className="mt-1">
                {profile.verificationStatus}
              </Badge>
            </div>
          </div>

          {profile.organizationName && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Organization</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{profile.organizationName}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {isScheduled ? (
              <div className="flex-1 flex items-center justify-center gap-2 h-8 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={ClockIcon} className="h-3 w-3" />
                Auto-deleted on {profile.metadata?.finalDeletionDate
                  ? formatDate(profile.metadata.finalDeletionDate)
                  : 'N/A'}
              </div>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs dark:border-gray-700"
                  onClick={onView}
                >
                  <HugeiconsIcon icon={ViewIcon} className="h-3 w-3 mr-1" /> View
                </Button>
                {profile.activeStatus === 'active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400"
                    onClick={onSuspend}
                  >
                    <HugeiconsIcon icon={BanIcon} className="h-3 w-3 mr-1" /> Suspend
                  </Button>
                )}
                {profile.activeStatus === 'suspended' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs border-green-200 text-green-600 dark:border-green-800 dark:text-green-400"
                    onClick={onLiftSuspension}
                  >
                    <HugeiconsIcon icon={UnlockIcon} className="h-3 w-3 mr-1" /> Lift Suspension
                  </Button>
                )}
              </>
            )}
          </div>
          {isScheduled && profile.metadata?.finalDeletionDate && (
            <div className="col-span-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-lg p-2">
              <p className="text-[10px] text-blue-400 uppercase tracking-wide">Scheduled deletion</p>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {formatDate(profile.metadata.finalDeletionDate)}
              </p>
              {profile.metadata.deletionReason && (
                <p className="text-[10px] text-blue-400 mt-0.5">{profile.metadata.deletionReason}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'active' | 'suspended' | 'deactivated' | 'scheduled'>('active');
  const [searchTerm, setSearchTerm] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Date range filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Modal states
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isLiftSuspensionModalOpen, setIsLiftSuspensionModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState("14");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [hardDelete, setHardDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedUsers(new Set());
  }, [activeTab, accountTypeFilter, verificationFilter, startDate, endDate]);

  // Query params
  const queryParams: GetProfilesParams = {
    page: currentPage,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  if (debouncedSearch) queryParams.search = debouncedSearch;
  if (activeTab === 'scheduled') {
    queryParams.activeStatus = 'deactivated' as any;
  } else {
    queryParams.activeStatus = activeTab as any;
  }
  if (accountTypeFilter !== "all") queryParams.accountType = accountTypeFilter as any;
  if (verificationFilter !== "all") queryParams.verificationStatus = verificationFilter as any;
  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;

  const { data, isLoading, isFetching, refetch } = useGetProfiles(queryParams);
  
  // Mutations
  const deactivateMutation = useDeactivateAccount();
  const reactivateMutation = useReactivateAccount();
  const suspendMutation = useSuspendAccount();
  const liftSuspensionMutation = useLiftSuspension();
  const deleteMutation = useDeleteAccount();

  const profiles = data?.data || [];
  const pagination = data?.pagination;
  const showSkeleton = isLoading || (isFetching && profiles.length === 0);

  const isScheduledForDeletion = (profile: Profile) => !!profile.metadata?.deletionScheduled;

  // Get counts for tabs
  const getCountByStatus = (status: string) => {
    if (!data?.data) return 0;
    if (status === 'scheduled') return data.data.filter(p => isScheduledForDeletion(p)).length;
    if (status === 'deactivated') return data.data.filter(p => p.activeStatus === 'deactivated' && !isScheduledForDeletion(p)).length;
    return data.data.filter(p => p.activeStatus === status).length;
  };

  const tabConfigs = {
    active: { label: 'Active', count: getCountByStatus('active') },
    suspended: { label: 'Suspended', count: getCountByStatus('suspended') },
    deactivated: { label: 'Deactivated', count: getCountByStatus('deactivated') },
    scheduled: { label: 'Scheduled Deletion', count: getCountByStatus('scheduled') },
  };

  const filteredProfiles = profiles.filter((p) => {
    if (activeTab === 'scheduled') return isScheduledForDeletion(p);
    if (activeTab === 'deactivated') return !isScheduledForDeletion(p);
    return true;
  });

  const stats = {
    total: pagination?.total || 0,
    active: getCountByStatus('active'),
    suspended: getCountByStatus('suspended'),
    deactivated: getCountByStatus('deactivated'),
    verified: profiles.filter(p => p.verificationStatus === 'verified').length,
  };

  // Handlers
  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.size === filteredProfiles.length && filteredProfiles.length > 0
        ? new Set()
        : new Set(filteredProfiles.map((p) => p._id))
    );
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedUsers);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedUsers(next);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setActiveTab("active");
    setAccountTypeFilter("all");
    setVerificationFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    setSelectedUsers(new Set());
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Users refreshed");
  };

  const handleTabChange = (tab: 'active' | 'suspended' | 'deactivated' | 'scheduled') => {
    setActiveTab(tab);
  };

  const hasFilters = debouncedSearch || accountTypeFilter !== "all" || verificationFilter !== "all" || startDate || endDate;

  // Action handlers
  const handleDeactivate = async (profileId: string, reason?: string) => {
    try {
      await deactivateMutation.mutateAsync({
        id: profileId,
        params: { reason: reason || "Deactivated by admin", sendEmail: true }
      });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      toast.success("Account deactivated successfully");
    } catch (error) {
      console.error("Deactivation failed:", error);
      toast.error("Failed to deactivate account");
    }
  };

  const handleReactivate = async (profileId: string) => {
    try {
      await reactivateMutation.mutateAsync({ id: profileId });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      toast.success("Account reactivated successfully");
    } catch (error) {
      console.error("Reactivation failed:", error);
      toast.error("Failed to reactivate account");
    }
  };

  const handleSuspend = async () => {
    if (!selectedProfile) return;
    setActionLoading(true);
    try {
      await suspendMutation.mutateAsync({
        id: selectedProfile._id,
        params: {
          reason: suspendReason,
          duration: parseInt(suspendDuration),
          sendEmail: true
        }
      });
      toast.success(`Account suspended for ${suspendDuration} days`);
      setIsSuspendModalOpen(false);
      setSuspendReason("");
      setSuspendDuration("14");
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
    } catch (error) {
      console.error("Suspension failed:", error);
      toast.error("Failed to suspend account");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLiftSuspension = async () => {
    if (!selectedProfile) return;
    setActionLoading(true);
    try {
      await liftSuspensionMutation.mutateAsync({
        id: selectedProfile._id,
        params: { sendEmail: true }
      });
      toast.success("Suspension lifted successfully");
      setIsLiftSuspensionModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
    } catch (error) {
      console.error("Lift suspension failed:", error);
      toast.error("Failed to lift suspension");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProfile) return;
    setActionLoading(true);
    try {
      await deleteMutation.mutateAsync({
        id: selectedProfile._id,
        params: {
          reason: deleteReason,
          hardDelete: hardDelete,
          sendEmail: true
        }
      });
      toast.success(hardDelete ? "Account permanently deleted" : "Account scheduled for deletion");
      setIsDeleteModalOpen(false);
      setDeleteReason("");
      setHardDelete(false);
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
    } catch (error) {
      console.error("Deletion failed:", error);
      toast.error("Failed to delete account");
    } finally {
      setActionLoading(false);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const data = selectedUsers.size > 0 
      ? filteredProfiles.filter(p => selectedUsers.has(p._id))
      : filteredProfiles;
    
    if (data.length === 0) {
      toast.error("No users to export");
      return;
    }

    const headers = [
      'Full Name', 'Email', 'Phone', 'Account Type', 'Organization', 
      'Status', 'Verification', 'Location', 'Created At', 'Last Active'
    ];

    const rows = data.map((profile) => [
      profile.fullName,
      profile.contact.email,
      profile.contact.phoneNumber,
      profile.accountType,
      profile.organizationName || 'N/A',
      profile.activeStatus,
      profile.verificationStatus,
      `${profile.location.city}, ${profile.location.state}`,
      formatDate(profile.createdAt),
      profile.lastActiveAt ? formatDate(profile.lastActiveAt) : 'N/A',
    ]);

    const escapeCSV = (value: string | number): string => {
      const s = String(value);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvContent = [headers.join(','), ...rows.map((r) => r.map(escapeCSV).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users_${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} users to CSV`);
  };

  const handleExportPDF = async () => {
    const data = selectedUsers.size > 0 
      ? filteredProfiles.filter(p => selectedUsers.has(p._id))
      : filteredProfiles;
    
    if (data.length === 0) {
      toast.error("No users to export");
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 297, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Users Report", 20, 28);
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'PPP p')}`, 20, 55);
    doc.text(`Total Users: ${data.length}`, 20, 62);
    
    const tableData = data.map((profile) => [
      profile.fullName,
      profile.contact.email,
      profile.accountType,
      profile.activeStatus,
      profile.verificationStatus,
      formatDate(profile.createdAt),
    ]);
    
    autoTable(doc, {
      startY: 72,
      head: [["Name", "Email", "Type", "Status", "Verification", "Joined"]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 },
      },
    });
    
    doc.save(`users_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
    toast.success(`Exported ${data.length} users to PDF`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      <div className="px-4">
        
        {/* Introduction Text */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Users Management</h1>
            {stats.active > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                {stats.active} active
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage and monitor all user accounts on the platform. View details, manage account status, 
            and perform administrative actions like suspension or deletion.
          </p>
        </div>

        {/* Header with Refresh */}
        <div className="flex justify-end mb-4">
          <div className="flex gap-2">
            <ActionDropdown
              trigger={
                <Button type="button" variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 px-4 h-10">
                  <HugeiconsIcon icon={FileSpreadsheetIcon} className="h-3.5 w-3.5 mr-2" />
                  Export
                </Button>
              }
              items={[
                { label: 'Export as CSV', icon: FileSpreadsheetIcon, onClick: handleExportCSV },
                { divider: true } as const,
                { label: 'Export as PDF', icon: File01Icon, onClick: handleExportPDF },
                ...(selectedUsers.size > 0 ? [{ divider: true, section: `Selected (${selectedUsers.size})` } as const] : []),
              ]}
            />
            <Button
              type="button"
              onClick={handleRefresh}
              variant="outline"
              className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 px-4 h-10"
              disabled={isFetching}
            >
              <HugeiconsIcon icon={RefreshIcon} className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-6 items-center flex-wrap">
          {Object.entries(tabConfigs).map(([key, { label, count }]) => (
            <TabButton
              key={key}
              label={label}
              count={count}
              isActive={activeTab === key}
              onClick={() => handleTabChange(key as 'active' | 'suspended' | 'deactivated' | 'scheduled')}
            />
          ))}
          {isFetching && !isLoading && (
            <div className="flex items-center">
              <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4 animate-spin text-blue-500" />
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-2.5 items-center">
          <div className="flex-1 relative h-10 lg:h-11 min-w-[200px]">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>
          <Select value={accountTypeFilter} onValueChange={(v) => setAccountTypeFilter(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-36 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10 lg:h-11 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={Building02Icon} className="h-4 w-4" />
                <SelectValue placeholder="Type" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="organization">Organization</SelectItem>
            </SelectContent>
          </Select>
          <Select value={verificationFilter} onValueChange={(v) => setVerificationFilter(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-36 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10 lg:h-11 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={IdCardIcon} className="h-4 w-4" />
                <SelectValue placeholder="Verified" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
            </SelectContent>
          </Select>
          
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={() => {
              setStartDate("");
              setEndDate("");
            }}
          />
        </div>

        {/* Bulk Actions Bar */}
        {selectedUsers.size > 0 && !showSkeleton && (
          <div className="mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center">
                {selectedUsers.size}
              </span>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">users selected</span>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                <HugeiconsIcon icon={BanIcon} className="h-3.5 w-3.5 mr-1.5" /> Bulk Suspend
              </Button>
              <Button type="button" variant="outline" size="sm" className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50">
                <HugeiconsIcon icon={Delete03Icon} className="h-3.5 w-3.5 mr-1.5" /> Bulk Delete
              </Button>
            </div>
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {showSkeleton ? (
            <div className="p-6"><UsersSkeleton /></div>
          ) : filteredProfiles.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <HugeiconsIcon icon={UserIcon} className="h-6 w-6 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No users found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {hasFilters ? 'No users match your filters' : 'No user records found'}
              </p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <HugeiconsIcon icon={FilterHorizontalIcon} className="h-4 w-4 mr-2" />
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <div className="w-12">
                  <Checkbox
                    checked={selectedUsers.size === filteredProfiles.length && filteredProfiles.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </div>
                <div className="flex-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">User</div>
                <div className="w-48 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contact</div>
                <div className="w-32 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</div>
                <div className="w-28 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</div>
                <div className="w-28 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Verification</div>
                <div className="w-28 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Joined</div>
                <div className="w-16 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100 dark:divide-gray-800 relative">
                {isFetching && !isLoading && profiles.length > 0 && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-10 flex items-start justify-center pt-20">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      <HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                  </div>
                )}
                {filteredProfiles.map((profile) => (
                  <div
                    key={profile._id}
                    className={cn(
                      "flex items-center px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                      profile.activeStatus === 'suspended' && "bg-amber-50/30 dark:bg-amber-900/10"
                    )}
                  >
                    <div className="w-12">
                      <Checkbox checked={selectedUsers.has(profile._id)} onCheckedChange={() => toggleSelect(profile._id)} />
                    </div>
                    
                    <div className="flex-1 flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0">
                        {profile.profilePicture?.secure_url ? (
                          <AvatarImage src={profile.profilePicture.secure_url} alt={profile.fullName} />
                        ) : null}
                        <AvatarFallback className="bg-transparent text-white text-xs font-bold">
                          {getInitials(profile.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile.fullName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{profile.displayName || profile.fullName}</p>
                      </div>
                    </div>
                    
                    <div className="w-48">
                      <div className="flex items-center gap-1.5 mb-1">
                        <HugeiconsIcon icon={Mail01Icon} className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{profile.contact.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HugeiconsIcon icon={Phone01Icon} className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">{profile.contact.phoneNumber}</span>
                      </div>
                    </div>
                    
                    <div className="w-32">
                      <div className="flex items-center gap-1.5">
                        {profile.accountType === 'organization' ? (
                          <HugeiconsIcon icon={Building02Icon} className="h-3.5 w-3.5 text-blue-500" />
                        ) : (
                          <HugeiconsIcon icon={UserIcon} className="h-3.5 w-3.5 text-green-500" />
                        )}
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">{profile.accountType}</span>
                      </div>
                      {profile.organizationName && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{profile.organizationName}</p>
                      )}
                    </div>
                    
                    <div className="w-28">
                      <Badge variant={getStatusBadge(profile.activeStatus)} className="gap-1">
                        <HugeiconsIcon icon={getStatusIcon(profile.activeStatus)} size={12} />
                        {profile.activeStatus}
                      </Badge>
                      {profile.suspensionReason && profile.activeStatus === 'suspended' && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 truncate max-w-[100px]">
                          {profile.suspensionReason}
                        </p>
                      )}
                    </div>
                    
                    <div className="w-28">
                      <Badge variant={getVerificationBadge(profile.verificationStatus)} className="gap-1">
                        {profile.verificationStatus === 'verified' && <HugeiconsIcon icon={BadgeCheckIcon} size={12} />}
                        {profile.verificationStatus}
                      </Badge>
                    </div>
                    
                    <div className="w-28">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(profile.createdAt)}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{format(new Date(profile.createdAt), 'HH:mm')}</p>
                    </div>

                    {activeTab === 'scheduled' && (
                      <div className="w-28">
                        <p className="text-[10px] text-blue-500 dark:text-blue-400 font-medium">Final deletion</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {profile.metadata?.finalDeletionDate
                            ? formatDate(profile.metadata.finalDeletionDate)
                            : 'N/A'}
                        </p>
                      </div>
                    )}
                    
                    <div className="w-16 flex items-center justify-center gap-1">
                      {activeTab === 'scheduled' ? (
                        <div
                          className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800"
                          title="Managed by cron job"
                        >
                          <HugeiconsIcon icon={ClockIcon} className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-[10px] text-gray-400">Auto</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => { setSelectedProfile(profile); setIsViewModalOpen(true); }}
                            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            title="View Details"
                          >
                            <HugeiconsIcon icon={ViewIcon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </button>
                          <ActionDropdown
                            trigger={
                              <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </button>
                            }
                            items={[
                              { label: 'View Details', icon: ViewIcon, onClick: () => { setSelectedProfile(profile); setIsViewModalOpen(true); } },
                              { divider: true, section: 'Account Actions' } as const,
                              ...(profile.activeStatus === 'active'
                                ? [
                                    { label: 'Deactivate', icon: UserRemove01Icon, onClick: () => handleDeactivate(profile._id) },
                                    { label: 'Suspend', icon: BanIcon, onClick: () => { setSelectedProfile(profile); setIsSuspendModalOpen(true); } }
                                  ]
                                : profile.activeStatus === 'deactivated'
                                ? [{ label: 'Reactivate', icon: UserCheck01Icon, onClick: () => handleReactivate(profile._id) }]
                                : profile.activeStatus === 'suspended'
                                ? [{ label: 'Lift Suspension', icon: UnlockIcon, onClick: () => { setSelectedProfile(profile); setIsLiftSuspensionModalOpen(true); } }]
                                : []
                              ),
                              { divider: true } as const,
                              { label: 'Permanently Delete', icon: Delete03Icon, onClick: () => { setSelectedProfile(profile); setIsDeleteModalOpen(true); }, danger: true },
                            ]}
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4">
                  <PaginationWithInfo
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={(page) => setCurrentPage(page)}
                    showInfo={true}
                    showPageNumbers={true}
                    maxVisiblePages={5}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {showSkeleton ? (
            <UsersSkeleton />
          ) : filteredProfiles.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <HugeiconsIcon icon={UserIcon} className="h-6 w-6 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No users found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">No user records found</p>
            </div>
          ) : (
            <>
              {isFetching && !isLoading && profiles.length > 0 && (
                <div className="flex justify-center py-4">
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                    <HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                  </div>
                </div>
              )}
              {filteredProfiles.map((profile) => (
                <MobileUserCard
                  key={profile._id}
                  profile={profile}
                  isSelected={selectedUsers.has(profile._id)}
                  onToggleSelect={() => toggleSelect(profile._id)}
                  onView={() => { setSelectedProfile(profile); setIsViewModalOpen(true); }}
                  onSuspend={() => { setSelectedProfile(profile); setIsSuspendModalOpen(true); }}
                  onLiftSuspension={() => { setSelectedProfile(profile); setIsLiftSuspensionModalOpen(true); }}
                  isExpanded={expandedCardId === profile._id}
                  onToggleExpand={() =>
                    setExpandedCardId((prev) => (prev === profile._id ? null : profile._id))
                  }
                  isScheduled={activeTab === 'scheduled'}
                />
              ))}
            </>
          )}
          
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4">
              <PaginationWithInfo
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={(page) => setCurrentPage(page)}
                showInfo={true}
                showPageNumbers={false}
                maxVisiblePages={3}
              />
            </div>
          )}
        </div>
      </div>

      {/* View User Modal */}
      <ReusableModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="User Details"
        description="Complete information about the user account"
        size="full"
        className="!max-w-5xl"
        actions={[
          {
            label: 'Close',
            onClick: () => setIsViewModalOpen(false),
            variant: 'outline',
          }
        ]}
      >
        {selectedProfile && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
              <Avatar className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg ring-4 ring-white dark:ring-gray-900 flex-shrink-0">
                {selectedProfile.profilePicture?.secure_url ? (
                  <AvatarImage src={selectedProfile.profilePicture.secure_url} alt={selectedProfile.fullName} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-bold">
                  {getInitials(selectedProfile.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedProfile.fullName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedProfile.displayName || selectedProfile.fullName}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant={getStatusBadge(selectedProfile.activeStatus)} className="gap-1">
                    <HugeiconsIcon icon={getStatusIcon(selectedProfile.activeStatus)} size={12} />
                    {selectedProfile.activeStatus}
                  </Badge>
                  <Badge variant={getVerificationBadge(selectedProfile.verificationStatus)} className="gap-1">
                    {selectedProfile.verificationStatus === 'verified' && <HugeiconsIcon icon={BadgeCheckIcon} size={12} />}
                    {selectedProfile.verificationStatus}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Full Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProfile.fullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Display Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProfile.displayName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Account Type</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{selectedProfile.accountType}</p>
                </div>
                {selectedProfile.organizationName && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Organization</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProfile.organizationName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProfile.contact.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProfile.contact.phoneNumber}</p>
                </div>
                {selectedProfile.contact.website && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Website</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProfile.contact.website}</p>
                  </div>
                )}
                {selectedProfile.contact.officeNumber && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Office Number</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProfile.contact.officeNumber}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Location</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProfile.location.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">City</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProfile.location.city || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">State</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProfile.location.state || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Country</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProfile.location.country || 'Nigeria'}</p>
                </div>
              </div>
            </div>

            {/* Bio & Specialties */}
            {selectedProfile.bio && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Bio</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProfile.bio}</p>
              </div>
            )}

            {selectedProfile.shortBio && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Short Bio</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProfile.shortBio}</p>
              </div>
            )}

            {selectedProfile.specialties && selectedProfile.specialties.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.specialties.map((specialty, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Experience & Stats */}
            {(typeof selectedProfile.yearsOfExperience !== 'undefined' && selectedProfile.yearsOfExperience !== null && selectedProfile.yearsOfExperience !== 0) || 
            (typeof selectedProfile.totalEvents !== 'undefined' && selectedProfile.totalEvents !== null && selectedProfile.totalEvents !== 0) || 
            (typeof selectedProfile.averageRating !== 'undefined' && selectedProfile.averageRating !== null && selectedProfile.averageRating !== 0) ? (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Experience</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {typeof selectedProfile.yearsOfExperience !== 'undefined' && selectedProfile.yearsOfExperience !== null && selectedProfile.yearsOfExperience !== 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Years of Experience</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedProfile.yearsOfExperience}+ years</p>
                    </div>
                  )}
                  {typeof selectedProfile.totalEvents !== 'undefined' && selectedProfile.totalEvents !== null && selectedProfile.totalEvents !== 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total Events</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedProfile.totalEvents}</p>
                    </div>
                  )}
                  {typeof selectedProfile.averageRating !== 'undefined' && selectedProfile.averageRating !== null && selectedProfile.averageRating !== 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedProfile.averageRating} ⭐</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Social Media */}
            {selectedProfile.contact.socialMedia && Object.values(selectedProfile.contact.socialMedia).some(v => v) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Social Media</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedProfile.contact.socialMedia.facebook && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-blue-600">Facebook:</span>
                      <a href={selectedProfile.contact.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:underline truncate">
                        Profile
                      </a>
                    </div>
                  )}
                  {selectedProfile.contact.socialMedia.instagram && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-pink-600">Instagram:</span>
                      <a href={selectedProfile.contact.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:underline truncate">
                        Profile
                      </a>
                    </div>
                  )}
                  {selectedProfile.contact.socialMedia.twitter && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-blue-400">Twitter:</span>
                      <a href={selectedProfile.contact.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:underline truncate">
                        Profile
                      </a>
                    </div>
                  )}
                  {selectedProfile.contact.socialMedia.linkedin && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-blue-700">LinkedIn:</span>
                      <a href={selectedProfile.contact.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-600 dark:text-gray-400 hover:underline truncate">
                        Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Account Metadata */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Account Metadata</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(selectedProfile.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Last Active</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProfile.lastActiveAt ? formatDateTime(selectedProfile.lastActiveAt) : 'N/A'}</p>
                </div>
                {selectedProfile.deactivatedAt && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Deactivated At</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(selectedProfile.deactivatedAt)}</p>
                  </div>
                )}
                {selectedProfile.suspendedAt && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Suspended At</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(selectedProfile.suspendedAt)}</p>
                  </div>
                )}
                {selectedProfile.suspensionReason && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Suspension Reason</p>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{selectedProfile.suspensionReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Verification Info */}
            {selectedProfile.verifiedAt && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Verification Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Verified At</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(selectedProfile.verifiedAt)}</p>
                  </div>
                  {selectedProfile.verifiedBy && typeof selectedProfile.verifiedBy !== 'string' && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Verified By</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedProfile.verifiedBy.fullName} ({selectedProfile.verifiedBy.email})</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </ReusableModal>

      {/* Suspend Modal */}
      <ActionModal
        isOpen={isSuspendModalOpen}
        onClose={() => {
          setIsSuspendModalOpen(false);
          setSuspendReason("");
          setSuspendDuration("14");
        }}
        onAction={handleSuspend}
        title="Suspend Account"
        description="This will temporarily suspend the user's account"
        actionLabel="Suspend Account"
        cancelLabel="Cancel"
        actionVariant="secondary"
        isLoading={actionLoading}
        disabled={!suspendReason}
        size="md"
      >
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-lg">
            <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1.5">Suspension Details:</p>
              <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
                <li>· User: {selectedProfile?.fullName}</li>
                <li>· Email: {selectedProfile?.contact.email}</li>
                <li>· Suspension will hide all events and block access</li>
              </ul>
            </div>
          </div>
          
          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason for Suspension</Label>
            <Textarea
              placeholder="Enter the reason for suspension..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="mt-1.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              rows={3}
            />
          </div>
          
          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Suspension Duration (days)</Label>
            <Select value={suspendDuration} onValueChange={(v) => setSuspendDuration(v ?? "14")}>
              <SelectTrigger className="mt-1.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ActionModal>

      {/* Lift Suspension Modal */}
      <ConfirmModal
        isOpen={isLiftSuspensionModalOpen}
        onClose={() => setIsLiftSuspensionModalOpen(false)}
        onConfirm={handleLiftSuspension}
        title="Lift Suspension"
        description={`Are you sure you want to lift the suspension for ${selectedProfile?.fullName}'s account?`}
        confirmLabel="Lift Suspension"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={actionLoading}
        size="md"
      >
        <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50 rounded-lg mt-4">
          <HugeiconsIcon icon={ShieldCheckIcon} className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1.5">Lifting suspension will:</p>
            <ul className="space-y-1 text-xs text-green-700 dark:text-green-400">
              <li>· Restore full account access</li>
              <li>· Reactivate all events</li>
              <li>· Resume subscription if applicable</li>
              <li>· Send confirmation email to the user</li>
            </ul>
          </div>
        </div>
      </ConfirmModal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteReason("");
          setHardDelete(false);
        }}
        onConfirm={handleDelete}
        title="Delete Account"
        description={`Are you sure you want to ${hardDelete ? 'permanently delete' : 'schedule deletion for'} ${selectedProfile?.fullName}'s account? ${!hardDelete ? 'This will give a 30-day grace period before permanent deletion.' : 'This action cannot be undone.'}`}
        confirmLabel={hardDelete ? 'Permanently Delete' : 'Schedule Deletion'}
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={actionLoading}
        size="md"
      >
        <div className="mt-4 space-y-4">
          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason for Deletion</Label>
            <Textarea
              placeholder="Enter the reason for deletion..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              className="mt-1.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              rows={2}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Checkbox
              id="hardDelete"
              checked={hardDelete}
              onCheckedChange={(checked) => setHardDelete(checked as boolean)}
            />
            <Label htmlFor="hardDelete" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              Permanently delete immediately (no grace period)
            </Label>
          </div>
          {!hardDelete && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <HugeiconsIcon icon={ClockIcon} className="h-3 w-3" />
              Account will be scheduled for deletion with a 30-day grace period
            </p>
          )}
        </div>
      </ConfirmModal>
    </div>
  );
}