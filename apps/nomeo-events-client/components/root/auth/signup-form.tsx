"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  CircleLock02Icon as Lock01Icon,
  ViewIcon as EyeIcon,
  ViewOffSlashIcon as EyeOffIcon,
  UserIcon as User03Icon,
  UserAdd01Icon as UserPlus01Icon,
  Pdf02Icon,
} from "@hugeicons/core-free-icons";
import { SocialButtons } from "./social-buttons";
import { SignupFormData } from "@/types/auth-type";
import { useNestedModalStore } from "@/stores/nested-modal-store";
import { TermsOfUseContent } from "../consent/terms-of-use";
import { PrivacyPolicyContent } from "../consent/privacy-policy";
import { authClient } from "@/lib/auth-client";
import { PasswordStrength } from "@/components/ui/password-strength";
import { toast } from "sonner";

interface SignupFormProps {
  onSuccess?: (email: string) => void;
  onLogin?: () => void;
  isLoading?: boolean;
}

// Helper function to format name (capitalize first letter of each word)
const formatName = (name: string): string => {
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Helper function to validate name (2-3 words)
const validateName = (name: string): string | true => {
  const trimmedName = name.trim();
  const words = trimmedName.split(/\s+/);
  
  if (words.length < 2) {
    return "Please enter your full name (first and last name)";
  }
  
  if (words.length > 3) {
    return "Name cannot exceed 3 words";
  }
  
  // Check each word has at least 2 characters
  for (const word of words) {
    if (word.length < 2) {
      return "Each name part must have at least 2 characters";
    }
    // Check if word contains only letters and allowed characters
    if (!/^[a-zA-Z]+(?:['-][a-zA-Z]+)*$/.test(word)) {
      return "Name can only contain letters, apostrophes, and hyphens";
    }
  }
  
  return true;
};

export const SignupForm = ({ onSuccess, onLogin, isLoading = false }: SignupFormProps) => {
  const { openNestedModal } = useNestedModalStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<string>("weak");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  // Check if password is strong enough
  const isPasswordStrong = passwordStrength === "strong";
  const doPasswordsMatch = password === confirmPassword;
  const isFormValid = isPasswordStrong && doPasswordsMatch && !errors.name && !errors.email;

  const getCallbackUrl = () => {
    if (typeof window === "undefined") return "/dashboard";
    const params = new URLSearchParams(window.location.search);
    return params.get("callbackUrl") ?? "/dashboard";
  };

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);

    if (!data.acceptTerms) {
      setServerError("You must accept the terms and conditions");
      return;
    }

    if (!isPasswordStrong) {
      setServerError("Please use a stronger password");
      return;
    }

    if (!doPasswordsMatch) {
      setServerError("Passwords do not match");
      return;
    }

    // Format the name before sending to database
    const formattedName = formatName(data.name);

    const { error } = await authClient.signUp.email({
      name: formattedName,
      email: data.email,
      password: data.password,
    });

    if (error) {
      setServerError(error.message ?? "Something went wrong. Please try again.");
      return;
    }

    onSuccess?.(data.email);
  };

  // Handle name blur event to format the name
  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const formatted = formatName(e.target.value);
    setValue("name", formatted);
  };

  const handleGoogleSignup = () => {

    toast.loading("Redirecting to Google...");
    authClient.signIn.social({
      provider: "google",
      callbackURL: getCallbackUrl(),
    });
  };

  const viewTermsOfUse = () => {
    openNestedModal({
      title: "Terms of Use",
      description: "Please read our terms and conditions",
      size: "large",
      icon: Pdf02Icon,
      showCloseButton: true,
      closeOnEsc: true,
      closeOnOutsideClick: true,
      children: <TermsOfUseContent />,
    });
  };

  const viewPrivacyPolicy = () => {
    openNestedModal({
      title: "Privacy Policy",
      description: "Learn how we protect your data",
      size: "large",
      icon: Lock01Icon,
      showCloseButton: true,
      closeOnEsc: true,
      closeOnOutsideClick: true,
      children: <PrivacyPolicyContent />,
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HugeiconsIcon icon={User03Icon} size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              {...register("name", {
                required: "Full name is required",
                validate: validateName,
              })}
              onBlur={handleNameBlur}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                errors.name
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-700"
              }`}
              placeholder="John Doe"
              disabled={isLoading || isSubmitting}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.name.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Enter your full name (2-3 words, e.g., John Doe or John Michael Doe)
          </p>
        </div>

        {/* Email Field */}
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

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HugeiconsIcon icon={Lock01Icon} size={18} className="text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 8, message: "Password must be at least 8 characters" },
                validate: {
                  uppercase: (v) =>
                    /[A-Z]/.test(v) || "Must contain at least one uppercase letter",
                  lowercase: (v) =>
                    /[a-z]/.test(v) || "Must contain at least one lowercase letter",
                  number: (v) =>
                    /[0-9]/.test(v) || "Must contain at least one number",
                  special: (v) =>
                    /[^A-Za-z0-9]/.test(v) || "Must contain at least one special character",
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
          
          {/* Password Strength Indicator */}
          <div className="mt-3">
            <PasswordStrength 
              password={password}
              showProgress={true}
              showRequirements={true}
              onStrengthChange={(strength) => setPasswordStrength(strength)}
            />
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm Password
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
          
          {/* Password Match Indicator */}
          <AnimatePresence>
            {confirmPassword && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-2"
              >
                {doPasswordsMatch ? (
                  <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs">
                    <span>✓</span>
                    <span>Passwords match</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs">
                    <span>✗</span>
                    <span>Passwords do not match</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Terms Checkbox */}
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              {...register("acceptTerms")}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              disabled={isLoading || isSubmitting}
            />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              I accept the{" "}
              <button
                type="button"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
                onClick={viewTermsOfUse}
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
                onClick={viewPrivacyPolicy}
              >
                Privacy Policy
              </button>
            </span>
          </label>
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

        {/* Submit Button with validation feedback */}
        <motion.button
          whileHover={{ scale: isFormValid ? 1.02 : 1 }}
          whileTap={{ scale: isFormValid ? 0.98 : 1 }}
          type="submit"
          disabled={isLoading || isSubmitting || !isFormValid}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <HugeiconsIcon icon={UserPlus01Icon} size={18} />
              <span>Create Account</span>
            </>
          )}
        </motion.button>

        {/* Form validation summary */}
        {!isFormValid && (password || confirmPassword) && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center space-y-0.5">
            {password && !isPasswordStrong && (
              <p>• Please make your password stronger</p>
            )}
            {confirmPassword && !doPasswordsMatch && (
              <p>• Passwords need to match</p>
            )}
          </div>
        )}
      </form>

      <SocialButtons
        onGoogleClick={handleGoogleSignup}
        isLoading={isLoading || isSubmitting}
      />

      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <button
            onClick={onLogin}
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium transition"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};