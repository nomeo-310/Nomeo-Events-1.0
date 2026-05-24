'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, Logout01Icon } from '@hugeicons/core-free-icons'
import { NavigationMenu } from './navigation-menu'
import Logo from '@/components/ui/logo'
import type { AdminRole } from './dashboard-layout'

interface AdminMobileMenuProps {
  isOpen: boolean
  onClose: () => void
  menuItems: any[]
  isMenuItemActive: (path: string) => boolean
  adminName: string
  adminEmail: string
  adminRole: AdminRole
  onLogout: () => void
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

export const AdminMobileMenu = ({ isOpen, onClose, menuItems, isMenuItemActive, adminName, adminEmail, adminRole, onLogout }: AdminMobileMenuProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-800 z-50 shadow-xl overflow-y-auto flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <Logo />
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
                </button>
              </div>

              {/* Admin identity */}
              <div className="flex items-center gap-3">
                {/* Placeholder avatar — no image */}
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-base">{getInitials(adminName)}</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{adminName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{adminEmail}</div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <div className="flex-1 py-4 px-2">
              <NavigationMenu
                menuItems={menuItems}
                isMenuItemActive={isMenuItemActive}
                onItemClick={onClose}
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
              >
                <HugeiconsIcon icon={Logout01Icon} className="w-4 h-4" />
                Logout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}