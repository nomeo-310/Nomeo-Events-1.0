// models/adminLog.model.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export enum AdminAction {
  LOGIN = "login",
  LOGOUT = "logout",
  FAILED_LOGIN = "failed_login",
  PASSWORD_CHANGE = "password_change",
  UPDATE_SEEDPHRASE = "update_seedphrase",
  CREATE_EVENT = "create_event",
  UPDATE_EVENT = "update_event",
  DELETE_EVENT = "delete_event",
  RESTORE_EVENT = "restore_event",
  ARCHIVE_EVENT = "archive_event",
  PUBLISH_EVENT = "publish_event",
  UNPUBLISH_EVENT = "unpublish_event",
  FEATURE_EVENT = "feature_event",
  APPROVE_EVENT = "approve_event",
  REJECT_EVENT = "reject_event",
  CREATE_USER = "create_user",
  SUSPEND_USER = "suspend_user",
  UNSUSPEND_USER = "unsuspend_user",
  ACTIVATE_USER = "activate_user",
  DEACTIVATE_USER = "deactivate_user",
  DELETE_USER = "delete_user",
  VERIFY_USER = "verify_user",
  REJECT_VERIFICATION = "reject_verification",
  SUSPEND_VERIFICATION = "suspend_verification",
  UPDATE_USER_ROLE = "update_user_role",
  DELETE_USER_PROFILE = "delete_user_profile",
  RESTORE_USER_PROFILE = "restore_user_profile",
  APPROVE_REGISTRATION = "approve_registration",
  REJECT_REGISTRATION = "reject_registration",
  CANCEL_REGISTRATION = "cancel_registration",
  REFUND_REGISTRATION = "refund_registration",
  CHECK_IN_ATTENDEE = "check_in_attendee",
  CREATE_PLAN = "create_plan",
  UPDATE_PLAN = "update_plan",
  DELETE_PLAN = "delete_plan",
  CHANGE_SUBSCRIPTION = "change_subscription",
  CANCEL_SUBSCRIPTION = "cancel_subscription",
  APPLY_COUPON = "apply_coupon",
  UPDATE_SETTINGS = "update_settings",
  CLEAR_CACHE = "clear_cache",
  RUN_MAINTENANCE = "run_maintenance",
  EXPORT_DATA = "export_data",
  IMPORT_DATA = "import_data",
  VIEW_REPORTS = "view_reports",
  VALIDATE_SEEDPHRASE = "validate_seedphrase",
  RESET_2FA = "reset_2fa",
  REVIEW_FLAGGED_CONTENT = "review_flagged_content",
  BLOCK_IP = "block_ip",
  UNBLOCK_IP = "unblock_ip",
  BULK_EMAIL_SEND = "bulk_email_send",
  BULK_UPDATE_EVENTS = "bulk_update_events",
  BULK_DELETE_USERS = "bulk_delete_users",
  MASS_REFUND = "mass_refund",
  CREATE_ADMIN = "create_admin",
  UPDATE_ADMIN = "update_admin",
  UPDATE_ADMIN_ROLE = "update_admin_role",
  SUSPEND_ADMIN = "suspend_admin",
  ACTIVATE_ADMIN = "activate_admin",
  DELETE_ADMIN = "delete_admin",
  VIEW_ADMINS = "view_admins",
}

export enum AdminLogSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

export enum AdminRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  MODERATOR = "moderator",
  SUPPORT = "support",
}

export const TargetTypes = [
  "user", "event", "registration", "subscription",
  "profile", "plan", "system", "admin",  // added "admin" — needed for admin management actions
] as const;
export type TargetType = (typeof TargetTypes)[number];

export const ActionCategories = [
  "authentication",
  "event_management",
  "user_management",
  "registration_management",
  "subscription_management",
  "system_settings",
  "security",
  "bulk_operations",
  "reporting",
  "admin_management", // added — covers CREATE_ADMIN, SUSPEND_ADMIN, etc.
] as const;

// ====================== INTERFACES ======================

export interface IAdminLog {
  adminId: mongoose.Types.ObjectId;
  adminEmail: string;
  adminName: string;
  adminRole: AdminRole;
  action: AdminAction;
  actionCategory: string;
  severity: AdminLogSeverity;
  details: string;
  targetType?: TargetType;
  targetId?: mongoose.Types.ObjectId;
  targetName?: string;
  changes?: { field: string; oldValue?: any; newValue?: any }[];
  ipAddress: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  reason?: string;
  status: "success" | "failed" | "partial";
  errorMessage?: string;
  reversible: boolean;
  revertedAt?: Date;
  revertedBy?: mongoose.Types.ObjectId;
  reversionReason?: string;
  metadata: Map<string, any>;
  affectedCount?: number;
  duration?: number;
  createdAt: Date;
}

