// subscriptions-stats.tsx
import { useState } from 'react';
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ClockIcon,
  DollarIcon,
  LayersIcon,
  TimerIcon,
  CrownIcon,
  TradeUpIcon as TrendingUpIcon,
  TradeDownIcon as TrendingDownIcon,
  UserMultiple02Icon as UsersIcon,
  PieChartIcon,
  CoinsIcon,
  AwardIcon,
} from "@hugeicons/core-free-icons";
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

import { StatsTabButton, StatCard, CustomProgress } from './subscriptions-components';
import { formatCurrency, TIER_ICONS } from './subscriptions-types';
import { SkeletonLine } from './subscriptions-skeletons';

export const StatsSection = ({ stats, isLoading }: { stats: any; isLoading: boolean }) => {
  const [activeStatTab, setActiveStatTab] = useState('overview');

  const statTabs = [
    { id: 'overview', label: 'Overview', icon: PieChartIcon },
    { id: 'tiers', label: 'By Tier', icon: LayersIcon },
    { id: 'intervals', label: 'By Interval', icon: ClockIcon },
    { id: 'plans', label: 'Top Plans', icon: CrownIcon },
    { id: 'acquisition', label: 'Acquisition', icon: UsersIcon },
  ];

  const safeStats = {
    overview: stats?.overview || { totalSubscriptions: 0, activeSubscriptions: 0, statusBreakdown: [] },
    revenue: stats?.revenue || { mrr: 0, arr: 0, totalRevenue: 0, averageSubscription: 0, subscriptionRange: { min: 0, max: 0 } },
    tiers: stats?.tiers || [],
    intervals: stats?.intervals || [],
    trials: stats?.trials || { active: 0, endingThisWeek: 0, converted: 0, expired: 0, conversionRate: "0" },
    churn: stats?.churn || { thisPeriod: 0, cancelled: 0, expired: 0, churnRate: "0" },
    payments: stats?.payments || { total: 0, successful: 0, failed: 0, successRate: "0", totalAmount: 0 },
    topPlans: stats?.topPlans || [],
    acquisition: stats?.acquisition || [],
    growth: stats?.growth || [],
    upcomingRenewals: stats?.upcomingRenewals || [],
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonLine key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <SkeletonLine className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard 
          title="Monthly Recurring Revenue" 
          value={formatCurrency(safeStats.revenue.mrr * 100)} 
          subtitle="MRR"
          icon={DollarIcon}
          valueColor="green" 
        />
        <StatCard 
          title="Annual Run Rate" 
          value={formatCurrency(safeStats.revenue.arr * 100)} 
          subtitle="ARR"
          icon={TrendingUpIcon}
          valueColor="blue" 
        />
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(safeStats.revenue.totalRevenue * 100)} 
          subtitle="All time"
          icon={CoinsIcon}
          valueColor="purple" 
        />
        <StatCard 
          title="Active Subscriptions" 
          value={safeStats.overview.activeSubscriptions} 
          subtitle={`${safeStats.trials.active} trials active`}
          icon={UsersIcon}
          valueColor="green" 
        />
        <StatCard 
          title="Avg Subscription Value" 
          value={formatCurrency(safeStats.revenue.averageSubscription * 100)} 
          subtitle={`Range: ${formatCurrency(safeStats.revenue.subscriptionRange.min * 100)} - ${formatCurrency(safeStats.revenue.subscriptionRange.max * 100)}`}
          icon={AwardIcon}
          valueColor="blue" 
        />
        <StatCard 
          title="Churn Rate" 
          value={`${safeStats.churn.churnRate}%`} 
          subtitle={`${safeStats.churn.thisPeriod} churned this period`}
          icon={TrendingDownIcon}
          valueColor="red" 
        />
      </div>

      {/* Stats Tab Buttons */}
      {safeStats.overview.totalSubscriptions > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {statTabs.map((tab) => (
              <StatsTabButton
                key={tab.id}
                label={tab.label}
                icon={tab.icon}
                isActive={activeStatTab === tab.id}
                onClick={() => setActiveStatTab(tab.id)}
              />
            ))}
          </div>

          {/* Overview Content */}
          {activeStatTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <HugeiconsIcon icon={PieChartIcon} className="h-4 w-4" />
                    Status Breakdown
                  </h4>
                  <div className="space-y-3">
                    {safeStats.overview.statusBreakdown.map((item: any) => (
                      <div key={item.status}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize text-gray-600 dark:text-gray-400">{item.status}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{item.count} ({item.percentage}%)</span>
                        </div>
                        <CustomProgress value={parseFloat(item.percentage)} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <HugeiconsIcon icon={TimerIcon} className="h-4 w-4" />
                    Trial & Renewals
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Active Trials</span>
                      <span className="font-semibold">{safeStats.trials.active}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Trial Conversion Rate</span>
                      <span className="font-semibold text-green-600">{safeStats.trials.conversionRate}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Upcoming Renewals</span>
                      <span className="font-semibold">{safeStats.upcomingRenewals[0]?.count || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Expected Revenue</span>
                      <span className="font-semibold text-blue-600">{formatCurrency((safeStats.upcomingRenewals[0]?.expectedRevenue || 0) * 100)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tiers Content */}
          {activeStatTab === 'tiers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeStats.tiers.map((tier: any) => (
                <div key={tier.name} className="border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <HugeiconsIcon icon={TIER_ICONS[tier.name]} className="h-5 w-5 text-blue-500" />
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{tier.name}</h4>
                    <Badge className="ml-auto">{tier.percentage}% of total</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Subscriptions</span>
                      <span className="font-semibold">{tier.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Active</span>
                      <span className="font-semibold text-green-600">{tier.active}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Revenue</span>
                      <span className="font-semibold text-blue-600">{formatCurrency(tier.revenue * 100)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};