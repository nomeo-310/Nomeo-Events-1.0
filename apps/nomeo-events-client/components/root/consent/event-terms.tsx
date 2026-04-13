"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Ticket01Icon,
  CalendarIcon,
  Money01Icon,
  UserGroupIcon,
  CameraIcon,
  Shield01Icon,
  Alert01Icon as AlertTriangleIcon,
  ReverseWithdrawal02Icon as RefundIcon,
} from "@hugeicons/core-free-icons";
import { ConsentModalProps } from "@/types/consent-type";


export const EventTermsContent = () => {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg mb-4">
        <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2">
          <HugeiconsIcon icon={AlertTriangleIcon} size={18} className="flex-shrink-0 mt-0.5" />
          <span>Please read these terms carefully before purchasing tickets or attending this event.</span>
        </p>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={Ticket01Icon} size={20} className="text-green-600" />
        1. Ticket Purchase & Entry
      </h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>All ticket sales are final unless the event is canceled by the organizer.</li>
        <li>Tickets are non-transferable unless specified otherwise by the event organizer.</li>
        <li>You must present a valid ticket (digital or printed) for entry.</li>
        <li>QR codes will be scanned upon entry - each code can only be used once.</li>
        <li>Lost or stolen tickets will not be replaced or refunded.</li>
        <li>Entry may be refused if you violate venue policies or event terms.</li>
        <li>Event organizers reserve the right to refuse entry or remove attendees for any reason.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={Money01Icon} size={20} className="text-green-600" />
        2. Refund & Cancellation Policy
      </h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li><strong>Event Cancellation:</strong> Full refund if event is canceled by organizer.</li>
        <li><strong>Event Postponement:</strong> Tickets valid for rescheduled date; refunds available within 14 days.</li>
        <li><strong>Attendee Cancellation:</strong> No refunds for attendee-initiated cancellations unless specified.</li>
        <li><strong>Force Majeure:</strong> No refunds for events canceled due to circumstances beyond control (weather, natural disasters, government restrictions).</li>
        <li>Processing fees are non-refundable.</li>
        <li>Refunds will be processed to original payment method within 5-10 business days.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={CalendarIcon} size={20} className="text-green-600" />
        3. Event Schedule & Changes
      </h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>Event dates, times, and lineup are subject to change without notice.</li>
        <li>We will notify ticket holders of significant changes via email.</li>
        <li>Arrive early - late entry may be restricted.</li>
        <li>Schedule times are approximate and may vary.</li>
        <li>Performers/speakers may be substituted without prior notice.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={UserGroupIcon} size={20} className="text-green-600" />
        4. Code of Conduct
      </h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>Treat all attendees, staff, and performers with respect.</li>
        <li>Harassment, discrimination, or disruptive behavior will result in immediate removal without refund.</li>
        <li>Follow all venue rules and staff instructions.</li>
        <li>No fighting, violence, or aggressive behavior.</li>
        <li>No unauthorized sales, solicitation, or distribution of materials.</li>
        <li>No political campaigning or religious proselytizing.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={CameraIcon} size={20} className="text-green-600" />
        5. Photography & Recording
      </h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>Professional cameras and recording equipment may be restricted.</li>
        <li>Flash photography may be prohibited.</li>
        <li>By attending, you consent to being photographed/filmed for promotional purposes.</li>
        <li>Do not block views of other attendees with recording devices.</li>
        <li>Live streaming is prohibited without explicit permission.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={Shield01Icon} size={20} className="text-green-600" />
        6. Health & Safety
      </h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>Follow all health and safety guidelines posted at the venue.</li>
        <li>Do not attend if you are feeling unwell or have COVID-19 symptoms.</li>
        <li>Venue may require masks or proof of vaccination/testing (check event details).</li>
        <li>Emergency exits and pathways must remain clear at all times.</li>
        <li>First aid stations are available - seek help if needed.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={AlertTriangleIcon} size={20} className="text-green-600" />
        7. Prohibited Items
      </h3>
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">❌ Not Allowed</h4>
          <ul className="list-disc pl-4 text-sm space-y-1 text-gray-600 dark:text-gray-400">
            <li>Weapons of any kind</li>
            <li>Illegal substances</li>
            <li>Outside food & drinks</li>
            <li>Glass containers</li>
            <li>Large bags/backpacks</li>
            <li>Laser pointers</li>
            <li>Selfie sticks</li>
            <li>Drones</li>
          </ul>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">✅ Allowed</h4>
          <ul className="list-disc pl-4 text-sm space-y-1 text-gray-600 dark:text-gray-400">
            <li>Small purses/clutches</li>
            <li>Cell phones</li>
            <li>Service animals</li>
            <li>Medical supplies</li>
            <li>Sunscreen</li>
            <li>Empty water bottles</li>
            <li>Ear plugs</li>
          </ul>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3 flex items-center gap-2">
        <HugeiconsIcon icon={RefundIcon} size={20} className="text-green-600" />
        8. Liability Waiver
      </h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>Attend events at your own risk.</li>
        <li>Event organizers are not liable for personal injury, loss, or damage to property.</li>
        <li>You assume all risks associated with attendance, including COVID-19 exposure.</li>
        <li>Parking is at owner's risk - not responsible for theft or damage.</li>
        <li>Liability limited to ticket price (maximum liability).</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">9. Accessibility</h3>
      <p className="text-gray-600 dark:text-gray-400">
        We strive to make events accessible to all. For accommodation requests (wheelchair access, sign language interpretation, etc.), please contact the event organizer at least 7 days before the event.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">10. Age Restrictions</h3>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>Age requirements vary by event - check event details.</li>
        <li>Valid government ID required for age-restricted events.</li>
        <li>No refunds for attendees denied entry due to age requirements.</li>
        <li>Minors must be accompanied by parent/guardian where required.</li>
      </ul>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">11. Weather Policy</h3>
      <p className="text-gray-600 dark:text-gray-400">
        Outdoor events may proceed rain or shine. In case of severe weather (lightning, hurricanes, etc.), the event may be delayed, relocated, or canceled. No refunds for weather-related cancellations unless the event is fully canceled.
      </p>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">12. Privacy & Data Collection</h3>
      <p className="text-gray-600 dark:text-gray-400">
        We collect attendee information for event management purposes. Your information may be shared with:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-600 dark:text-gray-400">
        <li>Event organizers for check-in and communication</li>
        <li>Venue staff for security and logistics</li>
        <li>Emergency services if required</li>
        <li>Sponsors only with explicit consent</li>
      </ul>

      <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg mt-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
          <HugeiconsIcon icon={AlertTriangleIcon} size={18} className="flex-shrink-0" />
          <span>By purchasing a ticket or attending this event, you agree to all terms and conditions stated above.</span>
        </p>
      </div>
    </div>
  )
}