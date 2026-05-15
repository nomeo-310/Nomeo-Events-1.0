// lib/auth/auth.ts
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { createAuthMiddleware } from "better-auth/api";
import mongoose from "mongoose";
import { connectDB } from "../mongoose";

export function createAuth() {
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL!,

    trustedOrigins: [
      process.env.BETTER_AUTH_URL!,
      "http://localhost:3000",
    ],

    database: mongodbAdapter(mongoose.connection.db!),

    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
        },
        avatar: {
          type: "string",
          required: false,
          defaultValue: "",
        },
      },
    },

    emailAndPassword: { enabled: true, requireEmailVerification: false },
    socialProviders: {},
    plugins: [],

    hooks: {
      // Must be a single AuthMiddleware via createAuthMiddleware — not an array
      after: createAuthMiddleware(async (ctx) => {
        // Only run on session fetch and only if a session exists
        if (ctx.path !== "/get-session") return;

        const session = (ctx.context as any)?.session;
        if (!session?.user) return;

        const adminRoles = ["super_admin", "admin", "moderator", "support"];
        if (!adminRoles.includes(session.user.role)) return;

        const db = mongoose.connection.db;
        if (!db) return;

        try {
          const admin = await db
            .collection("admins")
            .findOne({ userId: session.user.id });

          if (!admin || !admin.isActive) return;

          // Merge admin fields into the session user — flows through to
          // useSession() on the client and auth.api.getSession() on the server
          Object.assign(session.user, {
            displayName: (admin.displayName as string) ?? session.user.name,
            isOnboarded: (admin.isOnboarded as boolean) ?? false,
            useSeedPhrase: (admin.useSeedPhrase as boolean) ?? false,
            loginCount: (admin.loginCount as number) ?? 0,
            lastLoginAt: (admin.lastLoginAt as Date) ?? null,
            lastLoginIP: (admin.lastLoginIP as string) ?? null,
          });
        } catch (err) {
          // Never let a hook failure break session reads
          console.error("Failed to merge admin fields into session:", err);
        }
      }),
    },
  });
}

let _auth: ReturnType<typeof createAuth> | null = null;

export async function getAuth() {
  if (!_auth) {
    await connectDB();
    _auth = createAuth();
  }
  return _auth;
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];

// Extended type with admin fields merged in by the hook
export type AdminSessionUser = Session["user"] & {
  displayName: string;
  isOnboarded: boolean;
  useSeedPhrase: boolean;
  loginCount: number;
  lastLoginAt: Date | null;
  lastLoginIP: string | null;
};