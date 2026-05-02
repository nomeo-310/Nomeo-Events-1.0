"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Shield01Icon, 
  CircleLock01Icon, 
  StarIcon, 
  CreditCardIcon, 
  CheckmarkCircle02Icon, 
  AlertCircleIcon, 
  CancelCircleIcon,
  File01Icon,
  IdIcon as IdCardIcon,
  Home02Icon,
  Building05Icon as Building07Icon,
  Loading03Icon
} from "@hugeicons/core-free-icons";

interface VerificationTabProps {
  isVerified: boolean;
  isPending: boolean;
  isRejected: boolean;
  onStartVerification: () => void;
}

export const VerificationTab = ({
  isVerified,
  isPending,
  isRejected,
  onStartVerification,
}: VerificationTabProps) => {
  // Show different content based on verification status
  const renderVerificationStatus = () => {
    if (isVerified) {
      return (
        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-6 h-6 sm:w-7 sm:h-7 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-green-800 dark:text-green-200 mb-1">
                Account Verified
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your account has been successfully verified. Thank you for building trust in our community.
                You now have access to all verified features.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (isPending) {
      return (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                <HugeiconsIcon icon={Loading03Icon} className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600 dark:text-amber-400 animate-spin" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-amber-800 dark:text-amber-200 mb-1">
                Verification Pending
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                Your verification request is being reviewed by our team. This usually takes 1-2 business days.
                We'll notify you once completed.
              </p>
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4" />
                <span>Please don't submit another request while your current one is being reviewed</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isRejected) {
      return (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                <HugeiconsIcon icon={CancelCircleIcon} className="w-6 h-6 sm:w-7 sm:h-7 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-semibold text-red-800 dark:text-red-200 mb-1">
                Verification Rejected
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                Your verification request was rejected. Please review the requirements and submit new documents.
              </p>
              <button
                onClick={onStartVerification}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
              >
                Submit New Request
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Unverified state
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
              <HugeiconsIcon icon={Shield01Icon} className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Verify Your Account
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Get verified to unlock more features, increase trust, and access exclusive opportunities.
              Verification helps us maintain a safe and trustworthy community.
            </p>
            <button
              onClick={onStartVerification}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm font-medium"
            >
              Start Verification
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Helper to render document requirements based on account type
  // Note: You'll need to pass accountType as a prop to show specific requirements
  const renderDocumentRequirements = () => {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 sm:p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <HugeiconsIcon icon={File01Icon} className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Required Documents
        </h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <HugeiconsIcon icon={IdCardIcon} className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Identity Document</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Government-issued ID (National ID, Passport, Driver's License, or Voter's Card)
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <HugeiconsIcon icon={Home02Icon} className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Proof of Address</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Recent utility bill, bank statement, or government letter (issued within last 3 months)
              </p>
            </div>
          </div>
          
          {/* Note: This section would be conditionally shown for organizations */}
          <div className="flex items-start gap-3 opacity-60">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <HugeiconsIcon icon={Building07Icon} className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">CAC Document <span className="text-xs text-gray-500">(Organizations only)</span></p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                CAC registration certificate for business/organization accounts
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Verification Status Section */}
      {renderVerificationStatus()}

      {/* Document Requirements Section - Only show for unverified or rejected */}
      {!isVerified && !isPending && renderDocumentRequirements()}

      {/* Benefits Section - Show for all except pending */}
      {!isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4 text-center hover:shadow-md transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 dark:bg-indigo-950 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <HugeiconsIcon icon={CircleLock01Icon} className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h4 className="font-semibold mb-1 text-sm sm:text-base text-gray-900 dark:text-white">Increased Trust</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">Build credibility with attendees and organizers</p>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4 text-center hover:shadow-md transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 dark:bg-indigo-950 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <HugeiconsIcon icon={StarIcon} className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h4 className="font-semibold mb-1 text-sm sm:text-base text-gray-900 dark:text-white">Featured Events</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">Get priority placement in search results</p>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4 text-center hover:shadow-md transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 dark:bg-indigo-950 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <HugeiconsIcon icon={CreditCardIcon} className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h4 className="font-semibold mb-1 text-sm sm:text-base text-gray-900 dark:text-white">Higher Limits</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400">Access increased payout and transaction limits</p>
          </div>
        </div>
      )}

      {/* Pending message with benefits preview */}
      {isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 opacity-60">
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <HugeiconsIcon icon={CircleLock01Icon} className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
            </div>
            <h4 className="font-semibold mb-1 text-sm sm:text-base text-gray-500 dark:text-gray-400">Increased Trust</h4>
            <p className="text-xs text-gray-400 dark:text-gray-500">Available after verification</p>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <HugeiconsIcon icon={StarIcon} className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
            </div>
            <h4 className="font-semibold mb-1 text-sm sm:text-base text-gray-500 dark:text-gray-400">Featured Events</h4>
            <p className="text-xs text-gray-400 dark:text-gray-500">Available after verification</p>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 sm:p-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <HugeiconsIcon icon={CreditCardIcon} className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
            </div>
            <h4 className="font-semibold mb-1 text-sm sm:text-base text-gray-500 dark:text-gray-400">Higher Limits</h4>
            <p className="text-xs text-gray-400 dark:text-gray-500">Available after verification</p>
          </div>
        </div>
      )}
    </div>
  );
};