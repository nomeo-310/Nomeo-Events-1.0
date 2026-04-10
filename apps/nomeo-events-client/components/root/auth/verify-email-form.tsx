"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShieldCheck as VerificationCodeIcon,
  ArrowLeft02Icon,
  RefreshIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { VerifyEmailFormData } from "@/types/auth-type";

interface VerifyEmailFormProps {
  email?: string;
  onSuccess?: (data: VerifyEmailFormData) => void;
  onResendCode?: () => void;
  onBackToLogin?: () => void;
  isLoading?: boolean;
}

export const VerifyEmailForm = ({
  email,
  onSuccess,
  onResendCode,
  onBackToLogin,
  isLoading = false,
}: VerifyEmailFormProps) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<VerifyEmailFormData>({
    defaultValues: {
      code: "",
    },
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const validateForm = (data: VerifyEmailFormData): boolean => {
    if (!data.code) {
      setServerError("Verification code is required");
      return false;
    }
    if (data.code.length !== 6) {
      setServerError("Verification code must be 6 digits");
      return false;
    }
    if (!/^\d+$/.test(data.code)) {
      setServerError("Code must contain only numbers");
      return false;
    }
    return true;
  };

  const onSubmit = async (data: VerifyEmailFormData) => {
    setServerError(null);
    
    if (!validateForm(data)) return;
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Demo validation - accept any 6-digit code
      if (data.code.length === 6 && /^\d+$/.test(data.code)) {
        setIsVerified(true);
        onSuccess?.(data);
        reset();
      } else {
        setServerError("Invalid verification code. Please try again.");
      }
    } catch (error) {
      setServerError("An error occurred. Please try again.");
    }
  };

  const handleResendCode = () => {
    if (countdown === 0) {
      setCountdown(60);
      onResendCode?.();
      setServerError(null);
    }
  };

  if (isVerified) {
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
          Email Verified!
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your email has been successfully verified. You can now login to your account.
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
          Verify Your Email
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We've sent a verification code to{" "}
          <span className="font-medium text-gray-900 dark:text-white">
            {email || "your email"}
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Verification Code Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Verification Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HugeiconsIcon icon={VerificationCodeIcon} size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              {...register("code")}
              maxLength={6}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                errors.code
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-700"
              }`}
              placeholder="000000"
              disabled={isLoading || isSubmitting}
            />
          </div>
          {errors.code && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.code.message}
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
              <HugeiconsIcon icon={VerificationCodeIcon} size={18} />
              <span>Verify Email</span>
            </>
          )}
        </motion.button>

        {/* Resend Code */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={countdown > 0}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 mx-auto"
          >
            <HugeiconsIcon icon={RefreshIcon} size={14} />
            <span>
              {countdown > 0 
                ? `Resend code in ${countdown}s` 
                : "Resend verification code"}
            </span>
          </button>
        </div>

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