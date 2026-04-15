import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "./mongoose";
import mongoose from "mongoose";

export async function getSession() {
  const auth = await getAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return session;
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session) return null;

  await connectDB();

  const user = await mongoose.connection.db!
    .collection("user")
    .findOne({ _id: new mongoose.Types.ObjectId(session.user.id) });

  if (!user) return null;

  return {
    id: session.user.id,
    name: user.name as string,
    email: user.email as string,
    emailVerified: user.emailVerified as boolean,
    role: (user.role as string) ?? "user",
    avatar: (user.avatar as string) ?? "",
    image: (user.image as string) ?? "",
    createdAt: user.createdAt as Date,
  };
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;