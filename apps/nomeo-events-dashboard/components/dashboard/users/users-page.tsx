// users-page.tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  Building02Icon,
  Search01Icon,
  RefreshIcon,
  File01Icon,
  FileSpreadsheetIcon,
  IdIcon as IdCardIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginationWithInfo } from "@/components/ui/pagination";
import { useQueryClient } from '@tanstack/react-query';

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

import { UserTab, formatDate } from './users-types';
import { UsersSkeleton } from './users-skeletons';
import { TabButton, ActionDropdown, DateRangePicker } from './users-components';
import { UsersTable } from './users-table';
import { MobileUserCard } from './users-mobile-card';
import { ViewUserModal, SuspendModal, LiftSuspensionModal, DeleteModal } from './users-modals';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<UserTab>('active');
  const [searchTerm, setSearchTerm] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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

  // Debounce search
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

  const handleTabChange = (tab: UserTab) => {
    setActiveTab(tab);
  };

  const hasFilters = !!debouncedSearch || accountTypeFilter !== "all" || verificationFilter !== "all" || !!startDate || !!endDate;

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
      toast.error("Failed to deactivate account");
    }
  };

  const handleReactivate = async (profileId: string) => {
    try {
      await reactivateMutation.mutateAsync({ id: profileId });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      toast.success("Account reactivated successfully");
    } catch (error) {
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

    const headers = ['Full Name', 'Email', 'Phone', 'Account Type', 'Organization', 'Status', 'Verification', 'Created At'];

    const rows = data.map((profile) => [
      profile.fullName,
      profile.contact.email,
      profile.contact.phoneNumber,
      profile.accountType,
      profile.organizationName || 'N/A',
      profile.activeStatus,
      profile.verificationStatus,
      formatDate(profile.createdAt),
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
    });
    
    doc.save(`users_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
    toast.success(`Exported ${data.length} users to PDF`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      <div className="px-4">
        
        {/* Header */}
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

        {/* Export & Refresh */}
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
              onClick={() => handleTabChange(key as UserTab)}
            />
          ))}
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
          </div>
        )}

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <UsersTable
            profiles={filteredProfiles}
            selectedUsers={selectedUsers}
            activeTab={activeTab}
            isFetching={isFetching}
            isLoading={isLoading}
            onToggleSelect={toggleSelect}
            onSelectAll={handleSelectAll}
            onView={(profile) => { setSelectedProfile(profile); setIsViewModalOpen(true); }}
            onDeactivate={handleDeactivate}
            onReactivate={handleReactivate}
            onSuspend={(profile) => { setSelectedProfile(profile); setIsSuspendModalOpen(true); }}
            onLiftSuspension={(profile) => { setSelectedProfile(profile); setIsLiftSuspensionModalOpen(true); }}
            onDelete={(profile) => { setSelectedProfile(profile); setIsDeleteModalOpen(true); }}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
          />
          
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
            filteredProfiles.map((profile) => (
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
            ))
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

      {/* Modals */}
      <ViewUserModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        profile={selectedProfile}
      />

      <SuspendModal
        isOpen={isSuspendModalOpen}
        onClose={() => {
          setIsSuspendModalOpen(false);
          setSuspendReason("");
          setSuspendDuration("14");
        }}
        onConfirm={handleSuspend}
        profile={selectedProfile}
        isLoading={actionLoading}
        suspendReason={suspendReason}
        setSuspendReason={setSuspendReason}
        suspendDuration={suspendDuration}
        setSuspendDuration={setSuspendDuration}
      />

      <LiftSuspensionModal
        isOpen={isLiftSuspensionModalOpen}
        onClose={() => setIsLiftSuspensionModalOpen(false)}
        onConfirm={handleLiftSuspension}
        profile={selectedProfile}
        isLoading={actionLoading}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteReason("");
          setHardDelete(false);
        }}
        onConfirm={handleDelete}
        profile={selectedProfile}
        isLoading={actionLoading}
        deleteReason={deleteReason}
        setDeleteReason={setDeleteReason}
        hardDelete={hardDelete}
        setHardDelete={setHardDelete}
      />
    </div>
  );
}