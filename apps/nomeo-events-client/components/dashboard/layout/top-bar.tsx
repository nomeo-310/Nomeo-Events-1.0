'use client'

import { ThemeToggle } from '@/components/ui/theme-toggle'
import { NotificationBell } from './notification-bell'
import { UserAvatar } from './user-avatar'
import { HugeiconsIcon } from '@hugeicons/react'
import { Menu02Icon } from '@hugeicons/core-free-icons'
import Logo from '@/components/shared/navigation/logo'

interface TopBarProps {
  firstName: string
  userName: string
  userAvatar?: string | null
  unreadCount?: number
  onLogout: () => void
  onMobileMenuOpen: () => void
}

export const TopBar = ({ firstName, userName, userAvatar, unreadCount, onLogout, onMobileMenuOpen }: TopBarProps) => {
  return (
    <>
      {/* Desktop top bar */}
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

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-14">
        <div className="flex items-center justify-between px-4 h-full">
          {/* Left: hamburger */}
          <button
            onClick={onMobileMenuOpen}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <HugeiconsIcon icon={Menu02Icon} className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Center: logo */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Logo />
          </div>

          {/* Right: theme, notifications, avatar */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell unreadCount={unreadCount} />
            <UserAvatar userName={userName} userAvatar={userAvatar} className="w-8 h-8" />
          </div>
        </div>
      </div>
    </>
  )
}