"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CircleLock02Icon as Lock01Icon,
  ViewIcon as EyeIcon,
  ViewOffSlashIcon as EyeOffIcon,
  RotateClockwiseIcon as ResetIcon,
  CheckmarkCircle01Icon,
  ArrowLeft02Icon,
  CodeIcon,
} from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface ResetPasswordFormProps {
  email: string;
  onSuccess?: () => void;
  onBackToLogin?: () => void;
  isLoading?: boolean;
}

interface ResetFormData {
  otp: string;
  password: string;
  confirmPassword: string;
}

export const ResetPasswordForm = ({
  email,
  onSuccess,
  onBackToLogin,
  isLoading = false,
}: ResetPasswordFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isReset, setIsReset] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({
    defaultValues: { otp: "", password: "", confirmPassword: "" },
  });

  const password = watch("password");

  const onSubmit = async ({ otp, password }: ResetFormData) => {
    setServerError(null);

    const { error } = await authClient.emailOtp.resetPassword({
      email,
      otp,
      password,
    });

    if (error) {
      setServerError(error.message ?? "Something went wrong. Please try again.");
      return;
    }

    setIsReset(true);
    toast.success("Password reset successfully!");
    setTimeout(() => onSuccess?.(), 2000);
  };

  if (isReset) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4"
      >
        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            size={32}
            className="text-green-600 dark:text-green-400"
          />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Password Reset Successful!
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your password has been updated. Redirecting to login...
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* OTP Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Verification Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HugeiconsIcon icon={CodeIcon} size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              {...register("otp", {
                required: "Verification code is required",
                pattern: {
                  value: /^\d{6}$/,
                  message: "Must be a 6-digit code",
                },
              })}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                errors.otp
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-700"
              }`}
              placeholder="Enter 6-digit code"
              disabled={isLoading || isSubmitting}
              autoComplete="off"
              maxLength={6}
            />
          </div>
          {errors.otp && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.otp.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Enter the 6-digit verification code sent to {email}
          </p>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HugeiconsIcon icon={Lock01Icon} size={18} className="text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 8, message: "Must be at least 8 characters" },
                validate: {
                  uppercase: (v) =>
                    /[A-Z]/.test(v) || "Must contain an uppercase letter",
                  lowercase: (v) =>
                    /[a-z]/.test(v) || "Must contain a lowercase letter",
                  number: (v) => /[0-9]/.test(v) || "Must contain a number",
                  special: (v) =>
                    /[^A-Za-z0-9]/.test(v) || "Must contain a special character",
                },
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
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Min 8 characters with uppercase, lowercase, number and special character
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HugeiconsIcon icon={Lock01Icon} size={18} className="text-gray-400" />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (v) => v === password || "Passwords don't match",
              })}
              className={`w-full pl-10 pr-10 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                errors.confirmPassword
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-700"
              }`}
              placeholder="••••••••"
              disabled={isLoading || isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <HugeiconsIcon
                icon={showConfirmPassword ? EyeOffIcon : EyeIcon}
                size={18}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              />
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
            >
              <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>
            </motion.div>
          )}
        </AnimatePresence>

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
              <HugeiconsIcon icon={ResetIcon} size={18} />
              <span>Reset Password</span>
            </>
          )}
        </motion.button>

        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
          <span>Back to Login</span>
        </button>
      </form>
    </div>
  );
};