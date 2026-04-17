"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Shield01Icon, CircleLock01Icon, StarIcon, CreditCardIcon, CheckmarkCircle02Icon, AlertCircleIcon, CancelCircleIcon } from "@hugeicons/core-free-icons";

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
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <HugeiconsIcon icon={Shield01Icon} className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600 flex-shrink-0" />
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Identity Verification
            </h3>
            <p className="text-sm text-gray-600 mb-3 sm:mb-4">
              Get verified to unlock more features, increase trust, and access exclusive opportunities.
            </p>
            
            {!isVerified && !isPending && !isRejected && (
              <button
                onClick={onStartVerification}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
              >
                Start Verification
              </button>
            )}
            
            {isPending && (
              <div className="flex items-center gap-2 text-yellow-600 text-sm">
                <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Your verification is pending review. We'll notify you once completed.</span>
              </div>
            )}
            
            {isRejected && (
              <div>
                <div className="flex items-center gap-2 text-red-600 mb-2 sm:mb-3 text-sm">
                  <HugeiconsIcon icon={CancelCircleIcon} className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Your verification was rejected. Please submit again with valid documents.</span>
                </div>
                <button
                  onClick={onStartVerification}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                >
                  Resubmit Documents
                </button>
              </div>
            )}
            
            {isVerified && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Your account is verified! Thank you for building trust in our community.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="border border-gray-200 rounded-lg p-3 sm:p-4 text-center">
          <div className="text-2xl sm:text-2xl mb-1 sm:mb-2">
            <HugeiconsIcon icon={CircleLock01Icon} className="mx-auto"/>
          </div>
          <h4 className="font-semibold mb-1 text-sm sm:text-base">Increased Trust</h4>
          <p className="text-xs text-gray-600">Build credibility with attendees</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 sm:p-4 text-center">
          <div className="text-2xl sm:text-2xl mb-1 sm:mb-2">
            <HugeiconsIcon icon={StarIcon} className="mx-auto"/>
          </div>
          <h4 className="font-semibold mb-1 text-sm sm:text-base">Featured Events</h4>
          <p className="text-xs text-gray-600">Get priority in search results</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-3 sm:p-4 text-center">
          <div className="text-2xl sm:text-2xl mb-1 sm:mb-2">
            <HugeiconsIcon icon={CreditCardIcon} className="mx-auto" />
          </div>
          <h4 className="font-semibold mb-1 text-sm sm:text-base">Higher Payout Limits</h4>
          <p className="text-xs text-gray-600">Access increased transaction limits</p>
        </div>
      </div>
    </div>
  );
};