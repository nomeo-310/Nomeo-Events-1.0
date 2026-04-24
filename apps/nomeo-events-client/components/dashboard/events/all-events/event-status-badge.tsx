import { Event } from "@/hooks/use-events";
import { cn } from "@/lib/utils";

export function EventStatusBadge({ event }: { event: Event }) {
  if (event.isDeleted) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
        Deleted
      </span>
    );
  }
  if (event.isArchived) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
        Archived
      </span>
    );
  }

  const map: Record<string, { bg: string; text: string; label: string }> = {
    published: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "Published" },
    draft:     { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Draft"     },
    cancelled: { bg: "bg-red-100 dark:bg-red-900/30",     text: "text-red-700 dark:text-red-400",     label: "Cancelled" },
  };
  const s = map[event.status] ?? map.draft;

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", s.bg, s.text)}>
      {s.label}
    </span>
  );
}