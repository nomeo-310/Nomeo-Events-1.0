'use client';

import { HugeiconsIcon } from '@hugeicons/react'
import { Notification02Icon } from '@hugeicons/core-free-icons'

interface NotificationBellProps {
  unreadCount?: number
  className?: string
}

export const NotificationBell = ({ unreadCount = 0, className = '' }: NotificationBellProps) => {
  // Only show badge if unreadCount is a number AND greater than 0
  const showBadge = typeof unreadCount === 'number' && unreadCount > 0;
  
  return (
    <button className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative ${className}`}>
      <HugeiconsIcon icon={Notification02Icon} className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      {showBadge && (
        <span className="absolute top-[5px] right-[5px] min-w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none px-0.5">
          {unreadCount > 99 ? "99+" : unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  )
}