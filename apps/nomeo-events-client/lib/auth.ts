import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP } from "better-auth/plugins";
import mongoose from "mongoose";
import { sendOTPEmail } from "./send-otp-email";
import { ObjectId } from "mongodb";
import { Profile } from "@/models/profile";
import { Setting } from "@/models/setting";
import { Notification } from "@/models/notification";
import { connectDB } from "./mongoose";
import { Subscription } from "@/models/subscription";

const systemId = new ObjectId("000000000000000000000001");

export function createAuth() {
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL!,

    database: mongodbAdapter(mongoose.connection.db!),

    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
          enum: ["user", "admin", "superadmin"],
        },
        avatar: {
          type: "string",
          required: false,
          defaultValue: "",
        },
      },
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },

    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await connectDB();
            await Promise.all([
              Profile.create({
                userId: user.id,
                fullName: user.name,
                accountType: "individual",
                location: {
                  state: "Not provided",
                  city: "Not provided",
                  address: "Not provided",
                },
                contact: {
                  email: user.email,
                  phoneNumber: "Not provided",
                  socialMedia: {},
                },
                paymentMethod: "manual",
                events: [],
                publicProfile: {
                  showEmail: false,
                  showPhone: false,
                  showLocation: true,
                },
                verificationStatus: "unverified",
                activeStatus: "active",
              }),
              Setting.create({ userId: user.id }),
              Notification.create({
                senderId: systemId,
                receiverId: user.id,
                title: "Welcome to Nomeo Events!",
                message: `Hi ${user.name}, your account has been created successfully. Endeavour to create and complete your profile inorder to start creating events.`,
                message_type: "update",
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
              Subscription.initialSubscription(user.id, user.name)
            ]);
          },
        },
      },
    },

    plugins: [],
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