// payments-modals.tsx
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReusableModal, ConfirmModal } from "@/components/ui/reusable-modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { DetailField, PaymentStatusBadge } from "./payments-components";
import { ModalContentSkeleton } from "./payments-skeletons";
import { formatMoney, formatDateTime, channelLabels, purposeLabels, getEventPaymentDetails, getSubscriptionPaymentDetails } from "./payments-types";
import type { Payment } from "@/hooks/use-payments";

interface EventPaymentModalDetailsProps {
  payment: Payment;
}

function EventPaymentModalDetails({ payment }: EventPaymentModalDetailsProps) {
  const details = getEventPaymentDetails(payment);
  const registration = payment.registrationId ?? {};

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Event Registration Details</h4>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800 md:col-span-2">
          <div className="flex items-center gap-3">
            <Avatar className="bg-blue-600 text-white">
              <AvatarFallback className="bg-blue-600 text-xs font-bold text-white">{details.attendeeInitials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{details.attendeeName}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{details.attendeeEmail}</p>
            </div>
          </div>
        </div>
        <DetailField label="Registration Number" value={details.registrationNumber} />
        <DetailField label="Event Name" value={details.eventTitle} />
        <DetailField label="Event Slug" value={details.eventSlug || "N/A"} />
        <DetailField label="Plan Name" value={typeof registration.planName === "string" ? registration.planName : "N/A"} />
        <DetailField label="Plan Type" value={typeof registration.planType === "string" ? registration.planType : "N/A"} />
        <DetailField label="Registration ID" value={typeof registration._id === "string" ? registration._id : "N/A"} />
      </div>
    </div>
  );
}

interface SubscriptionPaymentModalDetailsProps {
  payment: Payment;
}

function SubscriptionPaymentModalDetails({ payment }: SubscriptionPaymentModalDetailsProps) {
  const details = getSubscriptionPaymentDetails(payment);
  const subscription = payment.subscriptionId ?? {};
  const plan = payment.planId ?? {};

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Subscription Details</h4>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800 md:col-span-2">
          <div className="flex items-center gap-3">
            <Avatar>
              {details.userImage && <AvatarImage src={details.userImage} alt={details.userName} />}
              <AvatarFallback className="bg-blue-600 text-xs font-bold text-white">{details.userInitials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{details.userName}</p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{details.userEmail}</p>
            </div>
          </div>
        </div>
        <DetailField label="Plan Name" value={details.planName} />
        <DetailField label="Billing Interval" value={<span className="capitalize">{details.interval}</span>} />
        <DetailField label="Plan Tier" value={typeof plan.tier === "string" ? <span className="capitalize">{plan.tier}</span> : "N/A"} />
        <DetailField label="Plan Price" value={typeof plan.priceKobo === "number" ? formatMoney(plan.priceKobo, payment.currency) : "N/A"} />
        <DetailField label="Subscription Status" value={<span className="capitalize">{details.subscriptionStatus}</span>} />
        <DetailField label="Subscription ID" value={typeof subscription._id === "string" ? subscription._id : "N/A"} />
      </div>
    </div>
  );
}

interface ViewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  isLoading: boolean;
  hasCompleteData: boolean;
  eventBreakdownData?: any;
  eventPaymentHistoryData?: any;
  registrationPaymentData?: any;
  subscriptionHistoryData?: any;
  planPaymentsData?: any;
  onRefund: (payment: Payment) => void;
}

