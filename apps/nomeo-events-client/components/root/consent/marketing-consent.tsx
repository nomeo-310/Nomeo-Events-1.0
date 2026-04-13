"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  MarketingIcon,
  Mail01Icon,
  Notification02Icon,
  Message01Icon as SmsIcon,
  TelephoneIcon as PhoneIcon,
  Megaphone01Icon,
  UserGroupIcon,
  Discount01Icon,
} from "@hugeicons/core-free-icons";

export const MarketingConsentContent = () => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 p-6 rounded-lg mb-6">
        <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">
          Get the best event experiences delivered to your inbox!
        </p>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          By subscribing to marketing communications, you'll be the first to know about exclusive events, early bird discounts, and personalized recommendations.
        </p>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={Megaphone01Icon} size={20} className="text-pink-600" />
        What You'll Receive
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <HugeiconsIcon icon={Discount01Icon} size={20} className="text-green-600" />
            <h4 className="font-semibold">Exclusive Discounts</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Early bird pricing, promo codes, and special offers for subscribers only.</p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <HugeiconsIcon icon={UserGroupIcon} size={20} className="text-blue-600" />
            <h4 className="font-semibold">Personalized Recommendations</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Events tailored to your interests and past attendance.</p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <HugeiconsIcon icon={Notification02Icon} size={20} className="text-purple-600" />
            <h4 className="font-semibold">Event Alerts</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Notifications about upcoming events in your area and categories.</p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <HugeiconsIcon icon={Mail01Icon} size={20} className="text-orange-600" />
            <h4 className="font-semibold">Newsletter</h4>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Monthly updates featuring event highlights, industry news, and tips.</p>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={Mail01Icon} size={20} className="text-indigo-600" />
        Communication Channels
      </h3>
      <div className="space-y-3">
        <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <div className="flex items-center gap-3">
            <HugeiconsIcon icon={Mail01Icon} size={20} className="text-indigo-600" />
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Email Marketing</span>
              <p className="text-sm text-gray-500">Weekly newsletters, event recommendations, and special offers</p>
            </div>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded" />
        </label>

        <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <div className="flex items-center gap-3">
            <HugeiconsIcon icon={Notification02Icon} size={20} className="text-purple-600" />
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Push Notifications</span>
              <p className="text-sm text-gray-500">Real-time alerts for events, ticket releases, and reminders</p>
            </div>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-600 rounded" />
        </label>

        <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <div className="flex items-center gap-3">
            <HugeiconsIcon icon={SmsIcon} size={20} className="text-green-600" />
            <div>
              <span className="font-medium text-gray-900 dark:text-white">SMS Alerts</span>
              <p className="text-sm text-gray-500">Text message updates for urgent event changes or last-minute deals</p>
            </div>
          </div>
          <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" />
        </label>

        <label className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <div className="flex items-center gap-3">
            <HugeiconsIcon icon={PhoneIcon} size={20} className="text-red-600" />
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Phone Calls</span>
              <p className="text-sm text-gray-500">Important event confirmations or VIP experiences (rare)</p>
            </div>
          </div>
          <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" />
        </label>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">How We Use Your Data for Marketing</h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>We analyze your event attendance and preferences to send relevant recommendations</li>
        <li>Your data helps us create lookalike audiences for targeted advertising</li>
        <li>We may share anonymized data with event organizers for marketing insights</li>
        <li>You can opt out of personalized ads through your account settings</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Your Privacy Choices</h3>
      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">🔒 We respect your privacy. You can:</p>
        <ul className="list-disc pl-6 space-y-1 text-sm text-blue-700 dark:text-blue-300">
          <li>Unsubscribe from marketing emails at any time by clicking "unsubscribe"</li>
          <li>Adjust notification preferences in account settings</li>
          <li>Opt out of SMS by replying "STOP" to any message</li>
          <li>Request deletion of your marketing profile</li>
          <li>Opt out of data sharing for advertising purposes</li>
        </ul>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Frequency of Communications</h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li><strong>Email:</strong> Maximum 4-6 emails per month</li>
        <li><strong>Push Notifications:</strong> 1-3 notifications per week</li>
        <li><strong>SMS:</strong> Maximum 2-3 texts per month (emergency updates only)</li>
        <li><strong>Phone Calls:</strong> Only for VIP events or critical confirmations</li>
      </ul>

      <div className="bg-pink-50 dark:bg-pink-950/30 p-4 rounded-lg mt-4">
        <p className="text-sm text-pink-800 dark:text-pink-300">
          🎁 <strong>Bonus:</strong> Subscribers receive a 10% discount on their first event ticket! Check your email after accepting.
        </p>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Third-Party Marketing Partners</h3>
      <p className="text-gray-600 dark:text-gray-400">
        We work with trusted partners to deliver marketing communications:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li><strong>SendGrid/Mailchimp:</strong> Email delivery services</li>
        <li><strong>Twilio:</strong> SMS notifications</li>
        <li><strong>Facebook/Google Ads:</strong> Targeted advertising (anonymized data)</li>
        <li><strong>Segment:</strong> Customer data platform for personalization</li>
      </ul>
    </div>
  )
}