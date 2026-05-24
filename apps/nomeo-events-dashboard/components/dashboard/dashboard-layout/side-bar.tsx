'use client'

import { NavigationMenu } from './navigation-menu'
import { HugeiconsIcon } from '@hugeicons/react'
import { Logout02Icon } from '@hugeicons/core-free-icons'
import Logo from '@/components/ui/logo'
import type { AdminRole } from './dashboard-layout'

interface AdminSidebarProps {
  menuItems: any[]
  isMenuItemActive: (path: string) => boolean
  adminName: string
  adminEmail: string
  adminRole: AdminRole
  onLogout: () => void
}

/** Pill label shown under the avatar placeholder */
const ROLE_LABELS: Record<AdminRole, string> = {
  admin: 'Admin',
  super_admin: 'Super Admin',
  moderator: 'moderator',
  support: 'support'
}

/** Initials from name */
function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const AdminSidebar = ({
  menuItems,
  isMenuItemActive,
  adminName,
  adminEmail,
  onLogout,
}: AdminSidebarProps) => {
  return (
    <aside className="hidden lg:flex lg:w-64 xl:w-72 flex-col h-screen sticky top-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <Logo />
      </div>

      {/* Admin identity — placeholder avatar, no real image */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* Placeholder avatar */}
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">{getInitials(adminName)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">{adminName}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{adminEmail}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-6">
        <NavigationMenu
          menuItems={menuItems}
          isMenuItemActive={isMenuItemActive}
          className="space-y-1.5 px-3"
        />
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
        >
          <HugeiconsIcon icon={Logout02Icon} className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}