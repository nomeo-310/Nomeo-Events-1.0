import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUpdateNotification, type Notification } from "@/hooks/use-notification";
import { typeConfig } from "./notification-types";
import { SenderAvatar } from "./sender-avatar";

interface NotificationCardProps {
  notification: Notification;
  onAction: () => void;
}

export function NotificationCard({ notification, onAction }: NotificationCardProps) {
  const { mutate: updateNotification, isPending } = useUpdateNotification();

  const cfg = typeConfig[notification.message_type];
  const isUnread = notification.status === "unread";
  const isRead = notification.status === "read";
  const isArchived = notification.status === "archived";

  const handleAction = (action: string) => {
    updateNotification({ 
      notificationId: notification._id, 
      action: action as 'mark-as-read' | 'mark-as-unread' | 'archive' | 'restore' | 'delete'
    }, {
      onSuccess: () => onAction()
    });
  };

  return (
    <div
      className={cn(
        "px-5 md:px-4 py-4 md:py-3 flex flex-col gap-4 md:gap-3 transition-all group",
        "hover:bg-muted/30 border-b border-border last:border-b-0",
        isUnread && "bg-gradient-to-r from-violet-500/5 via-transparent to-transparent"
      )}
    >
      {/* Header Row */}
      <div className="flex items-start gap-4 md:gap-3">
        {/* Sender Avatar */}
        <SenderAvatar notification={notification} />
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 md:gap-2 mb-1 md:mb-0.5 flex-wrap">
            <p className="text-sm md:text-xs font-semibold truncate">
              {notification.sender_type === "system" && "System Notification"}
              {notification.sender_type === "admin" && "Admin Team"}
              {notification.sender_type === "user" && notification.senderId?.name}
            </p>
            <div
              className={cn(
                "w-6 h-6 md:w-5 md:h-5 rounded-full flex items-center justify-center text-xs md:text-[10px] flex-shrink-0",
                cfg.bg,
                cfg.text
              )}
            >
              {cfg.icon}
            </div>
            {isUnread && (
              <span className="text-xs md:text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 px-2 md:px-1.5 py-0.5 rounded-full">
                New
              </span>
            )}
          </div>
          <p className="text-base md:text-sm font-semibold text-foreground mb-1 md:mb-0.5">
            {notification.title}
          </p>
          <p className="text-sm md:text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {notification.message}
          </p>
          <div className="flex items-center gap-3 md:gap-2 mt-2 md:mt-1.5 flex-wrap">
            <p className="text-xs md:text-[10px] text-muted-foreground">
              {notification.timeAgo}
            </p>
            {notification.link && (
              <a
                href={notification.link}
                className="text-xs md:text-[10px] text-violet-500 hover:underline inline-flex items-center gap-1 font-medium"
              >
                View details
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons at Bottom */}
      <div className="flex items-center gap-3 md:gap-2 pl-14 md:pl-11 flex-wrap">
        {isUnread && (
          <button
            onClick={() => handleAction("mark-as-read")}
            disabled={isPending}
            className="text-sm md:text-xs px-3 md:px-2.5 py-1.5 md:py-1 rounded-md bg-violet-50 text-violet-700 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-300 dark:hover:bg-violet-900 transition-colors disabled:opacity-50 font-medium"
          >
            Mark as read
          </button>
        )}
        
        {isRead && (
          <button
            onClick={() => handleAction("mark-as-unread")}
            disabled={isPending}
            className="text-sm md:text-xs px-3 md:px-2.5 py-1.5 md:py-1 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 font-medium"
          >
            Mark as unread
          </button>
        )}

        {!isArchived ? (
          <button
            onClick={() => handleAction("archive")}
            disabled={isPending}
            className="text-sm md:text-xs px-3 md:px-2.5 py-1.5 md:py-1 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 font-medium"
          >
            Archive
          </button>
        ) : (
          <button
            onClick={() => handleAction("restore")}
            disabled={isPending}
            className="text-sm md:text-xs px-3 md:px-2.5 py-1.5 md:py-1 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 font-medium"
          >
            Restore
          </button>
        )}

        <button
          onClick={() => handleAction("delete")}
          disabled={isPending}
          className="text-sm md:text-xs px-3 md:px-2.5 py-1.5 md:py-1 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
}