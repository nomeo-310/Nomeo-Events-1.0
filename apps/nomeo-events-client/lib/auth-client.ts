import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { createAuth } from "./auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [
    emailOTPClient(),
    inferAdditionalFields<ReturnType<typeof createAuth>>(),
  ],
});

export const { signIn, signOut, signUp, useSession } = authClient;