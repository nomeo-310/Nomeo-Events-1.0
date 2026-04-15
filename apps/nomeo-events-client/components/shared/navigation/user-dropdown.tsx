"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { User03Icon as UserIcon, DashboardSquare01Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { UserDropdownProps } from "@/types/navigation-type";
import Dropdown from "./dropdown";

const UserDropdown = ({ isOpen, onClose, userName, userEmail, onLogout }: UserDropdownProps) => {
  return (
    <Dropdown isOpen={isOpen} onClose={onClose} width="w-56">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{userEmail}</p>
      </div>
      <div className="p-1.5 space-y-0.5">
        <Link href="/dashboard/profile" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
          <HugeiconsIcon icon={UserIcon} size={14} />Profile
        </Link>
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
          <HugeiconsIcon icon={DashboardSquare01Icon} size={14} />Dashboard
        </Link>
      </div>
      <div className="p-1.5 border-t border-gray-100 dark:border-gray-800">
        <button onClick={onLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
          <HugeiconsIcon icon={Logout01Icon} size={14} />Sign out
        </button>
      </div>
    </Dropdown>
  );
};

export default UserDropdown;