import { type Notification } from "@/hooks/use-notification";
import { Alert01Icon, CancelCircleIcon, CheckmarkCircle02Icon, InformationCircleIcon, Refresh03Icon, SecurityCheckIcon } from "@hugeicons/core-free-icons";

export type TabStatus = "unread" | "read" | "archived";

export const typeConfig: Record< Notification["message_type"], { icon: any; bg: string; text: string }
> = {
  success: {
    icon: CheckmarkCircle02Icon,
    bg: "bg-green-100 dark:bg-green-900",
    text: "text-green-800 dark:text-green-200",
  },
  info: {
    icon: InformationCircleIcon,
    bg: "bg-blue-100 dark:bg-blue-900",
    text: "text-blue-800 dark:text-blue-200",
  },
  warning: {
    icon: Alert01Icon,
    bg: "bg-amber-100 dark:bg-amber-900",
    text: "text-amber-800 dark:text-amber-200",
  },
  error: {
    icon: CancelCircleIcon,
    bg: "bg-red-100 dark:bg-red-900",
    text: "text-red-800 dark:text-red-200",
  },
  update: {
    icon: Refresh03Icon,
    bg: "bg-purple-100 dark:bg-purple-900",
    text: "text-purple-800 dark:text-purple-200",
  },
  verification: {
    icon: SecurityCheckIcon,
    bg: "bg-indigo-100 dark:bg-indigo-900",
    text: "text-indigo-800 dark:text-indigo-200",
  },
};