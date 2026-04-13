"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { DesktopNavLinkProps } from "@/types/navigation-type";

const DesktopNavLink = ({ item, isActive }: DesktopNavLinkProps) => {
  return (
    <Link
      href={item.href}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
        isActive
          ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/5"
      }`}
    >
      <HugeiconsIcon icon={item.icon} size={14} className="flex-shrink-0" />
      {item.name}
      {isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-[2px] rounded-full bg-indigo-500 dark:text-indigo-400" />
      )}
    </Link>
  );
};

export default DesktopNavLink;