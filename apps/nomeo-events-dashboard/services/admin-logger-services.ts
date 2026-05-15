// services/admin-logger.service.ts
import { AdminLog, AdminAction, AdminLogSeverity, AdminRole } from "@/models/admin-log";
import { headers } from "next/headers";

// ====================== INTERFACES ======================

interface LogActionParams {
  adminId: string;
  adminEmail: string;
  adminName: string;
  adminRole: AdminRole;
  action: AdminAction;
  details: string;
  targetType?: "user" | "event" | "registration" | "subscription" | "profile" | "plan" | "system";
  targetId?: string;
  targetName?: string;
  changes?: { field: string; oldValue?: any; newValue?: any }[];
  reason?: string;
  status?: "success" | "failed" | "partial";
  errorMessage?: string;
  reversible?: boolean;
  affectedCount?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

// ====================== MAIN CLASS ======================

export class AdminLogger {
  
  /**
   * Get client IP and user agent from request headers
   */
  private static async getRequestInfo(): Promise<{ ipAddress: string; userAgent?: string }> {
    try {
      const headersList = await headers();
      
      const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                        headersList.get("x-real-ip") || 
                        "unknown";
      
      const userAgent = headersList.get("user-agent") || undefined;

      return { ipAddress, userAgent };
    } catch (error) {
      // Fallback if headers() fails (e.g., during build or in non-request context)
      console.warn("Failed to get request headers for admin log:", error);
      return { ipAddress: "unknown" };
    }
  }

  /**
   * Log an admin action with automatic IP/user-agent detection
   */
  static async log(params: LogActionParams): Promise<void> {
    try {
      const { ipAddress, userAgent } = await this.getRequestInfo();

      await AdminLog.logAction({
        ...params,
        ipAddress,
        userAgent,
        metadata: {
          ...params.metadata,
          loggedVia: "AdminLogger.log()"
        }
      });

    } catch (error) {
      console.error("Failed to create admin log:", error);
      // Don't throw - logging should never break the main flow
    }
  }

  /**
   * Log with manually provided IP (useful for API routes that already have IP)
   */
  static async logWithIP(
    params: LogActionParams,
    ipAddress: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await AdminLog.logAction({
        ...params,
        ipAddress,
        userAgent,
        metadata: {
          ...params.metadata,
          loggedVia: "AdminLogger.logWithIP()"
        }
      });
    } catch (error) {
      console.error("Failed to create admin log:", error);
    }
  }

  /**
   * Log event-related actions
   */
  static async logEventAction(
    admin: AdminUser,
    action: AdminAction,
    eventId: string,
    eventTitle: string,
    details: string,
    extra?: Partial<LogActionParams>
  ): Promise<void> {
    return this.log({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      adminRole: admin.role,
      action,
      details,
      targetType: "event",
      targetId: eventId,
      targetName: eventTitle,
      ...extra
    });
  }

  /**
   * Log user-related actions
   */
  static async logUserAction(
    admin: AdminUser,
    action: AdminAction,
    userId: string,
    userName: string,
    details: string,
    extra?: Partial<LogActionParams>
  ): Promise<void> {
    return this.log({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      adminRole: admin.role,
      action,
      details,
      targetType: "user",
      targetId: userId,
      targetName: userName,
      ...extra
    });
  }

  /**
   * Log registration-related actions
   */
  static async logRegistrationAction(
    admin: AdminUser,
    action: AdminAction,
    registrationId: string,
    registrationNumber: string,
    attendeeName: string,
    details: string,
    extra?: Partial<LogActionParams>
  ): Promise<void> {
    return this.log({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      adminRole: admin.role,
      action,
      details,
      targetType: "registration",
      targetId: registrationId,
      targetName: `Reg#${registrationNumber} - ${attendeeName}`,
      ...extra
    });
  }

  /**
   * Log subscription-related actions
   */
  static async logSubscriptionAction(
    admin: AdminUser,
    action: AdminAction,
    subscriptionId: string,
    planName: string,
    userName: string,
    details: string,
    extra?: Partial<LogActionParams>
  ): Promise<void> {
    return this.log({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      adminRole: admin.role,
      action,
      details,
      targetType: "subscription",
      targetId: subscriptionId,
      targetName: `${planName} (${userName})`,
      ...extra
    });
  }

  /**
   * Log profile-related actions
   */
  static async logProfileAction(
    admin: AdminUser,
    action: AdminAction,
    profileId: string,
    userName: string,
    details: string,
    extra?: Partial<LogActionParams>
  ): Promise<void> {
    return this.log({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      adminRole: admin.role,
      action,
      details,
      targetType: "profile",
      targetId: profileId,
      targetName: `${userName}'s Profile`,
      ...extra
    });
  }

  /**
   * Log plan-related actions
   */
  static async logPlanAction(
    admin: AdminUser,
    action: AdminAction,
    planId: string,
    planName: string,
    details: string,
    extra?: Partial<LogActionParams>
  ): Promise<void> {
    return this.log({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      adminRole: admin.role,
      action,
      details,
      targetType: "plan",
      targetId: planId,
      targetName: planName,
      ...extra
    });
  }

  /**
   * Log system-level actions
   */
  static async logSystemAction(
    admin: AdminUser,
    action: AdminAction,
    details: string,
    extra?: Partial<LogActionParams>
  ): Promise<void> {
    return this.log({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      adminRole: admin.role,
      action,
      details,
      targetType: "system",
      ...extra
    });
  }

  /**
   * Log authentication actions (login/logout)
   */
  static async logAuthAction(
    admin: AdminUser,
    action: AdminAction,
    details: string,
    extra?: Partial<LogActionParams>
  ): Promise<void> {
    return this.log({
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.name,
      adminRole: admin.role,
      action,
      details,
      targetType: "system",
      ...extra
    });
  }

  /**
   * Get audit trail for a specific target
   */
  static async getAuditTrail(
    targetType: "user" | "event" | "registration" | "subscription" | "profile" | "plan" | "system", 
    targetId: string,
    limit?: number
  ): Promise<any[]> {
    try {
      return await AdminLog.getActionsByTarget(targetType, targetId);
    } catch (error) {
      console.error("Failed to get audit trail:", error);
      return [];
    }
  }

  /**
   * Get recent admin actions
   */
  static async getRecentActions(
    limit?: number, 
    category?: string
  ): Promise<any[]> {
    try {
      return await AdminLog.getRecentActions(limit, category);
    } catch (error) {
      console.error("Failed to get recent actions:", error);
      return [];
    }
  }

  /**
   * Get actions performed by a specific admin
   */
  static async getAdminActions(
    adminId: string, 
    limit?: number
  ): Promise<any[]> {
    try {
      return await AdminLog.getActionsByAdmin(adminId, limit);
    } catch (error) {
      console.error("Failed to get admin actions:", error);
      return [];
    }
  }

  /**
   * Get security-related events
   */
  static async getSecurityEvents(limit?: number): Promise<any[]> {
    try {
      return await AdminLog.getSecurityEvents(limit);
    } catch (error) {
      console.error("Failed to get security events:", error);
      return [];
    }
  }

  /**
   * Get action statistics for a date range
   */
  static async getActionStats(
    startDate: Date, 
    endDate: Date
  ): Promise<any> {
    try {
      return await AdminLog.getActionStats(startDate, endDate);
    } catch (error) {
      console.error("Failed to get action stats:", error);
      return [];
    }
  }
}

// ====================== EXPORT ======================

export default AdminLogger;