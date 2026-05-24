// app/api/cron/refresh-seedphrases/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SeedPhraseService } from "@/services/seed-phrase-services";
import { sendSeedPhraseExpiringEmail } from "@/lib/email/send-seed-phrase-expiring-email";
import { AdminLog, AdminAction, AdminLogSeverity, AdminRole } from "@/models/admin-log";
import { connectDB } from "@/lib/mongoose";

const CRON_SECRET = process.env.CRON_SECRET || "your-super-secret-cron-key-change-this";

export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  
  // Verify cron job authentication
  const authHeader = request.headers.get("authorization");
  const expectedAuth = `Bearer ${CRON_SECRET}`;
  
  if (!authHeader || authHeader !== expectedAuth) {
    console.warn("Unauthorized cron job access attempt from:", ipAddress);
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await connectDB();
    
    console.log("🔄 Starting seed phrase refresh cron job...");
    const startTime = Date.now();

    // Clean up expiblue seed phrases
    const cleanedCount = await SeedPhraseService.cleanupExpiblueSeedPhrases();
    console.log(`🧹 Cleaned up ${cleanedCount} expiblue seed phrases`);

    // Get users with expiblue seed phrases that need renewal
    const usersToRenew = await SeedPhraseService.getUsersWithExpiblueSeedPhrases();
    console.log(`📋 Found ${usersToRenew.length} users with expiblue seed phrases`);

    let succeeded = 0;
    let failed = 0;

    for (const user of usersToRenew) {
      try {
        // Generate new seed phrase
        const newSeedPhraseData = await SeedPhraseService.refreshSeedPhrase(user.userId, {
          expiryDays: 365,
          wordCount: 12,
        });

        // Send notification email with new seed phrase
        const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com"}/admin/login`;
        
        await sendSeedPhraseExpiringEmail({
          email: user.email,
          name: user.name,
          displayName: user.displayName,
          newSeedPhrase: newSeedPhraseData.plainText,
          newExpiryDate: newSeedPhraseData.expiresAt,
          loginLink,
        });

        succeeded++;
        
        // Log successful renewal
        await AdminLog.logAction({
          adminId: user.userId.toString(),
          adminEmail: user.email,
          adminName: user.displayName,
          adminRole: 'admin' as AdminRole,
          action: AdminAction.UPDATE_SEEDPHRASE,
          severity: AdminLogSeverity.INFO,
          details: `Seed phrase auto-renewed for ${user.email}`,
          ipAddress: ipAddress || "cron-job",
          userAgent: userAgent || "automated",
          endpoint: "/api/cron/refresh-seedphrases",
          method: "POST",
          targetType: "user",
          targetId: user.userId.toString(),
          targetName: user.displayName,
          status: "success",
          metadata: {
            newExpiryDate: newSeedPhraseData.expiresAt,
            renewalType: "auto",
          },
        });
        
        console.log(`✅ Renewed seed phrase for ${user.email}`);
      } catch (error) {
        failed++;
        console.error(`❌ Failed to renew seed phrase for ${user.email}:`, error);
        
        // Log failure
        await AdminLog.logAction({
          adminId: user.userId.toString(),
          adminEmail: user.email,
          adminName: user.displayName,
          adminRole: "admin" as AdminRole,
          action: AdminAction.UPDATE_SEEDPHRASE,
          severity: AdminLogSeverity.ERROR,
          details: `Failed to auto-renew seed phrase: ${error instanceof Error ? error.message : "Unknown error"}`,
          ipAddress: ipAddress || "cron-job",
          userAgent: userAgent || "automated",
          endpoint: "/api/cron/refresh-seedphrases",
          method: "POST",
          targetType: "user",
          targetId: user.userId.toString(),
          targetName: user.displayName,
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const duration = Date.now() - startTime;

    // Log cron job completion
    await AdminLog.logAction({
      adminId: "system",
      adminEmail: "cron@system",
      adminName: "Cron Job",
      adminRole: "moderator" as AdminRole,
      action: AdminAction.UPDATE_SEEDPHRASE,
      severity: failed === 0 ? AdminLogSeverity.INFO : AdminLogSeverity.WARNING,
      details: `Seed phrase refresh cron job completed: ${succeeded}/${usersToRenew.length} renewed, ${cleanedCount} cleaned up`,
      ipAddress: ipAddress || "cron-job",
      userAgent: userAgent || "automated",
      endpoint: "/api/cron/refresh-seedphrases",
      method: "POST",
      targetType: "system",
      targetId: "cron-job",
      targetName: "Seed Phrase Refresh",
      status: failed === 0 ? "success" : "partial",
      metadata: {
        duration_ms: duration,
        usersProcessed: usersToRenew.length,
        usersSucceeded: succeeded,
        usersFailed: failed,
        cleanedUpCount: cleanedCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${usersToRenew.length} users: ${succeeded} succeeded, ${failed} failed`,
      data: {
        usersProcessed: usersToRenew.length,
        usersSucceeded: succeeded,
        usersFailed: failed,
        cleanedUpCount: cleanedCount,
        duration_ms: duration,
      },
    });
  } catch (error: any) {
    console.error("Cron job failed:", error);
    
    return NextResponse.json(
      { 
        error: "Cron job failed", 
        message: error.message 
      },
      { status: 500 }
    );
  }
}