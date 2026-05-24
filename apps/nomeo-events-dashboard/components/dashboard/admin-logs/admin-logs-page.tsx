'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  RefreshIcon,
  Search01Icon,
  FilterHorizontalIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  ActivityIcon,
  AlertCircleIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  CancelCircleIcon as XCircleIcon,
  InformationCircleIcon as InfoCircleIcon,
  Alert02Icon as WarningTriangleIcon,
  ArrowUp02Icon,
  ArrowDown02Icon,
  DownloadIcon,
  Cancel01Icon,
  ShieldKeyIcon,
  DatabaseIcon,
  Setting07Icon,
  UserMultiple02Icon,
  Invoice01Icon,
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  useGetAdminLogs,
  useGetAdminLogStats,
  type AdminLog,
  type GetAdminLogsParams,
} from '@/hooks/use-admin-logs';

// ─── All AdminAction values (mirrors the model enum exactly) ─────────────────

const ALL_ACTIONS = [
  // Authentication
  'login', 'logout', 'failed_login', 'password_change', 'update_seedphrase',
  // Event management
  'create_event', 'update_event', 'delete_event', 'restore_event',
  'archive_event', 'publish_event', 'unpublish_event', 'feature_event',
  'approve_event', 'reject_event',
  // User management
  'create_user', 'suspend_user', 'unsuspend_user', 'activate_user',
  'deactivate_user', 'delete_user', 'verify_user', 'reject_verification',
  'suspend_verification', 'update_user_role', 'delete_user_profile', 'restore_user_profile',
  // Registration management
  'approve_registration', 'reject_registration', 'cancel_registration',
  'refund_registration', 'check_in_attendee',
  // Subscription / plan management
  'create_plan', 'update_plan', 'delete_plan', 'change_subscription',
  'cancel_subscription', 'apply_coupon',
  // System settings
  'update_settings', 'clear_cache', 'run_maintenance', 'export_data', 'import_data', 'view_reports',
  // Security
  'validate_seedphrase', 'reset_2fa', 'review_flagged_content', 'block_ip', 'unblock_ip',
  // Bulk operations
  'bulk_email_send', 'bulk_update_events', 'bulk_delete_users', 'mass_refund',
  // Admin management
  'create_admin', 'update_admin', 'update_admin_role', 'suspend_admin',
  'activate_admin', 'delete_admin', 'view_admins',
] as const;

type ActionValue = typeof ALL_ACTIONS[number];

const ALL_CATEGORIES = [
  'authentication',
  'event_management',
  'user_management',
  'registration_management',
  'subscription_management',
  'system_settings',
  'security',
  'bulk_operations',
  'reporting',
  'admin_management',
] as const;

type CategoryValue = typeof ALL_CATEGORIES[number];

// Human-readable labels
const ACTION_LABELS: Record<ActionValue, string> = {
  login: 'Login',
  logout: 'Logout',
  failed_login: 'Failed Login',
  password_change: 'Password Change',
  update_seedphrase: 'Update Seedphrase',
  create_event: 'Create Event',
  update_event: 'Update Event',
  delete_event: 'Delete Event',
  restore_event: 'Restore Event',
  archive_event: 'Archive Event',
  publish_event: 'Publish Event',
  unpublish_event: 'Unpublish Event',
  feature_event: 'Feature Event',
  approve_event: 'Approve Event',
  reject_event: 'Reject Event',
  create_user: 'Create User',
  suspend_user: 'Suspend User',
  unsuspend_user: 'Unsuspend User',
  activate_user: 'Activate User',
  deactivate_user: 'Deactivate User',
  delete_user: 'Delete User',
  verify_user: 'Verify User',
  reject_verification: 'Reject Verification',
  suspend_verification: 'Suspend Verification',
  update_user_role: 'Update User Role',
  delete_user_profile: 'Delete User Profile',
  restore_user_profile: 'Restore User Profile',
  approve_registration: 'Approve Registration',
  reject_registration: 'Reject Registration',
  cancel_registration: 'Cancel Registration',
  refund_registration: 'Refund Registration',
  check_in_attendee: 'Check-In Attendee',
  create_plan: 'Create Plan',
  update_plan: 'Update Plan',
  delete_plan: 'Delete Plan',
  change_subscription: 'Change Subscription',
  cancel_subscription: 'Cancel Subscription',
  apply_coupon: 'Apply Coupon',
  update_settings: 'Update Settings',
  clear_cache: 'Clear Cache',
  run_maintenance: 'Run Maintenance',
  export_data: 'Export Data',
  import_data: 'Import Data',
  view_reports: 'View Reports',
  validate_seedphrase: 'Validate Seedphrase',
  reset_2fa: 'Reset 2FA',
  review_flagged_content: 'Review Flagged Content',
  block_ip: 'Block IP',
  unblock_ip: 'Unblock IP',
  bulk_email_send: 'Bulk Email Send',
  bulk_update_events: 'Bulk Update Events',
  bulk_delete_users: 'Bulk Delete Users',
  mass_refund: 'Mass Refund',
  create_admin: 'Create Admin',
  update_admin: 'Update Admin',
  update_admin_role: 'Update Admin Role',
  suspend_admin: 'Suspend Admin',
  activate_admin: 'Activate Admin',
  delete_admin: 'Delete Admin',
  view_admins: 'View Admins',
};

