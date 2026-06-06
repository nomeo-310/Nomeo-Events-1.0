// payments-types.ts
import { format } from "date-fns";
import {
  AlertCircleIcon,
  CancelCircleIcon as XCircleIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  ClockIcon,
  ViewIcon,
  UnavailableIcon as BanIcon,
} from "@hugeicons/core-free-icons";
import type { Payment, PaymentGatewayStatus, PaymentPurpose } from "@/hooks/use-payments";

export type TabKey = "events" | "subscriptions";
export type HugeIcon = typeof ViewIcon;

export interface DropdownItem {
  label: string;
  icon: HugeIcon;
  onClick: () => void;
  danger?: boolean;
}

export const statusTone: Record<PaymentGatewayStatus, "default" | "secondary" | "destructive" | "outline"> = {
  success: "default",
  pending: "secondary",
  failed: "destructive",
  abandoned: "outline",
  reversed: "destructive",
};

export const statusIcon: Record<PaymentGatewayStatus, HugeIcon> = {
  success: CheckCircleIcon,
  pending: ClockIcon,
  failed: AlertCircleIcon,
  abandoned: BanIcon,
  reversed: XCircleIcon,
};

export const channelLabels: Record<string, string> = {
  card: "Card",
  bank_transfer: "Bank transfer",
  ussd: "USSD",
  qr: "QR",
  mobile_money: "Mobile money",
};

export const purposeLabels: Record<PaymentPurpose, string> = {
  event_registration: "Event",
  subscription: "Subscription",
};

export function formatMoney(kobo?: number, currency = "NGN") {
  const amount = (kobo ?? 0) / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date?: string | Date) {
  if (!date) return "N/A";
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date?: string | Date) {
  if (!date) return "N/A";
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

export function getPaymentParty(payment: Payment) {
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

export function getInitials(name?: string, fallback = "U") {
  const trimmed = name?.trim();
  if (!trimmed) return fallback;

  const initials = trimmed
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join("");

  return initials.slice(0, 3).toUpperCase() || fallback;
}

export function getEventPaymentDetails(payment: Payment) {
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

export function getSubscriptionPaymentDetails(payment: Payment) {
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

export function getPaystackReference(payment: Payment) {
  return payment.paystackReference ?? "N/A";
}