"use client";

import { useState, type JSX } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon as XIcon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  CreditCardIcon,
  BankIcon,
  GlobeIcon,
  TicketIcon,
  Invoice01Icon as ReceiptIcon,
  MoneyBag01Icon as CurrencyDollarCircleIcon,
  TimeIcon,
  RefreshIcon,
  CopyIcon,
  Alert02Icon as AlertIcon,
  CalendarIcon,
  DocumentValidationIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaymentWithPlanDetails } from "@/hooks/use-payments";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubscriptionPaymentModalProps {
  paymentId: string | null;
  open: boolean;
  onClose: () => void;
}

// Helper functions
const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(amount / 100);
};

const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'PPP p');
};

const formatDateShort = (dateString: string) => {
  return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
};

const getStatusConfig = (status: string) => {
  const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any; label: string; color: string }> = {
    success: { variant: "default", icon: CheckmarkCircle02Icon, label: "Success", color: "green" },
    pending: { variant: "secondary", icon: RefreshIcon, label: "Pending", color: "yellow" },
    failed: { variant: "destructive", icon: AlertIcon, label: "Failed", color: "red" },
    abandoned: { variant: "destructive", icon: AlertIcon, label: "Abandoned", color: "red" },
    reversed: { variant: "outline", icon: RefreshIcon, label: "Reversed", color: "gray" },
  };
  return statusMap[status] || { variant: "secondary", icon: RefreshIcon, label: status, color: "gray" };
};

