// models/adminLog.model.ts
import mongoose, { Schema, Document, Model } from "mongoose";

// Extended action types covering all admin operations
export enum AdminAction {
  // Authentication
  LOGIN = "login",
  LOGOUT = "logout",
  FAILED_LOGIN = "failed_login",
  PASSWORD_CHANGE = "password_change",
  
  // Event Management
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
  
  // User/Profile Management
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
  
  // Registration Management
  APPROVE_REGISTRATION = "approve_registration",
  REJECT_REGISTRATION = "reject_registration",
  CANCEL_REGISTRATION = "cancel_registration",
  REFUND_REGISTRATION = "refund_registration",
  CHECK_IN_ATTENDEE = "check_in_attendee",
  
  // Subscription/Plan Management
  CREATE_PLAN = "create_plan",
  UPDATE_PLAN = "update_plan",
  DELETE_PLAN = "delete_plan",
  CHANGE_SUBSCRIPTION = "change_subscription",
  CANCEL_SUBSCRIPTION = "cancel_subscription",
  APPLY_COUPON = "apply_coupon",
  
  // System/Settings
  UPDATE_SETTINGS = "update_settings",
  CLEAR_CACHE = "clear_cache",
  RUN_MAINTENANCE = "run_maintenance",
  EXPORT_DATA = "export_data",
  IMPORT_DATA = "import_data",
  VIEW_REPORTS = "view_reports",
  
  // Security
  VALIDATE_SEEDPHRASE = "validate_seedphrase",
  RESET_2FA = "reset_2fa",
  REVIEW_FLAGGED_CONTENT = "review_flagged_content",
  BLOCK_IP = "block_ip",
  UNBLOCK_IP = "unblock_ip",
  
  // Bulk Operations
  BULK_EMAIL_SEND = "bulk_email_send",
  BULK_UPDATE_EVENTS = "bulk_update_events",
  BULK_DELETE_USERS = "bulk_delete_users",
  MASS_REFUND = "mass_refund"
}

export enum AdminLogSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical"
}

export enum AdminRole {
  USER = "user",
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  MODERATOR = "moderator",
  SUPPORT = "support"
}

export const TargetTypes = ["user", "event", "registration", "subscription", "profile", "plan", "system"] as const;
export type TargetType = typeof TargetTypes[number];

export const ActionCategories = [
  "authentication", 
  "event_management", 
  "user_management", 
  "registration_management", 
  "subscription_management", 
  "system_settings", 
  "security", 
  "bulk_operations", 
  "reporting"
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
  changes?: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
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

// ====================== STATIC METHODS INTERFACE ======================

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

// ====================== HELPER FUNCTIONS ======================

function getActionCategory(action: AdminAction): string {
  const categoryMap: Record<string, string> = {
    login: "authentication",
    logout: "authentication",
    failed_login: "authentication",
    password_change: "authentication",
    create_event: "event_management",
    update_event: "event_management",
    delete_event: "event_management",
    restore_event: "event_management",
    archive_event: "event_management",
    publish_event: "event_management",
    unpublish_event: "event_management",
    feature_event: "event_management",
    approve_event: "event_management",
    reject_event: "event_management",
    suspend_user: "user_management",
    unsuspend_user: "user_management",
    activate_user: "user_management",
    deactivate_user: "user_management",
    delete_user: "user_management",
    verify_user: "user_management",
    reject_verification: "user_management",
    suspend_verification: "user_management",
    update_user_role: "user_management",
    approve_registration: "registration_management",
    reject_registration: "registration_management",
    cancel_registration: "registration_management",
    refund_registration: "registration_management",
    check_in_attendee: "registration_management",
    create_plan: "subscription_management",
    update_plan: "subscription_management",
    delete_plan: "subscription_management",
    change_subscription: "subscription_management",
    cancel_subscription: "subscription_management",
    apply_coupon: "subscription_management",
    update_settings: "system_settings",
    clear_cache: "system_settings",
    run_maintenance: "system_settings",
    export_data: "system_settings",
    import_data: "system_settings",
    validate_seedphrase: "security",
    reset_2fa: "security",
    review_flagged_content: "security",
    block_ip: "security",
    unblock_ip: "security",
    bulk_email_send: "bulk_operations",
    bulk_update_events: "bulk_operations",
    bulk_delete_users: "bulk_operations",
    mass_refund: "bulk_operations",
    view_reports: "reporting"
  };
  
  return categoryMap[action] || "system_settings";
}

function getActionSeverity(action: AdminAction): AdminLogSeverity {
  const severityMap: Record<string, AdminLogSeverity> = {
    delete_user: AdminLogSeverity.CRITICAL,
    bulk_delete_users: AdminLogSeverity.CRITICAL,
    validate_seedphrase: AdminLogSeverity.CRITICAL,
    delete_event: AdminLogSeverity.WARNING,
    suspend_user: AdminLogSeverity.WARNING,
    block_ip: AdminLogSeverity.WARNING,
    failed_login: AdminLogSeverity.WARNING,
    reset_2fa: AdminLogSeverity.WARNING,
    reject_verification: AdminLogSeverity.WARNING,
    suspend_verification: AdminLogSeverity.WARNING,
    clear_cache: AdminLogSeverity.WARNING,
    run_maintenance: AdminLogSeverity.WARNING,
    mass_refund: AdminLogSeverity.WARNING
  };
  
  return severityMap[action] || AdminLogSeverity.INFO;
}

// ====================== SUB-SCHEMAS ======================

const ChangeSchema = new Schema({
  field: { type: String, required: true },
  oldValue: Schema.Types.Mixed,
  newValue: Schema.Types.Mixed,
}, { _id: false });

// ====================== MAIN SCHEMA ======================

const AdminLogSchema = new Schema<IAdminLogDocument, IAdminLogModel>(
  {
    adminId: { 
      type: Schema.Types.ObjectId, 
      ref: "Admin", 
      required: true,
      index: true
    },
    adminEmail: { 
      type: String, 
      required: true,
      index: true
    },
    adminName: {
      type: String,
      required: true
    },
    adminRole: {
      type: String,
      enum: Object.values(AdminRole),
      required: true
    },
    
    action: { 
      type: String, 
      required: true,
      enum: Object.values(AdminAction),
      index: true
    },
    actionCategory: {
      type: String,
      enum: ActionCategories,
      required: true
    },
    severity: {
      type: String,
      enum: Object.values(AdminLogSeverity),
      default: AdminLogSeverity.INFO
    },
    details: { 
      type: String, 
      required: true 
    },
    
    targetType: {
      type: String,
      enum: TargetTypes
    },
    targetId: {
      type: Schema.Types.ObjectId,
      index: true
    },
    targetName: String,
    
    changes: [ChangeSchema],
    
    ipAddress: { 
      type: String, 
      required: true 
    },
    userAgent: String,
    endpoint: String,
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    },
    
    reason: String,
    status: {
      type: String,
      enum: ["success", "failed", "partial"],
      default: "success"
    },
    errorMessage: String,
    
    reversible: {
      type: Boolean,
      default: false
    },
    revertedAt: Date,
    revertedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin"
    },
    reversionReason: String,
    
    metadata: { 
      type: Map, 
      of: Schema.Types.Mixed, 
      default: () => new Map() 
    },
    
    affectedCount: Number,
    duration: Number,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "admin_logs",
  }
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

