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
import { PageLock } from './page-lock'
import { useSubscription } from '@/hooks/use-subscription'
import { useMyProfile, useProfileCompletion, useProfileVerificationStatus } from '@/hooks/use-profile'
import { useModal } from '@/hooks/use-modal'
import { VerificationGuardModal } from '@/components/root/auth/verification-guard-modal'

const menuItems = [
  { id: 'overview',  label: 'Overview',  path: '/dashboard',           icon: DashboardSquare02Icon },
  { id: 'profile',   label: 'Profile',   path: '/dashboard/profile',   icon: User03Icon },
  { id: 'events',    label: 'Events',    path: '/dashboard/events',    icon: Calendar02Icon },
  { id: 'payments',  label: 'Payments',  path: '/dashboard/payments',  icon: CreditCardIcon },
  { id: 'analytics', label: 'Analytics', path: '/dashboard/analytics', icon: BarChartIcon },
  { id: 'settings',  label: 'Settings',  path: '/dashboard/settings',  icon: ToolsIcon },
]

const ALWAYS_UNLOCKED: string[] = [
  '/dashboard',
  '/dashboard/profile',
  '/dashboard/settings',
  '/dashboard/payments',
]

const REQUIRES_VERIFICATION: string[] = [
  '/dashboard/events',
  '/dashboard/analytics',
]

const GATED_PATHS: string[] = [
  '/dashboard/events',
  '/dashboard/analytics',
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

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded-md" />
      </div>
      <div className="flex gap-3">
        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl bg-gray-200 dark:bg-gray-700 h-40" />
        ))}
      </div>
    </div>
  )
}

export const DashboardLayout = ({ children, user }: DashboardLayoutProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { openModal, closeModal } = useModal()

  const { data: notifData } = useNotificationCounts()
  const unreadCounts = notifData?.unread

  const { isActive, isLoading: subLoading } = useSubscription()
  const { data: profile, isLoading: profileLoading } = useMyProfile()
  const { isVerified, isPending, isLoading: verificationLoading } = useProfileVerificationStatus()
  const { percentage: completionPercentage, isLoading: completionLoading } = useProfileCompletion()

  const isLoading = subLoading || profileLoading || verificationLoading || completionLoading

  const userName = user?.name || 'Guest User'
  const userEmail = user?.email || 'guest@example.com'
  const firstName = userName.split(' ')[0]

  const isMenuItemActive = (path: string): boolean => {
    if (!pathname) return false
    if (path === '/dashboard') return pathname === '/dashboard'
    return pathname === path || pathname.startsWith(path + '/')
  }

  const logOut = useCallback(async () => {
    await authClient.signOut()
    router.push('/')
    router.refresh()
  }, [router])

  // ── Open email verification modal ─────────────────────────────────────────
  // Called from PageLock's onVerifyEmail — opens AuthWrapper on verify-email view

  const handleVerifyEmail = useCallback(() => {
    openModal({
      title: '',
      size: 'large',
      showCloseButton: false,
      closeOnEsc: false,
      closeOnOutsideClick: false,
      children: (
        <VerificationGuardModal
          email={user.email}
          onClose={closeModal}
        />
      ),
    })
  }, [user.email, openModal, closeModal])

  // ── Lock resolution ───────────────────────────────────────────────────────
  // email_unverified is checked first — it blocks everything including
  // always-unlocked pages because an unverified account shouldn't access
  // the dashboard at all.

  const getLock = () => {
    // Email not verified → block everything, show email verify lock
    if (!user.emailVerified) return 'email_unverified' as const

    if (!pathname || ALWAYS_UNLOCKED.includes(pathname)) return null
    if (isLoading) return null

    if (profile?.activeStatus === 'suspended') return 'suspended' as const
    if (!isActive) return 'subscription_expired' as const
    if (REQUIRES_VERIFICATION.some(p => pathname.startsWith(p))) {
      if (isPending) return 'verification_pending' as const
      if (!isVerified) return 'unverified' as const
    }
    if (pathname.startsWith('/dashboard/events') && completionPercentage < 50) {
      return 'incomplete_profile' as const
    }

    return null
  }

  const lockCondition = getLock()

  const isGatedPath = GATED_PATHS.some(p => pathname?.startsWith(p))
  const showSkeleton = isGatedPath && isLoading && !lockCondition
  const showChildren = !showSkeleton

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
            onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          />

          <div className="pt-14 relative min-h-[calc(100vh-3.5rem)]">
            <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              <Breadcrumb pathname={pathname} menuItems={menuItems} />

              {showSkeleton ? (
                <PageSkeleton />
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {showChildren && children}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            <PageLock
              locked={!!lockCondition}
              condition={lockCondition ?? undefined}
              // Only passed through when condition is email_unverified
              // PageLock ignores it for all other conditions
              onVerifyEmail={lockCondition === 'email_unverified' ? handleVerifyEmail : undefined}
            />
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