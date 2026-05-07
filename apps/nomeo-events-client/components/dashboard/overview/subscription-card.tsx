// components/profile/SubscriptionCard.tsx
"use client";

import { cn } from "@/lib/utils";
import { CreditCardIcon, UserMultiple02Icon, UserAdd01Icon, Shield01Icon, CrownIcon, Building04Icon, Diamond02Icon, CheckmarkCircle02Icon, 
  Clock03Icon, AlertCircleIcon, Calendar02Icon, HardDriveIcon, PartyIcon, ArrowRight02Icon, WaveTriangleIcon, CancelCircleIcon, SparklesIcon, Rocket01Icon, 
  Timer01FreeIcons} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

// ─── Types ────────────────────────────────────────────────────────────────────
// Aligned to the actual API response shape — all limit fields optional,
// storageGb can be a decimal (e.g. 0.5), priceKobo / finalPriceKobo may be 0.

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "cancelled"
  | "canceled"       // accept both spellings from the API
  | "past_due"
  | "expired"
  | "paused"
  | "incomplete"
  | "incomplete_expired";

export type PlanTier =
  | "free" | "starter" | "basic" | "pro" | "business" | "enterprise";

export type PlanInterval =
  | "monthly" | "quarterly" | "biannual" | "annual" | "lifetime";

export interface SubscriptionData {
  id: string;
  status: SubscriptionStatus;
  planTier: PlanTier;
  planName: string;
  planSlug: string;
  interval: PlanInterval;
  priceKobo: number;
  finalPriceKobo: number;
  currency: string;
  trialEnd?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  maxEvents?: number;
  maxAttendeesPerEvent?: number;
  maxTeamMembers?: number;
  storageGb?: number;
  isActive: boolean;
  isInTrial: boolean;
  daysUntilRenewal: number;
}

