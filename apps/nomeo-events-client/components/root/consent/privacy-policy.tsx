"use client";


import { HugeiconsIcon } from "@hugeicons/react";
import {
  Shield01Icon,
  CircleLock01Icon as LockIcon,
  UserShield01Icon,
  DatabaseSyncIcon as DataflowIcon,
  CookieIcon,
} from "@hugeicons/core-free-icons";


export const PrivacyPolicyContent = () => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <p className="text-gray-600 dark:text-gray-400">
        At <strong>Nomeo Events</strong>, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our event management platform.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={LockIcon} size={20} className="text-indigo-600" />
        Information We Collect
      </h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li><strong>Personal Information:</strong> Name, email address, phone number, and billing information when you register for events or create an account.</li>
        <li><strong>Event Data:</strong> Information about events you create, attend, or show interest in, including preferences and feedback.</li>
        <li><strong>Technical Data:</strong> IP address, browser type, device information, and usage patterns when interacting with our platform.</li>
        <li><strong>Payment Information:</strong> Transaction details for event tickets or services (payment processing is handled by secure third-party providers).</li>
        <li><strong>Communications:</strong> Messages, inquiries, and support requests you send to us or other users.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={DataflowIcon} size={20} className="text-indigo-600" />
        How We Use Your Information
      </h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>To facilitate event registration, ticketing, and check-in processes.</li>
        <li>To personalize your event recommendations and notifications.</li>
        <li>To process payments and prevent fraudulent transactions.</li>
        <li>To communicate important updates about events you're attending or organizing.</li>
        <li>To improve our platform, analyze trends, and enhance user experience.</li>
        <li>To comply with legal obligations and enforce our terms of service.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={UserShield01Icon} size={20} className="text-indigo-600" />
        Information Sharing & Disclosure
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        We do not sell your personal information. We may share your information in the following circumstances:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li><strong>Event Organizers:</strong> When you register for an event, your information is shared with the event organizer for coordination purposes.</li>
        <li><strong>Service Providers:</strong> Third-party vendors who assist with payment processing, email delivery, analytics, and customer support.</li>
        <li><strong>Legal Requirements:</strong> When required by law or to protect our rights, property, or safety.</li>
        <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={CookieIcon} size={20} className="text-indigo-600" />
        Cookies & Tracking Technologies
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        We use cookies and similar tracking technologies to enhance your experience, analyze platform usage, and personalize content. You can control cookie preferences through your browser settings. For more details, please review our <button onClick={() => {}} className="text-indigo-600 dark:text-indigo-400 hover:underline">Cookie Policy</button>.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Your Rights & Choices</h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li><strong>Access & Portability:</strong> Request a copy of your personal data.</li>
        <li><strong>Correction:</strong> Update or correct inaccurate information.</li>
        <li><strong>Deletion:</strong> Request deletion of your account and associated data.</li>
        <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications.</li>
        <li><strong>Cookie Preferences:</strong> Manage cookie settings through our consent manager.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Data Security</h3>
      <p className="text-gray-600 dark:text-gray-400">
        We implement industry-standard security measures including encryption, access controls, and regular security audits to protect your information. However, no method of transmission over the internet is 100% secure.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Data Retention</h3>
      <p className="text-gray-600 dark:text-gray-400">
        We retain your information for as long as your account is active or as needed to provide services. Event-related data may be retained longer for historical and analytical purposes. You may request deletion of your data at any time.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Children's Privacy</h3>
      <p className="text-gray-600 dark:text-gray-400">
        Our platform is not directed to children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">International Data Transfers</h3>
      <p className="text-gray-600 dark:text-gray-400">
        Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Updates to This Policy</h3>
      <p className="text-gray-600 dark:text-gray-400">
        We may update this Privacy Policy periodically. We will notify you of significant changes via email or through a notice on our platform. The "Last Updated" date at the top indicates when changes were made.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">Contact Us</h3>
      <p className="text-gray-600 dark:text-gray-400">
        If you have questions about this Privacy Policy or our data practices, please contact us at:
      </p>
      <ul className="list-none space-y-1 text-gray-600 dark:text-gray-400 mt-2">
        <li>📧 privacy@nomeoevents.com</li>
        <li>📞 +1 (555) 123-4567</li>
        <li>📍 123 Event Plaza, San Francisco, CA 94105</li>
      </ul>
    </div>
  )
}