export function ViewPaymentModal({
  isOpen,
  onClose,
  payment,
  isLoading,
  hasCompleteData,
  eventBreakdownData,
  eventPaymentHistoryData,
  registrationPaymentData,
  subscriptionHistoryData,
  planPaymentsData,
  onRefund,
}: ViewPaymentModalProps) {
  if (!payment) return null;

  const detailPayment = payment;

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Details"
      description="Complete transaction information and related payment context"
      size="full"
      className="!max-w-5xl"
      actions={[
        { label: "Close", onClick: onClose, variant: "outline" },
        ...(detailPayment.gatewayStatus === "success" && !isLoading && hasCompleteData
          ? [{ label: "Mark Refunded", onClick: () => onRefund(detailPayment), variant: "danger" as const }]
          : []),
      ]}
    >
      {isLoading || !hasCompleteData ? (
        <ModalContentSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="flex items-start gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
            {detailPayment.purpose === "subscription" ? (
              (() => {
                const details = getSubscriptionPaymentDetails(detailPayment);
                return (
                  <>
                    <Avatar className="h-16 w-16 shadow-lg ring-4 ring-white dark:ring-gray-900">
                      {details.userImage && details.userImage !== "N/A" && (
                        <AvatarImage src={details.userImage} alt={details.userName} />
                      )}
                      <AvatarFallback className="bg-blue-600 text-sm font-bold text-white">
                        {details.userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatMoney(detailPayment.amountPaid, detailPayment.currency)}
                      </h3>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{details.userName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{details.userEmail}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <PaymentStatusBadge status={detailPayment.gatewayStatus} />
                        <Badge variant="secondary">{purposeLabels[detailPayment.purpose]}</Badge>
                        {detailPayment.channel && (
                          <Badge variant="outline">
                            {channelLabels[detailPayment.channel] ?? detailPayment.channel}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()
            ) : (
              (() => {
                const details = getEventPaymentDetails(detailPayment);
                return (
                  <>
                    <Avatar className="h-16 w-16 bg-blue-600 text-white shadow-lg ring-4 ring-white dark:ring-gray-900">
                      <AvatarFallback className="bg-blue-600 text-sm font-bold text-white">
                        {details.attendeeInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatMoney(detailPayment.amountPaid, detailPayment.currency)}
                      </h3>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{details.attendeeName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{details.eventTitle}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <PaymentStatusBadge status={detailPayment.gatewayStatus} />
                        <Badge variant="secondary">{purposeLabels[detailPayment.purpose]}</Badge>
                        {detailPayment.channel && (
                          <Badge variant="outline">
                            {channelLabels[detailPayment.channel] ?? detailPayment.channel}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Original Amount</p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{formatMoney(detailPayment.amount, detailPayment.currency)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Amount Paid</p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{formatMoney(detailPayment.amountPaid, detailPayment.currency)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Discount</p>
              <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">{formatMoney(detailPayment.discountAmount, detailPayment.currency)}</p>
              {detailPayment.couponCode && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Code: {detailPayment.couponCode}</p>}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Transaction Information</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailField label="Payment Reference" value={detailPayment.reference} />
              <DetailField label="Paystack Reference" value={detailPayment.paystackReference ?? "N/A"} />
              <DetailField label="Gateway Response" value={detailPayment.gatewayResponse ?? "N/A"} />
              <DetailField label="Paid At" value={formatDateTime(detailPayment.paidAt)} />
              <DetailField label="Created At" value={formatDateTime(detailPayment.createdAt)} />
              <DetailField 
                label="Card" 
                value={detailPayment.cardType || detailPayment.cardLast4
                  ? `${detailPayment.cardType ?? "Card"} ${detailPayment.cardLast4 ? `•••• ${detailPayment.cardLast4}` : ""}`
                  : "N/A"} 
              />
              <DetailField label="Bank" value={detailPayment.cardBank ?? "N/A"} />
              <DetailField label="Channel" value={channelLabels[detailPayment.channel ?? ""] ?? detailPayment.channel ?? "N/A"} />
            </div>
          </div>

          {detailPayment.purpose === "event_registration" ? (
            <EventPaymentModalDetails payment={detailPayment} />
          ) : (
            <SubscriptionPaymentModalDetails payment={detailPayment} />
          )}

          {detailPayment.refundedAt && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20">
              <h4 className="mb-3 text-sm font-semibold text-red-800 dark:text-red-300">Refund Information</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailField label="Refunded At" value={formatDateTime(detailPayment.refundedAt)} />
                <DetailField label="Refund Amount" value={formatMoney(detailPayment.refundAmount, detailPayment.currency)} />
                <DetailField label="Refund Reference" value={detailPayment.refundReference ?? "N/A"} />
                <DetailField label="Reason" value={detailPayment.refundReason ?? "N/A"} />
              </div>
            </div>
          )}
        </div>
      )}
    </ReusableModal>
  );
}

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  payment: Payment | null;
  isLoading: boolean;
  refundReason: string;
  setRefundReason: (value: string) => void;
  refundAmount: string;
  setRefundAmount: (value: string) => void;
  refundReference: string;
  setRefundReference: (value: string) => void;
}

export function RefundModal({
  isOpen,
  onClose,
  onConfirm,
  payment,
  isLoading,
  refundReason,
  setRefundReason,
  refundAmount,
  setRefundAmount,
  refundReference,
  setRefundReference,
}: RefundModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Mark Payment Refunded"
      description={`This will mark ${payment?.reference ?? "this payment"} as reversed in your database. Call Paystack separately if your backend has not wired that in yet.`}
      confirmLabel="Mark Refunded"
      cancelLabel="Cancel"
      confirmVariant="danger"
      isLoading={isLoading}
      size="md"
    >
      <div className="mt-4 space-y-4">
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Refund details</p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            Maximum refund amount: {formatMoney(payment?.amountPaid, payment?.currency)}.
          </p>
        </div>

        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason</Label>
          <Textarea
            placeholder="Enter the refund reason..."
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            className="mt-1.5 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            rows={3}
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Refund Amount (kobo)</Label>
          <Input
            type="number"
            min={1}
            max={payment?.amountPaid}
            placeholder="Leave blank for full refund"
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            className="mt-1.5 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Refund Reference</Label>
          <Input
            placeholder="Internal or Paystack refund ref"
            value={refundReference}
            onChange={(e) => setRefundReference(e.target.value)}
            className="mt-1.5 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>
    </ConfirmModal>
  );
}