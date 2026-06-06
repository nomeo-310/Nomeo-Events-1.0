"use client";
// components/admin/AdminAnalyticsDashboard.tsx

import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MonthPoint   { label: string; count: number }
interface MonthRevenue { label: string; total: number }

interface AnalyticsData {
  generatedAt: string;
  overview: {
    totalUsers: number; verifiedUsers: number;
    totalAdmins: number; activeAdmins: number;
    totalEvents: number; publishedEvents: number;
    totalRegistrations: number; confirmedRegs: number;
    activeSubscriptions: number;
    totalRevenue: number; mrr: number;
    newsletterSubs: number;
    paymentSuccessRate: number; occupancyRate: number;
  };
  users: {
    total: number; verified: number;
    newToday: number; newLast7Days: number; newLast30Days: number;
    byRole: { _id: string; count: number }[];
    monthly: MonthPoint[];
  };
  admins: {
    total: number; active: number; recentLogins: number;
    byRole: { _id: string; count: number }[];
  };
  events: {
    total: number; published: number; draft: number; cancelled: number;
    archived: number; deleted: number; featured: number;
    upcoming: number; ongoing: number; completed: number;
    occupancyRate: number; avgTotalSeats: number;
    avgEventsPerOrganizer: number; maxEventsByOrganizer: number;
    byCategory: { _id: string; count: number }[];
    byMode: { _id: string; count: number }[];
    monthly: MonthPoint[];
  };
  registrations: {
    total: number; confirmed: number; pending: number; cancelled: number;
    attended: number; waitlisted: number; refunded: number; paidCompleted: number;
    groupRegs: number; corpRegs: number;
    withFeedback: number; avgRating: number;
    avgPerEvent: number; maxPerEvent: number;
    monthly: MonthPoint[];
  };
  subscriptions: {
    total: number; active: number; trialing: number; pastDue: number;
    cancelled: number; expired: number; paused: number; cancelAtEnd: number;
    mrr: number;
    byTier: { _id: string; count: number }[];
    byInterval: { _id: string; count: number }[];
    monthly: MonthPoint[];
  };
  payments: {
    total: number; successful: number; failed: number; pending: number; reversed: number;
    successRate: number; totalRevenue: number; totalDiscounts: number;
    refundCount: number; refundTotal: number;
    byPurpose: { _id: string; total: number; count: number }[];
    byChannel:  { _id: string; total: number; count: number }[];
    monthlyRevenue: MonthRevenue[];
  };
  newsletter: {
    total: number; active: number; unsubscribed: number; unsubscribeRate: number;
    withUserId: number; newLast7Days: number; newLast30Days: number;
    monthly: MonthPoint[];
  };
  campaigns: {
    total: number; completed: number; sending: number; draft: number; failed: number;
    byType: { _id: string; count: number }[];
    emailMetrics: {
      totalSent: number; totalSuccessful: number; totalFailed: number;
      totalOpened: number; totalClicked: number;
      openRate: number; clickRate: number;
    };
  };
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt     = (n: number) => (n ?? 0).toLocaleString();
const fmtNaira = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n ?? 0);
const pct = (n: number) => `${n ?? 0}%`;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div className={cn(
      "rounded-md bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.4s_ease-in-out_infinite] dark:from-gray-800 dark:via-gray-700 dark:to-gray-800",
      className
    )} />
  );
}

function StatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="mt-2 h-7 w-32" />
          <SkeletonLine className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <SkeletonLine className="h-4 w-40 mb-4" />
      <SkeletonLine className="h-[180px] w-full" />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonLine className="h-8 w-56 mb-2" />
        <SkeletonLine className="h-4 w-80" />
      </div>
      <StatsSkeleton />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <SkeletonLine className="h-3 w-20 mb-2" />
            <SkeletonLine className="h-6 w-24 mb-1" />
            <SkeletonLine className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  );
}

// ─── Stat Card — matches your existing StatCard exactly ──────────────────────

function StatCard({
  label, value, sub, accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className={cn("mt-0.5 text-base font-bold", accent ?? "text-gray-900 dark:text-white")}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3 mt-8">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900", className)}>
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Status row ───────────────────────────────────────────────────────────────

