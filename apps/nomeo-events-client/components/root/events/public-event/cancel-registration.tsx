"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Ticket01Icon as TicketIcon,
  Delete03Icon as TrashIcon,
  InformationCircleIcon as InfoIcon,
  Mail01Icon as MailIcon,
  Clock01Icon as ClockIcon,
} from "@hugeicons/core-free-icons";
import { EventCancellationModal } from "./event-cancellation-modal";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";

interface CancelRegistrationSectionProps {
  eventId: string;
  eventTitle?: string;
  /** Pass false to hide the section entirely */
  visible?: boolean;
  /** Hours before the event after which cancellation is no longer allowed. Default: 24 */
  cutoffHours?: number;
  /** Whether refunds are offered at all on this event */
  refundEnabled?: boolean;
  onSuccess?: () => void;
}

export function CancelRegistrationSection({ eventId, eventTitle, visible = true, cutoffHours = 24, refundEnabled = true, onSuccess }: CancelRegistrationSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!visible) return null;

  const params = useParams();

  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['events', 'slug', params.slug] });
    onSuccess?.();
  };

  return (
    <>
      {/* Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={TicketIcon} size={17} className="text-red-500 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                Already registered?
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                You can cancel your spot without logging in.
              </p>
            </div>
          </div>

          {/* Info pills */}
          <div className="flex flex-col gap-2 mb-5">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              <HugeiconsIcon icon={MailIcon} size={13} className="text-gray-400 shrink-0" />
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">
                We'll send a one-time code to the email you registered with to verify your identity.
              </p>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
              <HugeiconsIcon icon={ClockIcon} size={13} className="text-gray-400 shrink-0" />
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">
                Cancellations must be made at least{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {cutoffHours} hours
                </span>{" "}
                before the event starts.
              </p>
            </div>

            {refundEnabled && (
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/15 border border-green-100 dark:border-green-900/30">
                <HugeiconsIcon icon={InfoIcon} size={13} className="text-green-600 dark:text-green-400 shrink-0" />
                <p className="text-xs text-green-700 dark:text-green-400 leading-snug">
                  Eligible refunds are processed within{" "}
                  <span className="font-medium">5–7 business days</span>.
                </p>
              </div>
            )}
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
          >
            <HugeiconsIcon icon={TrashIcon} size={15} />
            Cancel my registration
          </button>

          {/* Fine print */}
          <p className="text-center text-[11px] text-gray-400 dark:text-gray-600 mt-3 leading-relaxed">
            Cancellations are permanent and cannot be undone.{" "}
            {!refundEnabled && "This event does not offer refunds."}
          </p>
        </div>
      </div>

      {/* Modal */}
      <EventCancellationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        eventId={eventId}
        eventTitle={eventTitle}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['events', 'slug', params.slug] });
          setModalOpen(false);
          handleSuccess
        }}
      />
    </>
  );
}