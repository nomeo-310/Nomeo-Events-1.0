'use client'

import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { Home04Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'

interface BreadcrumbProps {
  pathname: string | null
  isMenuItemActive: (path: string) => boolean
  menuItems?: any[]
}

export const Breadcrumb = ({ pathname, isMenuItemActive, menuItems = [] }: BreadcrumbProps) => {
  if (!pathname) return null

  return (
    <div className="mb-6">
      <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <Link href="/" className="hover:text-indigo-500 transition-colors flex items-center gap-1">
          <HugeiconsIcon icon={Home04Icon} className="w-4 h-4" />
          Home
        </Link>
        <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
        <Link href="/dashboard" className="hover:text-indigo-500 transition-colors">Dashboard</Link>
        {pathname !== '/dashboard' && (
          <>
            <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
            <span className="text-gray-900 dark:text-white font-medium">
              {menuItems.find(item => isMenuItemActive(item.path))?.label || 'Page'}
            </span>
          </>
        )}
      </nav>
    </div>
  )
}