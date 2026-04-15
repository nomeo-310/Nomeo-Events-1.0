'use client'

import { motion } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, HelpCircleIcon, Logout } from '@hugeicons/core-free-icons'
import { NavigationMenu } from './navigation-menu'
import { UserAvatar } from './user-avatar'
import Logo from '@/components/shared/navigation/logo'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  menuItems: any[]
  isMenuItemActive: (path: string) => boolean
  userName: string
  userEmail: string
  userAvatar?: string | null
  onLogout: () => void
}

export const MobileMenu = ({ isOpen, onClose, menuItems, isMenuItemActive, userName, userEmail, userAvatar, onLogout }: MobileMenuProps) => {
  if (!isOpen) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 lg:hidden"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-800 z-50 shadow-xl overflow-y-auto flex flex-col"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Logo />
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <UserAvatar userName={userName} userAvatar={userAvatar} className="w-12 h-12" />
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{userName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 py-4">
          <NavigationMenu 
            menuItems={menuItems} 
            isMenuItemActive={isMenuItemActive} 
            onItemClick={onClose}
          />
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => {
              // Handle help
              onClose()
            }} 
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mb-2"
          >
            <HugeiconsIcon icon={HelpCircleIcon} className="w-5 h-5" />
            <span>Help & Support</span>
          </button>
          <button 
            onClick={onLogout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <HugeiconsIcon icon={Logout} className="w-4 h-4" />
            Logout
          </button>
        </div>
      </motion.div>
    </>
  )
}