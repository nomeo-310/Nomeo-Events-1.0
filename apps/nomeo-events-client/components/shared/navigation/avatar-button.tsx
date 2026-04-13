"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { User03Icon as UserIcon, ArrowDown02Icon as ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { AvatarButtonProps } from "@/types/navigation-type";

const AvatarButton = ({ initials, isOpen, onClick }: AvatarButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 pl-0.5 pr-2 py-0.5 rounded-lg hover:bg-gray-100/80 dark:hover:bg-white/5 transition-colors duration-150"
    >
      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white dark:ring-gray-950">
        {initials || <HugeiconsIcon icon={UserIcon} size={13} />}
      </div>
      <HugeiconsIcon
        icon={ArrowDown01Icon}
        size={12}
        className={`text-gray-400 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
      />
    </button>
  );
};

export default AvatarButton;