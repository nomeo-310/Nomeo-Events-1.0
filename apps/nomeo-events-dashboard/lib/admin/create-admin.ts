// lib/admin/create-admin.ts
import { connectDB } from "@/lib/mongoose";
import { hashPassword } from "better-auth/crypto";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { AdminLog, AdminAction, AdminLogSeverity, AdminRole } from "@/models/admin-log";
import { generateSeedPhrase } from "@/hooks/use-generate-seedphrase";
import mongoose from "mongoose";
import { Admin } from "@/models/admin";
import { Seedphrase } from "@/models/seed-phrase";

interface CreateAdminParams {
  email: string;
  name: string;
  displayName: string;
  role: "admin" | "super_admin" | "moderator" | "support";
  createdBy: string;
  createdByName: string;
}

export async function createAdminUser({  email, name, displayName, role, createdBy, createdByName }: CreateAdminParams) {
  const startTime = Date.now();
  
  try {
    await connectDB();
    
    // Generate credentials
    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(tempPassword);
    
    // Generate seed phrase (12-16 words using your generator)
    const plainSeedPhrase = generateSeedPhrase();
    const hashedSeedPhrase = await bcrypt.hash(plainSeedPhrase, 10);
    
    const db = mongoose.connection.db!;
    const usersCollection = db.collection("user");
    const accountsCollection = db.collection("account");
    
    const userId = new ObjectId();
    const adminRole = role === "super_admin" ? "super_admin" : "admin";
    const dbRole = role === "super_admin" ? AdminRole.SUPER_ADMIN : AdminRole.ADMIN;
    
    // Create user in Better Auth's collection
    const newUser = {
      _id: userId,
      name: displayName,
      email: email.toLowerCase(),
      emailVerified: false,
      role: adminRole,
      avatar: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await usersCollection.insertOne(newUser);
    
    // Create account for password authentication
    const account = {
      userId: userId.toString(),
      providerId: "email",
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await accountsCollection.insertOne(account);

    await Admin.create({
      userId: userId,
      email: email.toLowerCase(),
      name: name,
      displayName: displayName,
      role: role === "super_admin" ? "super_admin" : "admin",
      isActive: false,
    });
    
    await Seedphrase.create({
      userId: userId,
      seedphrase: hashedSeedPhrase,
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      failedAttempts: 0,
    });
    
    // Log admin creation
    const duration = Date.now() - startTime;
    await AdminLog.logAction({
      adminId: createdBy,
      adminEmail: email.toLowerCase(),
      adminName: createdByName,
      adminRole: dbRole,
      action: AdminAction.CREATE_USER,
      severity: AdminLogSeverity.INFO,
      details: `Admin user created: ${displayName} (${email}) with role ${role}`,
      ipAddress: "system",
      targetType: "user",
      targetId: userId.toString(),
      targetName: displayName,
      changes: [
        { field: "role", oldValue: null, newValue: role },
        { field: "displayName", oldValue: null, newValue: displayName }
      ],
      status: "success",
      reversible: true,
      affectedCount: 1,
      duration,
      metadata: {
        createdBy,
        createdByName,
        hasSeedPhrase: true,
        seedPhraseExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    
    // Send email with credentials
    await sendInvitationEmail(email, name, displayName, tempPassword, plainSeedPhrase, role);
    
    return {
      userId: userId.toString(),
      success: true,
      email,
      name,
      displayName,
      tempPassword,
      seedPhrase: plainSeedPhrase,
    };
    
  } catch (error: any) {
    console.error("Error creating admin:", error);
    
    // Log error
    await AdminLog.logAction({
      adminId: createdBy,
      adminEmail: email,
      adminName: createdByName,
      adminRole: role === "super_admin" ? AdminRole.SUPER_ADMIN : AdminRole.ADMIN,
      action: AdminAction.CREATE_USER,
      severity: AdminLogSeverity.ERROR,
      details: `Failed to create admin user: ${error.message}`,
      ipAddress: "system",
      status: "failed",
      errorMessage: error.message,
      metadata: {
        attemptedEmail: email,
        attemptedRole: role
      }
    });
    
    throw error;
  }
}

function generateTemporaryPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function sendInvitationEmail( email: string,  name: string,  displayName: string, password: string,  seedPhrase: string, role: string ) {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
  
  console.log(`
    ═══════════════════════════════════════════════════════════════════
    🔐 ADMIN INVITATION - THREE FACTOR CREDENTIALS
    ═══════════════════════════════════════════════════════════════════
    
    To: ${email}
    Name: ${name}
    Display Name: ${displayName}
    Role: ${role}
    
    ┌─────────────────────────────────────────────────────────────────┐
    │  ALL THREE CREDENTIALS ARE REQUIRED FOR LOGIN                   │
    ├─────────────────────────────────────────────────────────────────┤
    │  📧 FACTOR 1 - EMAIL:      ${email}                             │
    │  🔑 FACTOR 2 - PASSWORD:   ${password}                          │
    │  🔐 FACTOR 3 - SEED PHRASE: ${seedPhrase}                       │
    └─────────────────────────────────────────────────────────────────┘
    
    🔗 LOGIN URL: ${loginUrl}
    
    ⚠️  IMPORTANT SECURITY NOTES:
    • You need ALL THREE credentials to login
    • Seed phrase format: space-separated words (12-16 words)
    • Seed phrase expires in 30 days
    • Change your password after first login
    • Never share these credentials
    • Contact super admin if you lose your seed phrase
    
    ═══════════════════════════════════════════════════════════════════
  `);
}