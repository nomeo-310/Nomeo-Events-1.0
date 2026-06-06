"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  CalendarIcon,
  CancelCircleIcon as XCircleIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  ClockIcon,
  File01Icon,
  FileSpreadsheetIcon,
  FilterHorizontalIcon,
  MoreHorizontalCircle01Icon,
  RefreshIcon,
  Search01Icon,
  ViewIcon,
  UnavailableIcon as BanIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationWithInfo } from "@/components/ui/pagination";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReusableModal, ConfirmModal } from "@/components/ui/reusable-modal";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import {
  paymentKeys,
  useEventCoupons,
  useEventPaymentStats,
  useEventPayments,
  useEventPaymentsByEvent,
  useEventStats,
  useExportEventPayments,
  useExportSubscriptionPayments,
  usePayment,
  usePaymentByRegistration,
  usePlanPayments,
  useRefundPayment,
  useSubscriptionCoupons,
  useSubscriptionPaymentHistory,
  useSubscriptionPayments,
  useSubscriptionStats,
  type DateRangeParams,
  type EventPaymentListParams,
  type Payment,
  type PaymentGatewayStatus,
  type PaymentPurpose,
  type SubscriptionPaymentListParams,
} from "@/hooks/use-payments";
import { useQueryClient } from "@tanstack/react-query";

type TabKey = "events" | "subscriptions";
type HugeIcon = typeof ViewIcon;
type PlanPaymentsData = {
  data?: {
    summary?: {
      totalRevenue?: number;
    };
  };
  summary?: {
    totalRevenue?: number;
  };
};

interface DropdownItem {
  label: string;
  icon: HugeIcon;
  onClick: () => void;
  danger?: boolean;
}

const statusTone: Record<PaymentGatewayStatus, "default" | "secondary" | "destructive" | "outline"> = {
  success: "default",
  pending: "secondary",
  failed: "destructive",
  abandoned: "outline",
  reversed: "destructive",
};

const statusIcon: Record<PaymentGatewayStatus, HugeIcon> = {
  success: CheckCircleIcon,
  pending: ClockIcon,
  failed: AlertCircleIcon,
  abandoned: BanIcon,
  reversed: XCircleIcon,
};

const channelLabels: Record<string, string> = {
  card: "Card",
  bank_transfer: "Bank transfer",
  ussd: "USSD",
  qr: "QR",
  mobile_money: "Mobile money",
};

const purposeLabels: Record<PaymentPurpose, string> = {
  event_registration: "Event",
  subscription: "Subscription",
};

function formatMoney(kobo?: number, currency = "NGN") {
  const amount = (kobo ?? 0) / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date?: string | Date) {
  if (!date) return "N/A";
  return format(new Date(date), "dd MMM yyyy");
}

function formatDateTime(date?: string | Date) {
  if (!date) return "N/A";
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

function getPaymentParty(payment: Payment) {
  const registration = payment.registrationId ?? {};
  const subscription = payment.subscriptionId ?? {};
  const plan = payment.planId ?? {};

  return {
    title:
      registration.attendeeName ??
      registration.attendeeEmail ??
      plan.name ??
      subscription.status ??
      payment.reference,
    subtitle:
      registration.registrationNumber ??
      registration.attendeeEmail ??
      payment.paystackReference ??
      payment.reference,
  };
}

function getInitials(name?: string, fallback = "U") {
  const trimmed = name?.trim();
  if (!trimmed) return fallback;

  const initials = trimmed
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join("");

  return initials.slice(0, 3).toUpperCase() || fallback;
}

function getEventPaymentDetails(payment: Payment) {
  const registration = payment.registrationId ?? {};
  const event = payment.eventId ?? {};
  const attendeeName = typeof registration.attendeeName === "string" ? registration.attendeeName.trim() : "";

  return {
    attendeeName: attendeeName || "N/A",
    attendeeEmail: typeof registration.attendeeEmail === "string" ? registration.attendeeEmail : "N/A",
    attendeeInitials: getInitials(attendeeName, "U"),
    registrationNumber: typeof registration.registrationNumber === "string" ? registration.registrationNumber : "N/A",
    eventTitle: typeof event.title === "string" ? event.title : "N/A",
    eventSlug: typeof event.slug === "string" ? event.slug : "",
  };
}

function getSubscriptionPaymentDetails(payment: Payment) {
  const subscription = payment.subscriptionId ?? {};
  const plan = payment.planId ?? {};
  const user = subscription.userId ?? {};
  const userName = typeof user.name === "string" ? user.name.trim() : "";
  const image = typeof user.image === "string" ? user.image : typeof user.avatar === "string" ? user.avatar : "";

  return {
    userName: userName || "N/A",
    userEmail: typeof user.email === "string" ? user.email : "N/A",
    userImage: image,
    userInitials: getInitials(userName, "U"),
    planName: typeof plan.name === "string" ? plan.name : "N/A",
    interval: typeof plan.interval === "string" ? plan.interval : "N/A",
    subscriptionStatus: typeof subscription.status === "string" ? subscription.status : "N/A",
  };
}

function getPaystackReference(payment: Payment) {
  return payment.paystackReference ?? "N/A";
}

// Event Stats Skeleton
function EventStatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-7 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
    </div>
  );
}