// Info Row Component
function InfoRow({ label, value, highlight, copyable }: { label: string; value: React.ReactNode; highlight?: boolean; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    if (typeof value === 'string' && value !== 'N/A') {
      navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0 w-32">{label}</span>
      <div className="flex-1 flex items-center gap-2">
        <span className={cn(
          "text-sm break-all",
          highlight ? "font-semibold text-indigo-600 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300"
        )}>
          {value || 'N/A'}
        </span>
        {copyable && typeof value === 'string' && value && value !== 'N/A' && (
          <button
            onClick={handleCopy}
            className="p-1 rounded-md text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0"
            title="Copy to clipboard"
          >
            <HugeiconsIcon icon={CopyIcon} size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// Section Component
function Section({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <HugeiconsIcon icon={icon} size={14} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-4">
        {children}
      </div>
    </div>
  );
}

// Loading State Component
function ModalSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div>
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="text-right">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-7 w-28" />
        </div>
      </div>
      
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-lg" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SubscriptionPaymentModal({ paymentId, open, onClose }: SubscriptionPaymentModalProps): JSX.Element | null {
  const [activeTab, setActiveTab] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading, error } = usePaymentWithPlanDetails( paymentId || '', { enabled: !!paymentId && open });

  if (!open) return null;

  const paymentData = data?.data;
  const payment = paymentData?.payment;
  const planDetails = paymentData?.planDetails;
  const pricingBreakdown = paymentData?.pricingBreakdown;
  const summary = paymentData?.summary;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full sm:max-w-4xl bg-white dark:bg-gray-900 sm:rounded-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 px-5 py-5">
            <ModalSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full sm:max-w-4xl bg-white dark:bg-gray-900 sm:rounded-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Error Loading Payment</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <HugeiconsIcon icon={XIcon} size={20} />
            </button>
          </div>
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <HugeiconsIcon icon={AlertIcon} size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to Load Payment Details</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(payment.gateway.status);

  const exportPaymentToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("Subscription Payment Receipt", 20, 28);
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'PPP p')}`, 20, 55);
      doc.text(`Receipt ID: ${payment._id.substring(0, 12)}`, 20, 62);
      
      // Status badge
      const isSuccess = payment.gateway.status === 'success';
      doc.setFillColor(isSuccess ? 34 : 239, isSuccess ? 197 : 68, isSuccess ? 94 : 68);
      doc.roundedRect(150, 50, 40, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(payment.gateway.status.toUpperCase(), 170, 57);
      
      // Payment info table
      doc.setTextColor(0, 0, 0);
      autoTable(doc, {
        startY: 75,
        head: [['Field', 'Value']],
        body: [
          ['Reference', payment.gateway.reference],
          ['Paystack Reference', payment.gateway.paystackReference || 'N/A'],
          ['Purpose', payment.purpose?.replace('_', ' ') || 'Subscription'],
          ['Plan', summary?.planName || 'N/A'],
          ['Billing Interval', summary?.billingInterval || 'N/A'],
          ['Subtotal', summary?.subtotal || 'N/A'],
          ['Discount', summary?.discount || 'N/A'],
          ['Total', summary?.total || 'N/A'],
          ['Amount Paid', summary?.amountPaid || 'N/A'],
          ['Channel', payment.gateway.channel?.toUpperCase() || 'N/A'],
          ['Status', payment.gateway.status.toUpperCase()],
          ['Created', formatDateShort(payment.createdAt)],
          ['Paid At', payment.gateway.paidAt ? formatDateShort(payment.gateway.paidAt) : 'N/A'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 130 },
        },
      });
      
      doc.save(`subscription_payment_${payment.gateway.reference}.pdf`);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative w-full sm:max-w-4xl bg-white dark:bg-gray-900 sm:rounded-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={ReceiptIcon} size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">Subscription Payment Details</p>
              <p className="text-xs text-gray-400 truncate mt-1">{payment.gateway.reference}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <HugeiconsIcon icon={XIcon} size={18} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-5 py-5 space-y-5">
            {/* Status Header */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-800">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  payment.gateway.status === 'success' ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"
                )}>
                  <HugeiconsIcon 
                    icon={statusConfig.icon} 
                    size={20} 
                    className={payment.gateway.status === 'success' ? "text-green-600" : "text-amber-600"} 
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Payment Status</p>
                  <Badge variant={statusConfig.variant} className="mt-1">
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatAmount(payment.amount.intended)}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="space-y-4">
              <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "subscription", label: "Subscription Details" },
                  { id: "payment", label: "Payment Details" },
                  { id: "technical", label: "Technical" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-colors relative",
                      activeTab === tab.id
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                    )}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-5">
                  {/* Basic Information */}
                  <Section title="Basic Information" icon={ReceiptIcon}>
                    <InfoRow label="Payment ID" value={payment._id} copyable />
                    <InfoRow label="Reference" value={payment.gateway.reference} copyable />
                    <InfoRow label="Paystack Ref" value={payment.gateway.paystackReference} copyable />
                    <InfoRow label="Purpose" value={payment.purpose?.replace('_', ' ') || 'Subscription'} />
                    <InfoRow label="Provider" value={payment.provider || 'Paystack'} />
                    <InfoRow label="Channel" value={payment.gateway.channel?.toUpperCase()} />
                  </Section>

                  {/* Amount Details with Pricing Breakdown */}
                  <Section title="Amount Details" icon={CurrencyDollarCircleIcon}>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg">
                          <p className="text-[10px] text-gray-400 uppercase">Subtotal</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {pricingBreakdown?.originalAmountFormatted || formatAmount(payment.amount.intended)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg">
                          <p className="text-[10px] text-gray-400 uppercase">Discount</p>
                          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                            {pricingBreakdown?.discountAmountFormatted || formatAmount(payment.amount.discount)}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg">
                          <p className="text-[10px] text-gray-400 uppercase">Total</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {pricingBreakdown?.finalAmountFormatted || formatAmount(payment.amount.paid)}
                          </p>
                        </div>
                      </div>
                      
                      {pricingBreakdown?.discountPercentage && parseFloat(pricingBreakdown.discountPercentage) > 0 && (
                        <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                          <p className="text-xs text-green-700 dark:text-green-300">
                            <span className="font-semibold">Savings:</span> {pricingBreakdown.discountPercentage}% off
                          </p>
                        </div>
                      )}

                      {payment.couponApplied && (
                        <div className="mt-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                          <p className="text-xs text-orange-700 dark:text-orange-300">
                            <span className="font-semibold">Coupon Applied:</span> {payment.couponApplied.code}
                            {payment.couponApplied.discountFormatted && ` (${payment.couponApplied.discountFormatted} off)`}
                          </p>
                        </div>
                      )}
                    </div>
                  </Section>

                  {/* Timeline */}
                  <Section title="Timeline" icon={TimeIcon}>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500"></div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Created</p>
                          <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-gray-400"></div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Last Updated</p>
                          <p className="text-xs text-gray-500">{formatDate(payment.updatedAt)}</p>
                        </div>
                      </div>
                      {payment.gateway.paidAt && (
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Paid At</p>
                            <p className="text-xs text-gray-500">{formatDate(payment.gateway.paidAt)}</p>
                          </div>
                        </div>
                      )}
                      {payment.refund?.refundedAt && (
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500"></div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Refunded At</p>
                            <p className="text-xs text-gray-500">{formatDate(payment.refund.refundedAt)}</p>
                            {payment.refund.amount && (
                              <p className="text-xs text-gray-500 mt-1">Amount: {formatAmount(payment.refund.amount)}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Section>
                </div>
              )}

              {/* Subscription Details Tab */}
              {activeTab === "subscription" && planDetails && (
                <div className="space-y-5">
                  {/* Plan Information */}
                  <Section title="Plan Information" icon={DocumentValidationIcon}>
                    <InfoRow label="Plan Name" value={planDetails.name} highlight />
                    <InfoRow label="Plan Tier" value={planDetails.tier?.charAt(0).toUpperCase() + planDetails.tier?.slice(1)} />
                    <InfoRow label="Billing Interval" value={planDetails.pricing.intervalFormatted} />
                    <InfoRow label="Trial Period" value={planDetails.pricing.trialPeriodFormatted} />
                    <InfoRow label="Base Price" value={planDetails.pricing.basePriceFormatted} />
                  </Section>

                  {/* Plan Limits */}
                  <Section title="Plan Limits" icon={CreditCardIcon}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Events</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{planDetails.limits.maxEventsFormatted}</p>
                      </div>
                      <div className="text-center p-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Attendees/Event</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{planDetails.limits.maxAttendeesPerEventFormatted}</p>
                      </div>
                      <div className="text-center p-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Team Members</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{planDetails.limits.maxTeamMembersFormatted}</p>
                      </div>
                      <div className="text-center p-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Storage</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{planDetails.limits.storageFormatted}</p>
                      </div>
                    </div>
                  </Section>

                  {/* Plan Features - Updated to use grid layout */}
                  {planDetails.features && planDetails.features.length > 0 && (
                    <Section title="Features" icon={TicketIcon}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {planDetails.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-gray-900/50">
                            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{feature.name}</p>
                              {feature.description && (
                                <p className="text-xs text-gray-500 line-clamp-2">{feature.description}</p>
                              )}
                              {feature.limit && feature.limit > 0 && (
                                <p className="text-xs text-gray-400 mt-0.5">Limit: {feature.limitFormatted}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}
                </div>
              )}

              {/* Payment Details Tab */}
              {activeTab === "payment" && (
                <div className="space-y-5">
                  {/* Gateway Information */}
                  <Section title="Gateway Information" icon={CreditCardIcon}>
                    <InfoRow label="Gateway Status" value={payment.gateway.status} />
                    <InfoRow label="Gateway Response" value={payment.gateway.response} />
                    <InfoRow label="Reference" value={payment.gateway.reference} copyable />
                    <InfoRow label="Paystack Reference" value={payment.gateway.paystackReference} copyable />
                  </Section>

                  {/* Payment Method Information */}
                  {payment.paymentMethod && (payment.paymentMethod.type || payment.paymentMethod.last4 || payment.paymentMethod.bank) && (
                    <Section title="Payment Method" icon={BankIcon}>
                      {payment.paymentMethod.type && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-500">Card Type</span>
                          <span className="text-sm font-medium uppercase">{payment.paymentMethod.type}</span>
                        </div>
                      )}
                      {payment.paymentMethod.last4 && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-500">Card Number</span>
                          <span className="text-sm font-mono">•••• •••• •••• {payment.paymentMethod.last4}</span>
                        </div>
                      )}
                      {payment.paymentMethod.bank && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-500">Issuing Bank</span>
                          <span className="text-sm">{payment.paymentMethod.bank}</span>
                        </div>
                      )}
                    </Section>
                  )}

                  {/* Context Information */}
                  {(payment.context?.subscriptionId || payment.context?.planId) && (
                    <Section title="Context Information" icon={TicketIcon}>
                      {payment.context?.subscriptionId && (
                        <InfoRow label="Subscription ID" value={payment.context.subscriptionId} copyable />
                      )}
                      {payment.context?.planId && (
                        <InfoRow label="Plan ID" value={payment.context.planId} copyable />
                      )}
                    </Section>
                  )}

                  {/* Refund Information */}
                  {payment.refund?.refundedAt && (
                    <Section title="Refund Information" icon={AlertIcon}>
                      <InfoRow label="Refund Reason" value={payment.refund.reason} />
                      <InfoRow label="Refund Reference" value={payment.refund.reference} copyable />
                      <InfoRow label="Refund Amount" value={payment.refund.amountFormatted} />
                    </Section>
                  )}
                </div>
              )}

              {/* Technical Tab */}
              {activeTab === "technical" && (
                <div className="space-y-5">
                  <Section title="Technical Details" icon={GlobeIcon}>
                    <InfoRow label="Provider" value={payment.provider || 'Paystack'} />
                    <InfoRow label="Gateway Response" value={payment.gateway.response} />
                  </Section>

                  {summary && (
                    <Section title="Billing Summary" icon={CalendarIcon}>
                      <InfoRow label="Plan Name" value={summary.planName} />
                      <InfoRow label="Tier" value={summary.planTier} />
                      <InfoRow label="Billing Interval" value={summary.billingInterval} />
                      <InfoRow label="Trial Period" value={summary.trialPeriod} />
                      {summary.subtotal && <InfoRow label="Subtotal" value={summary.subtotal} />}
                      {summary.discount && <InfoRow label="Discount" value={summary.discount} />}
                      {summary.total && <InfoRow label="Total" value={summary.total} />}
                    </Section>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 shrink-0">
          <Button variant="ghost" onClick={onClose} className="text-gray-600 dark:text-gray-400">
            Close
          </Button>
          <Button 
            onClick={exportPaymentToPDF} 
            disabled={isExporting}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            {isExporting ? (
              <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin" />
            ) : (
              <HugeiconsIcon icon={ReceiptIcon} size={16} />
            )}
            {isExporting ? "Exporting..." : "Export PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}