export interface IAdminLogDocument extends IAdminLog, Document {}

interface CreateAdminLogParams {
  adminId: string;
  adminEmail: string;
  adminName: string;
  adminRole: AdminRole;
  action: AdminAction;
  actionCategory?: string;
  severity?: AdminLogSeverity;
  details: string;
  targetType?: TargetType;
  targetId?: string;
  targetName?: string;
  changes?: { field: string; oldValue?: any; newValue?: any }[];
  ipAddress: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  reason?: string;
  status?: "success" | "failed" | "partial";
  errorMessage?: string;
  reversible?: boolean;
  affectedCount?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface IAdminLogModel extends Model<IAdminLogDocument> {
  logAction(params: CreateAdminLogParams): Promise<IAdminLogDocument>;
  getRecentActions(limit?: number, category?: string): Promise<IAdminLogDocument[]>;
  getActionsByAdmin(adminId: string, limit?: number): Promise<IAdminLogDocument[]>;
  getActionsByTarget(targetType: TargetType, targetId: string): Promise<IAdminLogDocument[]>;
  getSecurityEvents(limit?: number): Promise<IAdminLogDocument[]>;
  getActionStats(startDate: Date, endDate: Date): Promise<any>;
  revertAction(logId: string, adminId: string, reason: string): Promise<IAdminLogDocument>;
}

// ====================== HELPERS ======================

function getActionCategory(action: AdminAction): string {
  const map: Partial<Record<AdminAction, string>> = {
    // Authentication
    [AdminAction.LOGIN]: "authentication",
    [AdminAction.LOGOUT]: "authentication",
    [AdminAction.FAILED_LOGIN]: "authentication",
    [AdminAction.PASSWORD_CHANGE]: "authentication",
    [AdminAction.UPDATE_SEEDPHRASE]: "authentication",

    // Event management
    [AdminAction.CREATE_EVENT]: "event_management",
    [AdminAction.UPDATE_EVENT]: "event_management",
    [AdminAction.DELETE_EVENT]: "event_management",
    [AdminAction.RESTORE_EVENT]: "event_management",
    [AdminAction.ARCHIVE_EVENT]: "event_management",
    [AdminAction.PUBLISH_EVENT]: "event_management",
    [AdminAction.UNPUBLISH_EVENT]: "event_management",
    [AdminAction.FEATURE_EVENT]: "event_management",
    [AdminAction.APPROVE_EVENT]: "event_management",
    [AdminAction.REJECT_EVENT]: "event_management",

    // User management
    [AdminAction.CREATE_USER]: "user_management",
    [AdminAction.SUSPEND_USER]: "user_management",
    [AdminAction.UNSUSPEND_USER]: "user_management",
    [AdminAction.ACTIVATE_USER]: "user_management",
    [AdminAction.DEACTIVATE_USER]: "user_management",
    [AdminAction.DELETE_USER]: "user_management",
    [AdminAction.VERIFY_USER]: "user_management",
    [AdminAction.REJECT_VERIFICATION]: "user_management",
    [AdminAction.SUSPEND_VERIFICATION]: "user_management",
    [AdminAction.UPDATE_USER_ROLE]: "user_management",
    [AdminAction.DELETE_USER_PROFILE]: "user_management",
    [AdminAction.RESTORE_USER_PROFILE]: "user_management",

    // Registration management
    [AdminAction.APPROVE_REGISTRATION]: "registration_management",
    [AdminAction.REJECT_REGISTRATION]: "registration_management",
    [AdminAction.CANCEL_REGISTRATION]: "registration_management",
    [AdminAction.REFUND_REGISTRATION]: "registration_management",
    [AdminAction.CHECK_IN_ATTENDEE]: "registration_management",

    // Subscription management
    [AdminAction.CREATE_PLAN]: "subscription_management",
    [AdminAction.UPDATE_PLAN]: "subscription_management",
    [AdminAction.DELETE_PLAN]: "subscription_management",
    [AdminAction.CHANGE_SUBSCRIPTION]: "subscription_management",
    [AdminAction.CANCEL_SUBSCRIPTION]: "subscription_management",
    [AdminAction.APPLY_COUPON]: "subscription_management",

    // System settings
    [AdminAction.UPDATE_SETTINGS]: "system_settings",
    [AdminAction.CLEAR_CACHE]: "system_settings",
    [AdminAction.RUN_MAINTENANCE]: "system_settings",
    [AdminAction.EXPORT_DATA]: "system_settings",
    [AdminAction.IMPORT_DATA]: "system_settings",

    // Security
    [AdminAction.VALIDATE_SEEDPHRASE]: "security",
    [AdminAction.RESET_2FA]: "security",
    [AdminAction.REVIEW_FLAGGED_CONTENT]: "security",
    [AdminAction.BLOCK_IP]: "security",
    [AdminAction.UNBLOCK_IP]: "security",

    // Bulk operations
    [AdminAction.BULK_EMAIL_SEND]: "bulk_operations",
    [AdminAction.BULK_UPDATE_EVENTS]: "bulk_operations",
    [AdminAction.BULK_DELETE_USERS]: "bulk_operations",
    [AdminAction.MASS_REFUND]: "bulk_operations",

    // Reporting
    [AdminAction.VIEW_REPORTS]: "reporting",

    // Admin management
    [AdminAction.CREATE_ADMIN]: "admin_management",
    [AdminAction.UPDATE_ADMIN]: "admin_management",
    [AdminAction.UPDATE_ADMIN_ROLE]: "admin_management",
    [AdminAction.SUSPEND_ADMIN]: "admin_management",
    [AdminAction.ACTIVATE_ADMIN]: "admin_management",
    [AdminAction.DELETE_ADMIN]: "admin_management",
    [AdminAction.VIEW_ADMINS]: "admin_management",
  };

  return map[action] ?? "system_settings";
}

function getActionSeverity(action: AdminAction): AdminLogSeverity {
  const critical = new Set<AdminAction>([
    AdminAction.DELETE_USER,
    AdminAction.BULK_DELETE_USERS,
    AdminAction.VALIDATE_SEEDPHRASE,
    AdminAction.DELETE_ADMIN,
  ]);

  const warning = new Set<AdminAction>([
    AdminAction.DELETE_EVENT,
    AdminAction.SUSPEND_USER,
    AdminAction.BLOCK_IP,
    AdminAction.FAILED_LOGIN,
    AdminAction.RESET_2FA,
    AdminAction.REJECT_VERIFICATION,
    AdminAction.SUSPEND_VERIFICATION,
    AdminAction.CLEAR_CACHE,
    AdminAction.RUN_MAINTENANCE,
    AdminAction.MASS_REFUND,
    AdminAction.SUSPEND_ADMIN,
    AdminAction.UPDATE_ADMIN_ROLE,
  ]);

  if (critical.has(action)) return AdminLogSeverity.CRITICAL;
  if (warning.has(action)) return AdminLogSeverity.WARNING;
  return AdminLogSeverity.INFO;
}

// ====================== SUB-SCHEMAS ======================

const ChangeSchema = new Schema(
  {
    field: { type: String, required: true }, // fixed: was requiblue
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
  },
  { _id: false }
);

// ====================== MAIN SCHEMA ======================

const AdminLogSchema = new Schema<IAdminLogDocument, IAdminLogModel>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    adminEmail: { type: String, required: true, index: true },
    adminName: { type: String, required: true },
    adminRole: { type: String, enum: Object.values(AdminRole), required: true },