const CATEGORY_LABELS: Record<CategoryValue, string> = {
  authentication: 'Authentication',
  event_management: 'Event Management',
  user_management: 'User Management',
  registration_management: 'Registration Management',
  subscription_management: 'Subscription Management',
  system_settings: 'System Settings',
  security: 'Security',
  bulk_operations: 'Bulk Operations',
  reporting: 'Reporting',
  admin_management: 'Admin Management',
};

const CATEGORY_ICONS: Record<CategoryValue, any> = {
  authentication: ShieldKeyIcon,
  event_management: CalendarIcon,
  user_management: UserIcon,
  registration_management: TickDouble02Icon,
  subscription_management: Invoice01Icon,
  system_settings: Setting07Icon,
  security: ShieldKeyIcon,
  bulk_operations: DatabaseIcon,
  reporting: ActivityIcon,
  admin_management: UserMultiple02Icon,
};

// ─── Severity & status configs ────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  info:     { label: 'Info',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',     icon: InfoCircleIcon },
  warning:  { label: 'Warning',  color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: WarningTriangleIcon },
  error:    { label: 'Error',    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',         icon: AlertCircleIcon },
  critical: { label: 'Critical', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: AlertCircleIcon },
} as const;

const STATUS_CONFIG = {
  success: { label: 'Success', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   icon: CheckCircleIcon },
  failed:  { label: 'Failed',  color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           icon: XCircleIcon },
  partial: { label: 'Partial', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: WarningTriangleIcon },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (date: Date | string) =>
  date ? format(new Date(date), 'dd MMM yyyy, HH:mm:ss') : 'N/A';

const formatDuration = (ms?: number) => {
  if (!ms) return 'N/A';
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
};

const labelForAction = (action: string): string =>
  ACTION_LABELS[action as ActionValue] ?? action.replace(/_/g, ' ');

const labelForCategory = (cat: string): string =>
  CATEGORY_LABELS[cat as CategoryValue] ?? cat.replace(/_/g, ' ');

// ─── Date range picker ────────────────────────────────────────────────────────

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
}

