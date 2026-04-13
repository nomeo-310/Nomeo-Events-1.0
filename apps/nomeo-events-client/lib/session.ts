// lib/session.ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

// call this in any server component or server action that requires auth
// automatically redirects to home if not logged in
export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return session;
}