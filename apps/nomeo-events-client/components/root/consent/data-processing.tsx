"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  DatabaseSyncIcon as DataflowIcon,
  Database01Icon,
  BrickWallShieldIcon as ShieldDataIcon,
  FolderTransferIcon as TransferIcon,
  CloudUploadIcon,
  CircleLock02Icon as LockIcon,
} from "@hugeicons/core-free-icons";


export const DataProcessingContent = () => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <p className="text-gray-600 dark:text-gray-400">
        This Data Processing Agreement ("DPA") outlines how <strong>Nomeo Events</strong> processes personal data on behalf of event organizers and attendees in compliance with applicable data protection laws including GDPR, CCPA, and other regulations.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={Database01Icon} size={20} className="text-indigo-600" />
        1. Categories of Personal Data Processed
      </h3>
      <p className="text-gray-600 dark:text-gray-400">We may process the following categories of personal data:</p>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li><strong>Identity Data:</strong> Full name, date of birth, government ID (for age-restricted events), profile photo</li>
        <li><strong>Contact Data:</strong> Email address, phone number, mailing address, emergency contact information</li>
        <li><strong>Event Data:</strong> Ticket purchases, event attendance history, seating preferences, dietary restrictions</li>
        <li><strong>Financial Data:</strong> Payment card details (processed by PCI-compliant third parties), billing address, transaction history</li>
        <li><strong>Technical Data:</strong> IP address, device information, browser type, login activity</li>
        <li><strong>Communication Data:</strong> Support tickets, chat messages, survey responses, event feedback</li>
        <li><strong>Marketing Data:</strong> Newsletter subscriptions, promotional preferences, event recommendations</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={ShieldDataIcon} size={20} className="text-indigo-600" />
        2. Purposes of Processing
      </h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>Event registration, ticketing, and check-in management</li>
        <li>Payment processing and fraud prevention</li>
        <li>Communication about events, updates, and changes</li>
        <li>Personalized event recommendations and content</li>
        <li>Analytics and platform improvement</li>
        <li>Legal compliance and dispute resolution</li>
        <li>Security monitoring and incident response</li>
        <li>Customer support and issue resolution</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={TransferIcon} size={20} className="text-indigo-600" />
        3. Data Processing Activities
      </h3>
      <div className="space-y-3 mt-2">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Collection</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Data is collected through account registration, event registration forms, ticket purchases, and platform interactions.</p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Storage</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Data is stored on secure servers with encryption at rest and in transit. Retention periods vary by data type.</p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Sharing</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Data is shared with event organizers, service providers, and as required by law.</p>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Deletion</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Users may request data deletion. Event-related data may be retained for legal and analytical purposes.</p>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={CloudUploadIcon} size={20} className="text-indigo-600" />
        4. Subprocessors & Third Parties
      </h3>
      <p className="text-gray-600 dark:text-gray-400">We engage the following categories of subprocessors to process data:</p>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li><strong>Cloud Hosting:</strong> AWS, Google Cloud (US/EU regions)</li>
        <li><strong>Payment Processing:</strong> Stripe, PayPal (PCI Level 1 certified)</li>
        <li><strong>Email Services:</strong> SendGrid, Mailchimp (for marketing communications)</li>
        <li><strong>Analytics:</strong> Google Analytics, Mixpanel (anonymous usage data)</li>
        <li><strong>Customer Support:</strong> Zendesk, Intercom (support tickets and chat)</li>
        <li><strong>Event Check-in:</strong> Third-party scanning and verification services</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={LockIcon} size={20} className="text-indigo-600" />
        5. Security Measures
      </h3>
      <p className="text-gray-600 dark:text-gray-400">We implement industry-standard security measures including:</p>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>End-to-end encryption for data in transit (TLS 1.3)</li>
        <li>AES-256 encryption for data at rest</li>
        <li>Regular security audits and penetration testing</li>
        <li>Multi-factor authentication for administrative access</li>
        <li>Access controls and least-privilege principles</li>
        <li>Automated backup and disaster recovery systems</li>
        <li>24/7 security monitoring and incident response team</li>
        <li>Employee background checks and data protection training</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">6. International Data Transfers</h3>
      <p className="text-gray-600 dark:text-gray-400">
        Your data may be transferred to and processed in countries outside your residence. We ensure appropriate safeguards such as:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>EU-US Data Privacy Framework certification</li>
        <li>Standard Contractual Clauses (SCCs) with subprocessors</li>
        <li>Binding Corporate Rules where applicable</li>
        <li>Data localization options for EU customers</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">7. Data Subject Rights</h3>
      <p className="text-gray-600 dark:text-gray-400">Under data protection laws, you have the following rights:</p>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
        <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
        <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
        <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
        <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
        <li><strong>Right to Object:</strong> Object to certain processing activities</li>
        <li><strong>Rights Related to Automated Decision-Making:</strong> Not be subject to solely automated decisions</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">8. Data Breach Notification</h3>
      <p className="text-gray-600 dark:text-gray-400">
        In the event of a data breach affecting your personal information, we will:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>Notify affected users within 72 hours of discovery (GDPR requirement)</li>
        <li>Provide details about the breach and potential impact</li>
        <li>Recommend mitigation steps</li>
        <li>Report to relevant supervisory authorities as required</li>
        <li>Conduct a thorough investigation and implement preventive measures</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">9. Data Retention Schedule</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800">
              <th className="px-4 py-2 text-left text-sm font-semibold">Data Type</th>
              <th className="px-4 py-2 text-left text-sm font-semibold">Retention Period</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <tr><td className="px-4 py-2 text-sm">Account Information</td><td className="px-4 py-2 text-sm">Until account deletion + 30 days</td></tr>
            <tr><td className="px-4 py-2 text-sm">Event Registration Data</td><td className="px-4 py-2 text-sm">5 years (for historical/analytical purposes)</td></tr>
            <tr><td className="px-4 py-2 text-sm">Payment Transactions</td><td className="px-4 py-2 text-sm">7 years (legal/tax requirements)</td></tr>
            <tr><td className="px-4 py-2 text-sm">Communication Logs</td><td className="px-4 py-2 text-sm">2 years</td></tr>
            <tr><td className="px-4 py-2 text-sm">Analytics Data</td><td className="px-4 py-2 text-sm">26 months (anonymized after 14 months)</td></tr>
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">10. Compliance Certifications</h3>
      <div className="flex flex-wrap gap-2 mt-2">
        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">GDPR Compliant</span>
        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">CCPA Ready</span>
        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm">PCI DSS Level 1</span>
        <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm">ISO 27001 Certified</span>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">11. Contact & DPO Information</h3>
      <p className="text-gray-600 dark:text-gray-400">
        For data processing inquiries or to exercise your rights, contact our Data Protection Officer:
      </p>
      <ul className="list-none space-y-1 text-gray-600 dark:text-gray-400 mt-2">
        <li>📧 dpo@nomeoevents.com</li>
        <li>📞 +1 (555) 123-4567 (ext. 801)</li>
        <li>📍 Data Protection Office, 123 Event Plaza, San Francisco, CA 94105</li>
        <li>🌐 https://nomeoevents.com/privacy/dpo</li>
      </ul>

      <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg mt-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          ⚖️ <strong>Legal Basis for Processing:</strong> We process your data based on contract performance (event registration), legal obligations (tax records), legitimate interests (platform security), and consent (marketing).
        </p>
      </div>
    </div>
  )
}