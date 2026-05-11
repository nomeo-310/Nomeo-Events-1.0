"use client";

import { useState, type JSX } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon as XIcon,
  CheckmarkCircle02Icon,
  Loading03Icon,
  Calendar03Icon as CalendarIcon,
  Building04Icon as BuildingIcon,
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
  UserIcon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Types based on your schema
interface Payment {
  _id: string;
  purpose: string;
  eventId?: string;
  registrationId?: string;
  subscriptionId?: string;
  planId?: string;
  amount: number;
  amountPaid: number;
  discountAmount: number;
  currency: string;
  reference: string;
  paystackReference?: string;
  accessCode?: string;
  authorizationUrl?: string;
  gatewayStatus: string;
  gatewayResponse?: string;
  channel?: string;
  ipAddress?: string;
  paidAt?: string;
  cardType?: string;
  cardLast4?: string;
  cardBank?: string;
  createdAt: string;
  updatedAt: string;
  couponCode?: string;
  couponDiscount?: number;
  provider?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReference?: string;
  refundReason?: string;
}

interface PaymentDetailsModalProps {
  payment: Payment | null;
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

export function PaymentDetailsModal({ payment, open, onClose }: PaymentDetailsModalProps): JSX.Element | null {
  const [activeTab, setActiveTab] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);

  if (!open || !payment) return null;

  const statusConfig = getStatusConfig(payment.gatewayStatus);

  const exportPaymentToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, 210, 45, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("Payment Receipt", 20, 28);
      
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text(`Generated: ${format(new Date(), 'PPP p')}`, 20, 55);
      doc.text(`Receipt ID: ${payment._id.substring(0, 12)}`, 20, 62);
      
