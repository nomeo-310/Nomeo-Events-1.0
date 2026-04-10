"use client";

import { useState } from "react";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";
import { ForgotPasswordForm } from "./forgot-password-form";
import { VerifyEmailForm } from "./verify-email-form";
import { ResetPasswordForm } from "./reset-password-form";
import { motion, AnimatePresence } from "framer-motion";

type AuthView = 
  | "login" 
  | "signup" 
  | "forgot-password" 
  | "verify-email" 
  | "reset-password";

interface AuthWrapperProps {
  defaultView?: AuthView;
  onSuccess?: () => void;
  onClose?: () => void;
}

export const AuthWrapper = ({ 
  defaultView = "login", 
  onSuccess, 
  onClose 
}: AuthWrapperProps) => {
  const [currentView, setCurrentView] = useState<AuthView>(defaultView);
  const [userEmail, setUserEmail] = useState<string>("");
  const [resetToken, setResetToken] = useState<string>("");

  const handleLoginSuccess = () => {
    onSuccess?.();
    onClose?.();
  };

  const handleSignupSuccess = () => {
    // After signup, show email verification
    setCurrentView("verify-email");
  };

  const handleForgotPasswordSuccess = (data: any) => {
    setUserEmail(data.email);
    setCurrentView("reset-password");
  };

  const handleVerifyEmailSuccess = () => {
    // After email verification, go to login
    setCurrentView("login");
  };

  const handleResetPasswordSuccess = () => {
    // After password reset, go to login
    setCurrentView("login");
  };

  const handleResendCode = () => {
    console.log("Resending verification code to:", userEmail);
    // Implement resend logic here
  };

  const views = {
    login: (
      <LoginForm
        onSuccess={handleLoginSuccess}
        onForgotPassword={() => setCurrentView("forgot-password")}
        onSignup={() => setCurrentView("signup")}
        onGoogleLogin={() => console.log("Google login")}
      />
    ),
    signup: (
      <SignupForm
        onSuccess={handleSignupSuccess}
        onLogin={() => setCurrentView("login")}
        onGoogleSignup={() => console.log("Google signup")}
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
        email={userEmail}
        onSuccess={handleVerifyEmailSuccess}
        onResendCode={handleResendCode}
        onBackToLogin={() => setCurrentView("login")}
      />
    ),
    "reset-password": (
      <ResetPasswordForm
        token={resetToken}
        onSuccess={handleResetPasswordSuccess}
        onBackToLogin={() => setCurrentView("login")}
      />
    ),
  };

  // Get title based on current view
  const getTitle = () => {
    switch (currentView) {
      case "login":
        return "Welcome Back";
      case "signup":
        return "Create an Account";
      case "forgot-password":
        return "Forgot Password?";
      case "verify-email":
        return "Verify Your Email";
      case "reset-password":
        return "Reset Password";
      default:
        return "Authentication";
    }
  };

  const getDescription = () => {
    switch (currentView) {
      case "login":
        return "Sign in to your account to continue";
      case "signup":
        return "Join us today and start your journey";
      case "forgot-password":
        return "Enter your email to reset your password";
      case "verify-email":
        return "Enter the verification code sent to your email";
      case "reset-password":
        return "Create a new secure password for your account";
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