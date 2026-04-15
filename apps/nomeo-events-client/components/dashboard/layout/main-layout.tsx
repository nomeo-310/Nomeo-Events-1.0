'use client'

import { useCallback, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { authClient } from '@/lib/auth-client'
import { useNotificationCounts } from '@/hooks/use-notification'
import { TopBar } from './top-bar'
import { MobileMenu } from './mobile-menu'
import { BarChartIcon, Calendar02Icon, CreditCardIcon, DashboardSquare02Icon, ToolsIcon, User03Icon } from '@hugeicons/core-free-icons'
import { Sidebar } from './side-bar'
import { Breadcrumb } from './breadcrumb'

const menuItems = [
  {
    id: 'overview',
    label: 'Overview',
    path: '/dashboard',
    icon: DashboardSquare02Icon,
  },
  {
    id: 'events',
    label: 'Events',
    path: '/dashboard/events',
    icon: Calendar02Icon,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    path: '/dashboard/analytics',
    icon: BarChartIcon,
  },
  {
    id: 'payments',
    label: 'Payments',
    path: '/dashboard/payments',
    icon: CreditCardIcon,
  },
  {
    id: 'profile',
    label: 'Profile',
    path: '/dashboard/profile',
    icon: User03Icon,
  },
  {
    id: 'settings',
    label: 'Settings',
    path: '/dashboard/settings',
    icon: ToolsIcon,
  }
]

interface DashboardLayoutProps {
  children: React.ReactNode
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    role: string
    avatar: string
    createdAt: Date
  }
}

export const DashboardLayout = ({ children, user }: DashboardLayoutProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const { data } = useNotificationCounts()
  const unreadCounts = data?.unread

  const userName = user?.name || 'Guest User'
  const userEmail = user?.email || 'guest@example.com'
  const firstName = userName.split(' ')[0]

  const isMenuItemActive = (path: string): boolean => {
    if (!pathname) return false
    return pathname === path || pathname.startsWith(path + '/')
  }

  const logOut = useCallback(async () => {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-14">
        <div className="flex items-center justify-between px-4 h-full">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {/* Menu icon */}
          </button>
          {/* Logo and other mobile header content */}
        </div>
      </div>

      <div className="flex">
        <Sidebar 
          menuItems={menuItems}
          isMenuItemActive={isMenuItemActive}
          userName={userName}
          userEmail={userEmail}
          userAvatar={user?.avatar}
          onLogout={logOut}
        />

        <main className="flex-1 min-h-screen">
          <TopBar 
            firstName={firstName}
            userName={userName}
            userAvatar={user?.avatar}
            unreadCount={unreadCounts}
            onLogout={logOut}
          />

          <div className="pt-14">
            <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              <Breadcrumb pathname={pathname} isMenuItemActive={isMenuItemActive} />
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuItems={menuItems}
        isMenuItemActive={isMenuItemActive}
        userName={userName}
        userEmail={userEmail}
        userAvatar={user?.avatar}
        onLogout={logOut}
      />
    </div>
  )
}