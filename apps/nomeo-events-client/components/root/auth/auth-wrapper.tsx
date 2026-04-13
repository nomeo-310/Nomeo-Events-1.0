"use client";

import { useState, useEffect } from "react";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";
import { ForgotPasswordForm } from "./forgot-password-form";
import { VerifyEmailForm } from "./verify-email-form";
import { ResetPasswordForm } from "./reset-password-form";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { VerifyOtpForm } from "./verify-otp-form";

type AuthView =
  | "login"
  | "signup"
  | "forgot-password"
  | "verify-email"
  | "verify-reset-otp"
  | "reset-password";

interface AuthWrapperProps {
  defaultView?: AuthView;
  onSuccess?: () => void;
  onClose?: () => void;
}

export const AuthWrapper = ({ defaultView = "login", onSuccess, onClose }: AuthWrapperProps) => {
  const [currentView, setCurrentView] = useState<AuthView>(defaultView);
  const [pendingEmail, setPendingEmail] = useState("");

  const { data: session } = authClient.useSession();

  // close modal if user is already logged in
  useEffect(() => {
    if (session?.user) onClose?.();
  }, [session]);

  const handleLoginSuccess = () => {
    onSuccess?.();
    onClose?.();
  };

  // step: signup done → verify email OTP
  const handleSignupSuccess = (email: string) => {
    setPendingEmail(email);
    setCurrentView("verify-email");
  };

  // step 1 of reset: email submitted → verify OTP
  const handleForgotPasswordSuccess = (email: string) => {
    setPendingEmail(email);
    setCurrentView("verify-reset-otp");
  };

  // step 2 of reset: OTP verified → new password form
  const handleResetOtpSuccess = () => {
    setCurrentView("reset-password");
  };

  // step 3 of reset: password changed → back to login
  const handleResetPasswordSuccess = () => {
    setCurrentView("login");
  };

  const views: Record<AuthView, React.ReactNode> = {
    login: (
      <LoginForm
        onSuccess={handleLoginSuccess}
        onForgotPassword={() => setCurrentView("forgot-password")}
        onSignup={() => setCurrentView("signup")}
      />
    ),
    signup: (
      <SignupForm
        onSuccess={handleSignupSuccess}
        onLogin={() => setCurrentView("login")}
      />
    ),
    "forgot-password": (
      <ForgotPasswordForm
        onSuccess={handleForgotPasswordSuccess}
        onBackToLogin={() => setCurrentView("login")}
      />
    ),
    "verify-email": (
      <VerifyEmailForm
        email={pendingEmail}
        onBackToLogin={() => setCurrentView("login")}
      />
    ),
    "verify-reset-otp": (
      <VerifyOtpForm
        email={pendingEmail}
        onSuccess={handleResetOtpSuccess}
        onBack={() => setCurrentView("forgot-password")}
      />
    ),
    "reset-password": (
      <ResetPasswordForm
        email={pendingEmail}
        onSuccess={handleResetPasswordSuccess}
        onBackToLogin={() => setCurrentView("login")}
      />
    ),
  };

  const getTitle = () => {
    switch (currentView) {
      case "login":            return "Welcome Back";
      case "signup":           return "Create an Account";
      case "forgot-password":  return "Forgot Password?";
      case "verify-email":     return "Verify Your Email";
      case "verify-reset-otp": return "Check Your Email";
      case "reset-password":   return "Set New Password";
      default:                 return "Authentication";
    }
  };

  const getDescription = () => {
    switch (currentView) {
      case "login":
        return "Sign in to your account to continue";
      case "signup":
        return "Join us today and start your journey";
      case "forgot-password":
        return "Enter your email and we'll send you a reset code";
      case "verify-email":
        return `Enter the 6-digit code sent to ${pendingEmail}`;
      case "verify-reset-otp":
        return `Enter the 6-digit reset code sent to ${pendingEmail}`;
      case "reset-password":
        return "Create a strong new password for your account";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getTitle()}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {getDescription()}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {views[currentView]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};