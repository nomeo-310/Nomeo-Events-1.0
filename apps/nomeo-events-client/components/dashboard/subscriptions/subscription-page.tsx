"use client";

import { useEffect, useMemo, useState } from 'react';
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  TimeIcon,
  CreditCardIcon,
  Invoice01Icon as InvoiceIcon,
  CalendarIcon,
  AlertCircleIcon,
  RefreshIcon,
  File01Icon,
  FileSpreadsheetIcon,
  EyeIcon,
  ArrowRightIcon,
  CreditCardChangeIcon as MoneyBack01Icon,
  Wallet02Icon,
  BankIcon,
  SmartPhoneIcon,
  FilterHorizontalIcon,
  MoreHorizontalIcon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/use-subscription";
import { SubscriptionPaymentModal } from "./subscription-payment-modal";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from '@/lib/utils';
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from '@/components/ui/select';

// ─── Type Definitions ─────────────────────────────────────────────────────────

interface PaymentLimit {
  name?: string;
  included?: boolean;
  limit?: number;
  unit?: string;
  description?: string;
}

interface Plan {
  id: string;
  name: string;
  slug: string;
  tier: string;
  interval: string;
  priceKobo: number;
  priceFormatted: string;
  currency: string;
  description: string;
  features: PaymentLimit[];
  trialDays: number;
  maxEvents: number;
  maxAttendeesPerEvent: number;
  maxTeamMembers: number;
  storageGb: number;
  isActive: boolean;
  metadata?: Record<string, any>;
}

interface User {
  id: string;
}

interface Payment {
  id: string;
  planId: string;
  subscriptionId: string;
  amount: number;
  amountFormatted: string;
  currency: string;
  gatewayStatus: string;
  reference: string;
  gatewayResponse?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  channel?: string;
  cardLast4?: string;
  refundedAt?: string;
}

interface CurrentPeriod {
  start: string;
  end: string;
  daysRemaining: number;
  isExpiringSoon: boolean;
  isOverdue: boolean;
}

interface PaystackInfo {
  subscriptionCode: string | null;
  emailToken: string | null;
  authorizationCode: string | null;
}

interface PaymentStats {
  totalPaid: number;
  totalCount: number;
  lastPaymentDate: string;
  nextPaymentDate: string;
  failedPayments: number;
  successfulPayments: number;
}

interface SubscriptionFlags {
  isActive: boolean;
  isInTrial: boolean;
  isExpiringSoon: boolean;
  isOverdue: boolean;
  isCancelled: boolean;
  isExpired: boolean;
  isPaused: boolean;
  cancelAtPeriodEnd: boolean;
}

interface SubscriptionData {
  id: string;
  status: string;
  statusDescription: string;
  planTier: string;
  planName: string;
  planSlug: string;
  interval: string;
  priceKobo: number;
  priceFormatted: string;
  finalPriceKobo: number;
  finalPriceFormatted: string;
  currency: string;
  coupon: any | null;
  trial: any | null;
  currentPeriod: CurrentPeriod;
  cancellation: any | null;
  limits: {
    maxEvents: number;
    maxAttendeesPerEvent: number;
    maxTeamMembers: number;
    storageGb: number;
  };
  paystack: PaystackInfo;
  paymentStats: PaymentStats;
  payments: Payment[];
  isActive: boolean;
  isInTrial: boolean;
  daysUntilRenewal: number;
  cancelAtPeriodEnd: boolean;
  flags: SubscriptionFlags;
  plan: Plan;
  user: User;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

const formatAmount = (kobo: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(kobo / 100);
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return format(new Date(dateString), 'PPP');
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    trialing: "secondary",
    past_due: "destructive",
    cancelled: "outline",
    expired: "destructive",
    paused: "secondary",
  };
  return variants[status] || "secondary";
};

const getStatusIcon = (status: string) => {
  const icons: Record<string, any> = {
    active: CheckmarkCircle02Icon,
    trialing: TimeIcon,
    past_due: AlertCircleIcon,
    cancelled: CancelCircleIcon,
    expired: AlertCircleIcon,
    paused: TimeIcon,
  };
  return icons[status] || AlertCircleIcon;
};

const getPaymentStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    success: "default",
    pending: "secondary",
    failed: "destructive",
    abandoned: "destructive",
    reversed: "outline",
  };
  return variants[status] || "secondary";
};