const DateRangePicker = ({
  startDate, endDate,
  onStartDateChange, onEndDateChange, onClear,
}: DateRangePickerProps) => {
  const [startObj, setStartObj] = useState<Date | undefined>(
    startDate ? new Date(startDate) : undefined
  );
  const [endObj, setEndObj] = useState<Date | undefined>(
    endDate ? new Date(endDate) : undefined
  );
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const pickStart = (date: Date | undefined) => {
    setStartObj(date);
    onStartDateChange(date ? format(date, 'yyyy-MM-dd') : '');
    setStartOpen(false);
  };
  const pickEnd = (date: Date | undefined) => {
    setEndObj(date);
    onEndDateChange(date ? format(date, 'yyyy-MM-dd') : '');
    setEndOpen(false);
  };
  const clear = () => {
    setStartObj(undefined);
    setEndObj(undefined);
    onClear();
  };

  const triggerCls = cn(
    'flex h-10 lg:h-11 w-[155px] items-center gap-2 rounded-md border border-input',
    'bg-transparent px-3 text-sm font-normal shadow-xs transition-colors cursor-pointer',
    'hover:bg-accent hover:text-accent-foreground focus:outline-none',
    'dark:border-gray-800 dark:bg-gray-900 dark:text-white'
  );

  return (
    <div className="flex items-center gap-2">
      <Popover open={startOpen} onOpenChange={setStartOpen}>
        <PopoverTrigger>
          <div className={cn(triggerCls, !startObj && 'text-muted-foreground')}>
            <HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5 shrink-0" />
            {startObj ? format(startObj, 'dd MMM yyyy') : 'Start date'}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 dark:bg-gray-900 dark:border-gray-800" align="start">
          <Calendar mode="single" selected={startObj} onSelect={pickStart}
            disabled={(d) => (endObj ? d > endObj : false)} captionLayout="dropdown" />
        </PopoverContent>
      </Popover>

      <span className="text-gray-400 text-xs">to</span>

      <Popover open={endOpen} onOpenChange={setEndOpen}>
        <PopoverTrigger>
          <div className={cn(triggerCls, !endObj && 'text-muted-foreground')}>
            <HugeiconsIcon icon={CalendarIcon} className="h-3.5 w-3.5 shrink-0" />
            {endObj ? format(endObj, 'dd MMM yyyy') : 'End date'}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 dark:bg-gray-900 dark:border-gray-800" align="start">
          <Calendar mode="single" selected={endObj} onSelect={pickEnd}
            disabled={(d) => (startObj ? d < startObj : false)} captionLayout="dropdown" />
        </PopoverContent>
      </Popover>

      {(startDate || endDate) && (
        <Button type="button" variant="ghost" size="sm" onClick={clear}
          className="h-8 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400">
          <HugeiconsIcon icon={Cancel01Icon} className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LogsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-3 mb-6">
        {[1, 140, 140, 128, 128].map((w, i) => (
          <div key={i} className={`h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ${i === 0 ? 'flex-1' : `w-[${w}px]`}`} />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 dark:border-gray-800"
          style={{ opacity: 1 - i * 0.1 }}>
          <div className="flex items-center gap-3 flex-1">
            <div className="h-9 w-9 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-2 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-3 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
          <div className="h-7 w-7 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, trend, accent }: {
  label: string; value: number; icon: any; trend?: number; accent?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
            {value.toLocaleString()}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{label}</p>
          {trend !== undefined && (
            <p className={cn('text-[10px] mt-1 flex items-center gap-0.5',
              trend > 0 ? 'text-green-600 dark:text-green-400'
              : trend < 0 ? 'text-red-600 dark:text-red-400'
              : 'text-gray-500')}>
              {trend > 0
                ? <HugeiconsIcon icon={ArrowUp02Icon} className="h-3 w-3" />
                : trend < 0 ? <HugeiconsIcon icon={ArrowDown02Icon} className="h-3 w-3" /> : null}
              {Math.abs(trend)}% vs last period
            </p>
          )}
        </div>
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', accent ?? 'bg-blue-100 dark:bg-blue-900/30')}>
          <HugeiconsIcon icon={icon} className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
    </div>
  );
}

// ─── Severity / status badges ─────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
  if (!cfg) return <Badge variant="outline">{severity}</Badge>;
  return (
    <Badge className={cn('gap-1 text-[11px]', cfg.color)}>
      <HugeiconsIcon icon={cfg.icon} className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  if (!cfg) return <Badge variant="outline">{status}</Badge>;
  return (
    <Badge className={cn('gap-1 text-[11px]', cfg.color)}>
      <HugeiconsIcon icon={cfg.icon} className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

// ─── Log detail modal content ─────────────────────────────────────────────────

function LogDetail({ log }: { log: AdminLog }) {
  return (
    <div className="space-y-5">
      {/* ID + badges */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">Log ID</p>
          <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{log._id}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <SeverityBadge severity={log.severity} />
          <StatusBadge status={log.status} />
        </div>
      </div>

      {/* Grid: admin + timing + action + endpoint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DetailBox label="Admin">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{log.adminName}</p>
          <p className="text-xs text-gray-500">{log.adminEmail}</p>
          <Badge variant="outline" className="mt-1.5 capitalize text-[10px] dark:border-gray-700">
            {log.adminRole.replace(/_/g, ' ')}
          </Badge>
        </DetailBox>

        <DetailBox label="Time & Network">
          <p className="text-sm text-gray-900 dark:text-white">{formatDate(log.createdAt)}</p>
          <p className="text-xs text-gray-500 mt-0.5">IP: {log.ipAddress}</p>
          {log.duration && (
            <p className="text-xs text-gray-500 mt-0.5">Duration: {formatDuration(log.duration)}</p>
          )}
        </DetailBox>

        <DetailBox label="Action">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{labelForAction(log.action)}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Category: {labelForCategory(log.actionCategory ?? '')}
          </p>
        </DetailBox>

        <DetailBox label="Endpoint">
          <p className="text-sm text-gray-900 dark:text-white break-all">{log.endpoint ?? 'N/A'}</p>
          {log.method && (
            <Badge variant="outline" className="mt-1.5 text-[10px] dark:border-gray-700">
              {log.method}
            </Badge>
          )}
        </DetailBox>
      </div>

      {/* Details */}
      <DetailBox label="Details">
        <p className="text-sm text-gray-900 dark:text-white leading-relaxed">{log.details}</p>
      </DetailBox>

      {/* Reason */}
      {log.reason && (
        <DetailBox label="Reason">
          <p className="text-sm text-gray-900 dark:text-white">{log.reason}</p>
        </DetailBox>
      )}

      {/* Target */}
      {log.targetType && (
        <DetailBox label="Target">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span><span className="text-gray-500">Type:</span> <span className="font-medium dark:text-white">{log.targetType}</span></span>
            {log.targetName && <span><span className="text-gray-500">Name:</span> <span className="font-medium dark:text-white">{log.targetName}</span></span>}
            {log.targetId && <span className="text-xs text-gray-400">ID: {log.targetId}</span>}
          </div>
        </DetailBox>
      )}

      {/* Changes */}
      {log.changes && log.changes.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Changes ({log.changes.length})
          </p>
          <div className="space-y-2">
            {log.changes.map((change, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">{change.field}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Before</p>
                    <p className="bg-white dark:bg-gray-900 rounded px-2 py-1 text-gray-700 dark:text-gray-300 text-xs break-all">
                      {change.oldValue !== undefined ? String(change.oldValue) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">After</p>
                    <p className="bg-white dark:bg-gray-900 rounded px-2 py-1 text-gray-700 dark:text-gray-300 text-xs break-all">
                      {change.newValue !== undefined ? String(change.newValue) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {log.errorMessage && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Error Message</p>
          <p className="text-sm text-red-700 dark:text-red-400">{log.errorMessage}</p>
        </div>
      )}

      {/* Reversion */}
      {log.reversible && (
        <div className={cn('rounded-lg p-4 border',
          log.revertedAt
            ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
            : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50')}>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
            {log.revertedAt ? 'Reverted Action' : 'Reversible Action'}
          </p>
          {log.revertedAt ? (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Reverted at {formatDate(log.revertedAt)}
              </p>
              {log.reversionReason && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Reason: {log.reversionReason}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">This action can be reverted</p>
          )}
        </div>
      )}

      {/* Metadata */}
      {log.metadata && Object.keys(log.metadata).length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Metadata</p>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 overflow-x-auto">
            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* User agent */}
      {log.userAgent && (
        <DetailBox label="User Agent">
          <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{log.userAgent}</p>
        </DetailBox>
      )}
    </div>
  );
}

function DetailBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

// ─── Filter state type ────────────────────────────────────────────────────────

interface Filters {
  adminRole: string;
  action: string;
  actionCategory: string;
  severity: string;
  status: string;
  startDate: string;
  endDate: string;
}

const DEFAULT_FILTERS: Filters = {
  adminRole: 'all',
  action: 'all',
  actionCategory: 'all',
  severity: 'all',
  status: 'all',
  startDate: '',
  endDate: '',
};

// Convert filter state → hook params (strip 'all' and empty strings → undefined)
function toQueryParams(filters: Filters, search: string, page: number): GetAdminLogsParams {
  return {
    page,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: search || undefined,
    adminRole:      filters.adminRole      !== 'all' ? filters.adminRole      : undefined,
    action:         filters.action         !== 'all' ? filters.action         : undefined,
    actionCategory: filters.actionCategory !== 'all' ? filters.actionCategory : undefined,
    severity:       filters.severity       !== 'all' ? filters.severity       : undefined,
    status:         filters.status         !== 'all' ? filters.status         : undefined,
    // searchParams.get() → string | null → guard with || undefined
    startDate: filters.startDate || undefined,
    endDate:   filters.endDate   || undefined,
  };
}

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
  // Use server-provided filter options when available, fall back to our constants
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
    Object.entries(filters).some(([k, v]) => v !== 'all' && v !== '');

  const handleRefresh = () => { refetch(); toast.success('Logs refreshed'); };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-6">
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
            <Button type="button" onClick={handleRefresh} variant="outline" disabled={isFetching}
              className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 h-10 px-4">
              <HugeiconsIcon icon={RefreshIcon} className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')} />
              Refresh
            </Button>
            <Button type="button" variant="outline"
              className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 h-10 px-4">
              <HugeiconsIcon icon={DownloadIcon} className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        {statsData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Actions (30d)" value={statsData.overview?.totalLogs ?? 0} icon={ActivityIcon} />
            <StatCard label="Active Admins" value={statsData.overview?.totalAdmins ?? 0} icon={UserMultiple02Icon} />
            {(statsData.severityDistribution ?? []).slice(0, 2).map((item: { _id: string; count: number }) => {
              const cfg = SEVERITY_CONFIG[item._id as keyof typeof SEVERITY_CONFIG];
              return cfg ? (
                <StatCard key={item._id} label={`${cfg.label} Events`} value={item.count} icon={cfg.icon} />
              ) : null;
            })}
          </div>
        )}

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2.5 items-center">
          {/* Search */}
          <div className="flex-1 relative h-10 lg:h-11 min-w-[220px]">
            <HugeiconsIcon icon={Search01Icon}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
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

          {/* Action — full list grouped by category */}
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
            <Button variant="ghost" onClick={clearFilters}
              className="h-10 px-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
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
                  { label: 'Action', w: 'w-56' },
                  { label: 'Category', w: 'w-44' },
                  { label: 'Target', w: 'w-32' },
                  { label: 'Severity', w: 'w-28' },
                  { label: 'Status', w: 'w-24' },
                  { label: '', w: 'w-12' },
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
                  <div key={log._id}
                    className={cn(
                      'flex items-center px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors',
                      log.severity === 'critical' && 'bg-purple-50/40 dark:bg-purple-900/10',
                      log.severity === 'error' && 'bg-red-50/30 dark:bg-red-900/10',
                    )}
                  >
                    {/* Admin + time */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{log.adminName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{log.adminEmail}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">{formatDate(log.createdAt)}</p>
                    </div>

                    {/* Action */}
                    <div className="w-56 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {labelForAction(log.action)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{log.details}</p>
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
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{log.targetName}</p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Severity */}
                    <div className="w-28">
                      <SeverityBadge severity={log.severity} />
                      {log.duration && (
                        <p className="text-[10px] text-gray-400 mt-1">{formatDuration(log.duration)}</p>
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
                    showInfo showPageNumbers maxVisiblePages={5}
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
                <div key={log._id}
                  className={cn(
                    'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4',
                    log.severity === 'critical' && 'border-purple-200 dark:border-purple-900/50',
                    log.severity === 'error' && 'border-red-200 dark:border-red-900/50',
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{log.adminName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{log.adminEmail}</p>
                    </div>
                    <SeverityBadge severity={log.severity} />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Action</p>
                      <p className="text-gray-900 dark:text-white font-medium">{labelForAction(log.action)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Details</p>
                      <p className="text-gray-600 dark:text-gray-400 text-xs line-clamp-2">{log.details}</p>
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
                    currentPage={page} totalPages={pagination.totalPages}
                    totalItems={pagination.total} itemsPerPage={pagination.limit}
                    onPageChange={setPage} showInfo showPageNumbers={false} maxVisiblePages={3}
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

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="py-24 text-center">
      <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
        <HugeiconsIcon icon={ActivityIcon} className="h-6 w-6 text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {hasFilters ? 'No matching logs' : 'No activity yet'}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {hasFilters ? 'Try adjusting your filters or search term' : 'Admin actions will appear here once recorded'}
      </p>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear}>
          <HugeiconsIcon icon={FilterHorizontalIcon} className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}