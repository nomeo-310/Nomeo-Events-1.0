'use client'


import { NavigationMenu } from './navigation-menu'
import { HugeiconsIcon } from '@hugeicons/react'
import { HelpCircleIcon, Logout02Icon } from '@hugeicons/core-free-icons'
import Logo from '@/components/shared/navigation/logo'
import { UserAvatar } from './user-avatar'

interface SidebarProps {
  menuItems: any[]
  isMenuItemActive: (path: string) => boolean
  userName: string
  userEmail: string
  userAvatar?: string | null
  onLogout: () => void
}

export const Sidebar = ({ menuItems, isMenuItemActive, userName, userEmail, userAvatar, onLogout }: SidebarProps) => {
  return (
    <aside className="hidden lg:flex lg:w-64 xl:w-72 flex-col h-screen sticky top-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <Logo />
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <UserAvatar userName={userName} userAvatar={userAvatar} className="w-10 h-10" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">{userName}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6">
        <NavigationMenu 
          menuItems={menuItems} 
          isMenuItemActive={isMenuItemActive} 
          className="space-y-1.5 px-3"
        />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
          <HugeiconsIcon icon={HelpCircleIcon} className="w-4 h-4" />
          <span>Help & Support</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <HugeiconsIcon icon={Logout02Icon} className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}