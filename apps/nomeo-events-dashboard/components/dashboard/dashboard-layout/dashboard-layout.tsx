'use client'

import { useCallback, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminTopBar } from './top-bar'
import { AdminMobileMenu } from './mobile-menu'
import { AdminSidebar } from './side-bar'
import { AdminBreadcrumb } from './bread-crumb'
import { AdminPageLock } from './page-lock'
import { UserMultiple02Icon, Calendar02Icon, CreditCardIcon, BarChartIcon, CheckmarkBadge02Icon, Settings01Icon, Notification02Icon, User03Icon, AiChemistry03Icon, Ticket01Icon, Megaphone03Icon, WaveTriangleIcon } from '@hugeicons/core-free-icons'
import { useAdminLogout } from '@/hooks/use-logout'

// ── Menu items ────────────────────────────────────────────────────────────────

const menuItems = [
  // Dashboard
  { id: 'notifications', group: 'dashboard', label: 'Notifications', path: '/', icon: Notification02Icon },

  // User Management
  { id: 'users', group: 'users', label: 'Users', path: '/users', icon: UserMultiple02Icon },
  { id: 'verifications', group: 'users', label: 'Verifications', path: '/verifications', icon: CheckmarkBadge02Icon },
  { id: 'admins', group: 'users', label: 'Admins', path: '/admins', icon: User03Icon },

  // Security
  { id: 'admin-logs', group: 'security', label: 'Audit Logs', path: '/admin-logs', icon: WaveTriangleIcon },

  // Billing & Finance
  { id: 'plans', group: 'billing', label: 'Plans', path: '/plans', icon: AiChemistry03Icon },
  { id: 'subscriptions', group: 'billing', label: 'Subscriptions', path: '/subscriptions', icon: Ticket01Icon },
  { id: 'payments', group: 'billing', label: 'Payments', path: '/payments', icon: CreditCardIcon },

  // Marketing & Activity
  { id: 'events', group: 'marketing', label: 'Events', path: '/events', icon: Calendar02Icon },
  { id: 'newsletter', group: 'marketing', label: 'Newsletter', path: '/newsletter', icon: Megaphone03Icon },

  // Analytics
  { id: 'analytics', group: 'analytics', label: 'Analytics', path: '/analytics', icon: BarChartIcon },

  // Settings
  { id: 'settings', group: 'settings', label: 'Settings', path: '/settings', icon: Settings01Icon },
];

// ── Access control ────────────────────────────────────────────────────────────

/** Pages that are always accessible regardless of admin status */
const ALWAYS_UNLOCKED: string[] = [
  '/',
]

/** Pages that require an active (non-suspended) admin account */
const REQUIRES_ACTIVE: string[] = [
  '/users',
  '/verifications',
  '/events',
  '/payments',
  '/analytics',
]

/** Pages that are role-gated (super-admin only, for example) */
const SUPER_ADMIN_ONLY: string[] = [
  '/settings',
  '/payments',
  '/analytics'
]

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdminRole = 'admin' | 'super_admin' | 'moderator' | 'support' 
export type AdminStatus = 'active' | 'suspended' | 'inactive'

interface AdminDashboardLayoutProps {
  children: React.ReactNode
  admin: {
    id: string
    name: string
    email: string
    role: AdminRole
    status: AdminStatus
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

// ── Layout ────────────────────────────────────────────────────────────────────

export const AdminDashboardLayout = ({ children, admin }: AdminDashboardLayoutProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { logout, isLoading } = useAdminLogout()

  const adminName = admin?.name || 'Admin'
  const adminEmail = admin?.email || ''
  const firstName = adminName.split(' ')[0]

  const isMenuItemActive = (path: string): boolean => {
    if (!pathname) return false
    if (path === '/') return pathname === '/'
    return pathname === path || pathname.startsWith(path + '/')
  }

  const logOut = useCallback(async () => {
    logout();
    router.refresh()
  }, [router]);

  // ── Lock resolution ───────────────────────────────────────────────────────

  const getLock = (): 'inactive' | 'suspended' | 'unauthorized' | null => {
    if (!pathname) return null

    // Suspended admin — block everything except always-unlocked
    if (admin.status === 'suspended') return 'suspended'

    // Inactive admin — cannot access any gated page
    if (admin.status === 'inactive' && !ALWAYS_UNLOCKED.includes(pathname)) {
      return 'inactive'
    }

    // Role gate: non-super-admins cannot access super-admin-only paths
    if (
      admin.role !== 'super_admin' &&
      SUPER_ADMIN_ONLY.some(p => pathname.startsWith(p))
    ) {
      return 'unauthorized'
    }

    return null
  }

  const lockCondition = getLock()

  // Show skeleton while data is resolving on gated paths
  const isGatedPath = REQUIRES_ACTIVE.some(p => pathname?.startsWith(p))
  const showSkeleton = false // replace with actual loading state if needed
  const showChildren = !showSkeleton

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <AdminSidebar
          menuItems={menuItems}
          isMenuItemActive={isMenuItemActive}
          adminName={adminName}
          adminEmail={adminEmail}
          adminRole={admin.role}
          onLogout={logOut}
        />

        <main className="flex-1 min-h-screen">
          <AdminTopBar
            firstName={firstName}
            adminName={adminName}
            adminRole={admin.role}
            onLogout={logOut}
            onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
          />

          <div className="pt-14 relative min-h-[calc(100vh-3.5rem)]">
            <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              <AdminBreadcrumb pathname={pathname} menuItems={menuItems} />

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

            <AdminPageLock
              locked={!!lockCondition}
              condition={lockCondition ?? undefined}
            />
          </div>
        </main>
      </div>

      <AdminMobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        menuItems={menuItems}
        isMenuItemActive={isMenuItemActive}
        adminName={adminName}
        adminEmail={adminEmail}
        adminRole={admin.role}
        onLogout={logOut}
      />
    </div>
  )
}