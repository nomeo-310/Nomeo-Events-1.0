"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Notification02Icon } from "@hugeicons/core-free-icons";
import { NotificationBellProps } from "@/types/navigation-type";

const NotificationBell = ({ count, onClick }: NotificationBellProps) => {
  return (
    <button
      onClick={onClick}
      aria-label="Notifications"
      className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/5 transition-colors duration-150"
    >
      <HugeiconsIcon icon={Notification02Icon} size={18} />
      {count > 0 && (
        <span className="absolute top-[5px] right-[5px] w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;