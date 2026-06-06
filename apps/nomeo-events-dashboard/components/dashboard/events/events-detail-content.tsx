// events-detail-content.tsx
import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  StarIcon,
  MoreHorizontalCircle01Icon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  ClockIcon,
  LockIcon,
  GlobalIcon,
  Archive01Icon,
  CancelCircleIcon as XCircleIcon,
  CertificateIcon,
  CheckListIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaginationWithInfo } from "@/components/ui/pagination";

import {
  DetailField,
  StatCard,
  ActionDropdown,
  EventStatusBadge,
  RegistrationFilters,
} from "./events-components";
import { ModalSkeleton, SkeletonLine } from "./events-skeletons";
import { formatMoney, formatDateTime, modeTone, categoryColors } from "./events-types";
import type { AdminEventDetail, AdminRegistrationRow } from "@/hooks/use-events";

export function EventDetailContent({ detail, isLoading, registrations, regsLoading, regsPagination, regsPage, onRegsPageChange, onAction, actionLoading }: {
  detail: AdminEventDetail | null; isLoading: boolean;
  registrations: AdminRegistrationRow[]; regsLoading: boolean; regsPagination: any; regsPage: number;
  onRegsPageChange: (p: number) => void; onAction: (a: string, b?: Record<string, unknown>) => void; actionLoading: boolean;
}) {
  const [registrationSearch, setRegistrationSearch] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState("all");

  const filteredRegistrations = useMemo(() => {
    let filtered = registrations;
    if (registrationSearch) {
      const searchLower = registrationSearch.toLowerCase();
      filtered = filtered.filter(reg =>
        reg.attendeeName?.toLowerCase().includes(searchLower) ||
        reg.attendeeEmail?.toLowerCase().includes(searchLower) ||
        reg.registrationNumber?.toLowerCase().includes(searchLower)
      );
    }
    if (registrationStatus !== "all") {
      filtered = filtered.filter(reg => reg.status === registrationStatus);
    }
    return filtered;
  }, [registrations, registrationSearch, registrationStatus]);

  const statusTone: Record<string, "secondary" | "destructive" | "outline" | "default" | "link" | "ghost" | undefined> = {
    pending: "secondary",
    confirmed: "default",
    attended: "secondary",
    cancelled: "destructive",
    waitlisted: "outline",
  };

  if (isLoading || !detail) return <ModalSkeleton />;

  const event = detail.event;
  const stats = detail.statistics;
  const organizer = event.organizerId as any;
  const bannerImage = (event as any).banner?.secure_url ?? (event as any).coverImage ?? (event as any).image ?? null;
  const shortDescription = (event as any).shortDescription ?? (event as any).summary ?? null;

  return (
    <div className="space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto px-1">
      {/* Banner image */}
      {bannerImage && (
        <div className="-mx-6 -mt-2">
          <img src={bannerImage} alt={event.title} className="h-32 lg:h-60 w-full object-cover sm:h-40" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-3 dark:border-gray-800 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{event.title}</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">{event.slug}</p>
          {shortDescription && (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{shortDescription}</p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <EventStatusBadge status={event.status} />
            <Badge variant={modeTone[event.eventMode] ?? "outline"} className="capitalize text-xs">{event.eventMode}</Badge>
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize", categoryColors[event.category] ?? "bg-gray-100 text-gray-700")}>
              {event.category?.replace(/_/g, " ")}
            </span>
            {event.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <HugeiconsIcon icon={StarIcon} size={10} /> Featured
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {event.status === "draft" && (
            <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => onAction("publish")} disabled={actionLoading}>
              <HugeiconsIcon icon={CheckCircleIcon} className="mr-1 h-3 w-3" /> Publish
            </Button>
          )}
          <ActionDropdown
            trigger={
              <Button size="sm" variant="outline" className="h-7 text-xs dark:border-gray-700" disabled={actionLoading}>
                <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="mr-1 h-3 w-3" /> Actions
              </Button>
            }
            items={[
              event.status === "published" && { label: "Unpublish", icon: ClockIcon, onClick: () => onAction("unpublish") },
              { divider: true, section: "Visibility" } as const,
              event.featured ? { label: "Unfeature", icon: StarIcon, onClick: () => onAction("unfeature") } : { label: "Feature", icon: StarIcon, onClick: () => onAction("feature") },
              event.isPublic ? { label: "Make Private", icon: LockIcon, onClick: () => onAction("make-private") } : { label: "Make Public", icon: GlobalIcon, onClick: () => onAction("make-public") },
              { divider: true, section: "Registrations" } as const,
              { label: "Confirm All Pending", icon: CheckListIcon, onClick: () => onAction("confirm-all-registrations") },
              { label: "Issue All Certificates", icon: CertificateIcon, onClick: () => onAction("issue-all-certificates") },
              { divider: true, section: "Danger" } as const,
              { label: "Cancel Event", icon: XCircleIcon, onClick: () => onAction("cancel"), danger: true },
              { label: "Archive Event", icon: Archive01Icon, onClick: () => onAction("archive"), danger: true },
            ].filter(Boolean) as any}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Projected" value={formatMoney(stats.revenue.projected)} />
        <StatCard label="Confirmed" value={formatMoney(stats.revenue.confirmed)} accent="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Refunded" value={formatMoney(stats.revenue.refunded)} accent="text-red-600 dark:text-red-400" />
        <StatCard label="Registrations" value={stats.totals.registrations} sub={`${stats.byStatus.confirmed.count} confirmed`} />
      </div>

      {/* Registration breakdown pills */}
      <div className="flex flex-wrap gap-1.5">
        {([
          ["Pending", stats.byStatus.pending.count, "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"],
          ["Confirmed", stats.byStatus.confirmed.count, "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"],
          ["Attended", stats.byStatus.attended.count, "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"],
          ["Cancelled", stats.byStatus.cancelled.count, "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"],
          ["Waitlisted", stats.byStatus.waitlisted.count, "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"],
        ] as [string, number, string][]).map(([label, count, color]) => (
          <span key={label} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", color)}>
            {label}: <span className="font-bold">{count}</span>
          </span>
        ))}
      </div>

      {/* Organizer */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-800/50">
        <p className="text-[10px] text-gray-500 dark:text-gray-400">Organizer</p>
        <p className="text-xs font-medium text-gray-900 dark:text-white">{organizer?.name ?? "N/A"}</p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">{organizer?.email ?? "N/A"}</p>
      </div>

      {/* Event details */}
      <div className="grid grid-cols-2 gap-2">
        <DetailField label="Start" value={formatDateTime(event.startDate)} />
        <DetailField label="End" value={formatDateTime(event.endDate)} />
        <DetailField label="Seats" value={`${event.availableSeats}/${event.totalSeats}`} />
        <DetailField label="Waitlist" value={(event as any).waitlistEnabled ? "Enabled" : "Disabled"} />
      </div>

      {/* Registrations section */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Registrations</h4>
          {regsPagination?.total > 0 && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {filteredRegistrations.length} of {regsPagination.total}
            </span>
          )}
        </div>

        <RegistrationFilters
          search={registrationSearch}
          onSearchChange={setRegistrationSearch}
          status={registrationStatus}
          onStatusChange={setRegistrationStatus}
        />

        {regsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <SkeletonLine key={i} className="h-10 rounded-lg" />)}
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 py-6 text-center text-xs text-gray-400 dark:border-gray-700">
            {registrationSearch || registrationStatus !== "all" ? "No registrations match your filters" : "No registrations yet"}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500">Attendee</th>
                    <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500">Reg No.</th>
                    <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500">Plan</th>
                    <th className="px-2 py-1.5 text-right text-[10px] font-medium text-gray-500">Amount</th>
                    <th className="px-2 py-1.5 text-left text-[10px] font-medium text-gray-500">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-2 py-1.5">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-gray-900 dark:text-white max-w-[120px]">{reg.attendeeName}</p>
                          <p className="truncate text-[9px] text-gray-400 max-w-[120px]">{reg.attendeeEmail}</p>
                        </div>
                       </td>
                      <td className="px-2 py-1.5">
                        <span className="font-mono text-[9px] text-gray-500 dark:text-gray-400">{reg.registrationNumber}</span>
                       </td>
                      <td className="px-2 py-1.5">
                        <span className="text-[10px] capitalize text-gray-600 dark:text-gray-400">{reg.planName || reg.planType}</span>
                       </td>
                      <td className="px-2 py-1.5 text-right">
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">{formatMoney(reg.price)}</span>
                       </td>
                      <td className="px-2 py-1.5">
                        <Badge variant={statusTone[reg.status] ?? "secondary"} className="capitalize text-[9px] px-1 py-0">
                          {reg.status}
                        </Badge>
                       </td>
                     </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {regsPagination && regsPagination.totalPages > 1 && (
              <div className="mt-3">
                <PaginationWithInfo
                  currentPage={regsPage}
                  totalPages={regsPagination.totalPages}
                  totalItems={regsPagination.total}
                  itemsPerPage={regsPagination.limit}
                  onPageChange={(p) => {
                    onRegsPageChange(p);
                    setRegistrationSearch("");
                    setRegistrationStatus("all");
                  }}
                  showInfo
                  showPageNumbers
                  maxVisiblePages={3}
                  className="text-xs"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}