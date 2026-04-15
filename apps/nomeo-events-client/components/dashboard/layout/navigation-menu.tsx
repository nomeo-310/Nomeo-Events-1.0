'use client'

import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { 
  DashboardSquareSettingIcon as LayoutDashboard,
  Calendar01Icon as Calendar,
  BarChartIcon as BarChart3,
  CreditCardIcon as CreditCard,
  User03Icon as User,
  ToolsIcon,
} from '@hugeicons/core-free-icons'

interface NavigationMenuProps {
  menuItems: Array<{
    id: string
    label: string
    path: string
    icon: any
  }>
  isMenuItemActive: (path: string) => boolean
  onItemClick?: () => void
  className?: string
}

export const NavigationMenu = ({ menuItems, isMenuItemActive, onItemClick, className = '' }: NavigationMenuProps) => {
  return (
    <nav className={className}>
      {menuItems.map((item) => {
        const Icon = item.icon
        const isActive = isMenuItemActive(item.path)

        return (
          <Link
            key={item.id}
            href={item.path}
            onClick={onItemClick}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
              ${isActive 
                ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            <HugeiconsIcon icon={Icon} className="w-5 h-5" />
            <span className="font-medium text-sm">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}