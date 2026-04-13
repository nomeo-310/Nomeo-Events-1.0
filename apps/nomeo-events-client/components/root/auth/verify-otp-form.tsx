"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import axios from "axios";

interface VerifyOtpFormProps {
  email: string;
  onSuccess: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const VerifyOtpForm = ({
  email,
  onSuccess,
  onBack,
  isLoading = false,
}: VerifyOtpFormProps) => {
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSubmit = async () => {

    if (!otpValue || otpValue.length !== 6) {
      setOtpError("Please enter a 6-digit code");
      return;
    }

    setOtpError(null);
    setServerError(null);
    setIsSubmitting(true);

    try {
      await axios.post("/api/auth/verify-otp", { email, otp: otpValue, type: "forget-password" });
    } catch (err: any) {
      setServerError(
        err.response?.data?.error || "Invalid or expired code. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }

    toast.success("Code verified! Set your new password.");
    onSuccess();
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setServerError(null);
    setOtpError(null);
    setResendSuccess(false);

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "forget-password",
    });

    if (error) {
      setServerError(error.message ?? "Failed to resend code. Please try again.");
      return;
    }

    setResendSuccess(true);
    setCountdown(60);
    toast.success("A new code has been sent.");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 text-center">
            Verification Code
          </label>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otpValue}
              onChange={(val) => {
                setOtpValue(val);
                setOtpError(null);
                setServerError(null);
              }}
              pattern={REGEXP_ONLY_DIGITS}
              disabled={isLoading || isSubmitting}
            >
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
          </div>
          {otpError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">
              {otpError}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Enter the 6-digit code sent to {email}
          </p>
        </div>

        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
            >
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {serverError}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {resendSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
            >
              <p className="text-sm text-green-600 dark:text-green-400 text-center">
                A new code has been sent to your email.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isLoading || isSubmitting || !otpValue || otpValue.length !== 6}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>Verify Code</span>
          )}
        </motion.button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 mx-auto"
          >
            <HugeiconsIcon icon={RefreshIcon} size={14} />
            <span>
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
};