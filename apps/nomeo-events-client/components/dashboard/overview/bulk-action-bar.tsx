import { useBulkNotificationAction } from "@/hooks/use-notification";
import { toast } from "sonner";

interface BulkActionsBarProps {
  status: string;
  onAction: () => void;
}

export function BulkActionsBar({ status, onAction }: BulkActionsBarProps) {
  const { mutate: bulkAction, isPending } = useBulkNotificationAction();
  
  const handleBulkAction = (action: string) => {
    bulkAction({ action: action as any });
    onAction();
    toast.success(`Bulk action completed`);
  };
  
  if (status === "archived") {
    return (
      <div className="px-5 md:px-4 py-3 md:py-2 border-b border-border flex gap-3 md:gap-2">
        <button
          onClick={() => handleBulkAction("delete-archived")}
          disabled={isPending}
          className="text-sm md:text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 md:px-2 py-1.5 md:py-1 rounded transition-colors disabled:opacity-50 font-medium"
        >
          Delete all archived
        </button>
      </div>
    );
  }
  
  return (
    <div className="px-5 md:px-4 py-3 md:py-2 border-b border-border flex gap-3 md:gap-2 flex-wrap">
      <button
        onClick={() => handleBulkAction("mark-all-read")}
        disabled={isPending}
        className="text-sm md:text-xs text-foreground hover:bg-muted px-3 md:px-2 py-1.5 md:py-1 rounded transition-colors disabled:opacity-50 font-medium"
      >
        Mark all as read
      </button>
      <button
        onClick={() => handleBulkAction("clear-read")}
        disabled={isPending}
        className="text-sm md:text-xs text-foreground hover:bg-muted px-3 md:px-2 py-1.5 md:py-1 rounded transition-colors disabled:opacity-50 font-medium"
      >
        Clear read
      </button>
      {status === "read" && (
        <button
          onClick={() => handleBulkAction("archive-all")}
          disabled={isPending}
          className="text-sm md:text-xs text-foreground hover:bg-muted px-3 md:px-2 py-1.5 md:py-1 rounded transition-colors disabled:opacity-50 font-medium"
        >
          Archive all
        </button>
      )}
    </div>
  );
}