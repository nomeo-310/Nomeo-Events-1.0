// subscriptions-page.tsx
'use client';

import { useState, useEffect } from 'react';
import { HugeiconsIcon } from "@hugeicons/react";
import {
Search01Icon, 
RefreshIcon, 
File01Icon, 
FileSpreadsheetIcon,
ViewIcon,
UnavailableIcon as BanIcon,
CheckmarkCircle02Icon as CheckCircleIcon,
ClockIcon,
AlertCircleIcon,
ArrowUp01Icon,
ArrowDown01Icon,
LayersIcon,
PauseIcon,
PlayIcon,
TimerIcon,
Alert02Icon as AlertTriangleIcon,
} from "@hugeicons/core-free-icons";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginationWithInfo } from "@/components/ui/pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ReusableModal, ActionModal } from '@/components/ui/reusable-modal';
import { authClient } from '@/lib/auth/auth-client';

import {
  useGetSubscriptions,
  useGetSubscription,
  useSubscriptionManagement,
  useGetSubscriptionStats,
  type GetSubscriptionsParams,
  type SubscriptionStatus,
  type PlanTier,
  type PlanInterval,
} from '@/hooks/use-subscriptions';
import { useQueryClient } from '@tanstack/react-query';

import { TabButton, DateRangePicker, ActionDropdown } from './subscriptions-components';
import { StatsSection } from './subscriptions-stats';
import { SubscriptionsTable } from './subscriptions-table';
import { SubscriptionsSkeleton } from './subscriptions-skeletons';
import { SubscriptionDetailsContent, ManualExpiryModal } from './subscriptions-modals';
import { getInitials, getStatusLabel, STATUS_ICONS, STATUS_COLORS, formatCurrency, formatDate, type DropdownItem } from './subscriptions-types';
import type { ISubscription } from '@/hooks/use-subscriptions';