    action: { type: String, required: true, enum: Object.values(AdminAction), index: true },
    actionCategory: { type: String, enum: ActionCategories, required: true },
    severity: { type: String, enum: Object.values(AdminLogSeverity), default: AdminLogSeverity.INFO },
    details: { type: String, required: true },

    targetType: { type: String, enum: TargetTypes },
    targetId: { type: Schema.Types.ObjectId, index: true },
    targetName: String,

    changes: [ChangeSchema],

    ipAddress: { type: String, required: true },
    userAgent: String,
    endpoint: String,
    method: { type: String, enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] },

    reason: String,
    status: { type: String, enum: ["success", "failed", "partial"], default: "success" },
    errorMessage: String,

    reversible: { type: Boolean, default: false },
    revertedAt: Date,
    revertedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    reversionReason: String,

    metadata: { type: Map, of: Schema.Types.Mixed, default: () => new Map() },

    affectedCount: Number,
    duration: Number,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ====================== INDEXES ======================

AdminLogSchema.index({ createdAt: -1 });
AdminLogSchema.index({ action: 1, createdAt: -1 });
AdminLogSchema.index({ targetType: 1, targetId: 1 });
AdminLogSchema.index({ severity: 1, createdAt: -1 });
AdminLogSchema.index({ adminId: 1, action: 1 });
AdminLogSchema.index({ actionCategory: 1, createdAt: -1 });
AdminLogSchema.index({ status: 1 });

