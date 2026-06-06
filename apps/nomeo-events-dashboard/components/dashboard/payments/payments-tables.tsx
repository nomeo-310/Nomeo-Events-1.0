// payments-tables.tsx
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CancelCircleIcon as XCircleIcon,
  MoreHorizontalCircle01Icon,
  ViewIcon,
  UnavailableIcon as BanIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { ActionDropdown, PaymentStatusBadge } from "./payments-components";
import { formatMoney, formatDate, channelLabels, getEventPaymentDetails, getSubscriptionPaymentDetails, getPaystackReference } from "./payments-types";
import type { Payment } from "@/hooks/use-payments";

interface TableActionsProps {
  payment: Payment;
  onView: (payment: Payment) => void;
  onRefund: (payment: Payment) => void;
}

function TableActions({ payment, onView, onRefund }: TableActionsProps) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onView(payment)}
        className="rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        title="View Details"
      >
        <HugeiconsIcon icon={ViewIcon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
      <ActionDropdown
        trigger={
          <button type="button" className="rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        }
        items={[
          { label: "View Details", icon: ViewIcon, onClick: () => onView(payment) },
          { divider: true, section: "Financial Actions" } as const,
          ...(payment.gatewayStatus === "success"
            ? [{ label: "Mark Refunded", icon: XCircleIcon, onClick: () => onRefund(payment), danger: true }]
            : [{ label: "Refund unavailable", icon: BanIcon, onClick: () => toast.info("Only successful payments can be refunded") }]),
        ]}
      />
    </div>
  );
}

interface EventPaymentsTableProps {
  payments: Payment[];
  selectedPayments: Set<string>;
  onSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onView: (payment: Payment) => void;
  onRefund: (payment: Payment) => void;
}

export function EventPaymentsTable({
  payments,
  selectedPayments,
  onSelectAll,
  onToggleSelect,
  onView,
  onRefund,
}: EventPaymentsTableProps) {
  return (
    <Table>
      <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
        <TableRow className="border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
          <TableHead className="w-12 pl-4">
            <Checkbox checked={selectedPayments.size === payments.length && payments.length > 0} onCheckedChange={onSelectAll} />
          </TableHead>
          <TableHead className="w-[21%]">Attendee</TableHead>
          <TableHead className="w-[15%]">Registration No.</TableHead>
          <TableHead className="w-[22%]">Event</TableHead>
          <TableHead className="w-[16%]">Paystack Ref</TableHead>
          <TableHead className="w-[10%]">Amount</TableHead>
          <TableHead className="w-[9%]">Status</TableHead>
          <TableHead className="w-[7%]">Created</TableHead>
          <TableHead className="w-16 text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => {
          const details = getEventPaymentDetails(payment);

          return (
            <TableRow
              key={payment._id}
              className={cn(
                "border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50",
                payment.gatewayStatus === "reversed" && "bg-red-50/30 dark:bg-red-900/10"
              )}
            >
              <TableCell className="pl-4">
                <Checkbox checked={selectedPayments.has(payment._id)} onCheckedChange={() => onToggleSelect(payment._id)} />
              </TableCell>
              <TableCell>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="bg-blue-600 text-white">
                    <AvatarFallback className="bg-blue-600 text-xs font-bold text-white">{details.attendeeInitials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{details.attendeeName}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{details.attendeeEmail}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{details.registrationNumber}</span>
              </TableCell>
              <TableCell>
                <p className="max-w-[180px] truncate text-sm font-medium text-gray-900 dark:text-white">{details.eventTitle}</p>
                {details.eventSlug && <p className="max-w-[180px] truncate text-[10px] text-gray-400">{details.eventSlug}</p>}
              </TableCell>
              <TableCell>
                <span className="inline-block max-w-[150px] truncate rounded-md bg-gray-100 px-1.5 py-0.5 align-middle font-mono text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  {getPaystackReference(payment)}
                </span>
              </TableCell>
              <TableCell>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{formatMoney(payment.amountPaid, payment.currency)}</p>
                {payment.discountAmount > 0 && (
                  <p className="mt-0.5 text-[10px] text-green-600 dark:text-green-400">
                    {formatMoney(payment.discountAmount, payment.currency)} off
                  </p>
                )}
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={payment.gatewayStatus} />
              </TableCell>
              <TableCell>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(payment.createdAt)}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{format(new Date(payment.createdAt), "HH:mm")}</p>
              </TableCell>
              <TableCell className="text-center">
                <TableActions payment={payment} onView={onView} onRefund={onRefund} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

interface SubscriptionPaymentsTableProps {
  payments: Payment[];
  selectedPayments: Set<string>;
  onSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onView: (payment: Payment) => void;
  onRefund: (payment: Payment) => void;
}

export function SubscriptionPaymentsTable({
  payments,
  selectedPayments,
  onSelectAll,
  onToggleSelect,
  onView,
  onRefund,
}: SubscriptionPaymentsTableProps) {
  return (
    <Table>
      <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
        <TableRow className="border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
          <TableHead className="w-12 pl-4">
            <Checkbox checked={selectedPayments.size === payments.length && payments.length > 0} onCheckedChange={onSelectAll} />
          </TableHead>
          <TableHead>Subscriber</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead>Interval</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Paystack Ref</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-16 text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => {
          const details = getSubscriptionPaymentDetails(payment);

          return (
            <TableRow
              key={payment._id}
              className={cn(
                "border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50",
                payment.gatewayStatus === "reversed" && "bg-red-50/30 dark:bg-red-900/10"
              )}
            >
              <TableCell className="pl-4">
                <Checkbox checked={selectedPayments.has(payment._id)} onCheckedChange={() => onToggleSelect(payment._id)} />
              </TableCell>
              <TableCell>
                <div className="flex min-w-[210px] items-center gap-3">
                  <Avatar>
                    {details.userImage && <AvatarImage src={details.userImage} alt={details.userName} />}
                    <AvatarFallback className="bg-blue-600 text-xs font-bold text-white">{details.userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{details.userName}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{details.userEmail}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <p className="max-w-[180px] truncate text-sm font-medium text-gray-900 dark:text-white">{details.planName}</p>
                <p className="text-[10px] capitalize text-gray-400">{details.subscriptionStatus}</p>
              </TableCell>
              <TableCell>
                <span className="text-xs font-semibold capitalize text-gray-700 dark:text-gray-300">{details.interval}</span>
              </TableCell>
              <TableCell>
                <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  {payment.reference}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{getPaystackReference(payment)}</span>
              </TableCell>
              <TableCell>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{formatMoney(payment.amountPaid, payment.currency)}</p>
                {payment.discountAmount > 0 && (
                  <p className="mt-0.5 text-[10px] text-green-600 dark:text-green-400">
                    {formatMoney(payment.discountAmount, payment.currency)} off
                  </p>
                )}
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={payment.gatewayStatus} />
              </TableCell>
              <TableCell>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{channelLabels[payment.channel ?? ""] ?? payment.channel ?? "N/A"}</p>
                {payment.cardLast4 && <p className="text-[10px] text-gray-400">**** {payment.cardLast4}</p>}
              </TableCell>
              <TableCell>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(payment.createdAt)}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{format(new Date(payment.createdAt), "HH:mm")}</p>
              </TableCell>
              <TableCell className="text-center">
                <TableActions payment={payment} onView={onView} onRefund={onRefund} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

import { format } from "date-fns";