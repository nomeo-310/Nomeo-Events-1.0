"use client";

import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { EyeIcon, Edit01Icon as EditIcon, Megaphone01Icon, Archive03Icon, CheckmarkCircle02Icon, Delete02Icon as TrashIcon, MoreHorizontalIcon } from "@hugeicons/core-free-icons";
import { Event } from "@/hooks/use-events";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface EventActionsMenuProps {
  event:     Event;
  onPublish: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete:  (id: string) => void;
  onRestore: (id: string) => void;
}

export function EventActionsMenu({ event, onPublish, onArchive, onDelete, onRestore }: EventActionsMenuProps) {
  const router = useRouter();
  const stop   = (e: React.MouseEvent, fn: () => void) => { e.stopPropagation(); fn(); };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={(e) => stop(e, () => router.push(`/dashboard/events/${event._id}`))}>
          <HugeiconsIcon icon={EyeIcon} size={14} /> View
        </DropdownMenuItem>

        {!event.isDeleted && !event.isArchived && (
          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={(e) => stop(e, () => router.push(`/dashboard/events/create-event/${event._id}`))}>
            <HugeiconsIcon icon={EditIcon} size={14} /> Edit
          </DropdownMenuItem>
        )}

        {event.status === "draft" && !event.isDeleted && !event.isArchived && (
          <DropdownMenuItem className="gap-2 cursor-pointer text-green-600 dark:text-green-400 focus:text-green-600" onClick={(e) => stop(e, () => onPublish(event._id))}>
            <HugeiconsIcon icon={Megaphone01Icon} size={14} /> Publish
          </DropdownMenuItem>
        )}

        {!event.isDeleted && !event.isArchived && (
          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={(e) => stop(e, () => onArchive(event._id))}>
            <HugeiconsIcon icon={Archive03Icon} size={14} /> Archive
          </DropdownMenuItem>
        )}

        {event.isDeleted || event.isArchived ? (
          <DropdownMenuItem className="gap-2 cursor-pointer text-indigo-600 dark:text-indigo-400 focus:text-indigo-600" onClick={(e) => stop(e, () => onRestore(event._id))}>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} /> Restore
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer text-red-500 focus:text-red-500" onClick={(e) => stop(e, () => onDelete(event._id))}>
              <HugeiconsIcon icon={TrashIcon} size={14} /> Move to Trash
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}