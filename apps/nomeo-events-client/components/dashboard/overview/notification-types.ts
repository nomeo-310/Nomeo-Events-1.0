import { type Notification } from "@/hooks/use-notification";

export type TabStatus = "unread" | "read" | "archived";

export const typeConfig: Record<
  Notification["message_type"],
  { icon: string; bg: string; text: string }
> = {
  success: { icon: "✓", bg: "bg-green-100 dark:bg-green-900", text: "text-green-800 dark:text-green-200" },
  info:    { icon: "i", bg: "bg-blue-100 dark:bg-blue-900",   text: "text-blue-800 dark:text-blue-200"  },
  warning: { icon: "!", bg: "bg-amber-100 dark:bg-amber-900", text: "text-amber-800 dark:text-amber-200" },
  error:   { icon: "✕", bg: "bg-red-100 dark:bg-red-900",    text: "text-red-800 dark:text-red-200"    },
  update:  { icon: "↻", bg: "bg-purple-100 dark:bg-purple-900", text: "text-purple-800 dark:text-purple-200" },
};