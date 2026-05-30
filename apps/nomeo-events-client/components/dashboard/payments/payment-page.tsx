"use client";

import React, { useState, useMemo, useEffect, useRef, type ComponentProps } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Loading01Icon, CheckmarkSquare04Icon, PartyIcon, UnavailableIcon, 
  DocumentValidationIcon, Search01Icon, FilterHorizontalIcon, RefreshIcon, 
  File01Icon, FileSpreadsheetIcon, CreditCardIcon, AlertCircleIcon, 
  CheckmarkCircle02Icon, CancelCircleIcon, TimeIcon, Invoice01Icon as ReceiptIcon, 
  MoreHorizontalCircle01Icon, Delete03Icon, Refresh03Icon as RefreshCircle02Icon,
  MoneyExchange01Icon as MoneyBack01Icon, ViewIcon, Cancel01Icon
} from "@hugeicons/core-free-icons";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationWithInfo } from "@/components/ui/pagination";
import { PaymentDetailsModal } from "./payment-details-modal";

type PaymentDetailsModalPayment = ComponentProps<typeof PaymentDetailsModal>["payment"];

// Import the existing hooks
import { 
  usePayments, 
  useRefundPayment,
  Payment, 
  PaymentGatewayStatus,
  PaymentPurpose,
  type PaymentListFilters
} from "@/hooks/use-payments";
import { createPortal } from "react-dom";

// Helper functions
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(amount / 100);
};

const getStatusBadge = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    success: "default",
    pending: "secondary",
    failed: "destructive",
    abandoned: "destructive",
    reversed: "outline",
  };
  return variants[status] || "secondary";
};

const getStatusIcon = (status: string) => {
  const icons: Record<string, any> = {
    success: CheckmarkCircle02Icon,
    pending: TimeIcon,
    failed: CancelCircleIcon,
    abandoned: AlertCircleIcon,
    reversed: RefreshIcon,
  };
  return icons[status] || AlertCircleIcon;
};

// ─── ActionDropdown — portal-based so it never gets clipped ──────────────────

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={`rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] ${className ?? ''}`} />
  );
}

const PaymentsSkeleton = () => (
  <div className="space-y-3">
    <div className="flex gap-3 mb-6">
      <SkeletonLine className="h-10 flex-1" />
      <SkeletonLine className="h-10 w-36" />
      <SkeletonLine className="h-10 w-36" />
    </div>
    <div className="flex gap-4 px-4 pb-3 border-b border-gray-100 dark:border-gray-800">
      <SkeletonLine className="h-3 w-3" />
      <SkeletonLine className="h-3 w-20" />
      <SkeletonLine className="h-3 w-32" />
      <SkeletonLine className="h-3 w-16 ml-auto" />
    </div>
    {Array.from({ length: 7 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800" style={{ opacity: 1 - i * 0.1 }}>
        <SkeletonLine className="h-4 w-4 rounded" />
        <SkeletonLine className="h-3 w-32" />
        <SkeletonLine className="h-3 w-24" />
        <SkeletonLine className="h-5 w-20 rounded-full" />
        <SkeletonLine className="h-3 w-16" />
        <SkeletonLine className="h-7 w-7 rounded-lg" />
      </div>
    ))}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
}

