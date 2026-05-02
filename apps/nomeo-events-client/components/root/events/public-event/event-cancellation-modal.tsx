"use client";

import { useState, useRef, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon as XIcon,
  Mail01Icon as MailIcon,
  Delete03Icon as TrashIcon,
  CheckmarkCircle02Icon as CheckIcon,
  Alert02Icon as AlertIcon,
  Ticket01Icon as TicketIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useRegistration } from "@/hooks/use-registration";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "email" | "otp" | "done";

interface RegistrationSummary {
  registrationNumber?: string;
  cascadedCancellations?: number;
}

interface EventCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle?: string;
  onSuccess?: () => void;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS: Step[] = ["email", "otp", "done"];

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.slice(0, 2).map((step, i) => (
        <div key={step} className="flex items-center gap-2 flex-1 last:flex-none">
          <div
            className={cn(
              "size-2.5 rounded-full shrink-0 transition-colors duration-200",
              i < idx ? "bg-green-500" : i === idx ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-700"
            )}
          />
          {i < 1 && (
            <div
              className={cn(
                "h-px flex-1 transition-colors duration-200",
                i < idx ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── OTP input ────────────────────────────────────────────────────────────────

function OtpInput({ onChange }: { onChange: (val: string) => void }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const [values, setValues] = useState(["", "", "", "", "", ""]);

  const update = (idx: number, char: string) => {
    const next = [...values];
    next[idx] = char;
    setValues(next);
    onChange(next.join(""));
    if (char && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Backspace" && !values[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...values];
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setValues(next);
    onChange(next.join(""));
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2.5 justify-center my-5">
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          onChange={(e) => update(i, e.target.value.replace(/\D/g, ""))}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          className="w-11 h-13 text-center text-lg font-semibold bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          style={{ height: "52px" }}
        />
      ))}
    </div>
  );
}

// ─── Loading spinner ──────────────────────────────────────────────────────────

function LoadingSpinner() {
  return <HugeiconsIcon icon={Loading03Icon} size={16} className="animate-spin text-white" />;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function EventCancellationModal({ isOpen, onClose, eventId, eventTitle, onSuccess }: EventCancellationModalProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [summary, setSummary] = useState<RegistrationSummary | null>(null);
  const [timer, setTimer] = useState(0);

  const { useInitiateCancellation, useConfirmCancellation } = useRegistration();
  const initiateCancellation = useInitiateCancellation();
  const confirmCancellation = useConfirmCancellation();

  const loading = initiateCancellation.isPending || confirmCancellation.isPending;

  const queryClient = useQueryClient();

  const params = useParams();

  // Resend countdown
  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep("email");
      setEmail("");
      setEmailError("");
      setOtp("");
      setOtpError("");
      setSummary(null);
      setTimer(0);
    }
  }, [isOpen]);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Step 1: send OTP
  const handleSendOtp = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");

    initiateCancellation.mutate(
      { email, eventId },
      {
        onSuccess: () => {
          setStep("otp");
          setTimer(30);
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || "Failed to send code. Please try again.";
          setEmailError(message);
        },
      }
    );
  };

  // Step 2: verify OTP and cancel
  const handleVerifyOtp = async () => {
    setOtpError("");

    confirmCancellation.mutate(
      { email, eventId, otp },
      {
        onSuccess: (response) => {
          setSummary({
            registrationNumber: response.data?.registrationNumber,
            cascadedCancellations: response.data?.cascadedCancellations,
          });
          setStep("done");
          onSuccess?.();
        },
        onError: (error: any) => {
          const message = error.response?.data?.message || "Invalid or expired code. Please try again.";
          setOtpError(message);
        },
      }
    );
  };

  const handleResend = async () => {
    initiateCancellation.mutate(
      { email, eventId },
      {
        onSuccess: () => {
          setTimer(30);
          setOtpError("");
        },
        onError: (error: any) => {
          setOtpError(error.response?.data?.message || "Failed to resend. Please try again.");
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <HugeiconsIcon icon={TrashIcon} size={15} className="text-red-500" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">Cancel registration</span>
          </div>
          {step !== "done" && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <HugeiconsIcon icon={XIcon} size={24} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          {step !== "done" && <StepIndicator current={step} />}

          {/* Step 1: Email */}
          {step === "email" && (
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-3">
                <HugeiconsIcon icon={MailIcon} size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Verify your email</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                Enter the email you registered with. We'll send a one-time code to confirm it's you.
              </p>

              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                placeholder="you@example.com"
                className="h-10 lg:h-11 w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {emailError && <p className="text-xs text-red-500 mt-1.5">{emailError}</p>}

              <div className="flex items-start gap-2.5 mt-4 p-3 bg-amber-50 dark:bg-amber-900/15 rounded-xl">
                <HugeiconsIcon icon={AlertIcon} size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  Cancellations are permanent and cannot be undone.
                </p>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading || !email}
                className="h-10 lg:h-11 w-full mt-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <LoadingSpinner /> : "Send verification code"}
              </button>
            </div>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-3">
                <HugeiconsIcon icon={MailIcon} size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Check your inbox</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 leading-relaxed">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-gray-800 dark:text-gray-200">{email}</span>
              </p>

              <OtpInput onChange={setOtp} />
              {otpError && <p className="text-xs text-red-500 text-center -mt-2 mb-3">{otpError}</p>}

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6}
                className="w-full py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <LoadingSpinner /> : "Yes, cancel my registration"}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-gray-400">
                Didn't get it?{" "}
                <button
                  onClick={handleResend}
                  disabled={timer > 0 || loading}
                  className="text-indigo-600 dark:text-indigo-400 disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  Resend {timer > 0 ? `(${timer}s)` : ""}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === "done" && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
                <HugeiconsIcon icon={CheckIcon} size={28} className="text-green-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Registration cancelled</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 max-w-xs">
                Your registration has been cancelled.
                {eventTitle && (
                  <span className="block mt-1 text-xs text-gray-400">
                    {eventTitle}
                  </span>
                )}
                {summary?.registrationNumber && (
                  <span className="block mt-1 text-xs text-gray-400">
                    Registration #{summary.registrationNumber}
                  </span>
                )}
                {summary?.cascadedCancellations && summary.cascadedCancellations > 0 && (
                  <span className="block mt-2 text-xs text-amber-600 dark:text-amber-400">
                    {summary.cascadedCancellations} linked registration(s) were also cancelled.
                  </span>
                )}
              </p>
              <button
                onClick={() => { queryClient.invalidateQueries({ queryKey: ['events', 'slug', params.slug] }); onClose()}}
                className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}