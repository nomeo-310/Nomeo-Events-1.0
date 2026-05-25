"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  CircleLock02Icon as Lock01Icon,
  ViewIcon as EyeIcon,
  ViewOffSlashIcon as EyeOffIcon,
  Login01Icon,
} from "@hugeicons/core-free-icons";
import { SocialButtons } from "./social-buttons";
import { LoginFormData } from "@/types/auth-type";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getAndClearReturnUrl } from "@/lib/return-url";
import { useOTP } from "@/hooks/use-otp";

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  onSignup?: () => void;
  onNeedsVerification?: (email: string) => void;
  isLoading?: boolean;
}

const BLOCKED_ACCOUNT_MESSAGES: Record<string, string> = {
  account_deactivated:
    "Your account has been deactivated. Please contact support if you believe this is a mistake.",
  account_scheduled_for_deletion:
    "This account is scheduled for permanent deletion. Access has been revoked.",
  account_suspended:
    "Your account has been suspended. Please contact support for more information.",
};

export const LoginForm = ({
  onSuccess,
  onForgotPassword,
  onSignup,
  isLoading = false,
  onNeedsVerification,
}: LoginFormProps) => {
  const { sendOTP } = useOTP();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  // Read error param set by middleware (catches social OAuth blocked accounts)
  const getInitialError = () => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (!error) return null;

    window.history.replaceState({}, "", window.location.pathname);

    return (
      BLOCKED_ACCOUNT_MESSAGES[error] ??
      "Access denied. Please contact support if you believe this is a mistake."
    );
  };

  const [serverError, setServerError] = useState<string | null>(getInitialError);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const getCallbackUrl = () => {
    if (typeof window === "undefined") return "/dashboard";
    const savedReturnUrl = getAndClearReturnUrl();
    if (savedReturnUrl) return savedReturnUrl;
    const params = new URLSearchParams(window.location.search);
    return params.get("callbackUrl") ?? "/dashboard";
  };

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    const callbackUrl = getCallbackUrl();

    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Handle email not verified
      if (error.code === "EMAIL_NOT_VERIFIED") {
        const sent = await sendOTP({
          email: data.email,
          type: "email-verification",
        });
        if (sent) {
          onNeedsVerification?.(data.email);
        } else {
          setServerError(
            "Please verify your email. Failed to send code — try again."
          );
        }
        return;
      }

      // Handle wrong credentials
      if (error.code === "INVALID_EMAIL_OR_PASSWORD") {
        setServerError("Invalid email or password. Please try again.");
        return;
      }

      // Handle blocked accounts — APIError("FORBIDDEN", { message }) from auth.ts
      if (error.status === 403) {
        const msg = error.message ?? "";
        setServerError(
          BLOCKED_ACCOUNT_MESSAGES[msg] ??
            "Access denied. Please contact support if you believe this is a mistake."
        );
        return;
      }

      // Fallback
      setServerError(error.message ?? "Something went wrong. Please try again.");
    }

    onSuccess?.();
    toast.success("Logged in successfully!");
    router.push(callbackUrl);
  };

  const handleGoogleLogin = () => {
    const callbackUrl = getCallbackUrl();
    toast.loading("Redirecting to Google...");
    authClient.signIn.social({
      provider: "google",
      callbackURL: callbackUrl,
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HugeiconsIcon icon={Mail01Icon} size={18} className="text-gray-400" />
            </div>
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address",
                },
              })}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                errors.email
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-700"
              }`}
              placeholder="you@example.com"
              disabled={isLoading || isSubmitting}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HugeiconsIcon icon={Lock01Icon} size={18} className="text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: "Password is required",
              })}
              className={`w-full pl-10 pr-10 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                errors.password
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-700"
              }`}
              placeholder="••••••••"
              disabled={isLoading || isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <HugeiconsIcon
                icon={showPassword ? EyeOffIcon : EyeIcon}
                size={18}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              />
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register("rememberMe")}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              disabled={isLoading || isSubmitting}
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              Remember me
            </span>
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline transition"
          >
            Forgot password?
          </button>
        </div>

        {/* Server Error */}
        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
            >
              <p className="text-sm text-red-600 dark:text-red-400">
                {serverError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading || isSubmitting}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <HugeiconsIcon icon={Login01Icon} size={18} />
              <span>Sign In</span>
            </>
          )}
        </motion.button>
      </form>

      <SocialButtons
        onGoogleClick={handleGoogleLogin}
        isLoading={isLoading || isSubmitting}
      />

      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <button
            onClick={onSignup}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium transition"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};