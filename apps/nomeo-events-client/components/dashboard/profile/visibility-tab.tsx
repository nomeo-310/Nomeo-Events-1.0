"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, TelephoneIcon, MapsLocation01Icon } from "@hugeicons/core-free-icons";

interface VisibilityTabProps {
  seoTitle: string;
  seoDescription: string;
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
  onShowEmailChange: (value: boolean) => void;
  onShowPhoneChange: (value: boolean) => void;
  onShowLocationChange: (value: boolean) => void;
}

export const VisibilityTab = ({
  seoTitle,
  seoDescription,
  showEmail,
  showPhone,
  showLocation,
  onSeoTitleChange,
  onSeoDescriptionChange,
  onShowEmailChange,
  onShowPhoneChange,
  onShowLocationChange,
}: VisibilityTabProps) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-indigo-800">
          Control what information is visible on your public profile.
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SEO Title
          </label>
          <input
            type="text"
            value={seoTitle || ""}
            onChange={(e) => onSeoTitleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            placeholder="Your profile SEO title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SEO Description
          </label>
          <textarea
            rows={3}
            value={seoDescription || ""}
            onChange={(e) => onSeoDescriptionChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm sm:text-base"
            placeholder="Your profile SEO description"
          />
        </div>

        <div className="border-t pt-3 sm:pt-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Privacy Settings</h3>
          
          <div className="space-y-2 sm:space-y-3">
            <label className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div className="flex items-center gap-2 sm:gap-3">
                <HugeiconsIcon icon={Mail01Icon} className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900 text-sm sm:text-base">Show Email</div>
                  <div className="text-xs text-gray-500">Display email on public profile</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onShowEmailChange(!showEmail)}
                className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  showEmail ? "bg-indigo-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                    showEmail ? "translate-x-5 sm:translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div className="flex items-center gap-2 sm:gap-3">
                <HugeiconsIcon icon={TelephoneIcon} className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900 text-sm sm:text-base">Show Phone</div>
                  <div className="text-xs text-gray-500">Display phone number on public profile</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onShowPhoneChange(!showPhone)}
                className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  showPhone ? "bg-indigo-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                    showPhone ? "translate-x-5 sm:translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div className="flex items-center gap-2 sm:gap-3">
                <HugeiconsIcon icon={MapsLocation01Icon} className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900 text-sm sm:text-base">Show Location</div>
                  <div className="text-xs text-gray-500">Display location on public profile</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onShowLocationChange(!showLocation)}
                className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  showLocation !== false ? "bg-indigo-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                    showLocation !== false ? "translate-x-5 sm:translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};