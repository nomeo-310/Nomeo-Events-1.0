"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  ArrowLeft02Icon,
  SentIcon as Send01Icon,
} from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface ForgotPasswordFormProps {
  onSuccess?: (email: string) => void;
  onBackToLogin?: () => void;
  isLoading?: boolean;
}

export const ForgotPasswordForm = ({
  onSuccess,
  onBackToLogin,
  isLoading = false,
}: ForgotPasswordFormProps) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }: { email: string }) => {
    setServerError(null);

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "forget-password",
    });

    if (error) {
      setServerError(error.message ?? "Something went wrong. Please try again.");
      return;
    }

    toast.success("A reset code has been sent to your email.");
    onSuccess?.(email);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <HugeiconsIcon icon={Send01Icon} size={18} />
              <span>Send Reset Code</span>
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