// hooks/use-otp.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface SendOTPParams {
  email: string;
  type: "email-verification" | "sign-in" | "forget-password" | "change-email"
}

interface VerifyOTPParams {
  email: string;
  otp: string;
  type: "email-verification" | "sign-in" | "forget-password" | "change-email"
}

interface UseOTPReturn {
  // States
  isLoading: boolean;
  error: string | null;
  countdown: number;
  canResend: boolean;
  
  // Functions
  sendOTP: (params: SendOTPParams) => Promise<boolean>;
  verifyOTP: (params: VerifyOTPParams) => Promise<boolean>;
  startCountdown: (seconds?: number) => void;
  resetCountdown: () => void;
}

export function useOTP(): UseOTPReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const startCountdown = useCallback((seconds: number = 60) => {
    setCountdown(seconds);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const resetCountdown = useCallback(() => {
    setCountdown(0);
  }, []);

  const sendOTP = useCallback(async ({ email, type }: SendOTPParams): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      toast.success(data.message || "Verification code sent!");
      startCountdown(60);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to send OTP";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [startCountdown]);

  const verifyOTP = useCallback(async ({ email, otp, type }: VerifyOTPParams): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid or expired code");
      }

      toast.success(data.message || "Email verified successfully!");
      return true;
    } catch (err: any) {
      const errorMessage = err.message || "Verification failed";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    countdown,
    canResend: countdown === 0 && !isLoading,
    sendOTP,
    verifyOTP,
    startCountdown,
    resetCountdown,
  };
}