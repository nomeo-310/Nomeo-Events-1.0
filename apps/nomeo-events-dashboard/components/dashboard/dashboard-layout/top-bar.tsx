'use client'

import { ThemeToggle } from '@/components/ui/theme-toggle'
import { HugeiconsIcon } from '@hugeicons/react'
import { Menu02Icon, ShieldUserIcon } from '@hugeicons/core-free-icons'
import Logo from '@/components/ui/logo'
import type { AdminRole } from './dashboard-layout'

interface AdminTopBarProps {
  firstName: string
  adminName: string
  adminRole: AdminRole
  onLogout: () => void
  onMobileMenuOpen: () => void
}

const ROLE_LABELS: Record<AdminRole, string> = {
  admin: 'Admin',
  super_admin: 'Super Admin',
  moderator: 'moderator',
  support: 'support'
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const AdminTopBar = ({ firstName, adminName, adminRole, onLogout, onMobileMenuOpen }: AdminTopBarProps) => {
  return (
    <>
      {/* Desktop top bar */}
      <div className="hidden lg:block fixed top-0 right-0 left-64 xl:left-72 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-14">
        <div className="flex items-center justify-between px-8 h-full">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Welcome, {firstName}!
          </h1>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {/* Role chip */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800">
              <HugeiconsIcon icon={ShieldUserIcon} className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {ROLE_LABELS[adminRole]}
              </span>
            </div>

            {/* Avatar placeholder + logout */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">{getInitials(adminName)}</span>
              </div>
              <button
                onClick={onLogout}
                className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
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
          {/* Hamburger */}
          <button
            onClick={onMobileMenuOpen}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <HugeiconsIcon icon={Menu02Icon} className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Center logo */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Logo />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">{getInitials(adminName)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}