const Modal = ({ isOpen, onClose, title, description, children, footer, size = 'md' }: ModalProps) => {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', esc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxW = size === 'md' ? 'max-w-xl' : 'max-w-3xl';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`relative bg-white dark:bg-gray-900 w-full ${maxW} rounded-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800`}
        style={{ boxShadow: '0 24px 80px -12px rgba(0,0,0,0.18)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">{title}</h3>
            {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{description}</p>}
          </div>
          <Button type="button" onClick={onClose} variant="ghost" size="icon" className="w-7 h-7 rounded-lg flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 dark:text-gray-300">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/60">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Field Component ──────────────────────────────────────────────────────────

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{label}</p>
    <div className="text-sm font-medium text-gray-900 dark:text-white">{children}</div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [purposeFilter, setPurposeFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Build filters for React Query
  const filters: PaymentListFilters = {
    page: currentPage,
    limit: 20,
    ...(statusFilter !== "all" && { gatewayStatus: statusFilter as PaymentGatewayStatus }),
    ...(purposeFilter !== "all" && { purpose: purposeFilter as PaymentPurpose }),
  };

  // Use the existing usePayments hook from your hooks file
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isFetching,
  } = usePayments(filters, {
    placeholderData: (previousData) => previousData,
  });

  // Use the refund mutation hook
  const { mutateAsync: refundPayment, isPending: isRefunding } = useRefundPayment();

  const payments = data?.payments || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  };

  // Filter payments locally for search
  const filteredPayments = useMemo(() => {
    if (!searchTerm) return payments;
    return payments.filter((payment) =>
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment._id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [payments, searchTerm]);

  // Export handlers
  const exportToCSV = (paymentsData: Payment[], filename: string) => {
    const headers = [
      'Reference', 'Paystack Reference', 'Purpose', 'Amount', 'Amount Paid', 
      'Discount', 'Currency', 'Status', 'Channel', 'Created At', 'Updated At',
      'Paid At', 'Card Type', 'Card Last 4', 'Card Bank', 'Coupon Code'
    ];

    const rows = paymentsData.map((payment) => [
      payment.reference,
      (payment as any).paystackReference || '',
      payment.purpose,
      (payment.amount / 100).toString(),
      (payment.amountPaid / 100).toString(),
      (payment.discountAmount / 100).toString(),
      payment.currency,
      payment.gatewayStatus,
      (payment as any).channel || '',
      format(new Date(payment.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      format(new Date(payment.updatedAt), 'yyyy-MM-dd HH:mm:ss'),
      payment.paidAt ? format(new Date(payment.paidAt), 'yyyy-MM-dd HH:mm:ss') : '',
      (payment as any).cardType || '',
      (payment as any).cardLast4 || '',
      (payment as any).cardBank || '',
      payment.couponCode || '',
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
    link.download = `${filename}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPaymentsTableToPDF = async (paymentsData: Payment[], filters: any) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 297, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Payments Report", 20, 28);
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'PPP p')}`, 20, 55);
    doc.text(`Total Payments: ${paymentsData.length}`, 20, 62);
    
    let yOffset = 72;
    if (filters.search) {
      doc.text(`Search: ${filters.search}`, 20, yOffset);
      yOffset += 6;
    }
    if (filters.status && filters.status !== 'all') {
      doc.text(`Status: ${filters.status}`, 20, yOffset);
      yOffset += 6;
    }
    if (filters.purpose && filters.purpose !== 'all') {
      doc.text(`Purpose: ${filters.purpose}`, 20, yOffset);
      yOffset += 6;
    }
    
    const tableData = paymentsData.map((payment) => [
      payment.reference,
      payment.purpose.replace('_', ' '),
      formatAmount(payment.amount),
      payment.gatewayStatus,
      (payment as any).channel?.toUpperCase() || 'N/A',
      format(new Date(payment.createdAt), 'MMM dd, yyyy'),
      (payment as any).paystackReference?.substring(0, 15) || 'N/A',
    ]);
    
    autoTable(doc, {
      startY: yOffset + 6,
      head: [["Reference", "Purpose", "Amount", "Status", "Channel", "Date", "Paystack Ref"]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 },
        6: { cellWidth: 35 },
      },
    });
    
    doc.save(`payments_report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
  };

  const handleExportCSV = () => {
    const data = selected.size > 0 ? payments.filter(p => selected.has(p._id)) : filteredPayments;
    if (data.length === 0) {
      toast.error("No payments to export");
      return;
    }
    exportToCSV(data, `payments_${format(new Date(), 'yyyy-MM-dd-HHmm')}`);
    toast.success(`Exported ${data.length} payments to CSV`);
  };

  const handleExportPDF = async () => {
    const data = selected.size > 0 ? payments.filter(p => selected.has(p._id)) : filteredPayments;
    if (data.length === 0) {
      toast.error("No payments to export");
      return;
    }
    setIsExporting(true);
    try {
      await exportPaymentsTableToPDF(data, {
        search: searchTerm,
        status: statusFilter,
        purpose: purposeFilter
      });
      toast.success(`Exported ${data.length} payments to PDF`);
    } catch (error) {
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = async () => {
    await refetch();
    toast.success("Payments refreshed");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPurposeFilter("all");
    setCurrentPage(1);
    setSelected(new Set());
  };

  const handleSelectAll = () => {
    setSelected(
      selected.size === filteredPayments.length && filteredPayments.length > 0
        ? new Set()
        : new Set(filteredPayments.map((p) => p._id))
    );
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  // Payment actions using the hooks
  const handleRefund = async () => {
    if (!selectedPayment) return;
    try {
      await refundPayment({
        paymentId: selectedPayment._id,
        reason: refundReason,
        amount: refundAmount ? parseInt(refundAmount) * 100 : undefined
      });
      setRefundModalOpen(false);
      setRefundReason('');
      setRefundAmount('');
      toast.success('Refund processed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Refund failed');
    }
  };

  const handleDelete = async () => {
    if (!selectedPayment) return;
    try {
      const response = await fetch(`/api/payments/${selectedPayment._id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Payment record deleted');
        setDeleteModalOpen(false);
        await refetch(); // Refetch after delete
      } else {
        toast.error('Delete failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleReinitiate = async (payment: Payment) => {
    try {
      const response = await fetch(`/api/payments/${payment._id}/reinitiate`, {
        method: 'POST',
      });
      
      if (response.ok) {
        toast.success('Payment reinitiated successfully');
        await refetch(); // Refetch after reinitiate
      } else {
        toast.error('Reinitiation failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const isLoadingState = isLoading && payments.length === 0;
  const isRefreshing = isFetching;
  const hasFilters = searchTerm || statusFilter !== "all" || purposeFilter !== "all";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-inherit">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      <div className="container mx-auto pb-5 md:pb-8 px-4">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                Payments
                {isRefreshing && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent" />
                )}
              </h1>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                Manage and track all payment transactions
              </p>
            </div>
            <div className="flex gap-2">
              <ActionDropdown
                trigger={
                  <Button type="button" variant="outline" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 h-10 px-3">
                    <HugeiconsIcon icon={FileSpreadsheetIcon} className="h-3.5 w-3.5 mr-2" />
                    Export
                  </Button>
                }
                items={[
                  { label: 'Export as CSV', icon: FileSpreadsheetIcon, onClick: handleExportCSV },
                  { divider: true } as const,
                  { label: isExporting ? 'Generating PDF…' : 'Export as PDF', icon: File01Icon, onClick: handleExportPDF },
                  ...(selected.size > 0 ? [{ divider: true, section: `Selected (${selected.size})` } as const] : []),
                ]}
              />
              <Button
                type="button"
                onClick={handleRefresh}
                variant="outline"
                className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 h-10 px-3"
                disabled={isRefreshing}
              >
                <HugeiconsIcon icon={RefreshIcon} className={`h-3.5 w-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
            {[
              { label: 'Total', value: pagination.total, icon: ReceiptIcon, color: 'text-indigo-600' },
              { label: 'Successful', value: payments.filter(p => p.gatewayStatus === 'success').length, icon: CheckmarkCircle02Icon, color: 'text-emerald-600' },
              { label: 'Pending', value: payments.filter(p => p.gatewayStatus === 'pending').length, icon: TimeIcon, color: 'text-amber-600' },
              { label: 'Failed', value: payments.filter(p => p.gatewayStatus === 'failed').length, icon: CancelCircleIcon, color: 'text-red-600' },
              { label: 'Refunded', value: payments.filter(p => p.refundedAt).length, icon: MoneyBack01Icon, color: 'text-purple-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-3.5 transition-colors hover:border-gray-200 dark:hover:border-gray-700 group">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide truncate">{label}</p>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
                    {value}
                  </p>
                  <HugeiconsIcon icon={Icon} className={`h-4 w-4 ${color} opacity-60 group-hover:opacity-100 transition-opacity dark:opacity-80`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl">
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={AlertCircleIcon} className="h-5 w-5 text-red-500 dark:text-red-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">Failed to load payments</p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">{error.message}</p>
              </div>
              <Button
                type="button"
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                className="border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/50"
              >
                <HugeiconsIcon icon={RefreshIcon} className="h-3 w-3 mr-1.5" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-5 flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1 relative h-10 lg:h-11">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
            <Input
              placeholder="Search by reference or ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || "all")}>
            <SelectTrigger className="w-full sm:w-44 dark:bg-gray-900 dark:border-gray-800 dark:text-white">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={FilterHorizontalIcon} className="h-3.5 w-3.5" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="success">
                <HugeiconsIcon icon={CheckmarkSquare04Icon} className='text-green-600 mt-0.5' />
                <span>Success</span>
              </SelectItem>
              <SelectItem value="pending">
                <HugeiconsIcon icon={Loading01Icon} className='text-amber-600 mt-0.5' />
                Pending
              </SelectItem>
              <SelectItem value="failed">
                <HugeiconsIcon icon={CancelCircleIcon} className='text-red-600 mt-0.5' />
                Failed
              </SelectItem>
              <SelectItem value="abandoned">
                <HugeiconsIcon icon={UnavailableIcon} className='text-red-600 mt-0.5' />
                Abandoned
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={purposeFilter} onValueChange={(value) => setPurposeFilter(value || "all")}>
            <SelectTrigger className="w-full sm:w-44 dark:bg-gray-900 dark:border-gray-800 dark:text-white">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={CreditCardIcon} className="h-3.5 w-3.5" />
                <SelectValue placeholder="Purpose" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="all">All Purposes</SelectItem>
              <SelectItem value="event_registration">
                <HugeiconsIcon icon={PartyIcon} className='text-indigo-600 mt-0.5' />
                Event Registration
              </SelectItem>
              <SelectItem value="subscription">
                <HugeiconsIcon icon={DocumentValidationIcon} className='text-indigo-600 mt-0.5' />
                Subscription
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions Bar */}
        {selected.size > 0 && (
          <div className="mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center">
                {selected.size}
              </span>
              <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">selected</span>
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="border-indigo-200 dark:border-indigo-800 bg-white dark:bg-gray-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                onClick={handleExportCSV}
              >
                <HugeiconsIcon icon={FileSpreadsheetIcon} className="h-3 w-3 mr-1.5" /> Export Selected
              </Button>
            </div>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden md:block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          {isLoadingState ? (
            <div className="pb-6"><PaymentsSkeleton /></div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center mx-auto mb-4">
                <HugeiconsIcon icon={ReceiptIcon} className="h-6 w-6 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No Payments Found</h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
                {hasFilters ? 'No payments match your filters' : 'No payment records found'}
              </p>
              {hasFilters && (
                <Button
                  type="button"
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <HugeiconsIcon icon={FilterHorizontalIcon} className="h-3.5 w-3.5 mr-2" /> Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl">
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm z-10">
                    <TableRow className="bg-gray-50/90 dark:bg-gray-800/90 hover:bg-gray-50/90 dark:hover:bg-gray-800/90 border-gray-100 dark:border-gray-800">
                      <TableHead className="w-12 pl-5 text-center">
                        <Checkbox
                          checked={selected.size === filteredPayments.length && filteredPayments.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-center">Reference</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-center">Purpose</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-center">Amount</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-center">Status</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-center">Channel</TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 text-center">Date</TableHead>
                      <TableHead className="w-20 text-[11px] font-semibold uppercase tracking-wider text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow
                        key={payment._id}
                        className="border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        <TableCell className="pl-5 text-center">
                          <Checkbox checked={selected.has(payment._id)} onCheckedChange={() => toggleSelect(payment._id)} />
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono text-[11px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">
                            {payment.reference}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                            {payment.purpose.replace('_', ' ')}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatAmount(payment.amount)}
                          </p>
                          {payment.discountAmount > 0 && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                              -{formatAmount(payment.discountAmount)} discount
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Badge variant={getStatusBadge(payment.gatewayStatus)} className="gap-1">
                              <HugeiconsIcon icon={getStatusIcon(payment.gatewayStatus)} size={12} />
                              {payment.gatewayStatus}
                            </Badge>
                          </div>
                          {payment.refundedAt && (
                            <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-1 text-center">
                              Refunded
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                            {(payment as any).channel?.toUpperCase() || 'N/A'}
                          </span>
                          {(payment as any).cardLast4 && (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">
                              •••• {(payment as any).cardLast4}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(payment.createdAt), 'dd MMM yy')}
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">
                            {format(new Date(payment.createdAt), 'HH:mm')}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 dark:hover:bg-gray-800"
                              onClick={() => { setSelectedPayment(payment); setIsModalOpen(true); }}
                            >
                              <HugeiconsIcon icon={ViewIcon} className="h-3.5 w-3.5 dark:text-gray-400" />
                            </Button>
                            <ActionDropdown
                              trigger={
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 dark:hover:bg-gray-800">
                                  <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-3.5 w-3.5 dark:text-gray-400" />
                                </Button>
                              }
                              items={[
                                { label: 'View Details', icon: ViewIcon, onClick: () => { setSelectedPayment(payment); setIsModalOpen(true); } },
                                ...(payment.gatewayStatus === 'success' && !payment.refundedAt
                                  ? [{ divider: true, section: 'Actions' } as const,
                                     { label: isRefunding ? 'Processing...' : 'Process Refund', 
                                       icon: MoneyBack01Icon, 
                                       onClick: () => { setSelectedPayment(payment); setRefundModalOpen(true); } }]
                                  : []),
                                ...(payment.gatewayStatus === 'failed' || payment.gatewayStatus === 'abandoned'
                                  ? [{ label: 'Reinitiate Payment', icon: RefreshCircle02Icon, onClick: () => handleReinitiate(payment) }]
                                  : []),
                                { divider: true } as const,
                                { label: 'Delete Record', icon: Delete03Icon, onClick: () => { setSelectedPayment(payment); setDeleteModalOpen(true); }, danger: true },
                              ]}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4">
                  <PaginationWithInfo
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
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

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {isLoadingState ? (
            <PaymentsSkeleton />
          ) : filteredPayments.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center mx-auto mb-3">
                <HugeiconsIcon icon={ReceiptIcon} className="h-5 w-5 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No Payments Found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{hasFilters ? 'No matches for your filters' : 'No payment records found'}</p>
            </div>
          ) : (
            filteredPayments.map((payment) => (
              <div key={payment._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Checkbox 
                        checked={selected.has(payment._id)} 
                        onCheckedChange={() => toggleSelect(payment._id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {payment.reference}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize mt-1">
                      {payment.purpose.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                      {(payment as any).paystackReference || 'No ref'}
                    </p>
                  </div>
                  <Badge variant={getStatusBadge(payment.gatewayStatus)} className="gap-1 shrink-0">
                    <HugeiconsIcon icon={getStatusIcon(payment.gatewayStatus)} size={12} />
                    {payment.gatewayStatus}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Amount</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatAmount(payment.amount)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Channel</p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase">{(payment as any).channel || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Date</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{format(new Date(payment.createdAt), 'dd MMM yyyy')}</p>
                  </div>
                  {(payment as any).cardLast4 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Card</p>
                      <p className="text-xs font-mono text-gray-600 dark:text-gray-400">•••• {(payment as any).cardLast4}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs dark:border-gray-700"
                    onClick={() => { setSelectedPayment(payment); setIsModalOpen(true); }}
                  >
                    <HugeiconsIcon icon={ViewIcon} className="h-3 w-3 mr-1" /> View
                  </Button>
                  {payment.gatewayStatus === 'success' && !payment.refundedAt && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs border-purple-200 text-purple-600 dark:border-purple-800 dark:text-purple-400"
                      onClick={() => { setSelectedPayment(payment); setRefundModalOpen(true); }}
                    >
                      <HugeiconsIcon icon={MoneyBack01Icon} className="h-3 w-3 mr-1" /> Refund
                    </Button>
                  )}
                  {(payment.gatewayStatus === 'failed' || payment.gatewayStatus === 'abandoned') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400"
                      onClick={() => handleReinitiate(payment)}
                    >
                      <HugeiconsIcon icon={RefreshCircle02Icon} className="h-3 w-3 mr-1" /> Retry
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
          
          {pagination.totalPages > 1 && (
            <div className="mt-4">
              <PaginationWithInfo
                currentPage={currentPage}
                totalPages={pagination.totalPages}
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

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        payment={selectedPayment}
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPayment(null);
        }}
      />

      {/* Refund Modal */}
      <Modal
        isOpen={refundModalOpen}
        onClose={() => { setRefundModalOpen(false); setRefundReason(''); setRefundAmount(''); }}
        title="Process Refund"
        description={`Payment: ${selectedPayment?.reference}`}
        size="md"
        footer={
          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              onClick={() => { setRefundModalOpen(false); setRefundReason(''); setRefundAmount(''); }} 
              variant="outline" 
              className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 h-10 px-3"
              disabled={isRefunding}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleRefund}  
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white h-10 px-3"
              disabled={isRefunding}
            >
              {isRefunding ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1.5" />
                  Processing...
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={MoneyBack01Icon} className="h-3.5 w-3.5 mr-1.5" />
                  Process Refund
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 rounded-xl">
            <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-1.5">Refund Details:</p>
              <ul className="space-y-1 text-xs text-purple-700 dark:text-purple-400">
                <li>· Amount: {selectedPayment && formatAmount(selectedPayment.amount)}</li>
                <li>· This action will refund the payment via Paystack</li>
                <li>· Refunds typically take 3-5 business days</li>
              </ul>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Refund Amount <span className="font-normal text-gray-400 dark:text-gray-500">(optional, leave empty for full)</span>
            </label>
            <Input
              type="number"
              placeholder="Enter amount to refund..."
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Reason <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
            </label>
            <Input
              placeholder="Reason for refund…"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Payment Record"
        description="This action cannot be undone"
        size="md"
        footer={
          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              onClick={() => setDeleteModalOpen(false)} 
              variant="outline" 
              size="sm" 
              className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleDelete} 
              size="sm" 
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
            >
              <HugeiconsIcon icon={Delete03Icon} className="h-3.5 w-3.5 mr-1.5" /> Delete Permanently
            </Button>
          </div>
        }
      >
        <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl">
          <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1.5">This will permanently delete this payment record:</p>
            <ul className="space-y-1 text-xs text-red-700 dark:text-red-400">
              <li>· Reference: {selectedPayment?.reference}</li>
              <li>· Amount: {selectedPayment && formatAmount(selectedPayment.amount)}</li>
              <li>· This action cannot be reversed</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
}