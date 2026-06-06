// analytics-types.ts

export interface MonthPoint { label: string; count: number }
export interface MonthRevenue { label: string; total: number }

export interface AnalyticsData {
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

export const fmt = (n: number) => (n ?? 0).toLocaleString();
export const fmtNaira = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n ?? 0);
export const pct = (n: number) => `${n ?? 0}%`;

export const categoryColors: Record<string, string> = {
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

export const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e", "#06b6d4", "#84cc16", "#f97316"];

export const tooltipStyle = {
  contentStyle: {
    background: "var(--tooltip-bg, #fff)",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 12,
    color: "#111827",
    boxShadow: "0 4px 12px -2px rgba(0,0,0,0.08)",
  },
};