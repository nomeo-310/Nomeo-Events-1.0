import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP } from "better-auth/plugins";
import { connectDB } from "./mongoose";
import mongoose from "mongoose";
import { sendOTPEmail } from "./mailer";

await connectDB();

export const auth = betterAuth({
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

  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600, // 10 minutes
      sendVerificationOTP: async ({ email, otp, type }) => {
        const userDoc = await mongoose.connection.db!
          .collection("user")
          .findOne({ email });

        const name = (userDoc?.name as string) ?? "there";
        await sendOTPEmail({ email, otp, name, type });
      },
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;