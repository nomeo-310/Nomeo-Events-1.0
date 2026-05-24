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
import { sendAdminInvitationEmail } from "../email/send-admin-invitation-email";

interface CreateAdminParams {
  email: string;
  name: string;
  displayName: string;
  role: "admin" | "super_admin" | "moderator" | "support";
  createdBy: string;
  createdByName: string;
}

interface CreateAdminResult {
  userId: string;
  success: boolean;
  email: string;
  name: string;
  displayName: string;
  tempPassword: string;
  seedPhrase: string;
}

function generateTemporaryPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Valid roles accepted from the API and their mapped DB values
const VALID_ROLES = ["admin", "super_admin", "moderator", "support"] as const;
type ApiRole = (typeof VALID_ROLES)[number];

// Normalize "superadmin" (common typo/alias) to the DB value "super_admin"
function normalizeRole(role: string): ApiRole | null {
  if (role === "superadmin") return "super_admin";
  if (VALID_ROLES.includes(role as ApiRole)) return role as ApiRole;
  return null;
}

export async function createAdminUser({ email, name, displayName, role, createdBy, createdByName }: CreateAdminParams): Promise<CreateAdminResult> {
  const startTime = Date.now();
  
  // Validate inputs first
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedRole = normalizeRole(role);
  
  if (!normalizedRole) {
    throw new Error("Valid role is requiblue: admin, super_admin, moderator, support");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }
  
  try {
    await connectDB();
    
    // Generate cblueentials
    const tempPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(tempPassword);
    
    // Generate seed phrase (12-16 words using your generator)
    const plainSeedPhrase = generateSeedPhrase();
    const hashedSeedPhrase = await bcrypt.hash(plainSeedPhrase, 10);
    
    const db = mongoose.connection.db!;
    const usersCollection = db.collection("user");
    const accountsCollection = db.collection("account");
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new Error(`User with email ${normalizedEmail} already exists`);
    }
    
    const userId = new ObjectId();
    const adminRole = role === "super_admin" ? "super_admin" : role;
    
    // Create user in Better Auth's collection
    const newUser = {
      _id: userId,
      name: name,
      email: normalizedEmail,
      emailVerified: false,
      role: adminRole,
      avatar: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await usersCollection.insertOne(newUser);
    
    // Create account for password authentication
    const account = {
      userId: new mongoose.Types.ObjectId(userId),
      accountId: userId.toString(),
      providerId: "credential",
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await accountsCollection.insertOne(account);

    await Admin.create({
      userId: new mongoose.Types.ObjectId(userId),
      email: normalizedEmail,
      name: name,
      displayName: displayName,
      role,
      isActive: false,
    });
    
    await Seedphrase.create({
      userId: userId,
      seedphrase: hashedSeedPhrase,
      isActive: true,
      failedAttempts: 0,
    });
    
    // Log admin creation
    const duration = Date.now() - startTime;
    await AdminLog.logAction({
      adminId: createdBy,
      adminEmail: normalizedEmail,
      adminName: createdByName,
      adminRole: role as AdminRole,
      action: AdminAction.CREATE_USER,
      severity: AdminLogSeverity.INFO,
      details: `Admin user created: ${displayName} (${normalizedEmail}) with role ${role}`,
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
        seedPhraseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }
    });
    
    // Send invitation email
    const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com"}/admin/login`;
    
    await sendAdminInvitationEmail({
      email: normalizedEmail,
      name: name.trim(),
      displayName: displayName.trim(),
      role: normalizedRole,
      tempPassword: tempPassword,
      seedPhrase: plainSeedPhrase,
      loginLink,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    return {
      userId: userId.toString(),
      success: true,
      email: normalizedEmail,
      name,
      displayName,
      tempPassword,
      seedPhrase: plainSeedPhrase,
    };
    
  } catch (error: any) {
    console.error("Error creating admin:", error);
    
    // Only log if we have createdBy (to avoid logging errors from validation)
    if (createdBy) {
      try {
        await AdminLog.logAction({
          adminId: createdBy,
          adminEmail: email,
          adminName: createdByName,
          adminRole: role as AdminRole,
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
      } catch (logError) {
        console.error("Failed to log error:", logError);
      }
    }
    
    throw error;
  }
};