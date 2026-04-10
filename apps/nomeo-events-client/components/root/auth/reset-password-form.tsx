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
  ArrowLeft02Icon
} from "@hugeicons/core-free-icons";
import { ResetPasswordFormData } from "@/types/auth-type";

interface ResetPasswordFormProps {
  token?: string;
  onSuccess?: (data: ResetPasswordFormData) => void;
  onBackToLogin?: () => void;
  isLoading?: boolean;
}

export const ResetPasswordForm = ({
  token,
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
    reset,
  } = useForm<ResetPasswordFormData>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const validateForm = (data: ResetPasswordFormData): boolean => {
    // Password validation
    if (!data.password) {
      setServerError("Password is required");
      return false;
    }
    if (data.password.length < 8) {
      setServerError("Password must be at least 8 characters");
      return false;
    }
    if (!/[A-Z]/.test(data.password)) {
      setServerError("Password must contain at least one uppercase letter");
      return false;
    }
    if (!/[a-z]/.test(data.password)) {
      setServerError("Password must contain at least one lowercase letter");
      return false;
    }
    if (!/[0-9]/.test(data.password)) {
      setServerError("Password must contain at least one number");
      return false;
    }
    if (!/[^A-Za-z0-9]/.test(data.password)) {
      setServerError("Password must contain at least one special character");
      return false;
    }

    // Confirm password validation
    if (!data.confirmPassword) {
      setServerError("Please confirm your password");
      return false;
    }
    if (data.password !== data.confirmPassword) {
      setServerError("Passwords don't match");
      return false;
    }

    return true;
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError(null);
    
    if (!validateForm(data)) return;
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Simulate successful password reset
      setIsReset(true);
      onSuccess?.(data);
      reset();
    } catch (error) {
      setServerError("An error occurred. Please try again.");
    }
  };

  if (isReset) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4"
      >
        <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} className="text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Password Reset Successful!
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your password has been successfully reset. You can now login with your new password.
        </p>
        <button
          onClick={onBackToLogin}
          className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium"
        >
          Continue to Login
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Reset Password
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New Password Field */}
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
              {...register("password")}
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
            Password must contain at least 8 characters, uppercase, lowercase, number, and special character
          </p>
        </div>

        {/* Confirm Password Field */}
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
                validate: value => value === password || "Passwords don't match"
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

        {/* Server Error */}
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

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading || isSubmitting}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed relative flex items-center justify-center gap-2"
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

        {/* Back to Login */}
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