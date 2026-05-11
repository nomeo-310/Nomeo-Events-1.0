import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "./mongoose";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

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

  const userCollection = mongoose.connection.db!.collection("user")
  const user = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(session.user.id) });

  const accountColletion = mongoose.connection.db!.collection("account")
  const account = await accountColletion.findOne({userId: new ObjectId( session.user.id)})

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
    providerId: account?.providerId as string
  };
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;