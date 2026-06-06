// admins-page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Search01Icon, 
  RefreshIcon, 
  File01Icon, 
  FileSpreadsheetIcon,
  Delete03Icon,
  ViewIcon,
  UnavailableIcon as BanIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  ClockIcon,
  AlertCircleIcon,
  UserCheck01Icon,
  UserAdd02Icon as AddUserIcon,
  ArrowUp02Icon as PromoteIcon,
  ArrowDown02Icon as DemoteIcon,
  SettingsIcon,
  UserGroupIcon,
  KeyIcon,
  SecurityCheckIcon as ShieldCheckIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { 
  useGetAdmins, 
  useAdminStats, 
  useAdminManagement,
  useAdminPermissions,
  useResetAdminPassword,
  type AdminUser,
  type GetAdminsParams
} from '@/hooks/use-admin-management';

import { ActionDropdown, DropdownItem } from './admin-action-dropdown';
import { AdminStatCards } from './admin-stat-cards';
import { AdminTable } from './admin-table';
import { AdminMobileCards } from './admin-mobile-cards';
import { 
  ViewAdminModal, 
  CreateAdminModal, 
  ResetPasswordModal, 
  RoleChangeModal, 
  ConfirmModalWrapper 
} from './admin-modals';
import { formatDate } from './admin-types';

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
  
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  
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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedAdmins(new Set());
  }, [roleFilter, statusFilter, debouncedSearch]);

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
  const hasFilters = !!debouncedSearch || roleFilter !== "all" || statusFilter !== "all";

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

  const handleCreateAdmin = async () => {
    if (!createForm.email || !createForm.name || !createForm.displayName) {
      toast.error("Please fill in all required fields");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createForm.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setActionLoading(true);
    try {
      await createAdmin(createForm);
      toast.success(`Admin ${createForm.displayName} created successfully`);
      setIsCreateModalOpen(false);
      setCreateForm({
        email: '',
        name: '',
        displayName: '',
        role: 'admin',
        sendEmail: true
      });
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || "Failed to create admin");
    } finally {
      setActionLoading(false);
    }
  };

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
      toast.error(error?.response?.data?.error || "Failed to reset password");
    } finally {
      setActionLoading(false);
    }
  };

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
      toast.error(error?.response?.data?.error || "Failed to promote admin");
    } finally {
      setActionLoading(false);
    }
  };

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
      toast.error(error?.response?.data?.error || "Failed to demote admin");
    } finally {
      setActionLoading(false);
    }
  };

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
      toast.error(error?.response?.data?.error || "Failed to suspend admin");
    } finally {
      setActionLoading(false);
    }
  };

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
      toast.error(error?.response?.data?.error || "Failed to activate admin");
    } finally {
      setActionLoading(false);
    }
  };

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
      toast.error(error?.response?.data?.error || "Failed to delete admin");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    const data = selectedAdmins.size > 0 
      ? admins.filter(a => selectedAdmins.has(a._id))
      : admins;
    
    if (data.length === 0) {
      toast.error("No admins to export");
      return;
    }

    const headers = ['Name', 'Display Name', 'Email', 'Role', 'Status', 'Login Count', 'Last Login', 'Created At'];
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

  const getAdminDropdownItems = (admin: AdminUser): DropdownItem[] => {
    const items: DropdownItem[] = [];
    
    items.push({
      label: 'View Details',
      icon: ViewIcon,
      onClick: () => { setSelectedAdmin(admin); setIsViewModalOpen(true); }
    });
    
    if (isSuperAdmin && admin.email !== user.email) {
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
      
      items.push({
        label: 'Reset Password',
        icon: KeyIcon,
        onClick: () => { setSelectedAdmin(admin); setIsResetPasswordModalOpen(true); }
      });
      
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
        <AdminStatCards stats={stats} />

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
        <div className="hidden md:block">
          <AdminTable
            admins={admins}
            selectedAdmins={selectedAdmins}
            isSuperAdmin={isSuperAdmin}
            currentUserEmail={user.email}
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onSelectAll={handleSelectAll}
            onToggleSelect={toggleSelect}
            getAdminDropdownItems={getAdminDropdownItems}
            isFetching={isFetching}
            isLoading={isLoading}
          />
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          <AdminMobileCards
            admins={admins}
            selectedAdmins={selectedAdmins}
            isSuperAdmin={isSuperAdmin}
            currentUserEmail={user.email}
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onToggleSelect={toggleSelect}
            getAdminDropdownItems={getAdminDropdownItems}
            showSkeleton={showSkeleton}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
          />
        </div>
      </div>

      {/* Modals */}
      <ViewAdminModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        admin={selectedAdmin}
      />

      {isSuperAdmin && (
        <>
          <CreateAdminModal
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
            onCreate={handleCreateAdmin}
            formData={createForm}
            onFormChange={setCreateForm}
            isLoading={actionLoading || isCreating}
          />

          <ResetPasswordModal
            isOpen={isResetPasswordModalOpen}
            onClose={() => {
              setIsResetPasswordModalOpen(false);
              setResetPasswordData({ newPassword: "", confirmPassword: "" });
            }}
            onReset={handleResetPassword}
            admin={selectedAdmin}
            passwordData={resetPasswordData}
            onPasswordChange={setResetPasswordData}
            isLoading={actionLoading || isResettingPassword}
          />

          <RoleChangeModal
            isOpen={isPromoteModalOpen}
            onClose={() => {
              setIsPromoteModalOpen(false);
              setActionReason("");
            }}
            onConfirm={handlePromote}
            title="Promote"
            description={`Promote ${selectedAdmin?.displayName} to a higher role`}
            actionLabel="Promote"
            admin={selectedAdmin}
            newRole={selectedNewRole}
            reason={actionReason}
            onReasonChange={setActionReason}
            isLoading={actionLoading || isUpdating}
            icon={PromoteIcon}
            iconColor="green"
          />

          <RoleChangeModal
            isOpen={isDemoteModalOpen}
            onClose={() => {
              setIsDemoteModalOpen(false);
              setActionReason("");
            }}
            onConfirm={handleDemote}
            title="Demote"
            description={`Demote ${selectedAdmin?.displayName} to a lower role`}
            actionLabel="Demote"
            admin={selectedAdmin}
            newRole={selectedNewRole}
            reason={actionReason}
            onReasonChange={setActionReason}
            isLoading={actionLoading || isUpdating}
            icon={DemoteIcon}
            iconColor="amber"
          />

          <RoleChangeModal
            isOpen={isSuspendModalOpen}
            onClose={() => {
              setIsSuspendModalOpen(false);
              setActionReason("");
            }}
            onConfirm={handleSuspend}
            title="Suspend"
            description="This will temporarily suspend the admin's account"
            actionLabel="Suspend Admin"
            admin={selectedAdmin}
            newRole=""
            reason={actionReason}
            onReasonChange={setActionReason}
            isLoading={actionLoading || isUpdating}
            icon={AlertCircleIcon}
            iconColor="amber"
          />

          <ConfirmModalWrapper
            isOpen={isActivateModalOpen}
            onClose={() => {
              setIsActivateModalOpen(false);
              setActionReason("");
            }}
            onConfirm={handleActivate}
            title="Activate Admin"
            description={`Are you sure you want to activate ${selectedAdmin?.displayName}'s admin account?`}
            confirmLabel="Activate Admin"
            isLoading={actionLoading || isUpdating}
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
          </ConfirmModalWrapper>

          <ConfirmModalWrapper
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
            isLoading={actionLoading || isDeleting}
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
          </ConfirmModalWrapper>
        </>
      )}
    </div>
  );
}