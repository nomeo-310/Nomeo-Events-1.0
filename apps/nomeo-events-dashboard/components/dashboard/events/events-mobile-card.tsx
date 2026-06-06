// events-mobile-card.tsx
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp01Icon,
  ArrowDown01Icon,
  ViewIcon,
  CheckmarkCircle02Icon as CheckCircleIcon,
} from "@hugeicons/core-free-icons";

import { EventStatusBadge } from "./events-components";
import { formatMoney, formatDate } from "./events-types";
import type { AdminEventRow } from "@/hooks/use-events";

export function MobileEventCard({ event, selected, expanded, onToggleSelect, onToggleExpand, onView, onAction }: {
  event: AdminEventRow; selected: boolean; expanded: boolean;
  onToggleSelect: () => void; onToggleExpand: () => void; onView: () => void; onAction: (a: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-3 p-4">
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{event.title}</p>
          <p className="truncate text-xs capitalize text-gray-500 dark:text-gray-400">{event.category?.replace(/_/g, " ")}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <EventStatusBadge status={event.status} />
          <button type="button" onClick={onToggleExpand} className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            <HugeiconsIcon icon={expanded ? ArrowUp01Icon : ArrowDown01Icon} className="h-4 w-4" />
          </button>
        </div>
      </div>
      {expanded && (
        <div className="space-y-3 border-t border-gray-100 px-4 pb-4 pt-3 dark:border-gray-800">
          <div className="grid grid-cols-2 gap-2">
            {([["Mode", event.eventMode], ["Seats", `${event.availableSeats}/${event.totalSeats}`],
               ["Revenue", formatMoney(event.registrationStats?.projectedRevenue ?? 0)],
               ["Starts", formatDate(event.startDate)]] as [string, string][]).map(([l, v]) => (
              <div key={l} className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">{l}</p>
                <p className="text-xs font-medium capitalize text-gray-700 dark:text-gray-300">{v}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 flex-1 text-xs dark:border-gray-700" onClick={onView}>
              <HugeiconsIcon icon={ViewIcon} className="mr-1 h-3 w-3" /> View
            </Button>
            {event.status === "draft" && (
              <Button size="sm" variant="outline" className="h-8 flex-1 border-green-200 text-xs text-green-600 dark:border-green-800" onClick={() => onAction("publish")}>
                <HugeiconsIcon icon={CheckCircleIcon} className="mr-1 h-3 w-3" /> Publish
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}