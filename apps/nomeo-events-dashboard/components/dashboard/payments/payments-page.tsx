
"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  File01Icon,
  FileSpreadsheetIcon,
  FilterHorizontalIcon,
  RefreshIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationWithInfo } from "@/components/ui/pagination";

import {
  paymentKeys,
  useEventPayments,
  useEventPaymentStats,
  useSubscriptionPayments,
  useSubscriptionStats,
  useEventStats,
  useEventPaymentsByEvent,
  usePayment,
  usePaymentByRegistration,
  useSubscriptionPaymentHistory,
  usePlanPayments,
  useRefundPayment,
  useExportEventPayments,
  useExportSubscriptionPayments,
  type DateRangeParams,
  type EventPaymentListParams,
  type PaymentGatewayStatus,
  type SubscriptionPaymentListParams,
} from "@/hooks/use-payments";

import { TabKey } from "./payments-types";
import { formatMoney, formatDate, purposeLabels, channelLabels, getPaymentParty } from "./payments-types";
import { PaymentsSkeleton } from "./payments-skeletons";
import { EventStats, SubscriptionStats } from "./payments-stats";
import { TabButton, ActionDropdown, DateRangePicker } from "./payments-components";
import { EventPaymentsTable, SubscriptionPaymentsTable } from "./payments-tables";
import { ViewPaymentModal, RefundModal } from "./payments-modals";

