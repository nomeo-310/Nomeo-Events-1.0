"use client";

import React, { useState } from "react";
import { useSettings } from "@/hooks/use-settings";
import type { Settings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BellDotIcon as Bell02Icon,
  GridViewIcon as DisplayIcon,
  CreditCardIcon,
  Calendar02Icon,
  LockIcon,
  DashboardSquareAddIcon as IntegrationIcon,
  AddTeamIcon as TeamIcon,
  Shield02Icon,
  UserAccountIcon,
  DeleteIcon,
  LockPasswordIcon as PasswordIcon,
  Mail02Icon,
  Loading03Icon
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PasswordStrength } from "@/components/ui/password-strength";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

// ==================== TYPE DEFINITIONS ====================
interface User {
  id?: string;
  email?: string;
  providerId?: string;
  name?: string;
  [key: string]: any;
}

interface SettingsPageProps {
  user: User;
}

interface SectionProps {
  user?: User;
  settings?: Settings;
  onUpdate: (data: any) => void;
  isPending: boolean;
}

interface LocalAccountSettings {
  email: string;
  newEmail: string;
  confirmEmail: string;
  otp: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ==================== MAIN COMPONENT ====================
export default function SettingsPage({ user }: SettingsPageProps) {
  const { useGetSettings, useUpdateSection } = useSettings();
  const { data: settings, isLoading } = useGetSettings();
  const { mutate: updateSection, isPending } = useUpdateSection();
  const [activeTab, setActiveTab] = useState("account");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <HugeiconsIcon icon={Loading03Icon} className="size-10 animate-spin text-indigo-600"/>
      </div>
    );
  }

  if (!settings) {
    return <div>Failed to load settings</div>;
  }

  const tabs = [
    { id: "account", label: "Account", icon: UserAccountIcon },
    { id: "notifications", label: "Notifications", icon: Bell02Icon },
    { id: "display", label: "Display", icon: DisplayIcon },
    { id: "payment", label: "Payment", icon: CreditCardIcon },
    { id: "events", label: "Events", icon: Calendar02Icon },
    { id: "privacy", label: "Privacy", icon: Shield02Icon },
    { id: "security", label: "Security", icon: LockIcon },
    { id: "integrations", label: "Integrations", icon: IntegrationIcon },
    { id: "team", label: "Team", icon: TeamIcon },
  ];

  return (
    <div className="container py-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 h-10 lg:h-11",
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            <HugeiconsIcon icon={tab.icon} size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="mt-6">
        {activeTab === "account" && (
          <AccountSection 
            user={user} 
            onUpdate={(data: any) => updateSection({ section: "account", data })} 
            isPending={isPending} 
          />
        )}
        {activeTab === "notifications" && (
          <NotificationsSection 
            settings={settings} 
            onUpdate={(data: any) => updateSection({ section: "notifications", data })} 
            isPending={isPending} 
          />
        )}
        {activeTab === "display" && (
          <DisplaySection 
            settings={settings} 
            onUpdate={(data: any) => updateSection({ section: "display", data })} 
            isPending={isPending} 
          />
        )}
        {activeTab === "payment" && (
          <PaymentSection 
            settings={settings} 
            onUpdate={(data: any) => updateSection({ section: "payment", data })} 
            isPending={isPending} 
          />
        )}
        {activeTab === "events" && (
          <EventsSection 
            settings={settings} 
            onUpdate={(data: any) => updateSection({ section: "eventDefaults", data })} 
            isPending={isPending} 
          />
        )}
        {activeTab === "privacy" && (
          <PrivacySection 
            settings={settings} 
            onUpdate={(data: any) => updateSection({ section: "privacy", data })} 
            isPending={isPending} 
          />
        )}
        {activeTab === "security" && (
          <SecuritySection 
            settings={settings} 
            onUpdate={(data: any) => updateSection({ section: "security", data })} 
            isPending={isPending} 
          />
        )}
        {activeTab === "integrations" && (
          <IntegrationsSection 
            settings={settings} 
            onUpdate={(data: any) => updateSection({ section: "integrations", data })} 
            isPending={isPending} 
          />
        )}
        {activeTab === "team" && (
          <TeamSection 
            settings={settings} 
            onUpdate={(data: any) => updateSection({ section: "teamSettings", data })} 
            isPending={isPending} 
          />
        )}
      </div>
    </div>
  );
}