// ====================== STATIC METHODS ======================

AdminLogSchema.statics.logAction = async function (
  this: IAdminLogModel,
  params: CreateAdminLogParams
): Promise<IAdminLogDocument> {
  const metadataMap = new Map<string, any>();
  if (params.metadata) {
    Object.entries(params.metadata).forEach(([k, v]) => metadataMap.set(k, v));
  }
  metadataMap.set("loggedAt", new Date().toISOString());
  metadataMap.set("environment", process.env.NODE_ENV ?? "development");

  const logData: Partial<IAdminLog> & Record<string, any> = {
    adminId: new mongoose.Types.ObjectId(params.adminId),
    adminEmail: params.adminEmail,
    adminName: params.adminName,
    adminRole: params.adminRole,
    action: params.action,
    actionCategory: params.actionCategory ?? getActionCategory(params.action),
    severity: params.severity ?? getActionSeverity(params.action),
    details: params.details,
    ipAddress: params.ipAddress,
    status: params.status ?? "success",
    reversible: params.reversible ?? false,
    metadata: metadataMap,
  };

  if (params.targetType) logData.targetType = params.targetType;
  if (params.targetId) logData.targetId = new mongoose.Types.ObjectId(params.targetId);
  if (params.targetName) logData.targetName = params.targetName;
  if (params.changes?.length) logData.changes = params.changes;
  if (params.userAgent) logData.userAgent = params.userAgent;
  if (params.endpoint) logData.endpoint = params.endpoint;
  if (params.method) logData.method = params.method;
  if (params.reason) logData.reason = params.reason;
  if (params.errorMessage) logData.errorMessage = params.errorMessage;
  if (params.affectedCount !== undefined) logData.affectedCount = params.affectedCount;
  if (params.duration !== undefined) logData.duration = params.duration;

  return new this(logData).save();
};

AdminLogSchema.statics.getRecentActions = async function (
  limit = 50,
  category?: string
): Promise<IAdminLogDocument[]> {
  const query: Record<string, any> = {};
  if (category) query.actionCategory = category;
  return this.find(query).sort({ createdAt: -1 }).limit(limit).lean().exec();
};

AdminLogSchema.statics.getActionsByAdmin = async function (
  adminId: string,
  limit = 50
): Promise<IAdminLogDocument[]> {
  return this.find({ adminId: new mongoose.Types.ObjectId(adminId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();
};

AdminLogSchema.statics.getActionsByTarget = async function (
  targetType: TargetType,
  targetId: string
): Promise<IAdminLogDocument[]> {
  return this.find({
    targetType,
    targetId: new mongoose.Types.ObjectId(targetId),
  })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
};

AdminLogSchema.statics.getSecurityEvents = async function (
  limit = 50
): Promise<IAdminLogDocument[]> {
  return this.find({
    $or: [
      { actionCategory: "security" },
      { severity: { $in: [AdminLogSeverity.CRITICAL, AdminLogSeverity.ERROR] } },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();
};

AdminLogSchema.statics.getActionStats = async function (
  startDate: Date,
  endDate: Date
): Promise<any> {
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { action: "$action", actionCategory: "$actionCategory" },
        count: { $sum: 1 },
        uniqueAdmins: { $addToSet: "$adminId" },
        lastPerformed: { $max: "$createdAt" },
        successCount: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
        failedCount: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
      },
    },
    {
      $project: {
        action: "$_id.action",
        actionCategory: "$_id.actionCategory",
        totalCount: "$count",
        uniqueAdminCount: { $size: "$uniqueAdmins" },
        successCount: 1,
        failedCount: 1,
        lastPerformed: 1,
        _id: 0,
      },
    },
    { $sort: { totalCount: -1 } },
  ]).exec();
};

AdminLogSchema.statics.revertAction = async function (
  logId: string,
  adminId: string,
  reason: string
): Promise<IAdminLogDocument> {
  const log = await this.findById(logId);
  if (!log) throw new Error("Log entry not found");
  if (!log.reversible) throw new Error("This action cannot be reverted");
  if (log.revertedAt) throw new Error("Action already reverted");

  log.revertedAt = new Date();
  log.revertedBy = new mongoose.Types.ObjectId(adminId);
  log.reversionReason = reason;
  return log.save();
};

// ====================== EXPORT ======================

export const AdminLog =
  (mongoose.models.AdminLog as IAdminLogModel) ||
  mongoose.model<IAdminLogDocument, IAdminLogModel>("AdminLog", AdminLogSchema);