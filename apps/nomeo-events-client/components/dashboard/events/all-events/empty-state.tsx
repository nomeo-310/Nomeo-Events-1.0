import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Calendar03Icon as CalendarIcon, CheckmarkCircle03Icon, LicenseDraftIcon, Archive03Icon, Delete03Icon } from "@hugeicons/core-free-icons";
import { StatusTab } from "./event-helpers";

const MESSAGES: Record<StatusTab, { title: string; description: string; icon: any }> = {
  all:       { title: "No events yet",       description: "Get started by creating your first event.",                          icon: CalendarIcon          },
  published: { title: "No published events", description: "Events you publish will appear here.",                              icon: CheckmarkCircle03Icon },
  draft:     { title: "No drafts",           description: "Events saved as drafts will appear here.",                          icon: LicenseDraftIcon      },
  archived:  { title: "No archived events",  description: "Events you archive will be stored here.",                           icon: Archive03Icon         },
  deleted:   { title: "Trash is empty",      description: "Events you delete will be moved here before permanent removal.",    icon: Delete03Icon          },
};

const CREATE_LABELS: Partial<Record<StatusTab, string>> = {
  all:       "Create Event",
  published: "Publish Event",
  draft:     "Create Event",
};

interface EmptyStateProps {
  tab:           StatusTab;
  onCreateClick: () => void;
}

export function EmptyState({ tab, onCreateClick }: EmptyStateProps) {
  const { title, description, icon } = MESSAGES[tab];
  const createLabel = CREATE_LABELS[tab];

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <HugeiconsIcon icon={icon} size={28} className="text-gray-400 dark:text-gray-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">{description}</p>
      {createLabel && (
        <button
          type="button"
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <HugeiconsIcon icon={PlusSignIcon} size={16} />
          {createLabel}
        </button>
      )}
    </div>
  );
}