export default function SubscriptionsPage() {
  const { data: session } = authClient.useSession();
  const isSuperAdmin = session?.user?.role === 'super_admin';
  const queryClient = useQueryClient();
  
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<SubscriptionStatus>('active');
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<PlanTier | 'all'>('all');
  const [intervalFilter, setIntervalFilter] = useState<PlanInterval | 'all'>('all');
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [manualExpiryOpen, setManualExpiryOpen] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState(30);

  const [viewId, setViewId] = useState<string | null>(null);
  const [cancelSub, setCancelSub] = useState<ISubscription | null>(null);
  const [pauseSub, setPauseSub] = useState<ISubscription | null>(null);
  const [extendSub, setExtendSub] = useState<ISubscription | null>(null);
  const [reason, setReason] = useState("");
  const [cancelNow, setCancelNow] = useState(false);
  const [extendDays, setExtendDays] = useState("30");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); setSelected(new Set()); }, [tab, tierFilter, intervalFilter, startDate, endDate]);

  const params: GetSubscriptionsParams = { page, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' };
  if (debouncedSearch) params.search = debouncedSearch;
  params.status = tab;
  if (tierFilter !== 'all') params.planTier = tierFilter;
  if (intervalFilter !== 'all') params.interval = intervalFilter;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const { data, isLoading, isFetching, refetch } = useGetSubscriptions(params);
  const { data: stats, isLoading: statsLoading } = useGetSubscriptionStats(statsPeriod);
  const { cancelSubscription, pauseSubscription, resumeSubscription, extendSubscription, markSubscriptionActive, markSubscriptionPastDue, bulkAction, exportSubscriptions } = useSubscriptionManagement();

  const subscriptions = data?.subscriptions || [];
  const pagination = data?.pagination;
  const showSkeleton = isLoading || (isFetching && subscriptions.length === 0);
  const hasFilters = debouncedSearch || tierFilter !== 'all' || intervalFilter !== 'all' || startDate || endDate;

  const toggleSelect = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };
  const selectAll = () => setSelected(selected.size === subscriptions.length && subscriptions.length > 0 ? new Set() : new Set(subscriptions.map(s => s._id)));
  const clearFilters = () => { setSearch(""); setDebouncedSearch(""); setTab("active"); setTierFilter("all"); setIntervalFilter("all"); setStartDate(""); setEndDate(""); setPage(1); setSelected(new Set()); };

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['subscriptions', 'stats'] });
    toast.success("Data refreshed");
  };

  const doCancel = async () => { 
    if (!cancelSub) return; 
    setActionLoading(true); 
    try { 
      await cancelSubscription(cancelSub._id, reason, cancelNow); 
      toast.success("Cancelled"); 
      setCancelSub(null); 
      setReason(""); 
      setCancelNow(false); 
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); 
    } catch { 
      toast.error("Failed"); 
    } finally { 
      setActionLoading(false); 
    } 
  };
  
  const doPause = async () => { 
    if (!pauseSub) return; 
    setActionLoading(true); 
    try { 
      await pauseSubscription(pauseSub._id, reason); 
      toast.success("Paused"); 
      setPauseSub(null); 
      setReason(""); 
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); 
    } catch { 
      toast.error("Failed"); 
    } finally { 
      setActionLoading(false); 
    } 
  };
  
  const doExtend = async () => { 
    if (!extendSub) return; 
    setActionLoading(true); 
    try { 
      await extendSubscription(extendSub._id, parseInt(extendDays), reason); 
      toast.success(`Extended ${extendDays} days`); 
      setExtendSub(null); 
      setReason(""); 
      setExtendDays("30"); 
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); 
    } catch { 
      toast.error("Failed"); 
    } finally { 
      setActionLoading(false); 
    } 
  };

  const tabConfigs: Array<{ key: SubscriptionStatus; label: string }> = [
    { key: 'active', label: 'Active' },
    { key: 'trialing', label: 'Trialing' },
    { key: 'past_due', label: 'Past Due' },
    { key: 'paused', label: 'Paused' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'expired', label: 'Expired' },
  ];

  const getTabCount = (k: SubscriptionStatus) => {
    if (!stats?.overview?.statusBreakdown) return 0;
    return stats.overview.statusBreakdown.find(s => s.status === k)?.count || 0;
  };

  const getSubscriptionDropdownItems = (sub: ISubscription): (DropdownItem | { divider: true; section?: string })[] => {
    const items: (DropdownItem | { divider: true; section?: string })[] = [
      { label: 'View Details', icon: ViewIcon, onClick: () => setViewId(sub._id) }
    ];
    
    if (isSuperAdmin) {
      items.push({ divider: true, section: 'Actions' });
      
      if (sub.status === 'active' || sub.status === 'trialing') {
        items.push({ label: 'Cancel', icon: BanIcon, onClick: () => setCancelSub(sub) });
        items.push({ label: 'Pause', icon: PauseIcon, onClick: () => setPauseSub(sub) });
        items.push({ label: 'Extend', icon: TimerIcon, onClick: () => setExtendSub(sub) });
      }
      
      if (sub.status === 'paused') {
        items.push({ 
          label: 'Resume', 
          icon: PlayIcon, 
          onClick: () => resumeSubscription(sub._id).then(() => { 
            toast.success("Resumed"); 
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); 
          }).catch(() => toast.error("Failed")) 
        });
      }
      
      if (sub.status === 'past_due') {
        items.push({ 
          label: 'Mark Active', 
          icon: CheckCircleIcon, 
          onClick: () => markSubscriptionActive(sub._id).then(() => { 
            toast.success("Marked active"); 
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); 
          }).catch(() => toast.error("Failed")) 
        });
      }
      
      if (sub.status === 'active') {
        items.push({ 
          label: 'Mark Past Due', 
          icon: AlertCircleIcon, 
          onClick: () => markSubscriptionPastDue(sub._id).then(() => { 
            toast.success("Marked past due"); 
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); 
          }).catch(() => toast.error("Failed")) 
        });
      }
    }
    
    return items;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <div className="px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Subscription Management</h1>
              {stats && stats.overview?.activeSubscriptions > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                  {stats.overview.activeSubscriptions} active
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Monitor and manage all subscriptions. View details, handle cancellations, pauses, extensions, and track revenue metrics.</p>
        </div>

        {/* Stats Section */}
        <StatsSection stats={stats} isLoading={statsLoading} />

        {/* Toolbar */}
        <div className="flex justify-end mb-4 gap-2">
          <Select value={String(statsPeriod)} onValueChange={v => setStatsPeriod(parseInt(v || '30'))}>
            <SelectTrigger className="w-32 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
            </SelectContent>
          </Select>
          <ActionDropdown trigger={<Button type="button" variant="outline" size="sm" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 px-4 h-10"><HugeiconsIcon icon={FileSpreadsheetIcon} className="h-3.5 w-3.5 mr-2" />Export</Button>}
            items={[
              { label: 'Export CSV', icon: FileSpreadsheetIcon, onClick: () => exportSubscriptions({ format: 'csv', status: tab }) },
              { label: 'Export JSON', icon: File01Icon, onClick: () => exportSubscriptions({ format: 'json' }) },
            ]}
          />
          <Button type="button" onClick={handleRefresh} variant="outline" className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 px-4 h-10" disabled={isFetching}>
            <HugeiconsIcon icon={RefreshIcon} className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {tabConfigs.map(({ key, label }) => (
              <TabButton key={key} label={label} count={getTabCount(key)} isActive={tab === key} onClick={() => setTab(key)} />
            ))}
            {isFetching && !isLoading && <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4 animate-spin text-blue-500" />}
          </div>
          
          {isSuperAdmin && (
            <div className="hidden lg:block">
              <Button 
                onClick={() => setManualExpiryOpen(true)}
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30"
              >
                <HugeiconsIcon icon={AlertTriangleIcon} className="h-4 w-4 mr-2" />
                Manual Expiry
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-2.5 items-center">
          <div className="flex-1 relative h-10 lg:h-11 min-w-[200px]">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
            <Input placeholder="Search by plan name, user email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:placeholder-gray-500" />
          </div>
          <Select value={tierFilter} onValueChange={v => setTierFilter((v as PlanTier) ?? 'all')}>
            <SelectTrigger className="w-full sm:w-36 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10 lg:h-11 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={LayersIcon} className="h-4 w-4" />
                <SelectValue placeholder="Tier" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Select value={intervalFilter} onValueChange={v => setIntervalFilter((v as PlanInterval) ?? 'all')}>
            <SelectTrigger className="w-full sm:w-36 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10 lg:h-11 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={ClockIcon} className="h-4 w-4" />
                <SelectValue placeholder="Interval" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="biannual">Biannual</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
              <SelectItem value="lifetime">Lifetime</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} onClear={() => { setStartDate(""); setEndDate(""); }} />
        </div>

        {/* Bulk bar */}
        {selected.size > 0 && !showSkeleton && isSuperAdmin && (
          <div className="mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center">{selected.size}</span>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">selected</span>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300" onClick={() => { bulkAction({ action: 'cancel', subscriptionIds: Array.from(selected), reason: 'Bulk cancellation' }); setSelected(new Set()); }}>
                <HugeiconsIcon icon={BanIcon} className="h-3.5 w-3.5 mr-1.5" />Bulk Cancel
              </Button>
              <Button type="button" variant="outline" size="sm" className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-blue-700 dark:text-blue-300" onClick={() => { bulkAction({ action: 'pause', subscriptionIds: Array.from(selected), reason: 'Bulk pause' }); setSelected(new Set()); }}>
                <HugeiconsIcon icon={PauseIcon} className="h-3.5 w-3.5 mr-1.5" />Bulk Pause
              </Button>
            </div>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden md:block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <SubscriptionsTable
            subscriptions={subscriptions}
            selected={selected}
            isSuperAdmin={isSuperAdmin}
            isFetching={isFetching}
            isLoading={isLoading}
            onToggleSelect={toggleSelect}
            onSelectAll={selectAll}
            onView={setViewId}
            getDropdownItems={getSubscriptionDropdownItems}
          />
          {pagination && pagination.totalPages > 1 && (
            <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4">
              <PaginationWithInfo currentPage={page} totalPages={pagination.totalPages} totalItems={pagination.totalCount} itemsPerPage={pagination.limit} onPageChange={setPage} showInfo showPageNumbers maxVisiblePages={5} />
            </div>
          )}
        </div>

        {/* Mobile */}
        <div className="md:hidden space-y-3">
          {showSkeleton ? <SubscriptionsSkeleton /> : subscriptions.map(sub => {
            const name = typeof sub.userId === 'object' ? sub.userId?.name : 'Unknown';
            const email = typeof sub.userId === 'object' ? sub.userId?.email : 'Unknown';
            const avatar = typeof sub.userId === 'object' ? sub.userId?.avatar : undefined;
            const isExpanded = expandedMobile === sub._id;
            return (
              <div key={sub._id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  {isSuperAdmin && <Checkbox checked={selected.has(sub._id)} onCheckedChange={() => toggleSelect(sub._id)} />}
                  <Avatar className="h-9 w-9 rounded-full flex-shrink-0">
                    {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
                    <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">{getInitials(name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sub.planName}</p>
                  </div>
                  <Badge className={cn("gap-1 border", STATUS_COLORS[sub.status])}>
                    <HugeiconsIcon icon={STATUS_ICONS[sub.status]} className="h-3 w-3" />
                    {getStatusLabel(sub.status)}
                  </Badge>
                  <button onClick={() => setExpandedMobile(p => p === sub._id ? null : sub._id)} className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <HugeiconsIcon icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon} className="h-4 w-4" />
                  </button>
                </div>
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                        <p className="text-[10px] text-gray-400 uppercase">Price</p>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatCurrency(sub.finalPriceKobo)}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                        <p className="text-[10px] text-gray-400 uppercase">Period End</p>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatDate(sub.currentPeriodEnd)}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full h-8 text-xs dark:border-gray-700" onClick={() => setViewId(sub._id)}>
                      <HugeiconsIcon icon={ViewIcon} className="h-3 w-3 mr-1" />View Details
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4">
              <PaginationWithInfo currentPage={page} totalPages={pagination.totalPages} totalItems={pagination.totalCount} itemsPerPage={pagination.limit} onPageChange={setPage} showInfo maxVisiblePages={3} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ReusableModal 
        isOpen={!!viewId} 
        onClose={() => setViewId(null)} 
        title="Subscription Details" 
        description="Complete subscription information" 
        size="full" 
        className="!max-w-4xl" 
        actions={[{ label: 'Close', onClick: () => setViewId(null), variant: 'outline' }]}
      >
        {viewId && <SubscriptionDetailsContent subscriptionId={viewId} useGetSubscription={useGetSubscription} />}
      </ReusableModal>

      <ActionModal isOpen={!!cancelSub} onClose={() => { setCancelSub(null); setReason(""); setCancelNow(false); }} onAction={doCancel} title="Cancel Subscription" description="Cancel the user's subscription" actionLabel="Cancel Subscription" cancelLabel="Keep Active" actionVariant="danger" isLoading={actionLoading} disabled={!reason} size="md">
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-lg">
            <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div><p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1.5">Cancelling: {cancelSub?.planName} ({cancelSub?.planTier})</p><p className="text-xs text-red-700 dark:text-red-400">Period ends: {formatDate(cancelSub?.currentPeriodEnd)}</p></div>
          </div>
          <div><Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason</Label><Textarea placeholder="Reason for cancellation..." value={reason} onChange={e => setReason(e.target.value)} className="mt-1.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white" rows={3} /></div>
          <div className="flex items-center gap-2"><Checkbox id="cancelNow" checked={cancelNow} onCheckedChange={c => setCancelNow(!!c)} /><Label htmlFor="cancelNow" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">Cancel immediately</Label></div>
        </div>
      </ActionModal>

      <ActionModal isOpen={!!pauseSub} onClose={() => { setPauseSub(null); setReason(""); }} onAction={doPause} title="Pause Subscription" description="Temporarily pause the subscription" actionLabel="Pause" cancelLabel="Cancel" actionVariant="secondary" isLoading={actionLoading} disabled={!reason} size="md">
        <div className="space-y-4">
          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-lg">
            <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div><p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1.5">Pausing: {pauseSub?.planName}</p><p className="text-xs text-amber-700 dark:text-amber-400">Access will be suspended immediately</p></div>
          </div>
          <div><Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason</Label><Textarea placeholder="Reason for pausing..." value={reason} onChange={e => setReason(e.target.value)} className="mt-1.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white" rows={3} /></div>
        </div>
      </ActionModal>

      <ManualExpiryModal 
        isOpen={manualExpiryOpen} 
        onClose={() => setManualExpiryOpen(false)} 
        onRefresh={handleRefresh}
        fetchApi={fetch}
        postApi={fetch}
      />
    </div>
  );
}