'use client'

import { ThemeToggle } from '@/components/ui/theme-toggle'
import { NotificationBell } from './notification-bell'
import { UserAvatar } from './user-avatar'

interface TopBarProps {
  firstName: string
  userName: string
  userAvatar?: string | null
  unreadCount?: number
  onLogout: () => void
}

export const TopBar = ({ firstName, userName, userAvatar, unreadCount, onLogout }: TopBarProps) => {
  return (
    <div className="hidden lg:block fixed top-0 right-0 left-64 xl:left-72 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-14">
      <div className="flex items-center justify-between px-8 h-full">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Welcome {firstName}!
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            Ready to manage your events?
          </p>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <NotificationBell unreadCount={unreadCount} />
          
          <div className="flex items-center gap-3">
            <UserAvatar userName={userName} userAvatar={userAvatar} className="w-8 h-8" />
            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}