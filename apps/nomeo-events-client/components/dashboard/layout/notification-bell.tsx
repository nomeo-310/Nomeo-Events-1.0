'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { Notification02Icon } from '@hugeicons/core-free-icons'

interface NotificationBellProps {
  unreadCount?: number
  className?: string
}

export const NotificationBell = ({ unreadCount, className = '' }: NotificationBellProps) => {
  return (
    <button className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative ${className}`}>
      <HugeiconsIcon icon={Notification02Icon} className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      {unreadCount && unreadCount > 0 && (
        <span className="absolute top-[5px] right-[5px] w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  )
}