import { useState } from "react";
import { cn } from "@/lib/utils";
import { useGetNotifications, useNotificationCounts } from "@/hooks/use-notification";
import Pagination from "@/components/ui/pagination";
import { TabStatus } from "./notification-types";
import { BulkActionsBar } from "./bulk-action-bar";
import { LoadingSkeleton } from "./loading-skeleton";
import { EmptyState } from "./empty-state";
import { NotificationCard } from "./notification-card";

export function NotificationPanel() {
  const [activeTab, setActiveTab] = useState<TabStatus>("unread");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const LIMIT = 10;

  const { data: counts, refetch: refetchCounts } = useNotificationCounts();
  const { data, isLoading, refetch: refetchNotifications } = useGetNotifications({
    status: activeTab,
    page,
    limit: LIMIT,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const handleAction = () => {
    refetchCounts();
    refetchNotifications();
    setRefreshKey(prev => prev + 1);
  };

  function handleTabChange(tab: TabStatus) {
    setActiveTab(tab);
    setPage(1);
  }

  const notifications = data?.data ?? [];
  const pagination = data?.pagination;

  const tabs: { key: TabStatus; label: string; count: number }[] = [
    { key: "unread",   label: "Unread",   count: counts?.unread   ?? 0 },
    { key: "read",     label: "Read",     count: counts?.read     ?? 0 },
    { key: "archived", label: "Archived", count: counts?.archived ?? 0 },
  ];

  return (
    <div className="rounded-xl border border-border bg-background flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 md:gap-1.5 py-4 md:py-3 text-sm md:text-xs font-semibold relative transition-colors",
              activeTab === t.key
                ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-violet-500 after:rounded-t"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full px-2 md:px-1.5 py-0.5 text-xs md:text-[10px] font-semibold",
                t.key === "unread" && t.count > 0
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {t.count > 99 ? "99+" : t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk Actions Bar - Only show when there are items */}
      {notifications.length > 0 && (
        <BulkActionsBar status={activeTab} onAction={handleAction} />
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingSkeleton />
        ) : notifications.length === 0 ? (
          <EmptyState status={activeTab} />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {notifications.map((notification) => (
              <NotificationCard 
                key={`${notification._id}-${refreshKey}`} 
                notification={notification} 
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && !isLoading && notifications.length > 0 && (
        <div className="px-5 md:px-4 py-4 md:py-3 border-t border-border">
          <Pagination
            currentPage={page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            maxVisiblePages={5}
          />
        </div>
      )}
    </div>
  );
}