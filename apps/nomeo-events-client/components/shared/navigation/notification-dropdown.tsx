"use client";

import Link from "next/link";
import { NotificationDropdownProps } from "@/types/navigation-type";
import Dropdown from "./dropdown";

const NotificationDropdown = ({ isOpen, onClose, notifications, count }: NotificationDropdownProps) => {
  return (
    <Dropdown isOpen={isOpen} onClose={onClose} width="w-80">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
        {count > 0 && (
          <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
            {count} new
          </span>
        )}
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto">
        {notifications.map((notification) => (
          <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{notification.time}</p>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800">
        <Link href="/dashboard" onClick={onClose} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline block text-center">
          View all notifications
        </Link>
      </div>
    </Dropdown>
  );
};

export default NotificationDropdown;