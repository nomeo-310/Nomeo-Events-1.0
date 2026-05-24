'use client'

import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'

interface NavigationMenuProps {
  menuItems: Array<{
    id: string
    label: string
    path: string
    icon: any
    group?: string
  }>
  isMenuItemActive: (path: string) => boolean
  onItemClick?: () => void
  className?: string
  groupLabels?: Record<string, string> // Optional: custom group labels
}

export const NavigationMenu = ({ 
  menuItems, 
  isMenuItemActive, 
  onItemClick, 
  className = ''
}: NavigationMenuProps) => {
  const groupedItems = menuItems.reduce((acc, item) => {
    const group = item.group || 'default'
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {} as Record<string, typeof menuItems>)

  return (
    <nav className={className}>
      {Object.entries(groupedItems).map(([group, items], groupIndex) => (
        <div key={group}>
          {groupIndex > 0 && (
            <div className="my-3 border-t border-gray-200 dark:border-gray-700" />
          )}
          {items.map((item) => {
            const isActive = isMenuItemActive(item.path)
            return (
              <Link
                prefetch
                key={item.id}
                href={item.path}
                onClick={onItemClick}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-all mb-2
                  ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <HugeiconsIcon icon={item.icon} className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}