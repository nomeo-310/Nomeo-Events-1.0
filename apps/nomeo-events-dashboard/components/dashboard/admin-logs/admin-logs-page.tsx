'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  RefreshIcon,
  Search01Icon,
  FilterHorizontalIcon,
  EyeIcon,
  UserIcon,
  ActivityIcon,
  AlertCircleIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  DownloadIcon,
  UserMultiple02Icon,
  TickDouble02Icon,
} from '@hugeicons/core-free-icons';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaginationWithInfo } from '@/components/ui/pagination';
import { ReusableModal } from '@/components/ui/reusable-modal';
import { cn } from '@/lib/utils';
import {
  useGetAdminLogs,
  useGetAdminLogStats,
  type AdminLog,
} from '@/hooks/use-admin-logs';

import {
  ALL_ACTIONS,
  ALL_CATEGORIES,
  ACTION_LABELS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  SEVERITY_CONFIG,
  type CategoryValue,
  type Filters,
  DEFAULT_FILTERS,
  toQueryParams,
  labelForAction,
  labelForCategory,
  formatDate,
  formatDuration,
} from './log-types'
import { DateRangePicker } from './log-date-range-picker';
import { SeverityBadge, StatusBadge } from './log-badges';
import { StatCard } from './log-stat-card';
import { LogDetail } from './log-detail';
import { LogsSkeleton } from './log-skeleton';
import { EmptyState } from './log-empty-state';

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedLog, setSelectedLog] = useState<AdminLog | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters/search change
  useEffect(() => { setPage(1); }, [filters, debouncedSearch]);

  const queryParams = toQueryParams(filters, debouncedSearch, page);

  const { data: logsData, isLoading, isFetching, refetch } = useGetAdminLogs(queryParams);
  const { data: statsData } = useGetAdminLogStats(30);

  const logs        = logsData?.data ?? [];
  const pagination  = logsData?.pagination;
  const serverRoles      = logsData?.filters?.roles ?? [];
  const serverStatuses   = logsData?.filters?.statuses ?? ['success', 'failed', 'partial'];
  const serverSeverities = logsData?.filters?.severities ?? ['info', 'warning', 'error', 'critical'];

  const showSkeleton = isLoading || (isFetching && logs.length === 0);

  const setFilter = useCallback(<K extends keyof Filters>(key: K, val: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  }, []);

  const clearFilters = () => { setFilters(DEFAULT_FILTERS); setSearch(''); setPage(1); };

  const hasActiveFilters =
    search !== '' ||
    Object.entries(filters).some(([, v]) => v !== 'all' && v !== '');

  const handleRefresh = () => { refetch(); toast.success('Logs refreshed'); };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="px-4 lg:px-6 space-y-5 max-w-screen-2xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                Admin Activity Logs
              </h1>
              {pagination?.total != null && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                  {pagination.total.toLocaleString()} total
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Every administrative action across the platform — searchable, filterable, auditable.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              onClick={handleRefresh}
              variant="outline"
              disabled={isFetching}
              className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 h-10 px-4"
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')}
              />
              Refresh
            </Button>
            <Button
              type="button"
              variant="outline"
              className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 h-10 px-4"
            >
              <HugeiconsIcon icon={DownloadIcon} className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        {statsData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Total Actions (30d)"
              value={statsData.overview?.totalLogs ?? 0}
              icon={ActivityIcon}
            />
            <StatCard
              label="Active Admins"
              value={statsData.overview?.totalAdmins ?? 0}
              icon={UserMultiple02Icon}
            />
            {(statsData.severityDistribution ?? [])
              .slice(0, 2)
              .map((item: { _id: string; count: number }) => {
                const cfg = SEVERITY_CONFIG[item._id as keyof typeof SEVERITY_CONFIG];
                return cfg ? (
                  <StatCard
                    key={item._id}
                    label={`${cfg.label} Events`}
                    value={item.count}
                    icon={cfg.icon}
                  />
                ) : null;
              })}
          </div>
        )}

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Search */}
          <div className="flex-1 relative h-10 lg:h-11 min-w-[220px]">
            <HugeiconsIcon
              icon={Search01Icon}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500 pointer-events-none"
            />
            <Input
              placeholder="Search admin, action, details…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-full dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:placeholder-gray-500"
            />
          </div>

          {/* Admin role */}
          <Select value={filters.adminRole} onValueChange={(v) => v && setFilter('adminRole', v)}>
            <SelectTrigger className="w-36 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10 lg:h-11 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={UserIcon} className="h-3.5 w-3.5 shrink-0" />
                <SelectValue placeholder="Role" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="all">All Roles</SelectItem>
              {(serverRoles.length > 0
                ? serverRoles
                : ['super_admin', 'admin', 'moderator', 'support']
              ).map((role) => (
                <SelectItem key={role} value={role} className="capitalize">
                  {role.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category */}
          <Select value={filters.actionCategory} onValueChange={(v) => v && setFilter('actionCategory', v)}>
            <SelectTrigger className="w-44 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10 lg:h-11 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={ActivityIcon} className="h-3.5 w-3.5 shrink-0" />
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="all">All Categories</SelectItem>
              {ALL_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action */}
          <Select value={filters.action} onValueChange={(v) => v && setFilter('action', v)}>
            <SelectTrigger className="w-44 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10 lg:h-11 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={TickDouble02Icon} className="h-3.5 w-3.5 shrink-0" />
                <SelectValue placeholder="Action" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1 max-h-72">
              <SelectItem value="all">All Actions</SelectItem>
              {ALL_ACTIONS.map((action) => (
                <SelectItem key={action} value={action}>
                  {ACTION_LABELS[action]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Severity */}
          <Select value={filters.severity} onValueChange={(v) => v && setFilter('severity', v)}>
            <SelectTrigger className="w-32 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10 lg:h-11 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={AlertCircleIcon} className="h-3.5 w-3.5 shrink-0" />
                <SelectValue placeholder="Severity" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="all">All</SelectItem>
              {serverSeverities.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={filters.status} onValueChange={(v) => v && setFilter('status', v)}>
            <SelectTrigger className="w-32 dark:bg-gray-900 dark:border-gray-800 dark:text-white h-10 lg:h-11 rounded-lg">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={CheckCircleIcon} className="h-3.5 w-3.5 shrink-0" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-900 dark:border-gray-800 p-1">
              <SelectItem value="all">All</SelectItem>
              {serverStatuses.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range */}
          <DateRangePicker
            startDate={filters.startDate}
            endDate={filters.endDate}
            onStartDateChange={(d) => setFilter('startDate', d)}
            onEndDateChange={(d) => setFilter('endDate', d)}
            onClear={() => setFilters(f => ({ ...f, startDate: '', endDate: '' }))}
          />

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="h-10 px-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <HugeiconsIcon icon={FilterHorizontalIcon} className="h-4 w-4 mr-1.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Inline fetching indicator */}
        {isFetching && !isLoading && (
          <div className="flex items-center gap-1.5">
            <HugeiconsIcon icon={RefreshIcon} className="h-3.5 w-3.5 animate-spin text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Updating…</span>
          </div>
        )}

        {/* ── Desktop table ───────────────────────────────────────────────── */}
        <div className="hidden md:block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {showSkeleton ? (
            <div className="p-6"><LogsSkeleton /></div>
          ) : logs.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
          ) : (
            <>
              {/* Table header */}
              <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                {[
                  { label: 'Admin & Time', flex: true },
                  { label: 'Action',   w: 'w-56' },
                  { label: 'Category', w: 'w-44' },
                  { label: 'Target',   w: 'w-32' },
                  { label: 'Severity', w: 'w-28' },
                  { label: 'Status',   w: 'w-24' },
                  { label: '',         w: 'w-12' },
                ].map(({ label, flex, w }) => (
                  <div key={label} className={cn(
                    'text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500',
                    flex ? 'flex-1' : w,
                    label === '' && 'text-right',
                  )}>
                    {label}
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50 dark:divide-gray-800 relative">
                {isFetching && !isLoading && logs.length > 0 && (
                  <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 z-10 flex items-start justify-center pt-24">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Loading…</span>
                    </div>
                  </div>
                )}

                {logs.map((log) => (
                  <div
                    key={log._id}
                    className={cn(
                      'flex items-center px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors',
                      log.severity === 'critical' && 'bg-purple-50/40 dark:bg-purple-900/10',
                      log.severity === 'error'    && 'bg-red-50/30 dark:bg-red-900/10',
                    )}
                  >
                    {/* Admin + time */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {log.adminName}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{log.adminEmail}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">
                        {formatDate(log.createdAt)}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="w-56 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {labelForAction(log.action)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {log.details}
                      </p>
                    </div>

                    {/* Category */}
                    <div className="w-44">
                      {log.actionCategory && (
                        <div className="flex items-center gap-1.5">
                          <HugeiconsIcon
                            icon={CATEGORY_ICONS[log.actionCategory as CategoryValue] ?? ActivityIcon}
                            className="h-3.5 w-3.5 text-gray-400 shrink-0"
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {labelForCategory(log.actionCategory)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Target */}
                    <div className="w-32 min-w-0">
                      {log.targetType && (
                        <>
                          <Badge variant="outline" className="text-[10px] capitalize dark:border-gray-700">
                            {log.targetType}
                          </Badge>
                          {log.targetName && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                              {log.targetName}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Severity */}
                    <div className="w-28">
                      <SeverityBadge severity={log.severity} />
                      {log.duration && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatDuration(log.duration)}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="w-24">
                      <StatusBadge status={log.status} />
                    </div>

                    {/* View */}
                    <div className="w-12 flex justify-end">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="View details"
                      >
                        <HugeiconsIcon icon={EyeIcon} className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-4">
                  <PaginationWithInfo
                    currentPage={page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={setPage}
                    showInfo
                    showPageNumbers
                    maxVisiblePages={5}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Mobile cards ────────────────────────────────────────────────── */}
        <div className="md:hidden space-y-3">
          {showSkeleton ? (
            <LogsSkeleton />
          ) : logs.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 text-center">
              <HugeiconsIcon icon={ActivityIcon} className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No logs found</p>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-3">
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {isFetching && !isLoading && (
                <div className="flex justify-center py-2">
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                    <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Loading…</span>
                  </div>
                </div>
              )}

              {logs.map((log) => (
                <div
                  key={log._id}
                  className={cn(
                    'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4',
                    log.severity === 'critical' && 'border-purple-200 dark:border-purple-900/50',
                    log.severity === 'error'    && 'border-red-200 dark:border-red-900/50',
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {log.adminName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {log.adminEmail}
                      </p>
                    </div>
                    <SeverityBadge severity={log.severity} />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Action</p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {labelForAction(log.action)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Details</p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2">
                        {log.details}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <p className="text-[10px] text-gray-400">{formatDate(log.createdAt)}</p>
                        <StatusBadge status={log.status} />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                        <HugeiconsIcon icon={EyeIcon} className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {pagination && pagination.totalPages > 1 && (
                <div className="mt-2">
                  <PaginationWithInfo
                    currentPage={page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={setPage}
                    showInfo
                    showPageNumbers={false}
                    maxVisiblePages={3}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Detail modal ─────────────────────────────────────────────────── */}
      <ReusableModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Log Details"
        description="Complete record of this administrative action"
        size="xl"
        maxHeight="85vh"
        actions={[{ label: 'Close', onClick: () => setSelectedLog(null), variant: 'outline' }]}
      >
        {selectedLog && <LogDetail log={selectedLog} />}
      </ReusableModal>
    </div>
  );
}