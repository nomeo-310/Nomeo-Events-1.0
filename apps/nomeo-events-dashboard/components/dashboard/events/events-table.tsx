// events-table.tsx
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
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalCircle01Icon,
  ViewIcon,
  StarIcon,
  GlobalIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
  ClockIcon,
  Archive01Icon,
  Delete01Icon,
  ArrowReloadHorizontalIcon,
  LockIcon,
} from "@hugeicons/core-free-icons";

import { ActionDropdown, EventStatusBadge } from "./events-components";
import { getGroupingLabel, formatMoney, formatDate, groupingTone, modeTone, categoryColors } from "./events-types";
import type { AdminEventRow } from "@/hooks/use-events";

function EventTableActions({ event, onView, onQuickAction }: {
  event: AdminEventRow; onView: (e: AdminEventRow) => void; onQuickAction: (e: AdminEventRow, a: string) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button type="button" onClick={() => onView(event)} className="rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800" title="View">
        <HugeiconsIcon icon={ViewIcon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>
      <ActionDropdown
        trigger={
          <button type="button" className="rounded-md p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        }
        items={[
          { label: "View Details", icon: ViewIcon, onClick: () => onView(event) },
          { divider: true, section: "Status" } as const,
          ...(event.status === "draft" ? [{ label: "Publish", icon: CheckCircleIcon, onClick: () => onQuickAction(event, "publish") }] : []),
          ...(event.status === "published" ? [{ label: "Unpublish", icon: ClockIcon, onClick: () => onQuickAction(event, "unpublish") }] : []),
          ...(event.isDeleted ? [{ label: "Restore", icon: ArrowReloadHorizontalIcon, onClick: () => onQuickAction(event, "restore") }] : []),
          { divider: true, section: "Visibility" } as const,
          event.featured
            ? { label: "Unfeature", icon: StarIcon, onClick: () => onQuickAction(event, "unfeature") }
            : { label: "Feature", icon: StarIcon, onClick: () => onQuickAction(event, "feature") },
          event.isPublic
            ? { label: "Make Private", icon: LockIcon, onClick: () => onQuickAction(event, "make-private") }
            : { label: "Make Public", icon: GlobalIcon, onClick: () => onQuickAction(event, "make-public") },
          { divider: true, section: "Danger" } as const,
          ...(!event.isArchived ? [{ label: "Archive", icon: Archive01Icon, onClick: () => onQuickAction(event, "archive"), danger: true }] : []),
          ...(!event.isDeleted ? [{ label: "Delete", icon: Delete01Icon, onClick: () => onQuickAction(event, "soft-delete"), danger: true }] : []),
        ]}
      />
    </div>
  );
}

export function EventsTable({ events, selectedEvents, onSelectAll, onToggleSelect, onView, onQuickAction }: {
  events: AdminEventRow[]; selectedEvents: Set<string>;
  onSelectAll: () => void; onToggleSelect: (id: string) => void;
  onView: (e: AdminEventRow) => void; onQuickAction: (e: AdminEventRow, a: string) => void;
}) {
  return (
    <Table>
      <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
        <TableRow className="border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
          <TableHead className="w-12 pl-4">
            <Checkbox checked={selectedEvents.size === events.length && events.length > 0} onCheckedChange={onSelectAll} />
          </TableHead>
          <TableHead className="w-[28%]">Event</TableHead>
          <TableHead className="w-[10%]">Category</TableHead>
          <TableHead className="w-[9%]">Status</TableHead>
          <TableHead className="w-[8%]">Mode</TableHead>
          <TableHead className="w-[9%]">Seats</TableHead>
          <TableHead className="w-[12%]">Revenue</TableHead>
          <TableHead className="w-[10%]">Organizer</TableHead>
          <TableHead className="w-[8%]">Starts</TableHead>
          <TableHead className="w-16 text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => {
          const grouping = getGroupingLabel(event.startDate, event.endDate);
          const stats = event.registrationStats;
          return (
            <TableRow key={event._id}
              className={cn("border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50",
                event.isDeleted && "opacity-50", event.isArchived && "bg-amber-50/30 dark:bg-amber-900/10")}>
              <TableCell className="pl-4">
                <Checkbox checked={selectedEvents.has(event._id)} onCheckedChange={() => onToggleSelect(event._id)} />
              </TableCell>
              <TableCell>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{event.title}</p>
                  <p className="truncate text-xs text-gray-400 dark:text-gray-500">{event.slug}</p>
                  <div className="mt-0.5 flex gap-1">
                    {event.featured && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                        <HugeiconsIcon icon={StarIcon} size={10} /> Featured
                      </span>
                    )}
                    {event.isPublic && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                        <HugeiconsIcon icon={GlobalIcon} size={10} /> Public
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", categoryColors[event.category] ?? "bg-gray-100 text-gray-700")}>
                  {event.category?.replace(/_/g, " ")}
                </span>
              </TableCell>
              <TableCell><EventStatusBadge status={event.status} /></TableCell>
              <TableCell>
                <Badge variant={modeTone[event.eventMode] ?? "outline"} className="capitalize text-xs">{event.eventMode}</Badge>
              </TableCell>
              <TableCell>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{event.availableSeats}/{event.totalSeats}</p>
                <p className="text-[10px] text-gray-400">{stats?.confirmed ?? 0} confirmed</p>
              </TableCell>
              <TableCell>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">{formatMoney(stats?.projectedRevenue ?? 0)}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{formatMoney(stats?.confirmedRevenue ?? 0)} confirmed</p>
              </TableCell>
              <TableCell>
                <p className="truncate text-xs text-gray-600 dark:text-gray-400 max-w-[100px]">
                  {event.organizerId?.name ?? "N/A"}
                </p>
              </TableCell>
              <TableCell>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(event.startDate)}</p>
                <Badge variant={groupingTone[grouping] ?? "outline"} className="mt-0.5 text-[10px] capitalize px-1 py-0">{grouping}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <EventTableActions event={event} onView={onView} onQuickAction={onQuickAction} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
    )
  }