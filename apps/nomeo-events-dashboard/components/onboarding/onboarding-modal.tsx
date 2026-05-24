// components/admin/onboarding-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from '@/lib/auth/auth-client';
import { ReusableModal } from "@/components/ui/reusable-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrength, usePasswordValidation } from "@/components/ui/password-strength";
import { useUpdatePassword, useUpdateAdminProfile, useGetAdminByUserId } from "@/hooks/use-admin-management";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  CheckmarkCircle02Icon, 
  UserIcon, 
  MailIcon, 
  BrushIcon,
  RocketIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  LockIcon,
  UserCircleIcon,
  ViewIcon,
  ViewOffIcon,
  DashboardSquare02Icon
} from "@hugeicons/core-free-icons";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  userData: {
    email: string;
    name: string;
    displayName: string;
  };
}

type Step = 0 | 1 | 2;

// Local storage keys
const STORAGE_KEYS = {
  ONBOARDING_STEP: 'onboarding_step',
  PASSWORD_UPDATED: 'onboarding_password_updated',
  PROFILE_UPDATED: 'onboarding_profile_updated',
  PASSWORD_DATA: 'onboarding_password_data',
  PROFILE_DATA: 'onboarding_profile_data',
};

export function OnboardingModal({ isOpen, onComplete, userData }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>(0);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileData, setProfileData] = useState({
    name: userData.name || "",
    displayName: userData.displayName || "",
  });
  
  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(true);

  const { mutateAsync: updatePassword } = useUpdatePassword();
  const { mutateAsync: updateProfile } = useUpdateAdminProfile();
  const { data: session } = authClient.useSession();

  // Get admin ID for profile update
  const adminData = useGetAdminByUserId(session?.user?.id || "");
  const adminId = adminData.data?._id;

  // Password validation - only needed if password not yet updated
  const { isValid: isPasswordValid } = usePasswordValidation(passwordData.newPassword);
  const doPasswordsMatch = passwordData.newPassword === passwordData.confirmPassword;
  const hasCurrentPassword = passwordData.currentPassword.length >= 1;
  const canSubmitPassword = !passwordUpdated && hasCurrentPassword && isPasswordValid && doPasswordsMatch && passwordData.newPassword.length >= 8;

  // Profile validation - only needed if profile not yet updated
  const canSubmitProfile = !profileUpdated && profileData.name.trim() !== "" && profileData.displayName.trim() !== "";

  // Load saved state from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      try {
        const savedStep = localStorage.getItem(STORAGE_KEYS.ONBOARDING_STEP);
        const savedPasswordUpdated = localStorage.getItem(STORAGE_KEYS.PASSWORD_UPDATED);
        const savedProfileUpdated = localStorage.getItem(STORAGE_KEYS.PROFILE_UPDATED);
        const savedPasswordData = localStorage.getItem(STORAGE_KEYS.PASSWORD_DATA);
        const savedProfileData = localStorage.getItem(STORAGE_KEYS.PROFILE_DATA);

        if (savedPasswordUpdated === 'true') {
          setPasswordUpdated(true);
        }
        
        if (savedProfileUpdated === 'true') {
          setProfileUpdated(true);
        }

        if (savedPasswordData && savedPasswordUpdated !== 'true') {
          const parsed = JSON.parse(savedPasswordData);
          setPasswordData(parsed);
        }

        if (savedProfileData && savedProfileUpdated !== 'true') {
          const parsed = JSON.parse(savedProfileData);
          setProfileData(parsed);
        }

        // Determine which step to show
        if (savedProfileUpdated === 'true') {
          setStep(2);
        } else if (savedPasswordUpdated === 'true') {
          setStep(2);
        } else if (savedStep) {
          setStep(parseInt(savedStep) as Step);
        }
      } catch (error) {
        console.error("Error loading saved state:", error);
      } finally {
        setIsLoadingState(false);
      }
    }
  }, [isOpen]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoadingState && isOpen && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_STEP, step.toString());
      localStorage.setItem(STORAGE_KEYS.PASSWORD_UPDATED, passwordUpdated.toString());
      localStorage.setItem(STORAGE_KEYS.PROFILE_UPDATED, profileUpdated.toString());
      if (!passwordUpdated) {
        localStorage.setItem(STORAGE_KEYS.PASSWORD_DATA, JSON.stringify(passwordData));
      }
      if (!profileUpdated) {
        localStorage.setItem(STORAGE_KEYS.PROFILE_DATA, JSON.stringify(profileData));
      }
    }
  }, [step, passwordUpdated, profileUpdated, passwordData, profileData, isLoadingState, isOpen]);

  // Clear localStorage when onboarding is complete
  const clearSavedState = () => {
    if (typeof window !== 'undefined') {
      Object.keys(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(STORAGE_KEYS[key as keyof typeof STORAGE_KEYS]);
      });
    }
  };

  // Handle password update (Step 1) - First time setup with current password
  const handlePasswordUpdate = async () => {
    if (!canSubmitPassword || isPasswordUpdating) return;

    setIsPasswordUpdating(true);
    try {
      const result = await updatePassword({
        action: 'first-time-setup',
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      if (result.success) {
        setPasswordUpdated(true);
        toast.success("Password set successfully!");
        
        localStorage.removeItem(STORAGE_KEYS.PASSWORD_DATA);
        
        setTimeout(() => {
          setStep(2);
          setIsPasswordUpdating(false);
        }, 800);
      } else {
        toast.error(result.message || "Failed to update password");
        setIsPasswordUpdating(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
      setIsPasswordUpdating(false);
    }
  };

  // Handle profile update (Step 2)
  const handleProfileUpdate = async () => {
    if (!canSubmitProfile || isProfileUpdating) return;

    setIsProfileUpdating(true);
    try {
      if (!adminId) {
        toast.error("User session not found");
        setIsProfileUpdating(false);
        return;
      }

      const result = await updateProfile({
        adminId,
        name: profileData.name,
        displayName: profileData.displayName,
      });

      if (result.success) {
        setProfileUpdated(true);
        toast.success("Profile updated successfully!");
        
        // Clear saved state and complete onboarding after success
        setTimeout(() => {
          clearSavedState();
          onComplete();
          setIsProfileUpdating(false);
        }, 800);
      } else {
        toast.error(result.message || "Failed to update profile");
        setIsProfileUpdating(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
      setIsProfileUpdating(false);
    }
  };

  // Go to next step
  const goToNextStep = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (passwordUpdated) {
        setStep(2);
      } else {
        handlePasswordUpdate();
      }
    } else if (step === 2) {
      if (profileUpdated) {
        clearSavedState();
        onComplete();
      } else {
        handleProfileUpdate();
      }
    }
  };

  // Go to previous step
  const goToPreviousStep = () => {
    if (step === 1) {
      setStep(0);
    } else if (step === 2) {
      setStep(1);
    }
  };

  // Reset state when modal opens (but preserve saved state)
  useEffect(() => {
    if (isOpen && !isLoadingState) {
      const hasSavedProgress = localStorage.getItem(STORAGE_KEYS.PASSWORD_UPDATED) === 'true' ||
                              localStorage.getItem(STORAGE_KEYS.PROFILE_UPDATED) === 'true';
      
      if (!hasSavedProgress) {
        setStep(0);
        setPasswordUpdated(false);
        setProfileUpdated(false);
        setPasswordData({ 
          currentPassword: "", 
          newPassword: "", 
          confirmPassword: "" 
        });
        setProfileData({
          name: userData.name || "",
          displayName: userData.displayName || "",
        });
      }
      
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, userData, isLoadingState]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, x: 100 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 }
  };

  const welcomeVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  };

  const isLoading = isPasswordUpdating || isProfileUpdating || isLoadingState;

  if (isLoadingState) {
    return (
      <ReusableModal
        isOpen={isOpen}
        onClose={() => {}}
        title=""
        description=""
        showCloseButton={false}
        closeOnEscape={false}
        closeOnOutsideClick={false}
        closable={false}
        size="lg"
        actions={[]}
        className="overflow-hidden"
      >
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </ReusableModal>
    );
  }

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={() => {}}
      title=""
      description=""
      showCloseButton={false}
      closeOnEscape={false}
      closeOnOutsideClick={false}
      closable={false}
      size="lg"
      actions={[]}
      className="overflow-hidden"
    >
      <AnimatePresence mode="wait">
        {/* Step 0 - Welcome */}
        {step === 0 && (
          <motion.div
            key="welcome"
            variants={welcomeVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
            className="flex flex-col items-center text-center py-8"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
              className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
            >
              <HugeiconsIcon icon={DashboardSquare02Icon} className="w-12 h-12 text-white" />
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Welcome to the Admin Dashboard!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                We're excited to have you on board.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Let's get your account set up in just a few minutes.
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="w-full mt-8 space-y-3"
            >
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <HugeiconsIcon icon={LockIcon} className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Update Your Password</p>
                  <p className="text-xs text-gray-500">Enter your temporary password and create a new one</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <HugeiconsIcon icon={UserCircleIcon} className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Complete Your Profile</p>
                  <p className="text-xs text-gray-500">Add your name and display name</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="w-full mt-8"
            >
              <Button
                onClick={goToNextStep}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 lg:h-11"
              >
                Get Started
                <HugeiconsIcon icon={ArrowRight01Icon} className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Step 1 - Password Setup */}
        {step === 1 && (
          <motion.div
            key="password"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Update Your Password
                </h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 ml-10">
                Enter the temporary password sent to your email and create a new one
              </p>
            </div>

            <div className="ml-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Step 1 of 2</span>
                <span className="text-xs font-medium text-blue-600">Password Update</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  className="w-1/2 h-full bg-blue-600 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "50%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <div className="ml-10 space-y-4">
              {!passwordUpdated ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-sm font-medium">
                      Temporary Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Enter your temporary password"
                        className="w-full pr-10"
                        autoFocus
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <HugeiconsIcon 
                          icon={showCurrentPassword ? ViewOffIcon : ViewIcon} 
                          className="w-4 h-4"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-medium">
                      New Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter your new password"
                        className="w-full pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <HugeiconsIcon 
                          icon={showNewPassword ? ViewOffIcon : ViewIcon} 
                          className="w-4 h-4"
                        />
                      </button>
                    </div>
                  </div>

                  <PasswordStrength
                    password={passwordData.newPassword}
                    showProgress={true}
                    showRequirements={true}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium">
                      Confirm New Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm your new password"
                        className="w-full pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      >
                        <HugeiconsIcon 
                          icon={showConfirmPassword ? ViewOffIcon : ViewIcon} 
                          className="w-4 h-4"
                        />
                      </button>
                    </div>
                    {passwordData.confirmPassword && !doPasswordsMatch && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-500"
                      >
                        Passwords do not match
                      </motion.p>
                    )}
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-green-800 dark:text-green-300">
                        Password Updated!
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        Your password has been successfully updated.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex justify-between gap-3 pt-4 ml-10">
              <Button
                onClick={goToPreviousStep}
                variant="outline"
                className="flex-1 h-10 lg:h-11"
                disabled={isLoading}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={goToNextStep}
                disabled={(!passwordUpdated && !canSubmitPassword)}
                className="flex-1 h-10 lg:h-11 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPasswordUpdating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Updating Password...
                  </>
                ) : passwordUpdated ? (
                  <>
                    Continue to Profile
                    <HugeiconsIcon icon={ArrowRight01Icon} className="ml-2 w-4 h-4" />
                  </>
                ) : (
                  <>
                    Update Password
                    <HugeiconsIcon icon={ArrowRight01Icon} className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2 - Profile Setup */}
        {step === 2 && (
          <motion.div
            key="profile"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">2</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Complete Your Profile
                </h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 ml-10">
                Tell us how you'd like to be addressed
              </p>
            </div>

            <div className="ml-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Step 2 of 2</span>
                <span className="text-xs font-medium text-blue-600">Profile Setup</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  className="w-full h-full bg-blue-600 rounded-full"
                  initial={{ width: "50%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            <div className="ml-10 space-y-4">
              {!profileUpdated ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <HugeiconsIcon icon={MailIcon} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={userData.email}
                        disabled
                        className="pl-9 bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <HugeiconsIcon icon={UserIcon} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="Enter your full name"
                        className="pl-9"
                        autoFocus
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display-name" className="text-sm font-medium">
                      Display Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <HugeiconsIcon icon={BrushIcon} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="display-name"
                        type="text"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                        placeholder="How should we address you?"
                        className="pl-9"
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-xs text-gray-500">This name will be visible to other admins</p>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-green-800 dark:text-green-300">
                        Profile Complete!
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        Your profile has been successfully updated.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex justify-between gap-3 pt-4 ml-10">
              <Button
                onClick={goToPreviousStep}
                variant="outline"
                className="flex-1 h-10 lg:h-11"
                disabled={isLoading || profileUpdated}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={goToNextStep}
                disabled={(!profileUpdated && !canSubmitProfile)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-10 lg:h-11"
              >
                {isProfileUpdating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Completing...
                  </>
                ) : profileUpdated ? (
                  <>
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} className="mr-2 w-4 h-4" />
                    Go to Dashboard
                  </>
                ) : (
                  <>
                    Complete Setup
                    <HugeiconsIcon icon={ArrowRight01Icon} className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ReusableModal>
  );
}