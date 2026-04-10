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
} from "@hugeicons/core-free-icons";
import { SocialButtons } from "./social-buttons";
import { SignupFormData } from "@/types/auth-type";


interface SignupFormProps {
  onSuccess?: (data: SignupFormData) => void;
  onLogin?: () => void;
  onGoogleSignup?: () => void;
  isLoading?: boolean;
}

export const SignupForm = ({
  onSuccess,
  onLogin,
  onGoogleSignup,
  isLoading = false,
}: SignupFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
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

  const validateForm = (data: SignupFormData): boolean => {
    // Name validation
    if (!data.name) {
      setServerError("Name is required");
      return false;
    }
    if (data.name.length < 2) {
      setServerError("Name must be at least 2 characters");
      return false;
    }
    if (data.name.length > 50) {
      setServerError("Name must be less than 50 characters");
      return false;
    }

    // Email validation
    if (!data.email) {
      setServerError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      setServerError("Please enter a valid email address");
      return false;
    }

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

    // Terms validation
    if (!data.acceptTerms) {
      setServerError("You must accept the terms and conditions");
      return false;
    }

    return true;
  };

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);
    
    if (!validateForm(data)) return;
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Check if email already exists
      if (data.email === "demo@example.com") {
        setServerError("Email already registered. Please login instead.");
        return;
      }
      
      // Simulate successful signup
      localStorage.setItem("nomeo_token", "demo_token");
      localStorage.setItem("user_email", data.email);
      localStorage.setItem("user_name", data.name);
      
      onSuccess?.(data);
      reset();
    } catch (error) {
      setServerError("An error occurred. Please try again.");
    }
  };

  const handleGoogleSignup = () => {
    console.log("Google signup clicked");
    onGoogleSignup?.();
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
              {...register("name")}
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
              {...register("email")}
              className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                errors.email
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-700"
              }`}
              placeholder="demo@example.com"
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
            Confirm Password
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
              <button type="button" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Terms of Service
              </button>{" "}
              and{" "}
              <button type="button" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Privacy Policy
              </button>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.acceptTerms.message}
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
              <HugeiconsIcon icon={UserPlus01Icon} size={18} />
              <span>Create Account</span>
            </>
          )}
        </motion.button>
      </form>

      {/* Social Signup */}
      <SocialButtons onGoogleClick={handleGoogleSignup} isLoading={isLoading || isSubmitting} />

      {/* Login Link */}
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