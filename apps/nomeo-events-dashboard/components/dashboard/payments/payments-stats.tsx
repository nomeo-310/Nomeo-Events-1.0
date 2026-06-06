// payments-stats.tsx
import React from "react";
import { format } from "date-fns";
import { EventStatsSkeleton, SubscriptionStatsSkeleton } from "./payments-skeletons";
import { formatMoney } from "./payments-types";
import { channelLabels } from "./payments-types";

export function EventStats({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) return <EventStatsSkeleton />;

  const summary = data?.data?.summary;
  const topEvents = data?.data?.topEvents || [];
  const byChannel = data?.data?.byChannel || [];
  const dailyTrend = data?.data?.dailyTrend || [];

  return (
    <div className="space-y-6">
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

export function SubscriptionStats({ data, isLoading }: { data: any; isLoading: boolean }) {
  if (isLoading) return <SubscriptionStatsSkeleton />;

  const summary = data?.data;
  const byPlanTier = data?.data?.byPlanTier || [];
  const byStatus = data?.data?.byStatus || [];

  return (
    <div className="space-y-6">
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