// ==================== ACCOUNT SECTION ====================
function AccountSection({ user, onUpdate, isPending }: SectionProps) {
  const router = useRouter();
  const [localSettings, setLocalSettings] = useState<LocalAccountSettings>({
    email: user?.email || "",
    newEmail: "",
    confirmEmail: "",
    otp: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendOtp = async () => {
    setEmailError("");
    
    if (localSettings.newEmail !== localSettings.confirmEmail) {
      setEmailError("New email and confirm email do not match");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(localSettings.newEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsSendingOtp(true);

    try {
      const response = await fetch("/api/settings/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: localSettings.newEmail }),
      });

      if (response.ok) {
        toast.success('Verification code sent to new email')
        setOtpSent(true);
        setEmailError("");
      } else {
        const data = await response.json();
        toast.error(data.error);
        setEmailError(data.error || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      setEmailError("Network error. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setEmailError("");
    
    if (!localSettings.newEmail) {
      setEmailError("New email address is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(localSettings.newEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsResendingOtp(true);

    try {
      const response = await fetch("/api/settings/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: localSettings.newEmail }),
      });

      if (response.ok) {
        toast.success('New verification code sent to your email');
        setEmailError("");
      } else {
        const data = await response.json();
        toast.error(data.error);
        setEmailError(data.error || "Failed to resend code. Please try again.");
      }
    } catch (error) {
      setEmailError("Network error. Please try again.");
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!otpSent) {
      setEmailError("Please request OTP first");
      return;
    }

    if (!localSettings.otp || localSettings.otp.length < 6) {
      setEmailError("Please enter a valid OTP code");
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const response = await fetch("/api/settings/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: localSettings.newEmail,
          otp: localSettings.otp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Email changed successfully");
        onUpdate({ email: localSettings.newEmail });
        setShowChangeEmail(false);
        setOtpSent(false);
        setEmailError("");
        setLocalSettings({ 
          ...localSettings, 
          email: localSettings.newEmail, 
          newEmail: "", 
          confirmEmail: "", 
          otp: "" 
        });

        await authClient.signOut();
        router.refresh();
      } else {
        const errorMessage = data.message || data.error || "Failed to change email. Please try again.";
        setEmailError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = "Network error. Please try again.";
      setEmailError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleCancelChangeEmail = () => {
    setShowChangeEmail(false);
    setOtpSent(false);
    setEmailError("");
    setLocalSettings({
      ...localSettings,
      newEmail: "",
      confirmEmail: "",
      otp: "",
    });
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    
    if (!localSettings.currentPassword) {
      setPasswordError("Current password is required");
      toast.error("Current password is required");
      return;
    }
    
    if (!localSettings.newPassword) {
      setPasswordError("New password is required");
      toast.error("New password is required");
      return;
    }
    
    if (localSettings.newPassword !== localSettings.confirmPassword) {
      setPasswordError("New passwords do not match");
      toast.error("New passwords do not match");
      return;
    }
    
    if (localSettings.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (localSettings.currentPassword === localSettings.newPassword) {
      setPasswordError("New password must be different from your current password");
      toast.error("New password must be different from your current password");
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const response = await fetch("/api/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: localSettings.currentPassword,
          newPassword: localSettings.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Password changed successfully");
        setShowChangePassword(false);
        setPasswordError("");
        setLocalSettings({ 
          ...localSettings, 
          currentPassword: "", 
          newPassword: "", 
          confirmPassword: "" 
        });

        await authClient.signOut();
      } else {
        const errorMessage = data.error || "Failed to change password";
        setPasswordError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error changing password:", error);
      const errorMessage = "Network error. Please try again.";
      setPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeactivateAccount = () => {
    onUpdate({ status: "deactivated" });
    setShowDeactivateConfirm(false);
  };

  const handleDeleteAccount = () => {
    onUpdate({ status: "deleted" });
    setShowDeleteConfirm(false);
  };

  const isCredentialUser = user?.providerId === 'credential';
  const isGoogleUser = user?.providerId === 'google';
  const providerName = isGoogleUser ? 'Google' : (user?.providerId || 'OAuth');

  return (
    <div className="space-y-6">
      {/* Change Email Section */}
      <div className="border rounded-lg p-4 lg:p-6 bg-white dark:bg-gray-900">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <HugeiconsIcon icon={Mail02Icon} className="h-5 w-5 text-indigo-600" />
            Email Address
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your email address</p>
        </div>
        
        {isCredentialUser ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Current Email</Label>
                <Input value={localSettings.email} disabled className="bg-gray-50 dark:bg-gray-800" />
              </div>
            </div>
            
            {!showChangeEmail ? (
              <Button
                variant="outline"
                onClick={() => setShowChangeEmail(true)}
                className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 h-10 lg:h-11 px-6"
              >
                Change Email
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>New Email Address</Label>
                    <Input
                      type="email"
                      value={localSettings.newEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setLocalSettings({ ...localSettings, newEmail: e.target.value });
                        setEmailError("");
                      }}
                      placeholder="Enter new email address"
                      disabled={otpSent}
                      className={emailError ? "border-red-500 focus:ring-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Email</Label>
                    <Input
                      type="email"
                      value={localSettings.confirmEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setLocalSettings({ ...localSettings, confirmEmail: e.target.value });
                        setEmailError("");
                      }}
                      placeholder="Confirm new email address"
                      disabled={otpSent}
                      className={emailError ? "border-red-500 focus:ring-red-500" : ""}
                    />
                  </div>
                </div>

                {emailError && !otpSent && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    {emailError}
                  </div>
                )}

                {!otpSent ? (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || !localSettings.newEmail || !localSettings.confirmEmail}
                      className="bg-indigo-600 hover:bg-indigo-700 h-10 lg:h-11 px-6"
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="animate-spin size-5 mr-2" />
                          Sending Code...
                        </>
                      ) : (
                        "Send Verification Code"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelChangeEmail}
                      className={'h-10 lg:h-11 px-6'}
                      disabled={isSendingOtp}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>OTP Verification Code</Label>
                        <Input
                          type="text"
                          value={localSettings.otp}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setLocalSettings({ ...localSettings, otp: e.target.value });
                            setEmailError("");
                          }}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          className="text-center text-lg tracking-widest font-mono"
                          disabled={isVerifyingOtp}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          We've sent a verification code to {localSettings.newEmail}
                        </p>
                      </div>
                    </div>
                    
                    {emailError && (
                      <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                        {emailError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        onClick={handleChangeEmail}
                        disabled={isVerifyingOtp || !localSettings.otp}
                        className="bg-indigo-600 hover:bg-indigo-700 h-10 lg:h-11 px-6"
                      >
                        {isVerifyingOtp ? (
                          <>
                            <Loader2 className="animate-spin size-5 mr-2" />
                            Verifying...
                          </>
                        ) : (
                          "Verify & Change Email"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleResendOtp}
                        disabled={isResendingOtp}
                        className={'h-10 lg:h-11 px-6'}
                      >
                        {isResendingOtp ? (
                          <>
                            <Loader2 className="animate-spin size-5 mr-2" />
                            Resending...
                          </>
                        ) : (
                          "Resend Code"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelChangeEmail}
                        className={'h-10 lg:h-11 px-6'}
                        disabled={isVerifyingOtp || isResendingOtp}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Current Email</Label>
                <Input value={localSettings.email} disabled className="bg-gray-50 dark:bg-gray-800" />
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Email cannot be changed</p>
                  <p className="text-xs">
                    You signed in with <strong>{providerName}</strong>. Accounts using OAuth providers must manage their email through their {providerName} account settings.
                  </p>
                  <p className="text-xs mt-2">
                    To change your email, please update it in your {providerName} account, then sign in again.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Section */}
      <div className="border rounded-lg p-4 lg:p-6 bg-white dark:bg-gray-900">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <HugeiconsIcon icon={PasswordIcon} className="h-5 w-5 text-indigo-600" />
            Password
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your password</p>
        </div>
        
        {isCredentialUser ? (
          <div className="space-y-4">
            {!showChangePassword ? (
              <Button
                variant="outline"
                onClick={() => setShowChangePassword(true)}
                className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 h-10 lg:h-11 px-6"
              >
                Change Password
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        value={localSettings.currentPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setLocalSettings({ ...localSettings, currentPassword: e.target.value });
                          setPasswordError("");
                        }}
                        placeholder="Enter current password"
                        className={passwordError ? "border-red-500 focus:ring-red-500 pr-10" : "pr-10"}
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showCurrentPassword ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="hidden lg:block"></div>

                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={localSettings.newPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setLocalSettings({ ...localSettings, newPassword: e.target.value });
                          setPasswordError("");
                        }}
                        placeholder="Enter new password"
                        className={passwordError ? "border-red-500 focus:ring-red-500 pr-10" : "pr-10"}
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showNewPassword ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Password must be at least 8 characters</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={localSettings.confirmPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setLocalSettings({ ...localSettings, confirmPassword: e.target.value });
                          setPasswordError("");
                        }}
                        placeholder="Confirm new password"
                        className={passwordError ? "border-red-500 focus:ring-red-500 pr-10" : "pr-10"}
                        disabled={isChangingPassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {localSettings.newPassword && !isChangingPassword && (
                  <div className="mt-2">
                    <PasswordStrength password={localSettings.newPassword} />
                  </div>
                )}
                
                {passwordError && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    {passwordError}
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={isChangingPassword || !localSettings.currentPassword || !localSettings.newPassword || !localSettings.confirmPassword}
                    className="bg-indigo-600 hover:bg-indigo-700 h-10 lg:h-11 px-6"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="animate-spin size-5 mr-2" />
                        Changing Password...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className={'h-10 lg:h-11 px-6'}
                    onClick={() => {
                      setShowChangePassword(false);
                      setPasswordError("");
                      setLocalSettings({ ...localSettings, currentPassword: "", newPassword: "", confirmPassword: "" });
                    }}
                    disabled={isChangingPassword}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Password cannot be changed</p>
                <p className="text-xs">
                  You signed in with <strong>{providerName}</strong>. OAuth accounts don't use passwords for authentication.
                </p>
                <p className="text-xs mt-2">
                  Please use your {providerName} account to manage your authentication settings.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deactivate Account Section */}
      <div className="border rounded-lg p-4 lg:p-6 bg-white dark:bg-gray-900 border-yellow-200 dark:border-yellow-800">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
            <HugeiconsIcon icon={UserAccountIcon} className="h-5 w-5" />
            Deactivate Account
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Temporarily deactivate your account. You can reactivate it later.
          </p>
        </div>
        
        {!showDeactivateConfirm ? (
          <Button
            variant="outline"
            onClick={() => setShowDeactivateConfirm(true)}
            className="border-yellow-600 text-yellow-600 hover:bg-yellow-50 h-10 lg:h-11 px-6"
          >
            Deactivate Account
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Warning:</strong> Deactivating your account will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Temporarily hide all your events and data</li>
                  <li>Prevent users from finding your profile</li>
                  <li>You can reactivate anytime by logging in</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleDeactivateAccount}
                className="bg-yellow-600 hover:bg-yellow-700 h-10 lg:h-11 px-6"
              >
                Yes, Deactivate Account
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeactivateConfirm(false)}
                className={'h-10 lg:h-11 px-6'}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Account Section */}
      <div className="border rounded-lg p-4 lg:p-6 bg-white dark:bg-gray-900 border-red-200 dark:border-red-800">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-500 flex items-center gap-2">
            <HugeiconsIcon icon={DeleteIcon} className="h-5 w-5" />
            Delete Account
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Permanently delete your account and all associated data.
          </p>
        </div>
        
        {!showDeleteConfirm ? (
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="border-red-600 text-red-600 hover:bg-red-50 h-10 lg:h-11 px-6"
          >
            Delete Account
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-sm text-red-800 dark:text-red-200">
                <strong>Warning:</strong> This action is irreversible. Deleting your account will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Permanently delete all your events and data</li>
                  <li>Remove all your personal information</li>
                  <li>Cancel any active subscriptions</li>
                  <li>You will lose access to your account forever</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700 h-10 lg:h-11 px-6"
              >
                Permanently Delete Account
              </Button>
              <Button
                variant="outline"
                className={'h-10 lg:h-11 px-6'}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== NOTIFICATIONS SECTION ====================
function NotificationsSection({ settings, onUpdate, isPending }: SectionProps) {
  if (!settings) return null;
  
  return (
    <div className="space-y-6">
      <div className="border rounded-lg lg:p-6 p-4 bg-white dark:bg-gray-900">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Notifications</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your email notification preferences</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { key: "newRegistration", label: "New Registrations", desc: "When someone registers for your events" },
            { key: "eventReminder", label: "Event Reminders", desc: "Reminders about upcoming events" },
            { key: "weeklyReport", label: "Weekly Report", desc: "Weekly summary of your events" },
            { key: "monthlyDigest", label: "Monthly Digest", desc: "Monthly overview and insights" },
            { key: "marketing", label: "Marketing Emails", desc: "Tips, updates, and promotional content" },
            { key: "paymentReceived", label: "Payment Received", desc: "When you receive a payment" },
            { key: "eventCancelled", label: "Event Cancelled", desc: "Notifications about cancelled events" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
              <Switch
                checked={settings.notifications.email[item.key as keyof typeof settings.notifications.email]}
                onCheckedChange={(checked: boolean) => {
                  onUpdate({
                    email: { ...settings.notifications.email, [item.key]: checked }
                  });
                }}
                disabled={isPending}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-6 bg-white dark:bg-gray-900">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">SMS Notifications</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your SMS notification preferences</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { key: "alerts", label: "Alerts", desc: "Important alerts via SMS" },
            { key: "reminders", label: "Reminders", desc: "Event reminders via SMS" },
            { key: "otpVerification", label: "OTP Verification", desc: "Two-factor authentication codes" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
              <Switch
                checked={settings.notifications.sms[item.key as keyof typeof settings.notifications.sms]}
                onCheckedChange={(checked: boolean) => {
                  onUpdate({
                    sms: { ...settings.notifications.sms, [item.key]: checked }
                  });
                }}
                disabled={isPending}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-lg lg:p-6 p-4 bg-white dark:bg-gray-900">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Push Notifications</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your push notification preferences</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { key: "updates", label: "Updates", desc: "Important updates and announcements" },
            { key: "messages", label: "Messages", desc: "Direct messages from attendees" },
            { key: "reminders", label: "Reminders", desc: "Push notification reminders" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
              <Switch
                checked={settings.notifications.push[item.key as keyof typeof settings.notifications.push]}
                onCheckedChange={(checked: boolean) => {
                  onUpdate({
                    push: { ...settings.notifications.push, [item.key]: checked }
                  });
                }}
                disabled={isPending}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-4 lg:p-6 bg-white dark:bg-gray-900">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">In-App Notifications</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your in-app notification preferences</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { key: "newRegistration", label: "New Registrations", desc: "When someone registers for your events" },
            { key: "eventUpdates", label: "Event Updates", desc: "Changes to your events" },
            { key: "teamInvites", label: "Team Invites", desc: "Invitations to join teams" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
              <Switch
                checked={settings.notifications.inApp[item.key as keyof typeof settings.notifications.inApp]}
                onCheckedChange={(checked: boolean) => {
                  onUpdate({
                    inApp: { ...settings.notifications.inApp, [item.key]: checked }
                  });
                }}
                disabled={isPending}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== DISPLAY SECTION ====================
function DisplaySection({ settings, onUpdate, isPending }: SectionProps) {
  if (!settings) return null;
  
  const [localSettings, setLocalSettings] = useState(settings.display);

  const handleSave = () => {
    onUpdate(localSettings);
  };

  return (
    <div className="border rounded-lg p-6 bg-white dark:bg-gray-900">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Display Settings</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize your display preferences</p>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={localSettings.timezone}
              onValueChange={(value: string | null) => {
                if (value) setLocalSettings({ ...localSettings, timezone: value });
              }}
            >
              <SelectTrigger className="border-gray-200 focus:ring-indigo-500 w-full h-10 lg:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={'p-1'}>
                <SelectItem value="Africa/Lagos">Africa/Lagos (GMT+1)</SelectItem>
                <SelectItem value="Africa/Nairobi">Africa/Nairobi (GMT+3)</SelectItem>
                <SelectItem value="America/New_York">America/New York (GMT-5)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date Format</Label>
            <Select
              value={localSettings.dateFormat}
              onValueChange={(value: string | null) => {
                if (value && (value === "DD/MM/YYYY" || value === "MM/DD/YYYY" || value === "YYYY-MM-DD")) {
                  setLocalSettings({ ...localSettings, dateFormat: value });
                }
              }}
            >
              <SelectTrigger className="border-gray-200 focus:ring-indigo-500 w-full h-10 lg:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={'p-1'}>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Time Format</Label>
            <Select
              value={localSettings.timeFormat}
              onValueChange={(value: string | null) => {
                if (value && (value === "12h" || value === "24h")) {
                  setLocalSettings({ ...localSettings, timeFormat: value });
                }
              }}
            >
              <SelectTrigger className="border-gray-200 focus:ring-indigo-500 w-full h-10 lg:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={'p-1'}>
                <SelectItem value="12h">12-hour</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Select
              value={localSettings.language}
              onValueChange={(value: string | null) => {
                if (value) setLocalSettings({ ...localSettings, language: value });
              }}
            >
              <SelectTrigger className="border-gray-200 focus:ring-indigo-500 w-full h-10 lg:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={'p-1'}>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={localSettings.currency}
              onValueChange={(value: string | null) => {
                if (value && (value === "NGN" || value === "USD" || value === "EUR" || value === "GBP")) {
                  setLocalSettings({ ...localSettings, currency: value });
                }
              }}
            >
              <SelectTrigger className="border-gray-200 focus:ring-indigo-500 w-full h-10 lg:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={'p-1'}>
                <SelectItem value="NGN">NGN (₦)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={localSettings.theme}
              onValueChange={(value: string | null) => {
                if (value && (value === "light" || value === "dark" || value === "system")) {
                  setLocalSettings({ ...localSettings, theme: value });
                }
              }}
            >
              <SelectTrigger className="border-gray-200 focus:ring-indigo-500 w-full h-10 lg:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={'p-1'}>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <Label>Compact View</Label>
            <p className="text-xs text-gray-500 mt-1">Use a denser layout</p>
          </div>
          <Switch
            checked={localSettings.compactView}
            onCheckedChange={(checked: boolean) => setLocalSettings({ ...localSettings, compactView: checked })}
            className="data-[state=checked]:bg-indigo-600"
          />
        </div>

        <Button onClick={handleSave} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 px-6 h-10 lg:h-11">
          {isPending ? "Saving..." : "Save Display Settings"}
        </Button>
      </div>
    </div>
  );
}

// ==================== PAYMENT SECTION ====================
function PaymentSection({ settings, onUpdate, isPending }: SectionProps) {
  if (!settings) return null;
  
  const [localSettings, setLocalSettings] = useState(settings.payment);

  const handleSave = () => {
    onUpdate(localSettings);
  };

  return (
    <div className="border rounded-lg p-4 lg:p-6 bg-white dark:bg-gray-900">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Settings</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your payment preferences</p>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={localSettings.currency}
              onValueChange={(value: string | null) => {
                if (value && (value === "NGN" || value === "USD" || value === "EUR" || value === "GBP")) {
                  setLocalSettings({ ...localSettings, currency: value });
                }
              }}
            >
              <SelectTrigger className="border-gray-200 focus:ring-indigo-500 w-full h-10 lg:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={'p-1'}>
                <SelectItem value="NGN">NGN (₦)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Payout Schedule</Label>
            <Select
              value={localSettings.payoutSchedule}
              onValueChange={(value: string | null) => {
                if (value && (value === "daily" || value === "weekly" || value === "biweekly" || value === "monthly")) {
                  setLocalSettings({ ...localSettings, payoutSchedule: value });
                }
              }}
            >
              <SelectTrigger className="border-gray-200 focus:ring-indigo-500 w-full h-10 lg:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={'p-1'}>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Payout Method</Label>
            <Select
              value={localSettings.payoutMethod}
              onValueChange={(value: string | null) => {
                if (value && (value === "bank" || value === "paypal" || value === "stripe")) {
                  setLocalSettings({ ...localSettings, payoutMethod: value });
                }
              }}
            >
              <SelectTrigger className="border-gray-200 focus:ring-indigo-500 w-full h-10 lg:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={'p-1'}>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Minimum Payout (₦)</Label>
            <Input
              type="number"
              value={localSettings.minimumPayout}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, minimumPayout: Number(e.target.value) })}
              className="border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <Label>Tax Rate (%)</Label>
            <Input
              type="number"
              value={localSettings.taxRate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, taxRate: Number(e.target.value) })}
              className="border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <Label>Tax ID (optional)</Label>
            <Input
              value={localSettings.taxId || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, taxId: e.target.value })}
              placeholder="Enter tax ID"
              className="border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <Label>Invoice Prefix</Label>
            <Input
              value={localSettings.invoicePrefix}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, invoicePrefix: e.target.value })}
              className="border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <Label>Auto Payout</Label>
            <p className="text-xs text-gray-500 mt-1">Automatically process payouts</p>
          </div>
          <Switch
            checked={localSettings.autoPayout}
            onCheckedChange={(checked: boolean) => setLocalSettings({ ...localSettings, autoPayout: checked })}
            className="data-[state=checked]:bg-indigo-600"
          />
        </div>

        <Button onClick={handleSave} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 px-6 h-10 lg:h-11">
          {isPending ? "Saving..." : "Save Payment Settings"}
        </Button>
      </div>
    </div>
  );
}

// ==================== EVENTS SECTION ====================
function EventsSection({ settings, onUpdate, isPending }: SectionProps) {
  if (!settings) return null;
  
  const [localSettings, setLocalSettings] = useState(settings.eventDefaults);

  const handleSave = () => {
    onUpdate(localSettings);
  };

  const eventSwitches = [
    { key: "autoApproveRegistrations", label: "Auto Approve Registrations", desc: "Automatically approve all registrations" },
    { key: "sendReminderEmail", label: "Send Reminder Emails", desc: "Automatically send reminder emails to attendees" },
    { key: "sendThankYouEmail", label: "Send Thank You Emails", desc: "Send thank you emails after registration" },
  ];

  return (
    <div className="border rounded-lg p-4 lg:p-6 bg-white dark:bg-gray-900">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Event Defaults</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Set default values for new events</p>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Default Timezone</Label>
            <Select
              value={localSettings.defaultTimezone}
              onValueChange={(value: string | null) => {
                if (value) setLocalSettings({ ...localSettings, defaultTimezone: value });
              }}
            >
              <SelectTrigger className="border-gray-200 focus:ring-indigo-500 w-full h-10 lg:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={'p-1'}>
                <SelectItem value="Africa/Lagos">Africa/Lagos (GMT+1)</SelectItem>
                <SelectItem value="Africa/Nairobi">Africa/Nairobi (GMT+3)</SelectItem>
                <SelectItem value="America/New_York">America/New York (GMT-5)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reminder Time (hours before event)</Label>
            <Input
              type="number"
              value={localSettings.defaultReminderTime}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, defaultReminderTime: Number(e.target.value) })}
              className="border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="lg:col-span-2 space-y-2">
            <Label>Default Refund Policy</Label>
            <Input
              value={localSettings.defaultRefundPolicy}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, defaultRefundPolicy: e.target.value })}
              className="border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {eventSwitches.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
              <Switch
                checked={localSettings[item.key as keyof typeof localSettings] as boolean}
                onCheckedChange={(checked: boolean) => setLocalSettings({ ...localSettings, [item.key]: checked })}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 px-6 h-10 lg:h-11">
          {isPending ? "Saving..." : "Save Event Defaults"}
        </Button>
      </div>
    </div>
  );
}

// ==================== PRIVACY SECTION ====================
function PrivacySection({ settings, onUpdate, isPending }: SectionProps) {
  if (!settings) return null;
  
  const [localRetentionDays, setLocalRetentionDays] = useState<number | null>(settings.privacy.dataRetentionDays);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRetentionBlur = () => {
    if (localRetentionDays === settings.privacy.dataRetentionDays) return;
    
    setIsUpdating(true);
    const days = localRetentionDays === null || isNaN(localRetentionDays) 
      ? 0 
      : Math.max(0, Number(localRetentionDays));
    
    onUpdate({ dataRetentionDays: days });
    setIsUpdating(false);
  };

  const handleRetentionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setLocalRetentionDays(null);
    } else {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        setLocalRetentionDays(numValue);
      }
    }
  };

  const privacyOptions = [
    { key: "showEmailOnPublicProfile", label: "Show Email on Public Profile", desc: "Display your email address publicly" },
    { key: "showPhoneOnPublicProfile", label: "Show Phone on Public Profile", desc: "Display your phone number publicly" },
    { key: "showLocationOnPublicProfile", label: "Show Location on Public Profile", desc: "Display your location publicly" },
    { key: "showEventHistory", label: "Show Event History", desc: "Let others see your event history" },
    { key: "allowDirectMessages", label: "Allow Direct Messages", desc: "Allow others to send you messages" },
    { key: "allowEventSharing", label: "Allow Event Sharing", desc: "Allow your events to be shared" },
    { key: "allowAnalyticsTracking", label: "Allow Analytics Tracking", desc: "Help us improve with anonymous usage data" },
  ];

  return (
    <div className="border rounded-lg p-4 lg:p-6 bg-white dark:bg-gray-900">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy Settings</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Control your privacy and data sharing</p>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {privacyOptions.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
              <Switch
                checked={settings.privacy[item.key as keyof typeof settings.privacy] as boolean}
                onCheckedChange={(checked: boolean) => {
                  onUpdate({ [item.key]: checked });
                }}
                disabled={isPending}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>Data Retention (days)</Label>
                <p className="text-xs text-gray-500 mt-1">How long to keep your data before deletion</p>
              </div>
              {isUpdating && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              )}
            </div>
            <Input
              type="number"
              min="0"
              step="1"
              value={localRetentionDays === null ? "" : localRetentionDays}
              onChange={handleRetentionChange}
              onBlur={handleRetentionBlur}
              placeholder="0"
              className="border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isPending}
            />
            {localRetentionDays === 0 && (
              <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                ⚠️ Data will not be automatically deleted. Manual deletion required.
              </p>
            )}
            {localRetentionDays && localRetentionDays > 0 && (
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                ✓ Data will be automatically deleted after {localRetentionDays} days of inactivity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== SECURITY SECTION ====================
function SecuritySection({ settings, onUpdate, isPending }: SectionProps) {
  if (!settings) return null;
  
  const [localSettings, setLocalSettings] = useState(settings.security);

  const handleSave = () => {
    onUpdate(localSettings);
  };

  return (
    <div className="border rounded-lg p-4 lg:p-6 bg-white dark:bg-gray-900">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Settings</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account security</p>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label>Two-Factor Authentication</Label>
              <p className="text-xs text-gray-500 mt-1">Add an extra layer of security</p>
            </div>
            <Switch
              checked={localSettings.twoFactorEnabled}
              onCheckedChange={(checked: boolean) => setLocalSettings({ ...localSettings, twoFactorEnabled: checked })}
              className="data-[state=checked]:bg-indigo-600"
            />
          </div>

          {localSettings.twoFactorEnabled && (
            <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Label>2FA Method</Label>
              <Select
                value={localSettings.twoFactorMethod}
                onValueChange={(value: string | null) => {
                  if (value && (value === "authenticator" || value === "sms" || value === "email")) {
                    setLocalSettings({ ...localSettings, twoFactorMethod: value });
                  }
                }}
              >
                <SelectTrigger className="border-gray-200 focus:ring-indigo-500 w-full h-10 lg:h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={'p-1'}>
                  <SelectItem value="authenticator">Authenticator App</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Label>Session Timeout (minutes)</Label>
            <Input
              type="number"
              value={localSettings.sessionTimeout}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, sessionTimeout: Number(e.target.value) })}
              className="border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <Label>Login Alerts</Label>
              <p className="text-xs text-gray-500 mt-1">Get notified of new logins</p>
            </div>
            <Switch
              checked={localSettings.loginAlerts}
              onCheckedChange={(checked: boolean) => setLocalSettings({ ...localSettings, loginAlerts: checked })}
              className="data-[state=checked]:bg-indigo-600"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 px-6 h-10 lg:h-11">
          {isPending ? "Saving..." : "Save Security Settings"}
        </Button>
      </div>
    </div>
  );
}

// ==================== INTEGRATIONS SECTION ====================
function IntegrationsSection({ settings, onUpdate, isPending }: SectionProps) {
  if (!settings) return null;
  
  const googleCalendarSwitches = [
    { key: "connected", label: "Connected", desc: "Link your Google Calendar" },
    { key: "syncEnabled", label: "Sync Enabled", desc: "Automatically sync events" },
  ];

  const zoomSwitches = [
    { key: "connected", label: "Connected", desc: "Link your Zoom account" },
  ];

  const mailchimpSwitches = [
    { key: "connected", label: "Connected", desc: "Link your Mailchimp account" },
    { key: "syncEnabled", label: "Sync Enabled", desc: "Automatically sync audience" },
  ];

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 lg:p-6 bg-white dark:bg-gray-900">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Google Calendar</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sync your events with Google Calendar</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {googleCalendarSwitches.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
              <Switch
                checked={settings.integrations.googleCalendar[item.key as keyof typeof settings.integrations.googleCalendar] as boolean}
                onCheckedChange={(checked: boolean) => {
                  onUpdate({
                    googleCalendar: { ...settings.integrations.googleCalendar, [item.key]: checked }
                  });
                }}
                disabled={isPending || (item.key === "syncEnabled" && !settings.integrations.googleCalendar.connected)}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-4 lg:p-6 bg-white dark:bg-gray-900">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Zoom Integration</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Connect and configure Zoom meetings</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {zoomSwitches.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
              <Switch
                checked={settings.integrations.zoom[item.key as keyof typeof settings.integrations.zoom] as boolean}
                onCheckedChange={(checked: boolean) => {
                  onUpdate({
                    zoom: { ...settings.integrations.zoom, [item.key]: checked }
                  });
                }}
                disabled={isPending}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-lg p-4 lg:p-6 bg-white dark:bg-gray-900">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mailchimp</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sync your contacts with Mailchimp</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mailchimpSwitches.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
              <Switch
                checked={settings.integrations.mailchimp[item.key as keyof typeof settings.integrations.mailchimp] as boolean}
                onCheckedChange={(checked: boolean) => {
                  onUpdate({
                    mailchimp: { ...settings.integrations.mailchimp, [item.key]: checked }
                  });
                }}
                disabled={isPending || (item.key === "syncEnabled" && !settings.integrations.mailchimp.connected)}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== TEAM SECTION ====================
function TeamSection({ settings, onUpdate, isPending }: SectionProps) {
  if (!settings) return null;
  
  const [localSettings, setLocalSettings] = useState(settings.teamSettings);

  const handleSave = () => {
    onUpdate(localSettings);
  };

  const teamSwitches = [
    { key: "allowTeamMembers", label: "Allow Team Members", desc: "Enable team collaboration" },
    { key: "requireApproval", label: "Require Approval", desc: "Require approval for team members" },
    { key: "auditLog", label: "Audit Log", desc: "Keep track of team activities" },
  ];

  return (
    <div className="border rounded-lg p-4 lg:p-6 bg-white dark:bg-gray-900">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Settings</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure team management preferences</p>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Max Team Members</Label>
            <Input
              type="number"
              value={localSettings.maxTeamMembers}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalSettings({ ...localSettings, maxTeamMembers: Number(e.target.value) })}
              className="border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <Label>Default Role</Label>
            <Select
              value={localSettings.defaultRole}
              onValueChange={(value: string | null) => {
                if (value && (value === "admin" || value === "editor" || value === "viewer")) {
                  setLocalSettings({ ...localSettings, defaultRole: value });
                }
              }}
            >
              <SelectTrigger className="border-gray-200 focus:ring-indigo-500 w-full h-10 lg:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={'p-1'}>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {teamSwitches.map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <Label className="font-medium">{item.label}</Label>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
              <Switch
                checked={localSettings[item.key as keyof typeof localSettings] as boolean}
                onCheckedChange={(checked: boolean) => setLocalSettings({ ...localSettings, [item.key]: checked })}
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 px-6 h-10 lg:h-11">
          {isPending ? "Saving..." : "Save Team Settings"}
        </Button>
      </div>
    </div>
  );
}