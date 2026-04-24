import type { JSX } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Edit01Icon as EditIcon,
  Loading03Icon,
  Megaphone01Icon,
  Archive03Icon,
  CheckmarkCircle02Icon,
  Delete02Icon as TrashIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

interface EventActionBarProps {
  event:           any;
  eventId:         string;
  publishMutation: any;
  archiveMutation: any;
  deleteMutation:  any;
  restoreMutation: any;
  isMutating:      boolean;
}

function SpinnerOr({ pending, icon }: { pending: boolean; icon: any }): JSX.Element {
  return <HugeiconsIcon icon={pending ? Loading03Icon : icon} size={14} className={pending ? "animate-spin" : ""} />;
}

export function EventActionBar({ event, eventId, publishMutation, archiveMutation, deleteMutation, restoreMutation, isMutating }: EventActionBarProps): JSX.Element {
  const router = useRouter();

  const isOngoing = event.grouping === 'ongoing';

  const isCompleted = event.grouping === 'completed';
  
  const isUpcoming = event.grouping === 'upcoming';

  if (isOngoing) {
    return (
      <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Actions are disabled while event is ongoing
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
      {/* Edit button - disabled for completed events */}
      {!event.isDeleted && (
        <Button
          type="button"
          onClick={() => router.push(`/dashboard/events/create-event/${eventId}`)}
          className="bg-indigo-600 hover:bg-indigo-700 gap-2 h-9"
          disabled={isCompleted}
          title={isCompleted ? "Cannot edit completed events" : ""}
        >
          <HugeiconsIcon icon={EditIcon} size={14} /> Edit Event
        </Button>
      )}

      {/* Publish button - only for drafts and upcoming events */}
      {event.status === "draft" && !event.isDeleted && !event.isArchived && isUpcoming && (
        <Button
          type="button" variant="outline" disabled={isMutating}
          onClick={() => publishMutation.mutate(eventId)}
          className="gap-2 h-9 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
        >
          <SpinnerOr pending={publishMutation.isPending} icon={Megaphone01Icon} /> Publish
        </Button>
      )}

      {/* Archive button - only for non-deleted, non-archived, upcoming events */}
      {!event.isDeleted && !event.isArchived && isUpcoming && (
        <Button
          type="button" variant="outline" disabled={isMutating}
          onClick={() => archiveMutation.mutate(eventId)}
          className="gap-2 h-9"
        >
          <SpinnerOr pending={archiveMutation.isPending} icon={Archive03Icon} /> Archive
        </Button>
      )}

      {/* Restore button - available for deleted/archived events regardless of grouping */}
      {(event.isDeleted || event.isArchived) && (
        <Button
          type="button" variant="outline" disabled={isMutating}
          onClick={() => restoreMutation.mutate(eventId)}
          className="gap-2 h-9 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/20"
        >
          <SpinnerOr pending={restoreMutation.isPending} icon={CheckmarkCircle02Icon} /> Restore
        </Button>
      )}

      {/* Delete button - disabled for completed events */}
      {!event.isDeleted && (
        <Button
          type="button" variant="outline" disabled={isMutating || isCompleted}
          onClick={() => deleteMutation.mutate(eventId)}
          className="gap-2 h-9 text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 ml-auto"
          title={isCompleted ? "Cannot delete completed events" : ""}
        >
          <SpinnerOr pending={deleteMutation.isPending} icon={TrashIcon} /> Move to Trash
        </Button>
      )}
    </div>
  );
}