      // Status badge
      doc.setFillColor(payment.gatewayStatus === 'success' ? 34 : 239, payment.gatewayStatus === 'success' ? 197 : 68, payment.gatewayStatus === 'success' ? 94 : 68);
      doc.roundedRect(150, 50, 40, 10, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(payment.gatewayStatus.toUpperCase(), 170, 57);
      
      // Payment info table
      doc.setTextColor(0, 0, 0);
      autoTable(doc, {
        startY: 75,
        head: [['Field', 'Value']],
        body: [
          ['Reference', payment.reference],
          ['Paystack Reference', payment.paystackReference || 'N/A'],
          ['Purpose', payment.purpose.replace('_', ' ')],
          ['Amount', formatAmount(payment.amount)],
          ['Amount Paid', formatAmount(payment.amountPaid)],
          ['Discount', formatAmount(payment.discountAmount)],
          ['Channel', payment.channel?.toUpperCase() || 'N/A'],
          ['Status', payment.gatewayStatus.toUpperCase()],
          ['Created', formatDateShort(payment.createdAt)],
          ['Paid At', payment.paidAt ? formatDateShort(payment.paidAt) : 'N/A'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 130 },
        },
      });
      
      doc.save(`payment_${payment.reference}.pdf`);
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
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">Payment Details</p>
              <p className="text-xs text-gray-400 truncate mt-1">{payment.reference}</p>
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
                  payment.gatewayStatus === 'success' ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"
                )}>
                  <HugeiconsIcon 
                    icon={statusConfig.icon} 
                    size={20} 
                    className={payment.gatewayStatus === 'success' ? "text-green-600" : "text-amber-600"} 
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatAmount(payment.amount)}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="space-y-4">
              <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "details", label: "Payment Details" },
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
                    <InfoRow label="Reference" value={payment.reference} copyable />
                    <InfoRow label="Paystack Ref" value={payment.paystackReference} copyable />
                    <InfoRow label="Purpose" value={payment.purpose.replace('_', ' ')} />
                    <InfoRow label="Provider" value={payment.provider || 'Paystack'} />
                    <InfoRow label="Channel" value={payment.channel?.toUpperCase()} />
                  </Section>

                  {/* Amount Details */}
                  <Section title="Amount Details" icon={CurrencyDollarCircleIcon}>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg">
                          <p className="text-[10px] text-gray-400 uppercase">Total</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{formatAmount(payment.amount)}</p>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg">
                          <p className="text-[10px] text-gray-400 uppercase">Paid</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatAmount(payment.amountPaid)}</p>
                        </div>
                        <div className="text-center p-3 bg-white dark:bg-gray-900 rounded-lg">
                          <p className="text-[10px] text-gray-400 uppercase">Discount</p>
                          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatAmount(payment.discountAmount)}</p>
                        </div>
                      </div>
                      
                      {payment.discountAmount > 0 && payment.couponCode && (
                        <div className="mt-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                          <p className="text-xs text-orange-700 dark:text-orange-300">
                            <span className="font-semibold">Coupon Applied:</span> {payment.couponCode}
                            {payment.couponDiscount && ` (${payment.couponDiscount}% off)`}
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
                      {payment.paidAt && (
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Paid At</p>
                            <p className="text-xs text-gray-500">{formatDate(payment.paidAt)}</p>
                          </div>
                        </div>
                      )}
                      {payment.refundedAt && (
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500"></div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Refunded At</p>
                            <p className="text-xs text-gray-500">{formatDate(payment.refundedAt)}</p>
                            {payment.refundAmount && (
                              <p className="text-xs text-gray-500 mt-1">Amount: {formatAmount(payment.refundAmount)}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Section>
                </div>
              )}

              {/* Payment Details Tab */}
              {activeTab === "details" && (
                <div className="space-y-5">
                  {/* Gateway Information */}
                  <Section title="Gateway Information" icon={CreditCardIcon}>
                    <InfoRow label="Gateway Status" value={payment.gatewayStatus} />
                    <InfoRow label="Gateway Response" value={payment.gatewayResponse} />
                    <InfoRow label="Access Code" value={payment.accessCode} copyable />
                  </Section>

                  {/* Card Information */}
                  {(payment.cardType || payment.cardLast4 || payment.cardBank) && (
                    <Section title="Card Information" icon={BankIcon}>
                      {payment.cardType && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-500">Card Type</span>
                          <span className="text-sm font-medium uppercase">{payment.cardType}</span>
                        </div>
                      )}
                      {payment.cardLast4 && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-500">Card Number</span>
                          <span className="text-sm font-mono">•••• •••• •••• {payment.cardLast4}</span>
                        </div>
                      )}
                      {payment.cardBank && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-500">Issuing Bank</span>
                          <span className="text-sm">{payment.cardBank}</span>
                        </div>
                      )}
                    </Section>
                  )}

                  {/* Context Information */}
                  {(payment.eventId || payment.registrationId || payment.subscriptionId || payment.planId) && (
                    <Section title="Context Information" icon={TicketIcon}>
                      {payment.eventId && <InfoRow label="Event ID" value={payment.eventId} copyable />}
                      {payment.registrationId && <InfoRow label="Registration ID" value={payment.registrationId} copyable />}
                      {payment.subscriptionId && <InfoRow label="Subscription ID" value={payment.subscriptionId} copyable />}
                      {payment.planId && <InfoRow label="Plan ID" value={payment.planId} copyable />}
                    </Section>
                  )}
                </div>
              )}

              {/* Technical Tab */}
              {activeTab === "technical" && (
                <div className="space-y-5">
                  <Section title="Technical Details" icon={GlobeIcon}>
                    <InfoRow label="IP Address" value={payment.ipAddress} />
                    <InfoRow label="Gateway Response" value={payment.gatewayResponse} />
                  </Section>

                  {payment.refundReason && (
                    <Section title="Refund Information" icon={AlertIcon}>
                      <InfoRow label="Refund Reason" value={payment.refundReason} />
                      {payment.refundReference && <InfoRow label="Refund Reference" value={payment.refundReference} copyable />}
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