// Subscription Stats Skeleton
function SubscriptionStatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-7 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-3 w-20 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
    </div>
  );
}

// Event Stats Component
function EventStats({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) return <EventStatsSkeleton />;

  const summary = data?.data?.summary;
  const topEvents = data?.data?.topEvents || [];
  const byChannel = data?.data?.byChannel || [];
  const dailyTrend = data?.data?.dailyTrend || [];

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Revenue</p>
          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{formatMoney(summary?.totalRevenue ?? 0)}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">From {summary?.count ?? 0} payments</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Discount</p>
          <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">{formatMoney(summary?.totalDiscount ?? 0)}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Applied across all events</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Top Event</p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white truncate">
            {topEvents[0]?.title || "N/A"}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {topEvents[0] ? `${formatMoney(topEvents[0].totalPaid)} from ${topEvents[0].count} payments` : "No data"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Top Channel</p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white capitalize">
            {byChannel[0]?._id === "unknown" ? "Unknown" : channelLabels[byChannel[0]?._id] || byChannel[0]?._id || "N/A"}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {byChannel[0] ? `${formatMoney(byChannel[0].totalPaid)} from ${byChannel[0].count} payments` : "No data"}
          </p>
        </div>
      </div>

      {/* Top Events Table */}
      {topEvents.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Top Events by Revenue</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Event Title</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Payments</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topEvents.map((event: any) => (
                  <tr key={event._id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white truncate max-w-[300px]">
                      {event.title}
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-400">
                      {event.count}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {formatMoney(event.totalPaid)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Trend Chart Summary */}
      {dailyTrend.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Daily Trend</h3>
          </div>
          <div className="grid gap-2 p-4">
            {dailyTrend.slice(-5).map((day: any) => (
              <div key={day.date} className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">{format(new Date(day.date), "dd MMM")}</span>
                <div className="flex-1 mx-4">
                  <div className="h-2 rounded-full bg-blue-100 dark:bg-blue-900">
                    <div 
                      className="h-2 rounded-full bg-blue-600 dark:bg-blue-500"
                      style={{ width: `${(day.totalPaid / Math.max(...dailyTrend.map((d: any) => d.totalPaid))) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">{formatMoney(day.totalPaid)}</span>
                  <span className="ml-2 text-xs text-gray-500">({day.count})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Subscription Stats Component
function SubscriptionStats({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) return <SubscriptionStatsSkeleton />;

  const summary = data?.data;
  const byPlanTier = data?.data?.byPlanTier || [];
  const byStatus = data?.data?.byStatus || [];

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Monthly Recurring Revenue</p>
          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{formatMoney(summary?.mrr ?? 0)}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">From {summary?.mrrTransactionCount ?? 0} transactions</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Annual Run Rate</p>
          <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">{formatMoney(summary?.arr ?? 0)}</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Projected annual revenue</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Top Plan Tier</p>
          <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white capitalize">
            {byPlanTier[0]?._id?.tier || "N/A"} ({byPlanTier[0]?._id?.interval || "N/A"})
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {byPlanTier[0] ? `${formatMoney(byPlanTier[0].totalPaid)} from ${byPlanTier[0].count} subscribers` : "No data"}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Success Rate</p>
          <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
            {byStatus[0]?._id === "success" ? "100%" : "0%"}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {byStatus[0]?.count ?? 0} successful payments
          </p>
        </div>
      </div>

      {/* Plan Breakdown */}
      {byPlanTier.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Subscription Plans Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Plan Tier</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Interval</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Subscribers</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {byPlanTier.map((plan: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-2 text-sm font-medium capitalize text-gray-900 dark:text-white">
                      {plan._id?.tier || "N/A"}
                    </td>
                    <td className="px-4 py-2 text-sm capitalize text-gray-600 dark:text-gray-400">
                      {plan._id?.interval || "N/A"}
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-400">
                      {plan.count}
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900 dark:text-white">
                      {formatMoney(plan.totalPaid)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] dark:from-gray-800 dark:via-gray-700 dark:to-gray-800",
        className
      )}
    />
  );
}

function PaymentsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-3 mb-6">
        <SkeletonLine className="h-10 flex-1" />
        <SkeletonLine className="h-10 w-36" />
        <SkeletonLine className="h-10 w-36" />
      </div>
      <SkeletonLine className="h-10 w-full" />
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800"
          style={{ opacity: 1 - i * 0.08 }}
        >
          <SkeletonLine className="h-4 w-4 rounded" />
          <div className="space-y-1 flex-1">
            <SkeletonLine className="h-3 w-36" />
            <SkeletonLine className="h-2 w-28" />
          </div>
          <SkeletonLine className="h-5 w-20 rounded-full" />
          <SkeletonLine className="h-3 w-24" />
          <SkeletonLine className="h-7 w-7 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function TabButton({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 lg:py-3 text-sm font-medium rounded-md transition-all",
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      )}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "ml-2 px-2 py-0.5 text-xs rounded-full",
            isActive
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ActionDropdown({
  items,
  trigger,
}: {
  items: (DropdownItem | { divider: true; section?: string })[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuWidth = 224;

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = 300;
    const offset = 6;
    let left = rect.right - menuWidth;

    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;

    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= menuHeight || spaceBelow >= rect.top
      ? rect.bottom + offset
      : rect.top - menuHeight - offset;

    setCoords({ top, left });
  };

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node) || menuRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => updateCoords();

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          if (!open) updateCoords();
          setOpen((prev) => !prev);
        }}
      >
        {trigger}
      </div>

      {open &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900"
            style={{
              top: coords.top,
              left: coords.left,
              width: menuWidth,
              boxShadow: "0 4px 24px -4px rgba(0,0,0,0.12), 0 1px 4px -1px rgba(0,0,0,0.08)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          >
            {items.map((item, index) => {
              if ("divider" in item && item.divider) {
                return item.section ? (
                  <p
                    key={index}
                    className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500"
                  >
                    {item.section}
                  </p>
                ) : (
                  <div key={index} className="my-1 border-t border-gray-100 dark:border-gray-800" />
                );
              }

              const { label, icon: Icon, onClick, danger } = item as DropdownItem;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={onClick}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                    danger
                      ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                >
                  <HugeiconsIcon
                    icon={Icon}
                    className={cn("h-3.5 w-3.5 flex-shrink-0", danger ? "text-red-500" : "text-gray-400 dark:text-gray-500")}
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
}

function DateRangePicker({
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
}) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const startDateObj = startDate ? new Date(startDate) : undefined;
  const endDateObj = endDate ? new Date(endDate) : undefined;

  const triggerClass = cn(
    "flex h-10 lg:h-11 w-[160px] items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm font-normal shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none cursor-pointer",
    "dark:border-gray-800 dark:bg-gray-900 dark:text-white"
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={startOpen} onOpenChange={setStartOpen}>
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
            onSelect={(date) => {
              onStartDateChange(date ? format(date, "yyyy-MM-dd") : "");
              setStartOpen(false);
            }}
            disabled={(date) => (endDateObj ? date > endDateObj : false)}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>

      <span className="text-xs text-gray-400">to</span>

      <Popover open={endOpen} onOpenChange={setEndOpen}>
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
            onSelect={(date) => {
              onEndDateChange(date ? format(date, "yyyy-MM-dd") : "");
              setEndOpen(false);
            }}
            disabled={(date) => (startDateObj ? date < startDateObj : false)}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>

      {(startDate || endDate) && (
        <Button type="button" variant="ghost" size="sm" onClick={onClear} className="h-8 px-2 text-gray-500">
          <HugeiconsIcon icon={XCircleIcon} className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentGatewayStatus }) {
  const Icon = statusIcon[status] ?? AlertCircleIcon;

  return (
    <Badge variant={statusTone[status] ?? "secondary"} className="gap-1 capitalize">
      <HugeiconsIcon icon={Icon} size={12} />
      {status}
    </Badge>
  );
}

function DetailField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <div className="mt-1 break-words text-sm font-medium text-gray-900 dark:text-white">{value || "N/A"}</div>
    </div>
  );
}

function EventPaymentModalDetails({ payment }: { payment: Payment }) {
  const details = getEventPaymentDetails(payment);
  const registration = payment.registrationId ?? {};

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Event Registration Details</h4>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800 md:col-span-2">
          <div className="flex items-center gap-3">
            <Avatar className="bg-blue-600 text-white">
              <AvatarFallback className="bg-blue-600 text-xs font-bold text-white">{details.attendeeInitials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{details.attendeeName}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{details.attendeeEmail}</p>
            </div>
          </div>
        </div>
        <DetailField label="Registration Number" value={details.registrationNumber} />
        <DetailField label="Event Name" value={details.eventTitle} />
        <DetailField label="Event Slug" value={details.eventSlug || "N/A"} />
        <DetailField label="Plan Name" value={typeof registration.planName === "string" ? registration.planName : "N/A"} />
        <DetailField label="Plan Type" value={typeof registration.planType === "string" ? registration.planType : "N/A"} />
        <DetailField label="Registration ID" value={typeof registration._id === "string" ? registration._id : "N/A"} />
      </div>
    </div>
  );
}

function SubscriptionPaymentModalDetails({ payment }: { payment: Payment }) {
  const details = getSubscriptionPaymentDetails(payment);
  const subscription = payment.subscriptionId ?? {};
  const plan = payment.planId ?? {};

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Subscription Details</h4>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800 md:col-span-2">
          <div className="flex items-center gap-3">
            <Avatar>
              {details.userImage && <AvatarImage src={details.userImage} alt={details.userName} />}
              <AvatarFallback className="bg-blue-600 text-xs font-bold text-white">{details.userInitials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{details.userName}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{details.userEmail}</p>
            </div>
          </div>
        </div>
        <DetailField label="Plan Name" value={details.planName} />
        <DetailField label="Billing Interval" value={<span className="capitalize">{details.interval}</span>} />
        <DetailField label="Plan Tier" value={typeof plan.tier === "string" ? <span className="capitalize">{plan.tier}</span> : "N/A"} />
        <DetailField label="Plan Price" value={typeof plan.priceKobo === "number" ? formatMoney(plan.priceKobo, payment.currency) : "N/A"} />
        <DetailField label="Subscription Status" value={<span className="capitalize">{details.subscriptionStatus}</span>} />
        <DetailField label="Subscription ID" value={typeof subscription._id === "string" ? subscription._id : "N/A"} />
      </div>
    </div>
  );
}

function MobilePaymentCard({
  payment,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  onView,
  onRefund,
}: {
  payment: Payment;
  selected: boolean;
  expanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onView: () => void;
  onRefund: () => void;
}) {
  const party = getPaymentParty(payment);

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
            <HugeiconsIcon icon={expanded ? ArrowUp01Icon : ArrowDown01Icon} className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-gray-100 px-4 pb-4 pt-3 dark:border-gray-800">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Paid</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatMoney(payment.amountPaid, payment.currency)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Purpose</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{purposeLabels[payment.purpose]}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Channel</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{channelLabels[payment.channel ?? ""] ?? payment.channel ?? "N/A"}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Date</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatDate(payment.createdAt)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 flex-1 text-xs dark:border-gray-700" onClick={onView}>
              <HugeiconsIcon icon={ViewIcon} className="mr-1 h-3 w-3" /> View
            </Button>
            {payment.gatewayStatus === "success" && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 flex-1 border-red-200 text-xs text-red-600 dark:border-red-800 dark:text-red-400"
                onClick={onRefund}
              >
                <HugeiconsIcon icon={XCircleIcon} className="mr-1 h-3 w-3" /> Refund
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TableActions({
  payment,
  onView,
  onRefund,
}: {
  payment: Payment;
  onView: (payment: Payment) => void;
  onRefund: (payment: Payment) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onView(payment)}
        className="rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        title="View Details"
      >
        <HugeiconsIcon icon={ViewIcon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
      <ActionDropdown
        trigger={
          <button type="button" className="rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        }
        items={[
          { label: "View Details", icon: ViewIcon, onClick: () => onView(payment) },
          { divider: true, section: "Financial Actions" } as const,
          ...(payment.gatewayStatus === "success"
            ? [{ label: "Mark Refunded", icon: XCircleIcon, onClick: () => onRefund(payment), danger: true }]
            : [{ label: "Refund unavailable", icon: BanIcon, onClick: () => toast.info("Only successful payments can be refunded") }]),
        ]}
      />
    </div>
  );
}

function EventPaymentsTable({
  payments,
  selectedPayments,
  onSelectAll,
  onToggleSelect,
  onView,
  onRefund,
}: {
  payments: Payment[];
  selectedPayments: Set<string>;
  onSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onView: (payment: Payment) => void;
  onRefund: (payment: Payment) => void;
}) {
  return (
    <Table>
      <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
        <TableRow className="border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
          <TableHead className="w-12 pl-4">
            <Checkbox checked={selectedPayments.size === payments.length && payments.length > 0} onCheckedChange={onSelectAll} />
          </TableHead>
          <TableHead className="w-[21%]">Attendee</TableHead>
          <TableHead className="w-[15%]">Registration No.</TableHead>
          <TableHead className="w-[22%]">Event</TableHead>
          <TableHead className="w-[16%]">Paystack Ref</TableHead>
          <TableHead className="w-[10%]">Amount</TableHead>
          <TableHead className="w-[9%]">Status</TableHead>
          <TableHead className="w-[7%]">Created</TableHead>
          <TableHead className="w-16 text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => {
          const details = getEventPaymentDetails(payment);

          return (
            <TableRow
              key={payment._id}
              className={cn(
                "border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50",
                payment.gatewayStatus === "reversed" && "bg-red-50/30 dark:bg-red-900/10"
              )}
            >
              <TableCell className="pl-4">
                <Checkbox checked={selectedPayments.has(payment._id)} onCheckedChange={() => onToggleSelect(payment._id)} />
              </TableCell>
              <TableCell>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="bg-blue-600 text-white">
                    <AvatarFallback className="bg-blue-600 text-xs font-bold text-white">{details.attendeeInitials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{details.attendeeName}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{details.attendeeEmail}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{details.registrationNumber}</span>
              </TableCell>
              <TableCell>
                <p className="max-w-[180px] truncate text-sm font-medium text-gray-900 dark:text-white">{details.eventTitle}</p>
                {details.eventSlug && <p className="max-w-[180px] truncate text-[10px] text-gray-400">{details.eventSlug}</p>}
              </TableCell>
              <TableCell>
                <span className="inline-block max-w-[150px] truncate rounded-md bg-gray-100 px-1.5 py-0.5 align-middle font-mono text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  {getPaystackReference(payment)}
                </span>
              </TableCell>
              <TableCell>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{formatMoney(payment.amountPaid, payment.currency)}</p>
                {payment.discountAmount > 0 && (
                  <p className="mt-0.5 text-[10px] text-green-600 dark:text-green-400">
                    {formatMoney(payment.discountAmount, payment.currency)} off
                  </p>
                )}
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={payment.gatewayStatus} />
              </TableCell>
              <TableCell>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(payment.createdAt)}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{format(new Date(payment.createdAt), "HH:mm")}</p>
              </TableCell>
              <TableCell className="text-center">
                <TableActions payment={payment} onView={onView} onRefund={onRefund} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function SubscriptionPaymentsTable({
  payments,
  selectedPayments,
  onSelectAll,
  onToggleSelect,
  onView,
  onRefund,
}: {
  payments: Payment[];
  selectedPayments: Set<string>;
  onSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onView: (payment: Payment) => void;
  onRefund: (payment: Payment) => void;
}) {
  return (
    <Table>
      <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
        <TableRow className="border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
          <TableHead className="w-12 pl-4">
            <Checkbox checked={selectedPayments.size === payments.length && payments.length > 0} onCheckedChange={onSelectAll} />
          </TableHead>
          <TableHead>Subscriber</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Interval</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Paystack Ref</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-16 text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => {
          const details = getSubscriptionPaymentDetails(payment);

          return (
            <TableRow
              key={payment._id}
              className={cn(
                "border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50",
                payment.gatewayStatus === "reversed" && "bg-red-50/30 dark:bg-red-900/10"
              )}
            >
              <TableCell className="pl-4">
                <Checkbox checked={selectedPayments.has(payment._id)} onCheckedChange={() => onToggleSelect(payment._id)} />
              </TableCell>
              <TableCell>
                <div className="flex min-w-[210px] items-center gap-3">
                  <Avatar>
                    {details.userImage && <AvatarImage src={details.userImage} alt={details.userName} />}
                    <AvatarFallback className="bg-blue-600 text-xs font-bold text-white">{details.userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{details.userName}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{details.userEmail}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="max-w-[180px] truncate text-sm font-medium text-gray-900 dark:text-white">{details.planName}</p>
                <p className="text-[10px] capitalize text-gray-400">{details.subscriptionStatus}</p>
              </TableCell>
              <TableCell>
                <span className="text-xs font-semibold capitalize text-gray-700 dark:text-gray-300">{details.interval}</span>
              </TableCell>
              <TableCell>
                <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  {payment.reference}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{getPaystackReference(payment)}</span>
              </TableCell>
              <TableCell>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{formatMoney(payment.amountPaid, payment.currency)}</p>
                {payment.discountAmount > 0 && (
                  <p className="mt-0.5 text-[10px] text-green-600 dark:text-green-400">
                    {formatMoney(payment.discountAmount, payment.currency)} off
                  </p>
                )}
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={payment.gatewayStatus} />
              </TableCell>
              <TableCell>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{channelLabels[payment.channel ?? ""] ?? payment.channel ?? "N/A"}</p>
                {payment.cardLast4 && <p className="text-[10px] text-gray-400">**** {payment.cardLast4}</p>}
              </TableCell>
              <TableCell>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(payment.createdAt)}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{format(new Date(payment.createdAt), "HH:mm")}</p>
              </TableCell>
              <TableCell className="text-center">
                <TableActions payment={payment} onView={onView} onRefund={onRefund} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// Loading skeleton for modal content
function ModalContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
        <SkeletonLine className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-8 w-32" />
          <SkeletonLine className="h-4 w-48" />
          <SkeletonLine className="h-4 w-64" />
          <div className="flex gap-2 mt-2">
            <SkeletonLine className="h-6 w-20 rounded-full" />
            <SkeletonLine className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SkeletonLine className="h-24 rounded-lg" />
        <SkeletonLine className="h-24 rounded-lg" />
        <SkeletonLine className="h-24 rounded-lg" />
      </div>
      <div className="space-y-3">
        <SkeletonLine className="h-6 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SkeletonLine className="h-20 rounded-lg" />
          <SkeletonLine className="h-20 rounded-lg" />
          <SkeletonLine className="h-20 rounded-lg" />
          <SkeletonLine className="h-20 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

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
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
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
  const eventCouponsQuery = useEventCoupons(dateParams);
  const subscriptionCouponsQuery = useSubscriptionCoupons(dateParams);
  
  // Only fetch payment details when modal is open and we have a selected payment
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
  const planPaymentsData = planPaymentsQuery.data as PlanPaymentsData | undefined;

  const refundMutation = useRefundPayment();
  const exportEventPayments = useExportEventPayments();
  const exportSubscriptionPayments = useExportSubscriptionPayments();

  const activeQuery = activeTab === "events" ? eventPaymentsQuery : subscriptionPaymentsQuery;

  const payments = activeQuery.data?.data ?? [];
  const pagination = activeQuery.data?.pagination;
  const showSkeleton = activeQuery.isLoading || (activeQuery.isFetching && payments.length === 0);

  // Safe data access for counts
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

  // Use the fetched detailed payment when available, otherwise fall back to selected payment
  const detailPayment = selectedPaymentQuery.data?.data ?? selectedPayment;

  // Check if we're still loading the detailed data
  const isLoadingDetails = selectedPaymentQuery.isLoading && selectedPaymentQuery.isFetching;
  
  // Check if we have fully loaded data for the current payment type
  const hasCompleteData = useMemo(() => {
    if (!detailPayment) return false;
    
    if (detailPayment.purpose === "subscription") {
      // Check if subscription details are fully loaded
      return !!(
        detailPayment.subscriptionId?.userId?.name &&
        detailPayment.subscriptionId?.userId?.email &&
        detailPayment.planId?.name
      );
    } else if (detailPayment.purpose === "event_registration") {
      // Check if event details are fully loaded
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
        : new Set(payments.map((payment) => payment._id))
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

  const handleStatusFilterChange = (value: PaymentGatewayStatus | "all") => {
    setStatusFilter(value);
    resetPageSelection();
  };

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    resetPageSelection();
  };

  const handleEndDateChange = (date: string) => {
    setEndDate(date);
    resetPageSelection();
  };

  const handleClearDateRange = () => {
    setStartDate("");
    setEndDate("");
    resetPageSelection();
  };

  const handleRefresh = async () => {
    await activeQuery.refetch();
    toast.success("Payments refreshed");
  };

  const openPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewModalOpen(true);
  };

  const openRefund = (payment: Payment) => {
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
    const rows = selectedPayments.size > 0 ? payments.filter((payment) => selectedPayments.has(payment._id)) : payments;
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
      body: rows.map((payment) => [
        payment.reference,
        purposeLabels[payment.purpose],
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

        {/* Stats Section - Separate for Events and Subscriptions */}
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

          <Select value={statusFilter} onValueChange={(value) => handleStatusFilterChange(value as PaymentGatewayStatus | "all")}>
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
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onClear={handleClearDateRange}
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
            <div className="p-6">
              <PaymentsSkeleton />
            </div>
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
            payments.map((payment) => (
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

      <ReusableModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPayment(null);
        }}
        title="Payment Details"
        description="Complete transaction information and related payment context"
        size="full"
        className="!max-w-5xl"
        actions={[
          {
            label: "Close",
            onClick: () => {
              setIsViewModalOpen(false);
              setSelectedPayment(null);
            },
            variant: "outline",
          },
          ...(detailPayment?.gatewayStatus === "success" && !isLoadingDetails && hasCompleteData
            ? [
                {
                  label: "Mark Refunded",
                  onClick: () => detailPayment && openRefund(detailPayment),
                  variant: "danger" as const,
                },
              ]
            : []),
        ]}
      >
        {!detailPayment ? (
          <ModalContentSkeleton />
        ) : isLoadingDetails || (!hasCompleteData && selectedPaymentQuery.isFetching) ? (
          <ModalContentSkeleton />
        ) : (
          <div className="space-y-6">
            <div className="flex items-start gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
              {detailPayment.purpose === "subscription" ? (
                (() => {
                  const details = getSubscriptionPaymentDetails(detailPayment);
                  return (
                    <>
                      <Avatar className="h-16 w-16 shadow-lg ring-4 ring-white dark:ring-gray-900">
                        {details.userImage && details.userImage !== "N/A" && (
                          <AvatarImage src={details.userImage} alt={details.userName} />
                        )}
                        <AvatarFallback className="bg-blue-600 text-sm font-bold text-white">
                          {details.userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatMoney(detailPayment.amountPaid, detailPayment.currency)}
                        </h3>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{details.userName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{details.userEmail}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <PaymentStatusBadge status={detailPayment.gatewayStatus} />
                          <Badge variant="secondary">{purposeLabels[detailPayment.purpose]}</Badge>
                          {detailPayment.channel && (
                            <Badge variant="outline">
                              {channelLabels[detailPayment.channel] ?? detailPayment.channel}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()
              ) : (
                (() => {
                  const details = getEventPaymentDetails(detailPayment);
                  return (
                    <>
                      <Avatar className="h-16 w-16 bg-blue-600 text-white shadow-lg ring-4 ring-white dark:ring-gray-900">
                        <AvatarFallback className="bg-blue-600 text-sm font-bold text-white">
                          {details.attendeeInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatMoney(detailPayment.amountPaid, detailPayment.currency)}
                        </h3>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{details.attendeeName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{details.eventTitle}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <PaymentStatusBadge status={detailPayment.gatewayStatus} />
                          <Badge variant="secondary">{purposeLabels[detailPayment.purpose]}</Badge>
                          {detailPayment.channel && (
                            <Badge variant="outline">
                              {channelLabels[detailPayment.channel] ?? detailPayment.channel}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Original Amount</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{formatMoney(detailPayment.amount, detailPayment.currency)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Amount Paid</p>
                <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{formatMoney(detailPayment.amountPaid, detailPayment.currency)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Discount</p>
                <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">{formatMoney(detailPayment.discountAmount, detailPayment.currency)}</p>
                {detailPayment.couponCode && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Code: {detailPayment.couponCode}</p>}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Transaction Information</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailField label="Payment Reference" value={detailPayment.reference} />
                <DetailField label="Paystack Reference" value={detailPayment.paystackReference ?? "N/A"} />
                <DetailField label="Gateway Response" value={detailPayment.gatewayResponse ?? "N/A"} />
                <DetailField label="Paid At" value={formatDateTime(detailPayment.paidAt)} />
                <DetailField label="Created At" value={formatDateTime(detailPayment.createdAt)} />
                <DetailField 
                  label="Card" 
                  value={detailPayment.cardType || detailPayment.cardLast4
                    ? `${detailPayment.cardType ?? "Card"} ${detailPayment.cardLast4 ? `•••• ${detailPayment.cardLast4}` : ""}`
                    : "N/A"} 
                />
                <DetailField label="Bank" value={detailPayment.cardBank ?? "N/A"} />
                <DetailField label="Channel" value={channelLabels[detailPayment.channel ?? ""] ?? detailPayment.channel ?? "N/A"} />
              </div>
            </div>

            {detailPayment.purpose === "event_registration" ? (
              <EventPaymentModalDetails payment={detailPayment} />
            ) : (
              <SubscriptionPaymentModalDetails payment={detailPayment} />
            )}

            {detailPayment.refundedAt && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
                <h4 className="mb-3 text-sm font-semibold text-red-800 dark:text-red-300">Refund Information</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <DetailField label="Refunded At" value={formatDateTime(detailPayment.refundedAt)} />
                  <DetailField label="Refund Amount" value={formatMoney(detailPayment.refundAmount, detailPayment.currency)} />
                  <DetailField label="Refund Reference" value={detailPayment.refundReference ?? "N/A"} />
                  <DetailField label="Reason" value={detailPayment.refundReason ?? "N/A"} />
                </div>
              </div>
            )}

            {(selectedEventId || selectedRegistrationId || selectedSubscriptionId || selectedPlanId) && (
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Context</h4>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {selectedEventId && (
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Event Revenue</p>
                      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{formatMoney(eventBreakdownQuery.data?.data?.summary?.totalRevenue ?? 0)}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{eventPaymentHistoryQuery.data?.pagination?.total ?? 0} event payments</p>
                    </div>
                  )}
                  {selectedRegistrationId && (
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Registration Status</p>
                      <p className="mt-1 text-sm font-semibold capitalize text-gray-900 dark:text-white">
                        {registrationPaymentQuery.data?.data?.gatewayStatus ?? "N/A"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Reference: {registrationPaymentQuery.data?.data?.reference ?? "N/A"}</p>
                    </div>
                  )}
                  {selectedSubscriptionId && (
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Subscription History</p>
                      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{subscriptionHistoryQuery.data?.pagination?.total ?? 0}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">linked payments</p>
                    </div>
                  )}
                  {selectedPlanId && (
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Plan Revenue</p>
                      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{formatMoney(planPaymentsData?.data?.summary?.totalRevenue ?? planPaymentsData?.summary?.totalRevenue ?? 0)}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">matching plan payments</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </ReusableModal>

      <ConfirmModal
        isOpen={isRefundModalOpen}
        onClose={() => {
          setIsRefundModalOpen(false);
          setRefundReason("");
          setRefundAmount("");
          setRefundReference("");
        }}
        onConfirm={handleRefund}
        title="Mark Payment Refunded"
        description={`This will mark ${selectedPayment?.reference ?? "this payment"} as reversed in your database. Call Paystack separately if your backend has not wired that in yet.`}
        confirmLabel="Mark Refunded"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isLoading={refundMutation.isPending}
        size="md"
      >
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Refund details</p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              Maximum refund amount: {formatMoney(selectedPayment?.amountPaid, selectedPayment?.currency)}.
            </p>
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason</Label>
            <Textarea
              placeholder="Enter the refund reason..."
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="mt-1.5 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Refund Amount (kobo)</Label>
            <Input
              type="number"
              min={1}
              max={selectedPayment?.amountPaid}
              placeholder="Leave blank for full refund"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="mt-1.5 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Refund Reference</Label>
            <Input
              placeholder="Internal or Paystack refund ref"
              value={refundReference}
              onChange={(e) => setRefundReference(e.target.value)}
              className="mt-1.5 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
}