// Mobile Payment Card Component
function MobilePaymentCard({
  payment,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  onView,
  onRefund,
}: {
  payment: any;
  selected: boolean;
  expanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onView: () => void;
  onRefund: () => void;
}) {
  const party = getPaymentParty(payment);
  const { channelLabels: labels, purposeLabels: purposes } = require("./payments-types");

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3 p-4">
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {payment.currency ?? "NGN"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{party.title}</p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{payment.reference}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <PaymentStatusBadge status={payment.gatewayStatus} />
          <button
            type="button"
            onClick={onToggleExpand}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <HugeiconsIcon icon={ArrowDown01Icon} className={cn("h-4 w-4", expanded && "rotate-180")} />
          </button>
        </div>
      </div>
    </div>
  );
}

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { PaymentStatusBadge } from "./payments-components";
import { format } from "date-fns";

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("events");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentGatewayStatus | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReference, setRefundReference] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const dateParams: DateRangeParams = useMemo(
    () => ({
      ...(startDate ? { dateFrom: startDate } : {}),
      ...(endDate ? { dateTo: endDate } : {}),
    }),
    [startDate, endDate]
  );

  const baseParams = {
    page: currentPage,
    limit: 20,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...dateParams,
  };

  const eventParams: EventPaymentListParams = baseParams;
  const subscriptionParams: SubscriptionPaymentListParams = baseParams;

  const eventPaymentsQuery = useEventPayments(eventParams);
  const subscriptionPaymentsQuery = useSubscriptionPayments(subscriptionParams);
  const eventStatsQuery = useEventPaymentStats(dateParams);
  const subscriptionStatsQuery = useSubscriptionStats(dateParams);

  const selectedPaymentQuery = usePayment(selectedPayment?._id ?? "", { 
    enabled: !!selectedPayment?._id && isViewModalOpen 
  });

  const selectedEventId = typeof selectedPayment?.eventId?._id === "string" ? selectedPayment.eventId._id : "";
  const selectedRegistrationId =
    typeof selectedPayment?.registrationId?._id === "string" ? selectedPayment.registrationId._id : "";
  const selectedSubscriptionId =
    typeof selectedPayment?.subscriptionId?._id === "string" ? selectedPayment.subscriptionId._id : "";
  const selectedPlanId = typeof selectedPayment?.planId?._id === "string" ? selectedPayment.planId._id : "";

  const eventBreakdownQuery = useEventStats(selectedEventId);
  const eventPaymentHistoryQuery = useEventPaymentsByEvent(selectedEventId, { limit: 5 });
  const registrationPaymentQuery = usePaymentByRegistration(selectedRegistrationId);
  const subscriptionHistoryQuery = useSubscriptionPaymentHistory(selectedSubscriptionId, { limit: 5 });
  const planPaymentsQuery = usePlanPayments(selectedPlanId, { limit: 5 });

  const refundMutation = useRefundPayment();
  const exportEventPayments = useExportEventPayments();
  const exportSubscriptionPayments = useExportSubscriptionPayments();

  const activeQuery = activeTab === "events" ? eventPaymentsQuery : subscriptionPaymentsQuery;

  const payments = activeQuery.data?.data ?? [];
  const pagination = activeQuery.data?.pagination;
  const showSkeleton = activeQuery.isLoading || (activeQuery.isFetching && payments.length === 0);

  const eventPaymentsData = eventPaymentsQuery.data;
  const subscriptionPaymentsData = subscriptionPaymentsQuery.data;
  
  const eventPaymentsCount = eventPaymentsData?.pagination?.total ?? 0;
  const subscriptionPaymentsCount = subscriptionPaymentsData?.pagination?.total ?? 0;

  const tabConfigs = {
    events: { label: "Event Payments", count: eventPaymentsCount },
    subscriptions: { label: "Subscriptions", count: subscriptionPaymentsCount },
  };

  const hasFilters =
    debouncedSearch ||
    statusFilter !== "all" ||
    startDate ||
    endDate;

  const detailPayment = selectedPaymentQuery.data?.data ?? selectedPayment;
  const isLoadingDetails = selectedPaymentQuery.isLoading && selectedPaymentQuery.isFetching;
  
  const hasCompleteData = useMemo(() => {
    if (!detailPayment) return false;
    
    if (detailPayment.purpose === "subscription") {
      return !!(
        detailPayment.subscriptionId?.userId?.name &&
        detailPayment.subscriptionId?.userId?.email &&
        detailPayment.planId?.name
      );
    } else if (detailPayment.purpose === "event_registration") {
      return !!(
        detailPayment.registrationId?.attendeeName ||
        detailPayment.eventId?.title
      );
    }
    return true;
  }, [detailPayment]);

  const handleSelectAll = () => {
    setSelectedPayments(
      selectedPayments.size === payments.length && payments.length > 0
        ? new Set()
        : new Set(payments.map((payment: any) => payment._id))
    );
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedPayments);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPayments(next);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    setSelectedPayments(new Set());
  };

  const resetPageSelection = () => {
    setCurrentPage(1);
    setSelectedPayments(new Set());
  };

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    resetPageSelection();
  };

  const handleRefresh = async () => {
    await activeQuery.refetch();
    toast.success("Payments refreshed");
  };

  const openPayment = (payment: any) => {
    setSelectedPayment(payment);
    setIsViewModalOpen(true);
  };

  const openRefund = (payment: any) => {
    setSelectedPayment(payment);
    setRefundAmount("");
    setRefundReason("");
    setRefundReference("");
    setIsRefundModalOpen(true);
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;

    try {
      await refundMutation.mutateAsync({
        id: selectedPayment._id,
        refundReason,
        ...(refundAmount ? { refundAmount: Number(refundAmount) } : {}),
        ...(refundReference ? { refundReference } : {}),
      });
      toast.success("Payment marked as refunded");
      setIsRefundModalOpen(false);
      setRefundAmount("");
      setRefundReason("");
      setRefundReference("");
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to refund payment");
    }
  };

  const handleExportCSV = () => {
    const params = {
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...dateParams,
    };

    if (activeTab === "events") {
      exportEventPayments.mutate(params, {
        onSuccess: () => toast.success("Event payments export started"),
        onError: (error) => toast.error(error instanceof Error ? error.message : "Export failed"),
      });
      return;
    }

    exportSubscriptionPayments.mutate(params, {
      onSuccess: () => toast.success("Subscription payments export started"),
      onError: (error) => toast.error(error instanceof Error ? error.message : "Export failed"),
    });
  };

  const handleExportPDF = () => {
    const rows = selectedPayments.size > 0 ? payments.filter((payment: any) => selectedPayments.has(payment._id)) : payments;
    if (rows.length === 0) {
      toast.error("No payments to export");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 297, 45, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Payments Report", 20, 28);
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "PPP p")}`, 20, 55);
    doc.text(`Rows: ${rows.length}`, 20, 62);

    autoTable(doc, {
      startY: 72,
      head: [["Reference", "Purpose", "Status", "Amount Paid", "Channel", "Created"]],
      body: rows.map((payment: any) => [
        payment.reference,
        purposeLabels[(payment.purpose as any) as keyof typeof purposeLabels] ?? String(payment.purpose),
        payment.gatewayStatus,
        formatMoney(payment.amountPaid, payment.currency),
        channelLabels[payment.channel ?? ""] ?? payment.channel ?? "N/A",
        formatDate(payment.createdAt),
      ]),
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
    });

    doc.save(`payments_report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`);
    toast.success(`Exported ${rows.length} payments to PDF`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 dark:bg-gray-900">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      <div className="px-4">
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payments Management</h1>
            {activeTab === "events" && eventPaymentsCount > 0 && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {eventPaymentsCount} total payments
              </span>
            )}
            {activeTab === "subscriptions" && subscriptionPaymentsCount > 0 && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {subscriptionPaymentsCount} total payments
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monitor all event and subscription transactions, review payment details, export reports, and process admin refunds.
          </p>
        </div>

        {activeTab === "events" ? (
          <EventStats data={eventStatsQuery.data} isLoading={eventStatsQuery.isLoading} />
        ) : (
          <SubscriptionStats data={subscriptionStatsQuery.data} isLoading={subscriptionStatsQuery.isLoading} />
        )}

        <div className="mb-4 mt-6 flex justify-end">
          <div className="flex gap-2">
            <ActionDropdown
              trigger={
                <Button type="button" variant="outline" size="sm" className="h-10 px-4 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                  <HugeiconsIcon icon={FileSpreadsheetIcon} className="mr-2 h-3.5 w-3.5" />
                  Export
                </Button>
              }
              items={[
                { label: "Export server CSV", icon: FileSpreadsheetIcon, onClick: handleExportCSV },
                { divider: true } as const,
                { label: "Export current page PDF", icon: File01Icon, onClick: handleExportPDF },
                ...(selectedPayments.size > 0 ? [{ divider: true, section: `Selected (${selectedPayments.size})` } as const] : []),
              ]}
            />
            <Button
              type="button"
              onClick={handleRefresh}
              variant="outline"
              className="h-10 px-4 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              disabled={activeQuery.isFetching}
            >
              <HugeiconsIcon icon={RefreshIcon} className={cn("mr-2 h-4 w-4", activeQuery.isFetching && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          {Object.entries(tabConfigs).map(([key, config]) => (
            <TabButton
              key={key}
              label={config.label}
              count={config.count}
              isActive={activeTab === key}
              onClick={() => handleTabChange(key as TabKey)}
            />
          ))}
          {activeQuery.isFetching && !activeQuery.isLoading && (
            <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4 animate-spin text-blue-500" />
          )}
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <div className="relative h-10 min-w-[220px] flex-1 lg:h-11">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search reference, Paystack ref, name, email, event, registration no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PaymentGatewayStatus | "all")}>
            <SelectTrigger className="h-10 w-full rounded-lg dark:border-gray-800 dark:bg-gray-900 dark:text-white sm:w-36 lg:h-11">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="p-1 dark:border-gray-800 dark:bg-gray-900">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="abandoned">Abandoned</SelectItem>
              <SelectItem value="reversed">Reversed</SelectItem>
            </SelectContent>
          </Select>

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(date) => { setStartDate(date); resetPageSelection(); }}
            onEndDateChange={(date) => { setEndDate(date); resetPageSelection(); }}
            onClear={() => { setStartDate(""); setEndDate(""); resetPageSelection(); }}
          />
        </div>

        {selectedPayments.size > 0 && !showSkeleton && (
          <div className="mb-5 flex flex-col items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/50 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white dark:bg-blue-500">
                {selectedPayments.size}
              </span>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">payments selected</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:bg-gray-900 dark:text-blue-300 dark:hover:bg-blue-950/50"
              onClick={handleExportPDF}
            >
              <HugeiconsIcon icon={File01Icon} className="mr-1.5 h-3.5 w-3.5" /> Export selected PDF
            </Button>
          </div>
        )}

        <div className="hidden overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:block">
          {showSkeleton ? (
            <div className="p-6"><PaymentsSkeleton /></div>
          ) : payments.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <HugeiconsIcon icon={File01Icon} className="h-6 w-6 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">No payments found</h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                {hasFilters ? "No payments match your filters" : "No payment records found"}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <HugeiconsIcon icon={FilterHorizontalIcon} className="mr-2 h-4 w-4" />
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="relative">
                {activeQuery.isFetching && !activeQuery.isLoading && payments.length > 0 && (
                  <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/50 pt-20 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      <HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                  </div>
                )}

                {activeTab === "events" ? (
                  <EventPaymentsTable
                    payments={payments}
                    selectedPayments={selectedPayments}
                    onSelectAll={handleSelectAll}
                    onToggleSelect={toggleSelect}
                    onView={openPayment}
                    onRefund={openRefund}
                  />
                ) : (
                  <SubscriptionPaymentsTable
                    payments={payments}
                    selectedPayments={selectedPayments}
                    onSelectAll={handleSelectAll}
                    onToggleSelect={toggleSelect}
                    onView={openPayment}
                    onRefund={openRefund}
                  />
                )}
              </div>

              {pagination && pagination.pages > 1 && (
                <div className="border-t border-gray-200 px-4 py-4 dark:border-gray-800">
                  <PaginationWithInfo
                    currentPage={currentPage}
                    totalPages={pagination.pages}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={(page) => setCurrentPage(page)}
                    showInfo
                    showPageNumbers
                    maxVisiblePages={5}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-3 md:hidden">
          {showSkeleton ? (
            <PaymentsSkeleton />
          ) : payments.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-gray-900">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <HugeiconsIcon icon={File01Icon} className="h-6 w-6 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">No payments found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">No payment records found</p>
            </div>
          ) : (
            payments.map((payment: any) => (
              <MobilePaymentCard
                key={payment._id}
                payment={payment}
                selected={selectedPayments.has(payment._id)}
                expanded={expandedCardId === payment._id}
                onToggleSelect={() => toggleSelect(payment._id)}
                onToggleExpand={() => setExpandedCardId((prev) => (prev === payment._id ? null : payment._id))}
                onView={() => openPayment(payment)}
                onRefund={() => openRefund(payment)}
              />
            ))
          )}

          {pagination && pagination.pages > 1 && (
            <div className="mt-4">
              <PaginationWithInfo
                currentPage={currentPage}
                totalPages={pagination.pages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={(page) => setCurrentPage(page)}
                showInfo
                showPageNumbers={false}
                maxVisiblePages={3}
              />
            </div>
          )}
        </div>
      </div>

      <ViewPaymentModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPayment(null);
        }}
        payment={detailPayment}
        isLoading={isLoadingDetails}
        hasCompleteData={hasCompleteData}
        eventBreakdownData={eventBreakdownQuery.data}
        eventPaymentHistoryData={eventPaymentHistoryQuery.data}
        registrationPaymentData={registrationPaymentQuery.data}
        subscriptionHistoryData={subscriptionHistoryQuery.data}
        planPaymentsData={planPaymentsQuery.data}
        onRefund={openRefund}
      />

      <RefundModal
        isOpen={isRefundModalOpen}
        onClose={() => {
          setIsRefundModalOpen(false);
          setRefundReason("");
          setRefundAmount("");
          setRefundReference("");
        }}
        onConfirm={handleRefund}
        payment={selectedPayment}
        isLoading={refundMutation.isPending}
        refundReason={refundReason}
        setRefundReason={setRefundReason}
        refundAmount={refundAmount}
        setRefundAmount={setRefundAmount}
        refundReference={refundReference}
        setRefundReference={setRefundReference}
      />
    </div>
  );
}