const getPaymentStatusIcon = (status: string) => {
  const icons: Record<string, any> = {
    success: CheckmarkCircle02Icon,
    pending: TimeIcon,
    failed: CancelCircleIcon,
    abandoned: AlertCircleIcon,
    reversed: RefreshIcon,
  };
  return icons[status] || AlertCircleIcon;
};

const getChannelIcon = (channel?: string) => {
  const icons: Record<string, any> = {
    card: CreditCardIcon,
    bank: BankIcon,
    ussd: SmartPhoneIcon,
    mobile_money: SmartPhoneIcon,
    wallet: Wallet02Icon,
  };
  return icons[channel?.toLowerCase() || ''] || CreditCardIcon;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={`rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] ${className ?? ''}`} />
  );
}

function SubscriptionSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-inherit">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div className="container mx-auto pb-5 md:pb-8 px-4">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <SkeletonLine className="h-8 w-48" />
              <SkeletonLine className="h-4 w-64 mt-2" />
            </div>
            <SkeletonLine className="h-9 w-24" />
          </div>
          
          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonLine key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Subscription Details Skeleton */}
        <div className="mb-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="space-y-6">
            <SkeletonLine className="h-6 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonLine key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <SkeletonLine className="h-24 rounded-lg" />
            <SkeletonLine className="h-32 rounded-lg" />
          </div>
        </div>

        {/* Payment History Skeleton */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <SkeletonLine className="h-6 w-36" />
              <SkeletonLine className="h-4 w-48 mt-1" />
            </div>
            <SkeletonLine className="h-9 w-32" />
          </div>
          
          {/* Payment Stats Skeleton */}
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonLine key={i} className="h-24 rounded-xl" />
            ))}
          </div>

          {/* Filters Skeleton */}
          <div className="flex gap-3">
            <SkeletonLine className="h-10 flex-1" />
            <SkeletonLine className="h-10 w-36" />
            <SkeletonLine className="h-10 w-36" />
          </div>

          {/* Table Skeleton */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="p-4 space-y-3">
              <div className="flex gap-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                <SkeletonLine className="h-3 w-3" />
                <SkeletonLine className="h-3 w-32" />
                <SkeletonLine className="h-3 w-24" />
                <SkeletonLine className="h-3 w-20" />
                <SkeletonLine className="h-3 w-24" />
                <SkeletonLine className="h-3 w-20" />
                <SkeletonLine className="h-3 w-7 ml-auto" />
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 dark:border-gray-800">
                  <SkeletonLine className="h-4 w-4 rounded" />
                  <SkeletonLine className="h-3 w-32" />
                  <SkeletonLine className="h-3 w-24" />
                  <SkeletonLine className="h-5 w-20 rounded-full" />
                  <SkeletonLine className="h-3 w-24" />
                  <SkeletonLine className="h-3 w-20" />
                  <SkeletonLine className="h-7 w-7 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Stats Component ────────────────────────────────────────────────────

function PaymentStats({ payments }: { payments: Payment[] }) {
  const totalPayments = payments.length;
  const successfulPayments = payments.filter(p => p.gatewayStatus === 'success').length;
  const pendingPayments = payments.filter(p => p.gatewayStatus === 'pending').length;
  const failedPayments = payments.filter(p => p.gatewayStatus === 'failed').length;
  const refundedPayments = payments.filter(p => p.refundedAt).length;

  const statsCards = [
    { label: 'Total', value: totalPayments, icon: InvoiceIcon, color: 'text-indigo-600' },
    { label: 'Successful', value: successfulPayments, icon: CheckmarkCircle02Icon, color: 'text-emerald-600' },
    { label: 'Pending', value: pendingPayments, icon: TimeIcon, color: 'text-amber-600' },
    { label: 'Failed', value: failedPayments, icon: CancelCircleIcon, color: 'text-red-600' },
    { label: 'Refunded', value: refundedPayments, icon: MoneyBack01Icon, color: 'text-purple-600' },
  ];

  return (
    <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
      {statsCards.map(({ label, value, icon: Icon, color }) => (
        <div 
          key={label} 
          className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3.5 transition-colors hover:border-gray-200 dark:hover:border-gray-700 group"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide truncate">{label}</p>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
              {value}
            </p>
            <HugeiconsIcon 
              icon={Icon} 
              className={`h-4 w-4 ${color} opacity-60 group-hover:opacity-100 transition-opacity dark:opacity-80`} 
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Payment History Table with Pagination ────────────────────────────────────

function PaymentHistoryTable({ payments }: { payments: Payment[] }) {
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Number of payments per page

  const handleViewPayment = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setIsModalOpen(true);
  };

  // Filter payments - memoized to prevent unnecessary recalculations
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch = searchTerm === "" || 
        payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || payment.gatewayStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const exportToCSV = () => {
    if (filteredPayments.length === 0) {
      toast.error("No payments to export");
      return;
    }
    
    const headers = ['Reference', 'Amount', 'Status', 'Channel', 'Date', 'Paid At'];
    const rows = filteredPayments.map((payment: Payment) => [
      payment.reference,
      payment.amountFormatted || formatAmount(payment.amount),
      payment.gatewayStatus,
      payment.channel || '',
      payment.createdAt ? formatDate(payment.createdAt) : '',
      payment.paidAt ? formatDate(payment.paidAt) : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment_history_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredPayments.length} payments to CSV`);
  };

  const exportToPDF = async () => {
    if (filteredPayments.length === 0) {
      toast.error("No payments to export");
      return;
    }
    
    setIsExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 297, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("Payment History Report", 20, 28);
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'PPP p')}`, 20, 55);
      doc.text(`Total Payments: ${filteredPayments.length}`, 20, 62);
      
      const tableData = filteredPayments.map((payment: Payment) => [
        payment.reference,
        payment.amountFormatted || formatAmount(payment.amount),
        payment.gatewayStatus,
        payment.channel?.toUpperCase() || 'N/A',
        payment.createdAt ? format(new Date(payment.createdAt), 'MMM dd, yyyy') : 'N/A',
        payment.paidAt ? format(new Date(payment.paidAt), 'MMM dd, yyyy') : 'N/A',
      ]);
      
      autoTable(doc, {
        startY: 80,
        head: [["Reference", "Amount", "Status", "Channel", "Created", "Paid At"]],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 35 },
          5: { cellWidth: 35 },
        },
      });
      
      doc.save(`payment_history_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      toast.success("PDF exported successfully");
    } catch (error) {
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const hasFilters = searchTerm || statusFilter !== "all";

  // Pagination component
  const PaginationControls = () => {
    const maxVisiblePages = 5;
    
    const getVisiblePages = useMemo(() => {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      const pages: number[] = [];
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    }, [currentPage, totalPages]);

    const visiblePages = getVisiblePages;

    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing <span className="font-semibold">{startIndex + 1}</span> -{' '}
          <span className="font-semibold">{Math.min(endIndex, filteredPayments.length)}</span> of{' '}
          <span className="font-semibold">{filteredPayments.length.toLocaleString()}</span> payments
        </div>
        
        <nav className="flex items-center justify-center space-x-1" aria-label="Pagination">
          {/* Previous Button */}
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Go to previous page"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} className="w-4 h-4" />
          </button>

          {/* First Page */}
          {visiblePages[0] > 1 && (
            <>
              <button
                onClick={() => setCurrentPage(1)}
                className={cn(
                  'min-w-[2.5rem] h-10 px-3 rounded-lg font-medium transition-colors',
                  currentPage === 1
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                1
              </button>
              {visiblePages[0] > 2 && (
                <span className="px-2">
                  <HugeiconsIcon icon={MoreHorizontalIcon} className="w-4 h-4 text-gray-400" />
                </span>
              )}
            </>
          )}

          {/* Visible Page Numbers */}
          {visiblePages.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={cn(
                'min-w-[2.5rem] h-10 px-3 rounded-lg font-medium transition-colors',
                currentPage === page
                  ? 'bg-blue-600 text-white dark:bg-blue-500'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          ))}

          {/* Last Page */}
          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="px-2">
                  <HugeiconsIcon icon={MoreHorizontalIcon} className="w-4 h-4 text-gray-400" />
                </span>
              )}
              <button
                onClick={() => setCurrentPage(totalPages)}
                className={cn(
                  'min-w-[2.5rem] h-10 px-3 rounded-lg font-medium transition-colors',
                  currentPage === totalPages
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                {totalPages}
              </button>
            </>
          )}

          {/* Next Button */}
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Go to next page"
          >
            <HugeiconsIcon icon={ArrowRight02Icon} className="w-4 h-4" />
          </button>
        </nav>
      </div>
    );
  };

  if (payments.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center mx-auto mb-4">
          <HugeiconsIcon icon={InvoiceIcon} className="h-6 w-6 text-gray-300 dark:text-gray-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No Payments Found</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500">No payment records found for this subscription</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Payment History</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            All payments made for your subscription
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={exportToCSV} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 h-10 px-3">
            <HugeiconsIcon icon={FileSpreadsheetIcon} className="h-3.5 w-3.5 mr-2" />
            Export CSV
          </Button>
          <Button type="button" variant="outline" onClick={exportToPDF} disabled={isExporting} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 h-10 px-3">
            <HugeiconsIcon icon={File01Icon} className="h-3.5 w-3.5 mr-2" />
            {isExporting ? "Exporting..." : "Export PDF"}
          </Button>
        </div>
      </div>

      {/* Payment Stats */}
      <PaymentStats payments={payments} />

      {/* Filters - Redesigned with proper input and shadcn Select */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input - Fixed focus issue */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by reference or ID..."
            className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-gray-100"
          />
        </div>
        
        {/* Shadcn Select for Status Filter */}
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || "all")}>
          <SelectTrigger className="w-[180px] h-10">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="abandoned">Abandoned</SelectItem>
            <SelectItem value="reversed">Reversed</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Clear Filters Button */}
        {hasFilters && (
          <Button
            type="button"
            onClick={clearFilters}
            variant="ghost"
            size="sm"
            className="text-gray-500 dark:text-gray-400"
          >
            <HugeiconsIcon icon={FilterHorizontalIcon} className="h-3.5 w-3.5 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Desktop Table */}
      {currentPayments.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center mx-auto mb-4">
            <HugeiconsIcon icon={InvoiceIcon} className="h-6 w-6 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No Matching Payments</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            No payments match your current filters
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-x-auto">
            <div className="overflow-x-auto rounded-2xl">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm z-10">
                  <TableRow className="bg-gray-50/90 dark:bg-gray-800/90 hover:bg-gray-50/90 dark:hover:bg-gray-800/90 border-gray-100 dark:border-gray-800">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Reference</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Amount</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Channel</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Created</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Paid At</TableHead>
                    <TableHead className="w-20 text-[11px] font-semibold uppercase tracking-wider text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentPayments.map((payment: Payment) => (
                    <TableRow
                      key={payment.id}
                      className="border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <TableCell>
                        <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">
                          {payment.reference}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {payment.amountFormatted || formatAmount(payment.amount)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-start">
                          <Badge variant={getPaymentStatusBadge(payment.gatewayStatus)} className="gap-1 capitalize">
                            <HugeiconsIcon icon={getPaymentStatusIcon(payment.gatewayStatus)} size={12} />
                            {payment.gatewayStatus}
                          </Badge>
                        </div>
                        {payment.refundedAt && (
                          <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">
                            Refunded
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <HugeiconsIcon icon={getChannelIcon(payment.channel)} size={12} className="text-gray-400" />
                          <span className="text-xs font-mono text-gray-600 dark:text-gray-400 uppercase">
                            {payment.channel || 'N/A'}
                          </span>
                        </div>
                        {payment.cardLast4 && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                            •••• {payment.cardLast4}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.createdAt ? format(new Date(payment.createdAt), 'dd MMM yy') : 'N/A'}
                        {payment.createdAt && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            {format(new Date(payment.createdAt), 'HH:mm')}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.paidAt ? format(new Date(payment.paidAt), 'dd MMM yy') : '—'}
                        {payment.paidAt && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            {format(new Date(payment.paidAt), 'HH:mm')}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 dark:hover:bg-gray-800"
                            onClick={() => handleViewPayment(payment.id)}
                          >
                            <HugeiconsIcon icon={EyeIcon} className="h-3.5 w-3.5 dark:text-gray-400" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile View with Pagination */}
          <div className="md:hidden space-y-3">
            {currentPayments.map((payment: Payment) => (
              <div key={payment.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {payment.reference}
                    </span>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                      {payment.amountFormatted || formatAmount(payment.amount)}
                    </p>
                  </div>
                  <Badge variant={getPaymentStatusBadge(payment.gatewayStatus)} className="gap-1 shrink-0 capitalize">
                    <HugeiconsIcon icon={getPaymentStatusIcon(payment.gatewayStatus)} size={12} />
                    {payment.gatewayStatus}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Channel</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <HugeiconsIcon icon={getChannelIcon(payment.channel)} size={12} className="text-gray-400" />
                      <p className="font-medium text-gray-700 dark:text-gray-300 uppercase">{payment.channel || 'N/A'}</p>
                    </div>
                    {payment.cardLast4 && (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        •••• {payment.cardLast4}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Created</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{payment.createdAt ? formatDate(payment.createdAt) : 'N/A'}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleViewPayment(payment.id)}
                >
                  <HugeiconsIcon icon={EyeIcon} className="h-3 w-3 mr-2" />
                  View Details
                </Button>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <PaginationControls />
        </>
      )}

      {/* Subscription Payment Modal */}
      <SubscriptionPaymentModal
        paymentId={selectedPaymentId}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPaymentId(null);
        }}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const SubscriptionPage = () => {
  const { subscription, isLoading, error, refresh } = useSubscription();

  if (isLoading) {
    return <SubscriptionSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <HugeiconsIcon icon={AlertCircleIcon} size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to Load Subscription</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
          <Button onClick={() => refresh()} className="mt-4">
            <HugeiconsIcon icon={RefreshIcon} size={16} className="mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const subscriptionData = subscription as SubscriptionData | null;
  const hasActiveSubscription = subscriptionData && subscriptionData.isActive;

  // Stats cards using serialized data fields
  const statsCards = [
    { 
      label: 'Status', 
      value: subscriptionData?.status?.toUpperCase() || 'N/A', 
      icon: getStatusIcon(subscriptionData?.status || 'active'), 
      color: subscriptionData?.status === 'active' ? 'text-emerald-600' : subscriptionData?.status === 'trialing' ? 'text-blue-600' : 'text-gray-600',
      subValue: subscriptionData?.statusDescription 
    },
    { 
      label: 'Plan', 
      value: subscriptionData?.planName || 'N/A', 
      icon: InvoiceIcon, 
      color: 'text-indigo-600',
      subValue: subscriptionData?.interval ? `${subscriptionData.interval} billing` : ''
    },
    { 
      label: 'Price', 
      value: subscriptionData?.priceFormatted || formatAmount(subscriptionData?.priceKobo || 0), 
      icon: CreditCardIcon, 
      color: 'text-purple-600',
      subValue: subscriptionData?.coupon ? `with ${subscriptionData.coupon.discount}% off` : `per ${subscriptionData?.interval || 'billing cycle'}`
    },
    { 
      label: 'Days Left', 
      value: subscriptionData?.currentPeriod?.daysRemaining || 0, 
      icon: CalendarIcon, 
      color: 'text-amber-600',
      subValue: subscriptionData?.currentPeriod?.daysRemaining === 1 ? 'day remaining' : 'days remaining'
    },
    { 
      label: 'Total Paid', 
      value: subscriptionData?.paymentStats?.totalPaid ? formatAmount(subscriptionData.paymentStats.totalPaid) : '₦0', 
      icon: InvoiceIcon, 
      color: 'text-green-600',
      subValue: `${subscriptionData?.paymentStats?.totalCount || 0} payment(s)`
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-inherit">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      <div className="container mx-auto pb-5 md:pb-8 px-4">
        
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                Subscription Management
              </h1>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                Manage your subscription plan, monitor usage, and view payment history
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => refresh()}
                variant="outline"
                className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 h-10 px-3"
              >
                <HugeiconsIcon icon={RefreshIcon} className="h-3.5 w-3.5 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Subscription Stats Cards */}
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
            {statsCards.map(({ label, value, icon: Icon, color, subValue }) => (
              <div key={label} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3.5 transition-colors hover:border-gray-200 dark:hover:border-gray-700 group">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide truncate">{label}</p>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                      {typeof value === 'number' ? value : value}
                    </p>
                    {subValue && (
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{subValue}</p>
                    )}
                  </div>
                  <HugeiconsIcon icon={Icon} className={`h-4 w-4 ${color} opacity-60 group-hover:opacity-100 transition-opacity dark:opacity-80`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {!hasActiveSubscription ? (
          /* No Active Subscription */
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center mx-auto mb-4">
              <HugeiconsIcon icon={InvoiceIcon} className="h-6 w-6 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No Active Subscription</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
              You don't have an active subscription. Choose a plan to get started.
            </p>
            <Button>
              <a href="/pricing">
                View Plans
                <HugeiconsIcon icon={ArrowRightIcon} size={16} className="ml-2" />
              </a>
            </Button>
          </div>
        ) : (
          /* Active Subscription View */
          <>
            {/* Subscription Details Section */}
            <div className="mb-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Current Subscription</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Details of your active plan</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(subscriptionData.status)} className="capitalize">
                    <HugeiconsIcon icon={getStatusIcon(subscriptionData.status)} size={12} className="mr-1" />
                    {subscriptionData.status}
                  </Badge>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Subscription Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Plan Details</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{subscriptionData.planName}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 capitalize mt-1">
                      {subscriptionData.interval} billing • Tier: {subscriptionData.planTier}
                    </p>
                    {subscriptionData.coupon && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        Coupon applied: {subscriptionData.coupon.code} ({subscriptionData.coupon.discount}% off)
                      </p>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Billing Period</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatDate(subscriptionData.currentPeriod?.start)} - {formatDate(subscriptionData.currentPeriod?.end)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {subscriptionData.currentPeriod?.daysRemaining} days remaining
                      </p>
                      {subscriptionData.currentPeriod?.isExpiringSoon && (
                        <Badge variant="destructive" className="text-[10px]">Expiring Soon</Badge>
                      )}
                      {subscriptionData.currentPeriod?.isOverdue && (
                        <Badge variant="destructive" className="text-[10px]">Overdue</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pricing</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {subscriptionData.priceFormatted || formatAmount(subscriptionData.priceKobo)}
                    </p>
                    {subscriptionData.finalPriceKobo !== subscriptionData.priceKobo && (
                      <>
                        <p className="text-xs text-gray-400 line-through mt-1">
                          Original: {formatAmount(subscriptionData.priceKobo)}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Final: {subscriptionData.finalPriceFormatted}
                        </p>
                      </>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      per {subscriptionData.interval}
                    </p>
                  </div>
                </div>

                {/* Paystack Information */}
                {subscriptionData.paystack?.subscriptionCode && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-100 dark:border-blue-900/50">
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      Paystack Subscription: {subscriptionData.paystack.subscriptionCode}
                    </p>
                  </div>
                )}

                {/* Plan Limits */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Plan Limits & Features</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">Max Events</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {subscriptionData.limits?.maxEvents === -1 ? '∞' : subscriptionData.limits?.maxEvents || '∞'}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">Attendees/Event</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {subscriptionData.limits?.maxAttendeesPerEvent === -1 ? '∞' : subscriptionData.limits?.maxAttendeesPerEvent || '∞'}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">Team Members</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {subscriptionData.limits?.maxTeamMembers === -1 ? '∞' : subscriptionData.limits?.maxTeamMembers || '∞'}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">Storage</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {subscriptionData.limits?.storageGb || 0} GB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Alerts */}
                {subscriptionData.cancelAtPeriodEnd && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50">
                    <div className="flex items-start gap-2">
                      <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-red-600 dark:text-red-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                          Subscription Scheduled for Cancellation
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
                          Your subscription will be cancelled on {formatDate(subscriptionData.currentPeriod?.end)}. 
                          You will lose access to premium features after this date.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {subscriptionData.flags?.isExpired && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50">
                    <p className="text-xs text-red-700 dark:text-red-400">
                      Your subscription has expired. Please renew to continue using premium features.
                    </p>
                  </div>
                )}

                {subscriptionData.isInTrial && subscriptionData.trial && (
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
                    <div className="flex items-start gap-2">
                      <HugeiconsIcon icon={TimeIcon} size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                          Trial Period Active
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-300 mt-0.5">
                          Your free trial ends on {formatDate(subscriptionData.trial.end)} ({subscriptionData.trial.daysRemaining} days remaining). 
                          You will be billed {subscriptionData.priceFormatted} {subscriptionData.interval} after the trial ends.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cancellation Info */}
                {subscriptionData.cancellation && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Cancelled on {formatDate(subscriptionData.cancellation.at)} 
                      {subscriptionData.cancellation.reason && ` • Reason: ${subscriptionData.cancellation.reason}`}
                      {subscriptionData.cancellation.endsAtPeriodEnd && " • Access until period end"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History Section - Standalone outside card */}
            <PaymentHistoryTable payments={subscriptionData.payments || []} />
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPage;