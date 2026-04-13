"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  RefreshIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";

interface VerifyEmailFormProps {
  email: string;
  onBackToLogin?: () => void;
  isLoading?: boolean;
  onSuccess?: () => void;
}

export const VerifyEmailForm = ({ email, onBackToLogin, isLoading = false, onSuccess }: VerifyEmailFormProps) => {

  const [serverError, setServerError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    setServerError(null);

    if (otpValue.length !== 6) {
      setOtpError("Please enter the complete 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("/api/auth/verify-otp", { email, otp: otpValue, type: "email-verification" });
      setIsVerified(true);
      setTimeout(() => onSuccess?.(), 1800);
    } catch (err: any) {
      setServerError(
        err.response?.data?.error || "Invalid or expired code. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setServerError(null);
    setResendSuccess(false);

    try {
      await axios.post("/api/auth/send-otp", { email });
      setResendSuccess(true);
      setCountdown(60);
      setOtpValue("");
    } catch (err: any) {
      setServerError(
        err.response?.data?.error || "Failed to resend code. Please try again."
      );
    } finally {
      setIsResending(false);
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
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            size={32}
            className="text-green-600 dark:text-green-400"
          />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Email Verified Successfully!
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Redirecting you to login page...
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="flex flex-col items-center gap-3">
          <label className="self-start text-sm font-medium text-gray-700 dark:text-gray-300">
            Verification Code
          </label>

          <InputOTP
            maxLength={6}
            value={otpValue}
            onChange={(val) => {
              setOtpValue(val);
              setOtpError(null);
              setServerError(null);
            }}
            pattern={REGEXP_ONLY_DIGITS}
            disabled={isSubmitting}
          >
            {/* Each slot in its own group = gap/space between every digit */}
            <InputOTPGroup>
              <InputOTPSlot index={0} className="w-14 h-14 text-xl" />
              <InputOTPSlot index={1} className="w-14 h-14 text-xl" />
              <InputOTPSlot index={2} className="w-14 h-14 text-xl" />
            </InputOTPGroup>
            <InputOTPSeparator className="mx-2" />
            <InputOTPGroup>
              <InputOTPSlot index={3} className="w-14 h-14 text-xl" />
              <InputOTPSlot index={4} className="w-14 h-14 text-xl" />
              <InputOTPSlot index={5} className="w-14 h-14 text-xl" />
            </InputOTPGroup>
          </InputOTP>

          {otpError && (
            <p className="self-start text-sm text-red-600 dark:text-red-400">
              {otpError}
            </p>
          )}
        </div>

        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
            >
              <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>
            </motion.div>
          )}

          {resendSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
            >
              <p className="text-sm text-green-600 dark:text-green-400">
                New verification code sent successfully!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting || otpValue.length !== 6}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Verifying..." : "Verify Email"}
        </motion.button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={countdown > 0 || isResending}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 mx-auto disabled:opacity-50"
          >
            <HugeiconsIcon icon={RefreshIcon} size={16} />
            {countdown > 0
              ? `Resend code in ${countdown}s`
              : isResending
              ? "Sending..."
              : "Resend verification code"}
          </button>
        </div>

        {onBackToLogin && (
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 py-2 transition"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
            Back to Sign Up
          </button>
        )}
      </form>
    </div>
  );
};