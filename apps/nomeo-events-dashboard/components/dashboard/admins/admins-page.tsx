"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  UserIcon, 
  Building02Icon, 
  Mail01Icon, 
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
  SecurityCheckIcon as ShieldCheckIcon,
  UserAdd01Icon as AddUserIcon,
  ArrowUp02Icon as PromoteIcon,
  ArrowDown02Icon as DemoteIcon,
  SettingsIcon,
  UserGroupIcon,
  EditIcon,
  KeyIcon
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
  useGetAdmins, 
  useAdminStats, 
  useAdminManagement,
  useAdminPermissions,
  useResetAdminPassword,
  type AdminUser,
  type GetAdminsParams
} from '@/hooks/use-admin-management';
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

const getRoleColor = (role: string) => {
  const colors: Record<string, string> = {
    super_admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    moderator: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    support: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };
  return colors[role] || "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    suspended: "destructive",
    inactive: "secondary",
  };
  return variants[status] || "secondary";
};

const getStatusIcon = (status: string) => {
  const icons: Record<string, any> = {
    active: CheckCircleIcon,
    suspended: BanIcon,
    inactive: ClockIcon,
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
// ACTION DROPDOWN COMPONENT
// ============================================

interface DropdownItem {
  label: string;
  icon: any;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

const ActionDropdown = ({
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

// ============================================
// SKELETON COMPONENT
// ============================================

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={`rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] ${className ?? ''}`} />
  );
}

const AdminsSkeleton = () => (
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
// MAIN PAGE COMPONENT
// ============================================

interface AdminsPageProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: "super_admin" | "admin" | "moderator" | "support";
    status: "active" | "suspended" | "inactive";
  };
}

export default function AdminsPage({ user }: AdminsPageProps) {

  const permissions = useAdminPermissions(user.role);
  const isSuperAdmin = user.role === 'super_admin';
  const { resetPassword: resetAdminPassword, isLoading: isResettingPassword } = useResetAdminPassword();
  
  const [selectedAdmins, setSelectedAdmins] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Modal states
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isDemoteModalOpen, setIsDemoteModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  
  // Password reset form
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  
  // Form states
  const [createForm, setCreateForm] = useState({
    email: '',
    name: '',
    displayName: '',
    role: 'admin' as 'super_admin' | 'admin' | 'moderator' | 'support',
    sendEmail: true
  });
  const [actionReason, setActionReason] = useState("");
  const [selectedNewRole, setSelectedNewRole] = useState<'super_admin' | 'admin' | 'moderator' | 'support'>('admin');
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedAdmins(new Set());
  }, [roleFilter, statusFilter, debouncedSearch]);

  // Query params
  const queryParams: GetAdminsParams = {
    page: currentPage,
    limit: 20,
  };

  if (debouncedSearch) queryParams.search = debouncedSearch;
  if (roleFilter !== "all") queryParams.role = roleFilter as any;
  if (statusFilter !== "all") queryParams.status = statusFilter as any;

  const { data, isLoading, isFetching, refetch } = useGetAdmins(queryParams);
  const { stats } = useAdminStats();
  const { createAdmin, updateAdmin, deleteAdmin, isCreating, isUpdating, isDeleting } = useAdminManagement();

  const admins = data?.admins || [];
  const pagination = data?.pagination;
  const showSkeleton = isLoading || (isFetching && admins.length === 0);

  const hasFilters = debouncedSearch || roleFilter !== "all" || statusFilter !== "all";

  // Handlers
  const handleSelectAll = () => {
    setSelectedAdmins(
      selectedAdmins.size === admins.length && admins.length > 0
        ? new Set()
        : new Set(admins.map((a) => a._id))
    );
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedAdmins);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedAdmins(next);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
    setSelectedAdmins(new Set());
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Admins refreshed");
  };

  // Create Admin
  const handleCreateAdmin = async () => {
    if (!createForm.email || !createForm.name || !createForm.displayName) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createForm.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setActionLoading(true);
    try {
      await createAdmin(createForm);
      toast.success(`Admin ${createForm.displayName} created successfully`);
      // Only close modal after successful creation
      setIsCreateModalOpen(false);
      // Reset form
      setCreateForm({
        email: '',
        name: '',
        displayName: '',
        role: 'admin',
        sendEmail: true
      });
      refetch();
    } catch (error: any) {
      console.error("Create admin failed:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to create admin";
      toast.error(errorMessage);
      // DO NOT close modal on error - keep it open so user can try again
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Password
  const handleResetPassword = async () => {
    if (!selectedAdmin) return;
    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (resetPasswordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    
    setActionLoading(true);
    try {
      await resetAdminPassword(selectedAdmin._id, resetPasswordData.newPassword, resetPasswordData.confirmPassword);
      toast.success(`Password reset for ${selectedAdmin.displayName}`);
      setIsResetPasswordModalOpen(false);
      setResetPasswordData({ newPassword: "", confirmPassword: "" });
      refetch();
    } catch (error: any) {
      console.error("Password reset failed:", error);
      toast.error(error?.response?.data?.error || "Failed to reset password");
    } finally {
      setActionLoading(false);
    }
  };

  // Promote Admin
  const handlePromote = async () => {
    if (!selectedAdmin) return;
    setActionLoading(true);
    try {
      await updateAdmin({
        adminId: selectedAdmin._id,
        action: 'promote',
        data: { newRole: selectedNewRole, reason: actionReason, sendEmail: true }
      });
      toast.success(`${selectedAdmin.displayName} promoted to ${selectedNewRole}`);
      setIsPromoteModalOpen(false);
      setActionReason("");
      refetch();
    } catch (error: any) {
      console.error("Promotion failed:", error);
      toast.error(error?.response?.data?.error || "Failed to promote admin");
    } finally {
      setActionLoading(false);
    }
  };

  // Demote Admin
  const handleDemote = async () => {
    if (!selectedAdmin) return;
    setActionLoading(true);
    try {
      await updateAdmin({
        adminId: selectedAdmin._id,
        action: 'demote',
        data: { targetRole: selectedNewRole, reason: actionReason, sendEmail: true }
      });
      toast.success(`${selectedAdmin.displayName} demoted to ${selectedNewRole}`);
      setIsDemoteModalOpen(false);
      setActionReason("");
      refetch();
    } catch (error: any) {
      console.error("Demotion failed:", error);
      toast.error(error?.response?.data?.error || "Failed to demote admin");
    } finally {
      setActionLoading(false);
    }
  };

  // Suspend Admin
  const handleSuspend = async () => {
    if (!selectedAdmin) return;
    setActionLoading(true);
    try {
      await updateAdmin({
        adminId: selectedAdmin._id,
        action: 'suspend',
        data: { reason: actionReason, sendEmail: true }
      });
      toast.success(`${selectedAdmin.displayName} suspended`);
      setIsSuspendModalOpen(false);
      setActionReason("");
      refetch();
    } catch (error: any) {
      console.error("Suspension failed:", error);
      toast.error(error?.response?.data?.error || "Failed to suspend admin");
    } finally {
      setActionLoading(false);
    }
  };

  // Activate Admin
  const handleActivate = async () => {
    if (!selectedAdmin) return;
    setActionLoading(true);
    try {
      await updateAdmin({
        adminId: selectedAdmin._id,
        action: 'activate',
        data: { reason: actionReason, sendEmail: true }
      });
      toast.success(`${selectedAdmin.displayName} activated`);
      setIsActivateModalOpen(false);
      setActionReason("");
      refetch();
    } catch (error: any) {
      console.error("Activation failed:", error);
      toast.error(error?.response?.data?.error || "Failed to activate admin");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Admin
  const handleDelete = async () => {
    if (!selectedAdmin) return;
    setActionLoading(true);
    try {
      await deleteAdmin({
        adminId: selectedAdmin._id,
        hardDelete: hardDelete,
        reason: actionReason
      });
      toast.success(hardDelete ? `${selectedAdmin.displayName} permanently deleted` : `${selectedAdmin.displayName} deactivated`);
      setIsDeleteModalOpen(false);
      setActionReason("");
      setHardDelete(false);
      refetch();
    } catch (error: any) {
      console.error("Deletion failed:", error);
      toast.error(error?.response?.data?.error || "Failed to delete admin");
    } finally {
      setActionLoading(false);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const data = selectedAdmins.size > 0 
      ? admins.filter(a => selectedAdmins.has(a._id))
      : admins;
    
    if (data.length === 0) {
      toast.error("No admins to export");
      return;
    }

    const headers = [
      'Name', 'Display Name', 'Email', 'Role', 'Status', 
      'Login Count', 'Last Login', 'Created At'
    ];

    const rows = data.map((admin) => [
      admin.name,
      admin.displayName,
      admin.email,
      admin.role,
      admin.adminStatus,
      admin.loginCount,
      admin.lastLoginAt ? formatDate(admin.lastLoginAt) : 'Never',
      formatDate(admin.createdAt),
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
    link.download = `admins_${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} admins to CSV`);
  };

  const handleExportPDF = async () => {
    const data = selectedAdmins.size > 0 
      ? admins.filter(a => selectedAdmins.has(a._id))
      : admins;
    
    if (data.length === 0) {
      toast.error("No admins to export");
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 297, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Admins Report", 20, 28);
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'PPP p')}`, 20, 55);
    doc.text(`Total Admins: ${data.length}`, 20, 62);
    
    const tableData = data.map((admin) => [
      admin.name,
      admin.email,
      admin.role,
      admin.adminStatus,
      formatDate(admin.createdAt),
    ]);
    
    autoTable(doc, {
      startY: 72,
      head: [["Name", "Email", "Role", "Status", "Created"]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 50 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
      },
    });
    
    doc.save(`admins_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
    toast.success(`Exported ${data.length} admins to PDF`);
  };

  // Get available roles for promotion/demotion
  const getAvailablePromotionRoles = (currentRole: string) => {
    const roles = ['support', 'moderator', 'admin', 'super_admin'];
    const currentIndex = roles.indexOf(currentRole);
    return roles.slice(currentIndex + 1) as ('super_admin' | 'admin' | 'moderator' | 'support')[];
  };

  const getAvailableDemotionRoles = (currentRole: string) => {
    const roles = ['support', 'moderator', 'admin', 'super_admin'];
    const currentIndex = roles.indexOf(currentRole);
    return roles.slice(0, currentIndex) as ('super_admin' | 'admin' | 'moderator' | 'support')[];
  };

  // Get dropdown items for an admin
  const getAdminDropdownItems = (admin: AdminUser): DropdownItem[] => {
    const items: DropdownItem[] = [];
    
    // View Details - always available
    items.push({
      label: 'View Details',
      icon: ViewIcon,
      onClick: () => { setSelectedAdmin(admin); setIsViewModalOpen(true); }
    });
    
    // Only super admin can see management actions
    if (isSuperAdmin && admin.email !== user.email) {
      // Role Management
      const promotionRoles = getAvailablePromotionRoles(admin.role);
      const demotionRoles = getAvailableDemotionRoles(admin.role);
      
      if (promotionRoles.length > 0) {
        items.push({
          label: `Promote to ${promotionRoles[0].replace('_', ' ').toUpperCase()}`,
          icon: PromoteIcon,
          onClick: () => { setSelectedAdmin(admin); setSelectedNewRole(promotionRoles[0]); setIsPromoteModalOpen(true); }
        });
      }
      
      if (demotionRoles.length > 0) {
        items.push({
          label: `Demote to ${demotionRoles[0].replace('_', ' ').toUpperCase()}`,
          icon: DemoteIcon,
          onClick: () => { setSelectedAdmin(admin); setSelectedNewRole(demotionRoles[0]); setIsDemoteModalOpen(true); }
        });
      }
      
      // Password Reset
      items.push({
        label: 'Reset Password',
        icon: KeyIcon,
        onClick: () => { setSelectedAdmin(admin); setIsResetPasswordModalOpen(true); }
      });
      
      // Account Actions
      if (admin.adminStatus === 'active') {
        items.push({
          label: 'Suspend Account',
          icon: BanIcon,
          onClick: () => { setSelectedAdmin(admin); setIsSuspendModalOpen(true); }
        });
      } else if (admin.adminStatus === 'suspended' || admin.adminStatus === 'inactive') {
        items.push({
          label: 'Activate Account',
          icon: UserCheck01Icon,
          onClick: () => { setSelectedAdmin(admin); setIsActivateModalOpen(true); }
        });
      }
      
      // Delete Account
      items.push({
        label: 'Delete Account',
        icon: Delete03Icon,
        onClick: () => { setSelectedAdmin(admin); setIsDeleteModalOpen(true); },
        danger: true
      });
    }
    
    return items;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      <div className="px-4">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Management</h1>
              {stats.total > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                  {stats.total} total
                </span>
              )}
            </div>
            {permissions.canCreateAdmin && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 h-10"
              >
                <HugeiconsIcon icon={AddUserIcon} className="h-4 w-4 mr-2" />
                Add Admin
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage administrator accounts, assign roles, and control access permissions.
          </p>
          {!isSuperAdmin && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
              <HugeiconsIcon icon={AlertCircleIcon} className="h-3 w-3" />
              You have view-only access. Contact a Super Admin to modify admin accounts.
            </p>
          )}
        </div>

        {/* Stats Cards */}
        {stats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Admins</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Super Admins</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.byRole.super_admin}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.byRole.admin}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.byStatus.active}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Active %</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.round(stats.activePercentage)}%</p>
            </div>
          </div>
        )}

        {/* Header with Refresh & Export */}
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
                { label: 'Export as PDF', icon: File01Icon, onClick: handleExportPDF },
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

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-2.5 items-center">
          <div className="flex-1 relative h-10 lg:h-11 min-w-[200px]">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search by name, email, or display name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-36 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10 lg:h-11 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={UserGroupIcon} className="h-4 w-4" />
                <SelectValue placeholder="Role" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="support">Support</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
            <SelectTrigger className="w-full sm:w-36 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10 lg:h-11 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={SettingsIcon} className="h-4 w-4" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {showSkeleton ? (
            <div className="p-6"><AdminsSkeleton /></div>
          ) : admins.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <HugeiconsIcon icon={UserIcon} className="h-6 w-6 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No admins found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {hasFilters ? 'No admins match your filters' : 'No admin records found'}
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
                  {isSuperAdmin && (
                    <Checkbox
                      checked={selectedAdmins.size === admins.length && admins.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  )}
                </div>
                <div className="flex-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Admin</div>
                <div className="w-48 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contact</div>
                <div className="w-32 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</div>
                <div className="w-28 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</div>
                <div className="w-28 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Last Login</div>
                <div className="w-28 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Created</div>
                <div className="w-16 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100 dark:divide-gray-800 relative">
                {isFetching && !isLoading && admins.length > 0 && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-10 flex items-start justify-center pt-20">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      <HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                  </div>
                )}
                {admins.map((admin) => (
                  <div
                    key={admin._id}
                    className={cn(
                      "flex items-center px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                      admin.adminStatus === 'suspended' && "bg-amber-50/30 dark:bg-amber-900/10"
                    )}
                  >
                    <div className="w-12">
                      {isSuperAdmin && (
                        <Checkbox 
                          checked={selectedAdmins.has(admin._id)} 
                          onCheckedChange={() => toggleSelect(admin._id)}
                          disabled={admin.email === user?.email}
                        />
                      )}
                    </div>
                    
                    <div className="flex-1 flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0">
                        <AvatarFallback className="bg-transparent text-white text-xs font-bold">
                          {getInitials(admin.displayName || admin.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{admin.displayName || admin.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{admin.name}</p>
                      </div>
                    </div>
                    
                    <div className="w-48">
                      <div className="flex items-center gap-1.5 mb-1">
                        <HugeiconsIcon icon={Mail01Icon} className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{admin.email}</span>
                      </div>
                    </div>
                    
                    <div className="w-32">
                      <span className={cn("px-2 py-1 text-xs font-medium rounded-full capitalize", getRoleColor(admin.role))}>
                        {admin.role.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="w-28">
                      <Badge variant={getStatusBadge(admin.adminStatus)} className="gap-1">
                        <HugeiconsIcon icon={getStatusIcon(admin.adminStatus)} size={12} />
                        {admin.adminStatus}
                      </Badge>
                    </div>
                    
                    <div className="w-28">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {admin.lastLoginAt ? formatDate(admin.lastLoginAt) : 'Never'}
                      </p>
                      {admin.loginCount > 0 && (
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{admin.loginCount} logins</p>
                      )}
                    </div>
                    
                    <div className="w-28">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(admin.createdAt)}</p>
                    </div>
                    
                    <div className="w-16 flex items-center justify-center">
                      <ActionDropdown
                        trigger={
                          <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </button>
                        }
                        items={getAdminDropdownItems(admin)}
                      />
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

        {/* Mobile View - Simplified */}
        <div className="md:hidden space-y-3">
          {showSkeleton ? (
            <AdminsSkeleton />
          ) : admins.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <HugeiconsIcon icon={UserIcon} className="h-6 w-6 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No admins found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">No admin records found</p>
            </div>
          ) : (
            <>
              {admins.map((admin) => (
                <div key={admin._id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-center gap-3">
                    {isSuperAdmin && (
                      <Checkbox 
                        checked={selectedAdmins.has(admin._id)} 
                        onCheckedChange={() => toggleSelect(admin._id)}
                        disabled={admin.email === user?.email}
                      />
                    )}
                    <Avatar className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0">
                      <AvatarFallback className="bg-transparent text-white text-xs font-bold">
                        {getInitials(admin.displayName || admin.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{admin.displayName || admin.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{admin.email}</p>
                    </div>
                    <Badge variant={getStatusBadge(admin.adminStatus)} className="gap-1">
                      <HugeiconsIcon icon={getStatusIcon(admin.adminStatus)} size={12} />
                      {admin.adminStatus}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={cn("px-2 py-1 text-xs font-medium rounded-full capitalize", getRoleColor(admin.role))}>
                      {admin.role.replace('_', ' ')}
                    </span>
                    <ActionDropdown
                      trigger={
                        <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                          <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-4 w-4 text-gray-500" />
                        </button>
                      }
                      items={getAdminDropdownItems(admin)}
                    />
                  </div>
                </div>
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

      {/* ==================== MODALS ==================== */}

      {/* View Admin Modal */}
      <ReusableModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Admin Details"
        description="Complete information about the administrator"
        size="full"
        className="!max-w-4xl"
        actions={[
          {
            label: 'Close',
            onClick: () => setIsViewModalOpen(false),
            variant: 'outline',
          }
        ]}
      >
        {selectedAdmin && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
              <Avatar className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg ring-4 ring-white dark:ring-gray-900 flex-shrink-0">
                <AvatarFallback className="bg-transparent text-white text-xl font-bold">
                  {getInitials(selectedAdmin.displayName || selectedAdmin.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedAdmin.displayName || selectedAdmin.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedAdmin.name}</p>
                <div className="flex gap-2 mt-2">
                  <span className={cn("px-2 py-1 text-xs font-medium rounded-full", getRoleColor(selectedAdmin.role))}>
                    {selectedAdmin.role.replace('_', ' ').toUpperCase()}
                  </span>
                  <Badge variant={getStatusBadge(selectedAdmin.adminStatus)} className="gap-1">
                    <HugeiconsIcon icon={getStatusIcon(selectedAdmin.adminStatus)} size={12} />
                    {selectedAdmin.adminStatus}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedAdmin.email}</p>
                </div>
              </div>
            </div>

            {/* Account Metadata */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Account Metadata</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(selectedAdmin.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Last Login</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedAdmin.lastLoginAt ? formatDateTime(selectedAdmin.lastLoginAt) : 'Never'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Login Count</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedAdmin.loginCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Onboarded</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedAdmin.isOnboarded ? 'Yes' : 'No'}</p>
                </div>
                {selectedAdmin.lastLoginIP && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Last Login IP</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedAdmin.lastLoginIP}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </ReusableModal>

      {/* Create Admin Modal - Only Super Admin - WITH closeOnAction={false} */}
      {isSuperAdmin && (
        <ActionModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setCreateForm({
              email: '',
              name: '',
              displayName: '',
              role: 'admin',
              sendEmail: true
            });
          }}
          onAction={handleCreateAdmin}
          title="Add New Admin"
          description="Create a new administrator account"
          actionLabel="Create Admin"
          cancelLabel="Cancel"
          actionVariant="danger"
          isLoading={actionLoading || isCreating}
          size="md"
          closeOnAction={false}
        >
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Email *</Label>
              <Input
                type="email"
                placeholder="admin@example.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="mt-1.5 dark:bg-gray-800 dark:border-gray-700"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Full Name *</Label>
              <Input
                placeholder="John Doe"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="mt-1.5 dark:bg-gray-800 dark:border-gray-700"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Display Name *</Label>
              <Input
                placeholder="John D."
                value={createForm.displayName}
                onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                className="mt-1.5 dark:bg-gray-800 dark:border-gray-700"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Role *</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v as any })}>
                <SelectTrigger className="mt-1.5 dark:bg-gray-800 dark:border-gray-700 lg:h-11 h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700 p-1">
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="sendEmail"
                checked={createForm.sendEmail}
                onCheckedChange={(checked) => setCreateForm({ ...createForm, sendEmail: checked as boolean })}
              />
              <Label htmlFor="sendEmail" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                Send invitation email
              </Label>
            </div>
          </div>
        </ActionModal>
      )}

      {/* Action Modals - Only Super Admin - WITH closeOnAction={false} */}
      {isSuperAdmin && (
        <>
          {/* Reset Password Modal */}
          <ActionModal
            isOpen={isResetPasswordModalOpen}
            onClose={() => {
              setIsResetPasswordModalOpen(false);
              setResetPasswordData({ newPassword: "", confirmPassword: "" });
            }}
            onAction={handleResetPassword}
            title="Reset Password"
            description={`Reset password for ${selectedAdmin?.displayName}`}
            actionLabel="Reset Password"
            cancelLabel="Cancel"
            actionVariant="primary"
            isLoading={actionLoading || isResettingPassword}
            size="md"
            closeOnAction={false}
          >
            <div className="space-y-4">
              <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-lg">
                <HugeiconsIcon icon={KeyIcon} className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1.5">Password Reset Details:</p>
                  <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
                    <li>· Admin: {selectedAdmin?.displayName}</li>
                    <li>· Email: {selectedAdmin?.email}</li>
                    <li>· A password reset email will be sent</li>
                  </ul>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">New Password *</Label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={resetPasswordData.newPassword}
                  onChange={(e) => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })}
                  className="mt-1.5 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Confirm Password *</Label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={resetPasswordData.confirmPassword}
                  onChange={(e) => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })}
                  className="mt-1.5 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>
          </ActionModal>

          {/* Promote Modal */}
          <ActionModal
            isOpen={isPromoteModalOpen}
            onClose={() => {
              setIsPromoteModalOpen(false);
              setActionReason("");
            }}
            onAction={handlePromote}
            title="Promote Admin"
            description={`Promote ${selectedAdmin?.displayName} to a higher role`}
            actionLabel="Promote"
            cancelLabel="Cancel"
            actionVariant="danger"
            isLoading={actionLoading || isUpdating}
            size="md"
            closeOnAction={false}
          >
            <div className="space-y-4">
              <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50 rounded-lg">
                <HugeiconsIcon icon={PromoteIcon} className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1.5">Promotion Details:</p>
                  <ul className="space-y-1 text-xs text-green-700 dark:text-green-400">
                    <li>· Admin: {selectedAdmin?.displayName}</li>
                    <li>· Current Role: {selectedAdmin?.role}</li>
                    <li>· New Role: {selectedNewRole}</li>
                  </ul>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason for Promotion</Label>
                <Textarea
                  placeholder="Enter the reason for promotion..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="mt-1.5 dark:bg-gray-800 dark:border-gray-700"
                  rows={3}
                />
              </div>
            </div>
          </ActionModal>

          {/* Demote Modal */}
          <ActionModal
            isOpen={isDemoteModalOpen}
            onClose={() => {
              setIsDemoteModalOpen(false);
              setActionReason("");
            }}
            onAction={handleDemote}
            title="Demote Admin"
            description={`Demote ${selectedAdmin?.displayName} to a lower role`}
            actionLabel="Demote"
            cancelLabel="Cancel"
            actionVariant="secondary"
            isLoading={actionLoading || isUpdating}
            size="md"
            closeOnAction={false}
          >
            <div className="space-y-4">
              <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-lg">
                <HugeiconsIcon icon={DemoteIcon} className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1.5">Demotion Details:</p>
                  <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
                    <li>· Admin: {selectedAdmin?.displayName}</li>
                    <li>· Current Role: {selectedAdmin?.role}</li>
                    <li>· New Role: {selectedNewRole}</li>
                  </ul>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason for Demotion</Label>
                <Textarea
                  placeholder="Enter the reason for demotion..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="mt-1.5 dark:bg-gray-800 dark:border-gray-700"
                  rows={3}
                />
              </div>
            </div>
          </ActionModal>

          {/* Suspend Modal */}
          <ActionModal
            isOpen={isSuspendModalOpen}
            onClose={() => {
              setIsSuspendModalOpen(false);
              setActionReason("");
            }}
            onAction={handleSuspend}
            title="Suspend Admin"
            description="This will temporarily suspend the admin's account"
            actionLabel="Suspend Admin"
            cancelLabel="Cancel"
            actionVariant="secondary"
            isLoading={actionLoading || isUpdating}
            size="md"
            closeOnAction={false}
          >
            <div className="space-y-4">
              <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-lg">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1.5">Suspension Details:</p>
                  <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
                    <li>· Admin: {selectedAdmin?.displayName}</li>
                    <li>· Email: {selectedAdmin?.email}</li>
                    <li>· Suspension will block admin access</li>
                  </ul>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason for Suspension</Label>
                <Textarea
                  placeholder="Enter the reason for suspension..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="mt-1.5 dark:bg-gray-800 dark:border-gray-700"
                  rows={3}
                />
              </div>
            </div>
          </ActionModal>

          {/* Activate Modal */}
          <ConfirmModal
            isOpen={isActivateModalOpen}
            onClose={() => {
              setIsActivateModalOpen(false);
              setActionReason("");
            }}
            onConfirm={handleActivate}
            title="Activate Admin"
            description={`Are you sure you want to activate ${selectedAdmin?.displayName}'s admin account?`}
            confirmLabel="Activate Admin"
            cancelLabel="Cancel"
            confirmVariant="danger"
            isLoading={actionLoading || isUpdating}
            size="md"
          >
            <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50 rounded-lg mt-4">
              <HugeiconsIcon icon={ShieldCheckIcon} className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1.5">Activating will:</p>
                <ul className="space-y-1 text-xs text-green-700 dark:text-green-400">
                  <li>· Restore full admin access</li>
                  <li>· Allow login and admin actions</li>
                  <li>· Send confirmation email</li>
                </ul>
              </div>
            </div>
            {actionReason && (
              <div className="mt-4">
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason</Label>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{actionReason}</p>
              </div>
            )}
          </ConfirmModal>

          {/* Delete Modal */}
          <ConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setActionReason("");
              setHardDelete(false);
            }}
            onConfirm={handleDelete}
            title="Delete Admin"
            description={`Are you sure you want to ${hardDelete ? 'permanently delete' : 'deactivate'} ${selectedAdmin?.displayName}'s admin account?`}
            confirmLabel={hardDelete ? 'Permanently Delete' : 'Deactivate Account'}
            cancelLabel="Cancel"
            confirmVariant="danger"
            isLoading={actionLoading || isDeleting}
            size="md"
          >
            <div className="mt-4 space-y-4">
              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason for Deletion</Label>
                <Textarea
                  placeholder="Enter the reason for deletion..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="mt-1.5 dark:bg-gray-800 dark:border-gray-700"
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
                  Permanently delete immediately (no recovery)
                </Label>
              </div>
              {!hardDelete && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <HugeiconsIcon icon={ClockIcon} className="h-3 w-3" />
                  Account will be deactivated and can be restored later
                </p>
              )}
            </div>
          </ConfirmModal>
        </>
      )}
    </div>
  );
}