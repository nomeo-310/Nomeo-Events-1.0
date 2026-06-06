// ─── All AdminAction values (mirrors the model enum exactly) ─────────────────

export const ALL_ACTIONS = [
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

export type ActionValue = typeof ALL_ACTIONS[number];

export const ALL_CATEGORIES = [
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

export type CategoryValue = typeof ALL_CATEGORIES[number];

// ─── Human-readable labels ────────────────────────────────────────────────────

export const ACTION_LABELS: Record<ActionValue, string> = {
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

export const CATEGORY_LABELS: Record<CategoryValue, string> = {
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

// ─── Severity & status configs ────────────────────────────────────────────────

import {
  ActivityIcon,
  AlertCircleIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  CancelCircleIcon as XCircleIcon,
  InformationCircleIcon as InfoCircleIcon,
  Alert02Icon as WarningTriangleIcon,
  CalendarIcon,
  UserIcon,
  ShieldKeyIcon,
  DatabaseIcon,
  Setting07Icon,
  UserMultiple02Icon,
  Invoice01Icon,
  TickDouble02Icon,
} from '@hugeicons/core-free-icons';

export const SEVERITY_CONFIG = {
  info:     { label: 'Info',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',     icon: InfoCircleIcon },
  warning:  { label: 'Warning',  color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: WarningTriangleIcon },
  error:    { label: 'Error',    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',         icon: AlertCircleIcon },
  critical: { label: 'Critical', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: AlertCircleIcon },
} as const;

export const STATUS_CONFIG = {
  success: { label: 'Success', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   icon: CheckCircleIcon },
  failed:  { label: 'Failed',  color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           icon: XCircleIcon },
  partial: { label: 'Partial', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: WarningTriangleIcon },
} as const;

export const CATEGORY_ICONS: Record<CategoryValue, any> = {
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

// ─── Shared helpers ───────────────────────────────────────────────────────────

import { format } from 'date-fns';

export const formatDate = (date: Date | string) =>
  date ? format(new Date(date), 'dd MMM yyyy, HH:mm:ss') : 'N/A';

export const formatDuration = (ms?: number) => {
  if (!ms) return 'N/A';
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
};

export const labelForAction = (action: string): string =>
  ACTION_LABELS[action as ActionValue] ?? action.replace(/_/g, ' ');

export const labelForCategory = (cat: string): string =>
  CATEGORY_LABELS[cat as CategoryValue] ?? cat.replace(/_/g, ' ');

// ─── Filter state ─────────────────────────────────────────────────────────────

export interface Filters {
  adminRole: string;
  action: string;
  actionCategory: string;
  severity: string;
  status: string;
  startDate: string;
  endDate: string;
}

export const DEFAULT_FILTERS: Filters = {
  adminRole: 'all',
  action: 'all',
  actionCategory: 'all',
  severity: 'all',
  status: 'all',
  startDate: '',
  endDate: '',
};

import type { GetAdminLogsParams } from '@/hooks/use-admin-logs';

export function toQueryParams(
  filters: Filters,
  search: string,
  page: number,
): GetAdminLogsParams {
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
    startDate: filters.startDate || undefined,
    endDate:   filters.endDate   || undefined,
  };
}