function StatusRow({
  label, value, accent,
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{label.replace(/_/g, " ")}</span>
      <span className={cn("text-xs font-semibold", accent ?? "text-gray-900 dark:text-white")}>
        {typeof value === "number" ? fmt(value) : value}
      </span>
    </div>
  );
}

// ─── Tooltip styles ───────────────────────────────────────────────────────────

const tooltipStyle = {
  contentStyle: {
    background: "var(--tooltip-bg, #fff)",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 12,
    color: "#111827",
    boxShadow: "0 4px 12px -2px rgba(0,0,0,0.08)",
  },
};

// Use CSS variable so dark mode works
const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e", "#06b6d4", "#84cc16", "#f97316"];

// ─── Mini chart components ────────────────────────────────────────────────────

function TrendBar({ data, dataKey = "count", color = "#3b82f6", height = 160 }: {
  data: { label: string; [k: string]: any }[];
  dataKey?: string;
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:stroke-gray-800" />
        <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} />
        <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function TrendLine({ data, lines, height = 160 }: {
  data: { label: string; [k: string]: any }[];
  lines: { key: string; color: string; label?: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:stroke-gray-800" />
        <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickLine={false} axisLine={false} />
        <Tooltip {...tooltipStyle} />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />}
        {lines.map(l => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.label ?? l.key}
            stroke={l.color} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function MiniPie({ data }: { data: { _id: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="_id" cx="50%" cy="50%"
          outerRadius={62} innerRadius={32}
          label={(props) => {
            const entry = props as typeof props & { _id: string };
            return `${entry._id} ${(((props.percent) ?? 0) * 100).toFixed(0)}%`;
          }}
          labelLine={false}
        >
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip {...tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Category pill colours — mirrors your existing categoryColors ─────────────

const categoryColors: Record<string, string> = {
  webinar:           "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  seminar:           "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  entertainment:     "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  film_show:         "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  science_tech:      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  school_activities: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  spirituality:      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  fashion:           "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  business:          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  sports:            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  health_wellness:   "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  art_culture:       "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  food_drink:        "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400",
  networking:        "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  charity:           "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState("");

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setRefreshedAt(new Date().toLocaleTimeString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 dark:bg-gray-900">
        <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        <div className="px-4">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 dark:bg-gray-900">
        <div className="px-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/30">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Failed to load analytics</p>
            <p className="mt-1 text-xs text-red-600 dark:text-red-500">{error}</p>
            <button onClick={() => load()} className="mt-3 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 shadow-sm hover:bg-red-50 dark:border-red-800 dark:bg-gray-900 dark:text-red-400 dark:hover:bg-red-950/50">
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { overview, users, admins, events, registrations, subscriptions, payments, newsletter, campaigns } = data;

  // Combined monthly growth
  const growthData = users.monthly.map((m, i) => ({
    label: m.label,
    Users:         m.count,
    Events:        events.monthly[i]?.count ?? 0,
    Registrations: registrations.monthly[i]?.count ?? 0,
    Subscriptions: subscriptions.monthly[i]?.count ?? 0,
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-6 dark:bg-gray-900">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div className="px-4">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Platform Analytics</h1>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Live
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Site-wide metrics across users, events, registrations, subscriptions, revenue, and email.
              {refreshedAt && <span className="ml-2 text-gray-400 dark:text-gray-500">Updated {refreshedAt}</span>}
            </p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-xs transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <svg className={cn("h-4 w-4", refreshing && "animate-spin")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* ── Overview KPIs ──────────────────────────────────────────────── */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Users"          value={fmt(overview.totalUsers)}          sub={`${fmt(overview.verifiedUsers)} verified`} />
          <StatCard label="Active Subscriptions" value={fmt(overview.activeSubscriptions)} sub={`MRR ${fmtNaira(overview.mrr)}`} accent="text-blue-600 dark:text-blue-400" />
          <StatCard label="Total Revenue"        value={fmtNaira(overview.totalRevenue)}   sub={`${pct(overview.paymentSuccessRate)} payment success`} accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Total Events"         value={fmt(overview.totalEvents)}         sub={`${fmt(overview.publishedEvents)} published`} />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Registrations"  value={fmt(overview.totalRegistrations)} sub={`${fmt(overview.confirmedRegs)} confirmed`} />
          <StatCard label="Newsletter"     value={fmt(overview.newsletterSubs)}     sub="active subscribers" />
          <StatCard label="Seat Occupancy" value={pct(overview.occupancyRate)}      sub="avg across all events" />
          <StatCard label="Active Admins"  value={fmt(overview.activeAdmins)}       sub={`of ${fmt(overview.totalAdmins)} total`} />
        </div>

        {/* ── Monthly Growth Chart ───────────────────────────────────────── */}
        <SectionHeader title="Monthly Growth" sub="New records created over the last 12 months" />
        <ChartCard title="Growth Trends">
          <TrendLine
            data={growthData}
            height={220}
            lines={[
              { key: "Users",         color: "#3b82f6", label: "Users"         },
              { key: "Events",        color: "#f59e0b", label: "Events"        },
              { key: "Registrations", color: "#10b981", label: "Registrations" },
              { key: "Subscriptions", color: "#8b5cf6", label: "Subscriptions" },
            ]}
          />
        </ChartCard>

        {/* ── Revenue ────────────────────────────────────────────────────── */}
        <SectionHeader title="Revenue" sub="Payment income, MRR, discounts and refunds" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Revenue"   value={fmtNaira(payments.totalRevenue)}  accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="MRR"             value={fmtNaira(subscriptions.mrr)}      sub="monthly recurring" accent="text-blue-600 dark:text-blue-400" />
          <StatCard label="Discounts Given" value={fmtNaira(payments.totalDiscounts)} />
          <StatCard label="Total Refunds"   value={fmtNaira(payments.refundTotal)}   sub={`${fmt(payments.refundCount)} refunds`} accent="text-red-600 dark:text-red-400" />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <ChartCard title="Monthly Revenue" className="lg:col-span-2">
            <TrendBar
              data={payments.monthlyRevenue.map(m => ({ label: m.label, Revenue: m.total }))}
              dataKey="Revenue"
              color="#10b981"
              height={160}
            />
          </ChartCard>
          <div className="space-y-3">
            <ChartCard title="By Purpose">
              {payments.byPurpose.map(p => (
                <StatusRow key={p._id} label={p._id.replace(/_/g, " ")} value={fmtNaira(p.total)} accent="text-emerald-600 dark:text-emerald-400" />
              ))}
            </ChartCard>
            <ChartCard title="By Channel">
              {payments.byChannel.map(c => (
                <StatusRow key={c._id} label={c._id ?? "unknown"} value={fmtNaira(c.total)} />
              ))}
            </ChartCard>
          </div>
        </div>

        {/* ── Payments ───────────────────────────────────────────────────── */}
        <SectionHeader title="Payments" sub="Transaction status breakdown" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Transaction Status</h3>
            </div>
            <div className="p-4 space-y-0.5">
              <StatusRow label="Total"      value={payments.total} />
              <StatusRow label="Successful" value={payments.successful} accent="text-emerald-600 dark:text-emerald-400" />
              <StatusRow label="Failed"     value={payments.failed}     accent="text-red-600 dark:text-red-400" />
              <StatusRow label="Pending"    value={payments.pending}    accent="text-amber-600 dark:text-amber-400" />
              <StatusRow label="Reversed"   value={payments.reversed}   accent="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <StatCard label="Success Rate"   value={pct(payments.successRate)} sub="of all transactions" accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Refund Count"   value={fmt(payments.refundCount)} sub={fmtNaira(payments.refundTotal)} accent="text-red-600 dark:text-red-400" />
        </div>

        {/* ── Users ──────────────────────────────────────────────────────── */}
        <SectionHeader title="Users" sub="Signups, verification and role distribution" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total"        value={fmt(users.total)} />
          <StatCard label="Verified"     value={fmt(users.verified)} sub={`${fmt(users.total - users.verified)} unverified`} accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="New Today"    value={fmt(users.newToday)} />
          <StatCard label="New (7 days)" value={fmt(users.newLast7Days)} />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <ChartCard title="New Signups Per Month" className="lg:col-span-2">
            <TrendBar data={users.monthly} color="#3b82f6" />
          </ChartCard>
          <ChartCard title="Users by Role">
            <MiniPie data={users.byRole} />
          </ChartCard>
        </div>

        {/* ── Events ─────────────────────────────────────────────────────── */}
        <SectionHeader title="Events" sub="Published, scheduled, occupancy and category breakdown" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total"        value={fmt(events.total)} />
          <StatCard label="Published"    value={fmt(events.published)}  accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Upcoming"     value={fmt(events.upcoming)}   accent="text-blue-600 dark:text-blue-400" />
          <StatCard label="Ongoing"      value={fmt(events.ongoing)}    accent="text-amber-600 dark:text-amber-400" />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Completed"          value={fmt(events.completed)} />
          <StatCard label="Featured"           value={fmt(events.featured)} />
          <StatCard label="Seat Occupancy"     value={pct(events.occupancyRate)} accent="text-blue-600 dark:text-blue-400" />
          <StatCard label="Avg Events / Org"   value={events.avgEventsPerOrganizer} sub={`max ${fmt(events.maxEventsByOrganizer)}`} />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <ChartCard title="Events Created Per Month" className="lg:col-span-2">
            <TrendBar data={events.monthly} color="#f59e0b" />
          </ChartCard>
          <ChartCard title="Event Mode">
            <MiniPie data={events.byMode} />
          </ChartCard>
        </div>
        {events.byCategory.length > 0 && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Events by Category</h3>
            </div>
            <div className="flex flex-wrap gap-2 p-4">
              {events.byCategory.map(c => (
                <span key={c._id} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize", categoryColors[c._id] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300")}>
                  {c._id?.replace(/_/g, " ")} <span className="font-bold">{c.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Registrations ──────────────────────────────────────────────── */}
        <SectionHeader title="Registrations" sub="Attendance, feedback and per-event averages" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total"        value={fmt(registrations.total)} />
          <StatCard label="Confirmed"    value={fmt(registrations.confirmed)}  accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Attended"     value={fmt(registrations.attended)}   accent="text-blue-600 dark:text-blue-400" />
          <StatCard label="Avg / Event"  value={registrations.avgPerEvent}     sub={`max ${fmt(registrations.maxPerEvent)}`} />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <ChartCard title="Registrations Per Month" className="lg:col-span-2">
            <TrendBar data={registrations.monthly} color="#10b981" />
          </ChartCard>
          <ChartCard title="Status Breakdown">
            <StatusRow label="Confirmed"    value={registrations.confirmed}     accent="text-emerald-600 dark:text-emerald-400" />
            <StatusRow label="Pending"      value={registrations.pending}       accent="text-amber-600 dark:text-amber-400" />
            <StatusRow label="Attended"     value={registrations.attended}      accent="text-blue-600 dark:text-blue-400" />
            <StatusRow label="Cancelled"    value={registrations.cancelled}     accent="text-red-600 dark:text-red-400" />
            <StatusRow label="Waitlisted"   value={registrations.waitlisted}    accent="text-purple-600 dark:text-purple-400" />
            <StatusRow label="Refunded"     value={registrations.refunded}      accent="text-red-600 dark:text-red-400" />
            <StatusRow label="With Feedback"value={registrations.withFeedback} />
            <StatusRow label="Avg Rating"   value={`${registrations.avgRating} / 5`} accent="text-amber-600 dark:text-amber-400" />
          </ChartCard>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {([
            ["Individual", registrations.total - registrations.groupRegs - registrations.corpRegs, "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"],
            ["Group",      registrations.groupRegs,  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"],
            ["Corporate",  registrations.corpRegs,   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"],
          ] as [string, number, string][]).map(([label, count, color]) => (
            <span key={label} className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium", color)}>
              {label}: <span className="font-bold">{fmt(count)}</span>
            </span>
          ))}
        </div>

        {/* ── Subscriptions ──────────────────────────────────────────────── */}
        <SectionHeader title="Subscriptions" sub="Plan tiers, billing intervals and churn signals" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total"          value={fmt(subscriptions.total)} />
          <StatCard label="Active"         value={fmt(subscriptions.active)}   accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Trialing"       value={fmt(subscriptions.trialing)} accent="text-blue-600 dark:text-blue-400" />
          <StatCard label="Cancel at End"  value={fmt(subscriptions.cancelAtEnd)} sub="churn risk" accent="text-amber-600 dark:text-amber-400" />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <ChartCard title="New Subscriptions Per Month" className="lg:col-span-2">
            <TrendBar data={subscriptions.monthly} color="#8b5cf6" />
          </ChartCard>
          <ChartCard title="By Plan Tier">
            <MiniPie data={subscriptions.byTier} />
          </ChartCard>
        </div>
        <div className="mt-3 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Status Breakdown</h3>
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {([
              ["Active",      subscriptions.active,    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"],
              ["Trialing",    subscriptions.trialing,  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"],
              ["Past Due",    subscriptions.pastDue,   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"],
              ["Paused",      subscriptions.paused,    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"],
              ["Cancelled",   subscriptions.cancelled, "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"],
              ["Expired",     subscriptions.expired,   "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"],
            ] as [string, number, string][]).map(([label, count, color]) => (
              <span key={label} className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium", color)}>
                {label}: <span className="font-bold">{fmt(count)}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Newsletter & Campaigns ─────────────────────────────────────── */}
        <SectionHeader title="Newsletter & Campaigns" sub="Subscriber growth, delivery and engagement rates" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Subscribers" value={fmt(newsletter.total)} />
          <StatCard label="Active"            value={fmt(newsletter.active)}      accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Unsubscribed"      value={fmt(newsletter.unsubscribed)} sub={`${pct(newsletter.unsubscribeRate)} churn`} accent="text-red-600 dark:text-red-400" />
          <StatCard label="New (30 days)"     value={fmt(newsletter.newLast30Days)} />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <ChartCard title="Newsletter Signups Per Month">
            <TrendBar data={newsletter.monthly} color="#06b6d4" />
          </ChartCard>
          <ChartCard title="Email Campaign Performance">
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Open Rate</p>
                <p className="mt-0.5 text-base font-bold text-amber-600 dark:text-amber-400">{pct(campaigns.emailMetrics.openRate)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Click Rate</p>
                <p className="mt-0.5 text-base font-bold text-blue-600 dark:text-blue-400">{pct(campaigns.emailMetrics.clickRate)}</p>
              </div>
            </div>
            <StatusRow label="Total Campaigns"  value={campaigns.total} />
            <StatusRow label="Completed"        value={campaigns.completed}  accent="text-emerald-600 dark:text-emerald-400" />
            <StatusRow label="Draft"            value={campaigns.draft} />
            <StatusRow label="Failed"           value={campaigns.failed}     accent="text-red-600 dark:text-red-400" />
            <StatusRow label="Emails Sent"      value={campaigns.emailMetrics.totalSent} />
            <StatusRow label="Opened"           value={campaigns.emailMetrics.totalOpened} accent="text-amber-600 dark:text-amber-400" />
            <StatusRow label="Clicked"          value={campaigns.emailMetrics.totalClicked} accent="text-blue-600 dark:text-blue-400" />
          </ChartCard>
        </div>

        {/* ── Admin Team ─────────────────────────────────────────────────── */}
        <SectionHeader title="Admin Team" sub="Active administrators and login activity" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-10">
          <StatCard label="Total Admins"    value={fmt(admins.total)} />
          <StatCard label="Active"          value={fmt(admins.active)}       accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Logins (7 days)" value={fmt(admins.recentLogins)} accent="text-blue-600 dark:text-blue-400" />
          {admins.byRole.map(r => (
            <StatCard key={r._id} label={r._id.replace(/_/g, " ")} value={fmt(r.count)} />
          ))}
        </div>

      </div>
    </div>
  );
}