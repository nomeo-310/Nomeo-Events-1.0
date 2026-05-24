'use client'

import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { Home11Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'

interface AdminBreadcrumbProps {
  pathname: string | null
  menuItems?: Array<{ path: string; label: string }>
}

export const AdminBreadcrumb = ({ pathname, menuItems = [] }: AdminBreadcrumbProps) => {
  if (!pathname) return null

  const segments = pathname.split('/').filter(Boolean)

  // Special case: root path '/' should show 'Notifications'
  if (segments.length === 0) {
    return (
      <nav className="mb-6 flex items-center text-sm" aria-label="Breadcrumb">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <span className="font-medium text-foreground">Notifications</span>
        </div>
      </nav>
    )
  }

  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const isLast = index === segments.length - 1
    const prevSegment = index > 0 ? segments[index - 1] : ''

    // Dynamic ID detection (MongoDB ObjectId, numeric, UUID)
    const isDynamicId =
      /^[0-9a-fA-F]{24}$/.test(segment) ||
      /^\d+$/.test(segment) ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)

    let label = ''

    if (isDynamicId) {
      if (prevSegment === 'users')         label = 'User Details'
      else if (prevSegment === 'events')   label = 'Event Details'
      else if (prevSegment === 'payments') label = 'Payment Details'
      else                                 label = `ID: ${segment.slice(0, 8)}…`
    } else {
      const menuItem = menuItems.find(
        item => item.path === href || item.path === `/${segment}`,
      )
      label =
        menuItem?.label ||
        segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    }

    // Explicit overrides
    const specialCases: Record<string, string> = {
      users:          'Users',
      verifications:  'Verifications',
      events:         'Events',
      payments:       'Payments',
      analytics:      'Analytics',
      settings:       'Settings',
      edit:           'Edit',
      view:           'View',
    }
    if (specialCases[segment]) label = specialCases[segment]

    return { href, label, isLast, isDynamic: isDynamicId }
  })

  // Always show "Dashboard" as first item (except on root '/')
  // For root '/', we already handled above with "Notifications"
  const showDashboard = true

  return (
    <nav className="mb-6 flex items-center text-sm" aria-label="Breadcrumb">
      <div className="flex items-center space-x-2 text-muted-foreground">
        {/* Dashboard home - always shows for non-root paths */}
        <Link
          href="/"
          prefetch
          className="hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <HugeiconsIcon icon={Home11Icon} className="w-4 h-4" />
          Dashboard
        </Link>

        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center">
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="w-4 h-4 mx-2 text-muted-foreground"
            />
            {crumb.isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                prefetch
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </nav>
  )
}