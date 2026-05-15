// lib/session.ts
import { getAuth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "./mongoose";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

// ─── Core session helpers ─────────────────────────────────────────────────────

export async function getSession() {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

// ─── Full merged user ─────────────────────────────────────────────────────────

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  await connectDB();
  const db = mongoose.connection.db!;
  const userId = new ObjectId(session.user.id); // plain string — Better Auth uses nanoid, never ObjectId

  // Single aggregation joining user → account → admin in one round-trip
  const [result] = await db
    .collection("user")
    .aggregate([
      {
        // _id is a plain string in Better Auth's MongoDB collections
        $match: { _id: userId },
      },
      {
        // Join the credential account to get providerId
        $lookup: {
          from: "account",
          localField: "_id",
          foreignField: "userId",
          as: "accounts",
        },
      },
      {
        // Join our custom Admin collection for display name, login stats etc.
        $lookup: {
          from: "admins",
          localField: "_id",
          foreignField: "userId",
          as: "adminRecords",
        },
      },
      { $limit: 1 },
    ])
    .toArray();

  if (!result) return null;

  const account = result.accounts?.[0] ?? null;
  const admin = result.adminRecords?.[0] ?? null;

  // Only return an admin session if the Admin record exists and is active.
  // Regular users who somehow have a session won't have an admin record.
  const isAdmin = !!admin && admin.isActive === true;

  return {
    // ── Better Auth user fields ──────────────────────────────────────────
    id: userId.toString(),
    name: (result.name as string) ?? "",
    email: result.email as string,
    emailVerified: result.emailVerified as boolean,
    role: (result.role as string) ?? "user",
    avatar: (result.avatar as string) ?? "",
    image: (result.image as string) ?? "",
    createdAt: result.createdAt as Date,
    updatedAt: result.updatedAt as Date,

    // ── Account / auth provider ──────────────────────────────────────────
    providerId: (account?.providerId as string) ?? null,

    // ── Admin profile fields (null for non-admins) ───────────────────────
    isAdmin,
    displayName: isAdmin ? (admin.displayName as string) : ((result.name as string) ?? ""),
    isOnboarded: isAdmin ? (admin.isOnboarded as boolean) : false,
    useSeedPhrase: isAdmin ? (admin.useSeedPhrase as boolean) : false,
    loginCount: isAdmin ? ((admin.loginCount as number) ?? 0) : 0,
    lastLoginAt: isAdmin ? ((admin.lastLoginAt as Date) ?? null) : null,
    lastLoginIP: isAdmin ? ((admin.lastLoginIP as string) ?? null) : null,
  };
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

// ─── Admin-only guard ─────────────────────────────────────────────────────────

const ADMIN_ROLES = ["super_admin", "admin", "moderator", "support"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  if (!user.isAdmin || !ADMIN_ROLES.includes(user.role as AdminRole)) {
    redirect("/login");
  }

  return user as CurrentUser & { role: AdminRole };
}

// ─── Route handler variant (no next/headers) ──────────────────────────────────
// next/headers only works in Server Components and Server Actions.
// Route Handlers must pass request.headers directly.

export async function getCurrentUserFromRequest(requestHeaders: Headers) {
  await connectDB();

  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return null;

  const db = mongoose.connection.db!;
  const userId = session.user.id;

  const [result] = await db
    .collection("user")
    .aggregate([
      { $match: { _id: userId } },
      {
        $lookup: {
          from: "account",
          localField: "_id",
          foreignField: "userId",
          as: "accounts",
        },
      },
      {
        $lookup: {
          from: "admins",
          localField: "_id",
          foreignField: "userId",
          as: "adminRecords",
        },
      },
      { $limit: 1 },
    ])
    .toArray();

  if (!result) return null;

  const account = result.accounts?.[0] ?? null;
  const admin = result.adminRecords?.[0] ?? null;
  const isAdmin = !!admin && admin.isActive === true;

  return {
    id: userId,
    name: (result.name as string) ?? "",
    email: result.email as string,
    emailVerified: result.emailVerified as boolean,
    role: (result.role as string) ?? "user",
    avatar: (result.avatar as string) ?? "",
    image: (result.image as string) ?? "",
    createdAt: result.createdAt as Date,
    updatedAt: result.updatedAt as Date,
    providerId: (account?.providerId as string) ?? null,
    isAdmin,
    displayName: isAdmin ? (admin.displayName as string) : ((result.name as string) ?? ""),
    isOnboarded: isAdmin ? (admin.isOnboarded as boolean) : false,
    useSeedPhrase: isAdmin ? (admin.useSeedPhrase as boolean) : false,
    loginCount: isAdmin ? ((admin.loginCount as number) ?? 0) : 0,
    lastLoginAt: isAdmin ? ((admin.lastLoginAt as Date) ?? null) : null,
    lastLoginIP: isAdmin ? ((admin.lastLoginIP as string) ?? null) : null,
  };
}

// To this — Awaited already unwraps the Promise, NonNullable removes null
export type CurrentUserFromRequest = NonNullable<Awaited<ReturnType<typeof getCurrentUserFromRequest>>>;

export async function requireAdminFromRequest(requestHeaders: Headers) {
  const user = await getCurrentUserFromRequest(requestHeaders);

  if (!user || !user.isAdmin || !ADMIN_ROLES.includes(user.role as AdminRole)) {
    return null; // Route handlers can't redirect — caller returns 401
  }

  return user as CurrentUserFromRequest & { role: AdminRole };
}