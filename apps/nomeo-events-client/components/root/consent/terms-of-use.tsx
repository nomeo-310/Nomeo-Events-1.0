"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Pdf02Icon as FilePdfIcon,
  JusticeScale02Icon as ScaleIcon,
  UserGroupIcon,
  Ticket01Icon,
  Money01Icon,
} from "@hugeicons/core-free-icons";


export const TermsOfUseContent = () => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <p className="text-gray-600 dark:text-gray-400">
        Welcome to <strong>Nomeo Events</strong>! These Terms of Use govern your access to and use of our event management platform, website, and services. By using our platform, you agree to be bound by these terms.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={ScaleIcon} size={20} className="text-indigo-600" />
        1. Acceptance of Terms
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        By registering for, accessing, or using the Nomeo Events platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use, our Privacy Policy, and any additional terms that may apply to specific features or events.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={UserGroupIcon} size={20} className="text-indigo-600" />
        2. Account Registration & Responsibilities
      </h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>You must be at least 18 years old to create an account or use our services.</li>
        <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
        <li>You agree to provide accurate, current, and complete information during registration.</li>
        <li>You are solely responsible for all activities that occur under your account.</li>
        <li>Notify us immediately of any unauthorized use of your account.</li>
        <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={Ticket01Icon} size={20} className="text-indigo-600" />
        3. Event Listings & Ticket Purchases
      </h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li><strong>Event Accuracy:</strong> Event organizers are responsible for the accuracy of their event listings, including dates, times, locations, and descriptions.</li>
        <li><strong>Ticket Purchases:</strong> All ticket sales are final unless otherwise stated by the event organizer.</li>
        <li><strong>Refund Policy:</strong> Refunds are handled by individual event organizers according to their stated policies.</li>
        <li><strong>Ticket Transferability:</strong> Tickets may be transferable unless specified otherwise by the organizer.</li>
        <li><strong>Event Cancellations:</strong> If an event is canceled, you may be eligible for a refund as determined by the organizer.</li>
        <li><strong>Code of Conduct:</strong> Attendees must adhere to the event organizer's code of conduct and venue rules.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={Money01Icon} size={20} className="text-indigo-600" />
        4. Payment & Fees
      </h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li><strong>Service Fees:</strong> We may charge service fees for ticket purchases and event listings.</li>
        <li><strong>Payment Processing:</strong> All payments are processed through secure third-party payment processors.</li>
        <li><strong>Taxes:</strong> You are responsible for any applicable taxes associated with your purchases.</li>
        <li><strong>Chargebacks:</strong> Unauthorized chargebacks may result in account suspension.</li>
        <li><strong>Pricing:</strong> Prices are displayed in your local currency and may include applicable fees.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">5. Organizer Responsibilities</h3>
      <p className="text-gray-600 dark:text-gray-400">If you create or manage events on our platform, you agree to:</p>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>Provide accurate and complete event information.</li>
        <li>Comply with all applicable laws and regulations.</li>
        <li>Handle attendee communications and support in a timely manner.</li>
        <li>Process refunds according to your stated policy.</li>
        <li>Not sell counterfeit tickets or misrepresent events.</li>
        <li>Maintain appropriate insurance and permits for your events.</li>
        <li>Respect attendee privacy and data protection rights.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">6. Prohibited Activities</h3>
      <p className="text-gray-600 dark:text-gray-400">You may not use our platform for:</p>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>Illegal activities or events promoting violence, discrimination, or harm.</li>
        <li>Spam, phishing, or fraudulent schemes.</li>
        <li>Scraping, crawling, or extracting data without permission.</li>
        <li>Interfering with platform security or performance.</li>
        <li>Impersonating others or providing false information.</li>
        <li>Reselling tickets at excessive prices (scalping).</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">7. Intellectual Property</h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li><strong>Our IP:</strong> The Nomeo Events platform, including its design, logos, and code, is owned by us and protected by copyright laws.</li>
        <li><strong>User Content:</strong> You retain ownership of content you post, but grant us a license to display and distribute it on our platform.</li>
        <li><strong>Event Content:</strong> Event organizers are responsible for ensuring they have rights to all content shared through our platform.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">8. Liability Disclaimer</h3>
      <p className="text-gray-600 dark:text-gray-400">
        Nomeo Events is a platform connecting event organizers and attendees. We are not responsible for:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>The quality, safety, or legality of events listed on our platform.</li>
        <li>Actions or omissions of event organizers or attendees.</li>
        <li>Technical issues, service interruptions, or data loss.</li>
        <li>Third-party websites or services linked from our platform.</li>
      </ul>
      <p className="text-gray-600 dark:text-gray-400 mt-2">
        OUR SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL LIABILITY FOR ANY DAMAGES ARISING FROM YOUR USE OF OUR PLATFORM.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">9. Termination</h3>
      <p className="text-gray-600 dark:text-gray-400">
        We may suspend or terminate your access to our platform at any time for violations of these terms, fraudulent activity, or any reason we deem necessary. You may delete your account at any time through your account settings.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">10. Dispute Resolution</h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li><strong>Governing Law:</strong> These terms are governed by the laws of California.</li>
        <li><strong>Arbitration:</strong> Disputes will be resolved through binding arbitration rather than court.</li>
        <li><strong>Class Action Waiver:</strong> You agree to resolve disputes individually and waive the right to class actions.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">11. Changes to Terms</h3>
      <p className="text-gray-600 dark:text-gray-400">
        We may modify these terms at any time. Continued use of our platform after changes constitutes acceptance of the modified terms. Material changes will be notified via email or platform notification.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">12. Contact Information</h3>
      <p className="text-gray-600 dark:text-gray-400">
        Questions about these Terms of Use? Contact us at:
      </p>
      <ul className="list-none space-y-1 text-gray-600 dark:text-gray-400 mt-2">
        <li>📧 legal@nomeoevents.com</li>
        <li>📞 +1 (555) 123-4567</li>
        <li>📍 123 Event Plaza, San Francisco, CA 94105</li>
      </ul>
    </div>
  )
}