AdminLogSchema.statics.logAction = async function(
  this: IAdminLogModel,
  params: CreateAdminLogParams
): Promise<IAdminLogDocument> {
  
  const metadataMap = new Map<string, any>();
  if (params.metadata) {
    Object.entries(params.metadata).forEach(([key, value]) => {
      metadataMap.set(key, value);
    });
  }
  metadataMap.set('loggedAt', new Date().toISOString());
  metadataMap.set('environment', process.env.NODE_ENV || 'development');

  const logData: any = {
    adminId: new mongoose.Types.ObjectId(params.adminId),
    adminEmail: params.adminEmail,
    adminName: params.adminName,
    adminRole: params.adminRole,
    action: params.action,
    actionCategory: params.actionCategory || getActionCategory(params.action),
    severity: params.severity || getActionSeverity(params.action),
    details: params.details,
    ipAddress: params.ipAddress,
    status: params.status || "success",
    reversible: params.reversible || false,
    metadata: metadataMap
  };

  if (params.targetType) logData.targetType = params.targetType;
  if (params.targetId) logData.targetId = new mongoose.Types.ObjectId(params.targetId);
  if (params.targetName) logData.targetName = params.targetName;
  if (params.changes && params.changes.length > 0) logData.changes = params.changes;
  if (params.userAgent) logData.userAgent = params.userAgent;
  if (params.endpoint) logData.endpoint = params.endpoint;
  if (params.method) logData.method = params.method;
  if (params.reason) logData.reason = params.reason;
  if (params.errorMessage) logData.errorMessage = params.errorMessage;
  if (params.affectedCount !== undefined) logData.affectedCount = params.affectedCount;
  if (params.duration !== undefined) logData.duration = params.duration;

  const log = new this(logData);
  return log.save();
};

AdminLogSchema.statics.getRecentActions = async function(
  this: IAdminLogModel,
  limit: number = 50, 
  category?: string
): Promise<IAdminLogDocument[]> {
  const query: Record<string, any> = {};
  if (category) query.actionCategory = category;
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();
};

AdminLogSchema.statics.getActionsByAdmin = async function(
  this: IAdminLogModel,
  adminId: string,
  limit: number = 50
): Promise<IAdminLogDocument[]> {
  return this.find({ adminId: new mongoose.Types.ObjectId(adminId) })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();
};

// FIXED: Use proper typing for the query
AdminLogSchema.statics.getActionsByTarget = async function(
  this: IAdminLogModel,
  targetType: TargetType,
  targetId: string
): Promise<IAdminLogDocument[]> {
  // Build the query object explicitly to avoid type issues
  const query: Record<string, any> = {
    targetType: targetType,
    targetId: new mongoose.Types.ObjectId(targetId)
  };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .lean()
    .exec();
};

AdminLogSchema.statics.getSecurityEvents = async function(
  this: IAdminLogModel,
  limit: number = 50
): Promise<IAdminLogDocument[]> {
  const query = {
    $or: [
      { actionCategory: "security" },
      { severity: { $in: [AdminLogSeverity.CRITICAL, AdminLogSeverity.ERROR] } }
    ]
  };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();
};

AdminLogSchema.statics.getActionStats = async function(
  this: IAdminLogModel,
  startDate: Date,
  endDate: Date
): Promise<any> {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          action: "$action",
          actionCategory: "$actionCategory"
        },
        count: { $sum: 1 },
        uniqueAdmins: { $addToSet: "$adminId" },
        lastPerformed: { $max: "$createdAt" },
        successCount: {
          $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
        }
      }
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
        _id: 0
      }
    },
    { $sort: { totalCount: -1 } }
  ]).exec();
};

AdminLogSchema.statics.revertAction = async function(
  this: IAdminLogModel,
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

export const AdminLog = (mongoose.models.AdminLog as IAdminLogModel) || 
  mongoose.model<IAdminLogDocument, IAdminLogModel>("AdminLog", AdminLogSchema);