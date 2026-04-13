"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  CookieIcon,
  Settings02Icon,
  AnalyticsIcon,
  MarketingIcon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import { ConsentModalProps } from "@/types/consent-type";

export const CookiePolicyContent = () => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <p className="text-gray-600 dark:text-gray-400">
        We use cookies and similar tracking technologies to enhance your experience on Nomeo Events. This Cookie Policy explains what cookies are, how we use them, and your choices regarding their use.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">What Are Cookies?</h3>
      <p className="text-gray-600 dark:text-gray-400">
        Cookies are small text files stored on your device when you visit websites. They help websites remember your preferences, analyze usage, and improve functionality.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Types of Cookies We Use</h3>
      
      <div className="space-y-4 mt-4">
        {/* Necessary Cookies */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={Shield01Icon} size={20} className="text-green-600" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Necessary Cookies</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Essential for platform functionality. Cannot be disabled.
                </p>
              </div>
            </div>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Always Active</span>
          </div>
          <ul className="list-disc pl-6 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <li>Authentication and security</li>
            <li>Shopping cart and checkout</li>
            <li>Session management</li>
            <li>CSRF protection</li>
          </ul>
        </div>

        {/* Functional Cookies */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={Settings02Icon} size={20} className="text-blue-600" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Functional Cookies</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Remember your preferences and settings.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <ul className="list-disc pl-6 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <li>Language and region preferences</li>
            <li>Recently viewed events</li>
            <li>Saved searches and filters</li>
            <li>Accessibility settings</li>
          </ul>
        </div>

        {/* Analytics Cookies */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={AnalyticsIcon} size={20} className="text-purple-600" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Analytics Cookies</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Help us understand how visitors interact with our platform.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <ul className="list-disc pl-6 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <li>Page view and click tracking</li>
            <li>Traffic source analysis</li>
            <li>User journey mapping</li>
            <li>Performance monitoring</li>
          </ul>
        </div>

        {/* Marketing Cookies */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={MarketingIcon} size={20} className="text-pink-600" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Marketing Cookies</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Personalize ads and measure campaign effectiveness.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
          <ul className="list-disc pl-6 mt-2 text-sm text-gray-600 dark:text-gray-400">
            <li>Relevant event recommendations</li>
            <li>Retargeting advertisements</li>
            <li>Social media integration</li>
            <li>Email campaign tracking</li>
          </ul>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">How to Manage Cookies</h3>
      <p className="text-gray-600 dark:text-gray-400">
        You can manage your cookie preferences at any time through our cookie settings panel or by adjusting your browser settings. Most browsers allow you to:
      </p>
      <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-400 mt-2">
        <li>View and delete stored cookies</li>
        <li>Block third-party cookies</li>
        <li>Block all cookies</li>
        <li>Clear cookies when closing browser</li>
      </ul>

      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg mt-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Note:</strong> Disabling certain cookies may affect platform functionality, such as remembering your login status or event preferences.
        </p>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Third-Party Cookies</h3>
      <p className="text-gray-600 dark:text-gray-400">
        Some cookies are placed by third-party services we use, including:
      </p>
      <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-400">
        <li><strong>Google Analytics:</strong> Platform usage analytics</li>
        <li><strong>Stripe:</strong> Payment processing</li>
        <li><strong>Facebook Pixel:</strong> Social media integration</li>
        <li><strong>Hotjar:</strong> User experience analytics</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Cookie Duration</h3>
      <ul className="list-disc pl-6 space-y-1 text-gray-600 dark:text-gray-400">
        <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
        <li><strong>Persistent Cookies:</strong> Remain for a set period (up to 2 years)</li>
        <li><strong>First-party Cookies:</strong> Set by Nomeo Events</li>
        <li><strong>Third-party Cookies:</strong> Set by our partners</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Updates to This Policy</h3>
      <p className="text-gray-600 dark:text-gray-400">
        We may update this Cookie Policy periodically. Changes will be posted on this page with an updated effective date.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Contact Us</h3>
      <p className="text-gray-600 dark:text-gray-400">
        Questions about our Cookie Policy? Contact us at privacy@nomeoevents.com
      </p>
    </div>
  )
}