export interface SubscriptionCardProps {
  subscription: SubscriptionData | null;
  isLoading?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLAN_CONFIG: Record<PlanTier, {
  Icon: any;
  accent: string;       // text colour
  chip: string;         // chip bg + text
  dot: string;          // solid dot colour
  buttonText: string;
  ButtonIcon: any;
}> = {
  free:       { Icon: SparklesIcon,  accent: "text-gray-500 dark:text-gray-400",   chip: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",     dot: "bg-gray-400",   buttonText: "Subscribe Now",   ButtonIcon: CreditCardIcon  },
  starter:    { Icon: Rocket01Icon,    accent: "text-blue-600 dark:text-blue-400",    chip: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",   dot: "bg-blue-500",   buttonText: "Upgrade Plan",    ButtonIcon: WaveTriangleIcon  },
  basic:      { Icon: Shield01Icon,    accent: "text-emerald-600 dark:text-emerald-400", chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300", dot: "bg-emerald-500", buttonText: "Upgrade Plan", ButtonIcon: WaveTriangleIcon },
  pro:        { Icon: CrownIcon,     accent: "text-violet-600 dark:text-violet-400", chip: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300", dot: "bg-violet-500", buttonText: "Upgrade Plan",  ButtonIcon: WaveTriangleIcon  },
  business:   { Icon: Building04Icon, accent: "text-indigo-600 dark:text-indigo-400", chip: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300", dot: "bg-indigo-500", buttonText: "Upgrade Plan",  ButtonIcon: WaveTriangleIcon  },
  enterprise: { Icon: Diamond02Icon,   accent: "text-amber-600 dark:text-amber-500",  chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",  dot: "bg-amber-500",  buttonText: "Contact Sales",   ButtonIcon: ArrowRight02Icon },
};

const STATUS_CONFIG: Record<string, {label: string; Icon: any; chip: string;}> = {
  trialing:           { label: "Trial",          Icon: Timer01FreeIcons,         chip: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
  active:             { label: "Active",          Icon: CheckmarkCircle02Icon,  chip: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" },
  will_cancel:        { label: "Will Cancel",     Icon: AlertCircleIcon,   chip: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" },
  cancelled:          { label: "Cancelled",       Icon: CancelCircleIcon,       chip: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
  canceled:           { label: "Cancelled",       Icon: CancelCircleIcon,       chip: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
  past_due:           { label: "Past Due",        Icon: AlertCircleIcon,   chip: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300" },
  expired:            { label: "Expired",         Icon: AlertCircleIcon,   chip: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
  paused:             { label: "Paused",          Icon: AlertCircleIcon,   chip: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" },
  incomplete:         { label: "Incomplete",      Icon: AlertCircleIcon,   chip: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" },
  incomplete_expired: { label: "Expired",         Icon: AlertCircleIcon,   chip: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" },
};

function getStatusKey(sub: SubscriptionData): string {
  if (sub.cancelAtPeriodEnd && (sub.status === "active" || sub.status === "trialing")) {
    return "will_cancel";
  }
  return sub.status;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatPrice(kobo: number, currency = "NGN"): string {
  if (!kobo || kobo === 0) return "Free";
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(kobo / 100);
}

function formatLimit(value?: number, unit = ""): string {
  if (value === undefined) return "—";
  if (value === 0) return "Unlimited";
  return `${value.toLocaleString()}${unit}`;
}

function formatStorage(gb?: number): string {
  if (gb === undefined) return "—";
  if (gb === 0) return "Unlimited";
  if (gb < 1) return `${(gb * 1024).toFixed(0)} MB`;
  return `${gb} GB`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SubscriptionSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-background p-6 space-y-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
        <div className="h-6 w-16 bg-muted rounded-full" />
      </div>
      <div className="h-px bg-border" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ─── Limit pill ───────────────────────────────────────────────────────────────

function LimitPill({ icon, label, value }: { icon: any; label: string; value: string }) {
  const isUnlimited = value === "Unlimited";
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
      <HugeiconsIcon icon={icon}
        className={cn(
          "w-4 h-4 flex-shrink-0",
          isUnlimited ? "text-violet-500" : "text-muted-foreground"
        )}
      />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{label}</p>
        <p
          className={cn(
            "text-sm font-semibold leading-none truncate",
            isUnlimited ? "text-violet-600 dark:text-violet-400" : "text-foreground"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SubscriptionCard({ subscription, isLoading = false }: SubscriptionCardProps) {
  if (isLoading) return <SubscriptionSkeleton />;
  if (!subscription) return null;

  const plan       = PLAN_CONFIG[subscription.planTier] ?? PLAN_CONFIG.free;
  const statusKey  = getStatusKey(subscription);
  const status     = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.active;
  const { Icon: PlanIcon, ButtonIcon } = plan;
  const { Icon: StatusIcon }           = status;

  const isFree       = subscription.planTier === "free";
  const hasDiscount  = subscription.priceKobo !== subscription.finalPriceKobo && subscription.priceKobo > 0;
  const showLimits   = [
    subscription.maxEvents,
    subscription.maxAttendeesPerEvent,
    subscription.maxTeamMembers,
    subscription.storageGb,
  ].some((v) => v !== undefined);

  return (
    <div className="rounded-xl border border-border bg-background p-6 md:p-5 flex flex-col gap-5 md:gap-4">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Plan icon */}
          <div className={cn("w-10 h-10 md:w-9 md:h-9 rounded-lg flex items-center justify-center bg-muted flex-shrink-0", plan.accent)}>
            <HugeiconsIcon icon={PlanIcon} className="w-5 h-5 md:w-4 md:h-4" />
          </div>

          <div>
            <p className="text-base md:text-sm font-semibold text-foreground leading-none">
              {subscription.planName} Plan
            </p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {isFree ? "No payment required" : `${subscription.interval} billing`}
            </p>
          </div>
        </div>

        {/* Status chip */}
        <span className={cn(
          "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0",
          status.chip
        )}>
          <HugeiconsIcon icon={StatusIcon} className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      {/* ── Trial / active banner ───────────────────────────────────────────── */}
      {subscription.isInTrial && subscription.trialEnd && (
        <div className="flex items-center gap-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 px-3 py-2.5">
          <HugeiconsIcon icon={PartyIcon} className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <p className="text-xs text-orange-700 dark:text-orange-300 leading-snug">
            Free trial active — ends{" "}
            <span className="font-semibold">{formatDate(subscription.trialEnd)}</span>
            {!isFree && (
              <>. You'll be charged <span className="font-semibold">{formatPrice(subscription.finalPriceKobo, subscription.currency)}</span> after.</>
            )}
          </p>
        </div>
      )}

      {subscription.cancelAtPeriodEnd && (
        <div className="flex items-center gap-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 px-3 py-2.5">
          <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <p className="text-xs text-orange-700 dark:text-orange-300">
            Cancellation scheduled — access until{" "}
            <span className="font-semibold">{formatDate(subscription.currentPeriodEnd)}</span>
          </p>
        </div>
      )}

      {/* ── Price row ───────────────────────────────────────────────────────── */}
      {!isFree && (
        <div className="flex items-baseline gap-2">
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(subscription.priceKobo, subscription.currency)}
            </span>
          )}
          <span className="text-2xl md:text-xl font-bold text-foreground">
            {formatPrice(subscription.finalPriceKobo, subscription.currency)}
          </span>
          <span className="text-xs text-muted-foreground">/{subscription.interval}</span>
          {hasDiscount && (
            <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded">
              Save {formatPrice(subscription.priceKobo - subscription.finalPriceKobo, subscription.currency)}
            </span>
          )}
        </div>
      )}

      <div className="h-px bg-border" />

      {/* ── Period ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2.5">
        <HugeiconsIcon icon={Calendar02Icon} className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Current period</p>
          <p className="text-sm md:text-xs font-medium text-foreground mt-0.5">
            {formatDate(subscription.currentPeriodStart)} — {formatDate(subscription.currentPeriodEnd)}
          </p>
          {subscription.daysUntilRenewal > 0 &&
            subscription.status === "active" &&
            !subscription.cancelAtPeriodEnd && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Renews in {subscription.daysUntilRenewal} day{subscription.daysUntilRenewal !== 1 ? "s" : ""}
              </p>
            )}
        </div>
      </div>

      {/* ── Plan limits ─────────────────────────────────────────────────────── */}
      {showLimits && (
        <>
          <div className="h-px bg-border" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
              Plan limits
            </p>
            <div className="grid grid-cols-2 gap-2">
              {subscription.maxEvents !== undefined && (
                <LimitPill icon={Calendar02Icon} label="Events" value={formatLimit(subscription.maxEvents)} />
              )}
              {subscription.maxAttendeesPerEvent !== undefined && (
                <LimitPill icon={UserMultiple02Icon} label="Attendees / event" value={formatLimit(subscription.maxAttendeesPerEvent)} />
              )}
              {subscription.maxTeamMembers !== undefined && (
                <LimitPill icon={UserAdd01Icon} label="Team members" value={formatLimit(subscription.maxTeamMembers)} />
              )}
              {subscription.storageGb !== undefined && (
                <LimitPill icon={HardDriveIcon} label="Storage" value={formatStorage(subscription.storageGb)} />
              )}
            </div>
          </div>
        </>
      )}

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <a
        href="/pricing"
        className={cn(
          "mt-1 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm md:text-xs font-semibold transition-colors h-10 lg:h-11" ,
          isFree
            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
            : "border border-border bg-background hover:bg-muted text-foreground"
        )}
      >
        <HugeiconsIcon icon={ButtonIcon} className="w-4 h-4" />
        {plan.buttonText}
      </a>
    </div>
  );
}