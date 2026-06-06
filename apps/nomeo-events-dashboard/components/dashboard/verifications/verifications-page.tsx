// verifications-page.tsx
'use client';

import { useState, useEffect } from 'react';
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  RefreshIcon,
  Building02Icon,
  IdIcon as IdCardIcon,
  Tick02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginationWithInfo } from "@/components/ui/pagination";

import {
  useGetPendingVerification,
  type GetPendingVerificationParams,
} from "@/hooks/use-pending-verification";
import {
  useVerifyProfiles,
  useRejectProfiles,
} from "@/hooks/use-verification-action";
import { useVerificationDetails } from "@/hooks/use-verification-details";

import { hasValidValue } from './verifications-types';
import { MobileCardSkeleton } from './verifications-skeletons';
import { DateRangePicker, StatCard, MobileVerificationCard } from './verifications-components';
import { VerificationsTable } from './verifications-table';
import { VerificationDetailModal } from './verifications-detail-modal';
import { BulkVerifyModal, BulkRejectModal } from './verifications-modal';

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
  const {
    data: detailsData,
    isLoading: isLoadingDetails,
    refetch: refetchDetails,
  } = useVerificationDetails(isDetailOpen ? selectedProfile?._id : null);

  const profiles = data?.data || [];
  const pagination = data?.pagination;
  const stats = data?.stats;
  const showSkeleton = isLoading || (isFetching && profiles.length === 0);
  const hasFilters = !!(debouncedSearch || documentType !== "all" || accountType !== "all" || startDate || endDate);

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
          <VerificationsTable
            profiles={profiles}
            selectedVerifications={selectedVerifications}
            isFetching={isFetching}
            isLoading={isLoading}
            hasFilters={hasFilters}
            onSelectAll={handleSelectAll}
            onToggleSelect={toggleSelect}
            onOpenDetail={openDetail}
            onClearFilters={clearFilters}
          />
          
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
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {showSkeleton ? (
            <MobileCardSkeleton />
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
        detailsData={detailsData}
        isLoadingDetails={isLoadingDetails}
        refetchDetails={refetchDetails}
      />

      {/* Bulk Verify Confirmation Modal */}
      <BulkVerifyModal
        isOpen={isBulkVerifyModalOpen}
        onClose={() => setIsBulkVerifyModalOpen(false)}
        onConfirm={handleBulkVerify}
        selectedCount={selectedVerifications.size}
        isLoading={verifyMutation.isPending}
      />

      {/* Bulk Reject Confirmation Modal */}
      <BulkRejectModal
        isOpen={isBulkRejectModalOpen}
        onClose={() => {
          setIsBulkRejectModalOpen(false);
          setBulkRejectReason("");
        }}
        onConfirm={handleBulkReject}
        selectedCount={selectedVerifications.size}
        isLoading={rejectMutation.isPending}
        rejectReason={bulkRejectReason}
        setRejectReason={setBulkRejectReason}
      />
    </div>
  );
}