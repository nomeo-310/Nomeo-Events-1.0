'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  LockIcon,
  Alert02Icon,
  UserRemove01Icon,
} from '@hugeicons/core-free-icons'

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Admin lock conditions:
 * - 'inactive'      → account exists but has not been activated yet
 * - 'suspended'     → admin has been suspended by super-admin
 * - 'unauthorized'  → active admin accessing a route above their role
 */
export type AdminLockCondition = 'inactive' | 'suspended' | 'unauthorized'

export interface AdminLockConfig {
  icon: 'lock' | 'suspended' | 'unauthorized'
  title: string
  description: string
  action?: { label: string; href?: string; onClick?: () => void }
  secondaryAction?: { label: string; href?: string; onClick?: () => void }
}

interface AdminPageLockProps {
  locked?: boolean
  condition?: AdminLockCondition
  config?: AdminLockConfig
}

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESETS: Record<AdminLockCondition, AdminLockConfig> = {
  inactive: {
    icon: 'lock',
    title: 'Account not yet active',
    description:
      'Your admin account has been created but is pending activation by a super-admin. You will be notified once access is granted.',
    secondaryAction: { label: 'Contact support', href: 'mailto:support@nomeo.app' },
  },
  suspended: {
    icon: 'suspended',
    title: 'Account suspended',
    description:
      'Your admin account has been temporarily suspended. Please contact a super-admin or the support team to resolve this.',
    action: { label: 'Contact support', href: 'mailto:support@nomeo.app' },
  },
  unauthorized: {
    icon: 'unauthorized',
    title: 'Access restricted',
    description:
      'You do not have the requiblue permissions to view this page. If you believe this is a mistake, contact a super-admin.',
    secondaryAction: { label: 'Go to dashboard', href: '/' },
  },
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICONS = {
  lock:         LockIcon,
  suspended:    Alert02Icon,
  unauthorized: UserRemove01Icon,
}

function LockIllustration({ type }: { type: AdminLockConfig['icon'] }) {
  const IconComponent = ICONS[type]
  return (
    <HugeiconsIcon icon={IconComponent} className="w-10 h-10 lg:w-12 lg:h-12" />
  )
}

// ─── Color themes ─────────────────────────────────────────────────────────────

type ColorTheme = {
  iconBg: string
  iconText: string
  button: string
  buttonHover: string
}

function getColorTheme(condition?: AdminLockCondition): ColorTheme {
  switch (condition) {
    case 'suspended':
      return {
        iconBg:      'bg-blue-50 dark:bg-blue-900/20',
        iconText:    'text-blue-500 dark:text-blue-400',
        button:      'bg-blue-500 dark:bg-blue-400 text-white',
        buttonHover: 'hover:bg-blue-600 dark:hover:bg-blue-300',
      }
    case 'unauthorized':
      return {
        iconBg:      'bg-amber-50 dark:bg-amber-900/20',
        iconText:    'text-amber-500 dark:text-amber-400',
        button:      'bg-amber-500 dark:bg-amber-400 text-white',
        buttonHover: 'hover:bg-amber-600 dark:hover:bg-amber-300',
      }
    case 'inactive':
    default:
      return {
        iconBg:      'bg-gray-100 dark:bg-gray-700/60',
        iconText:    'text-gray-500 dark:text-gray-400',
        button:      'bg-gray-900 dark:bg-white text-white dark:text-gray-900',
        buttonHover: 'hover:bg-gray-700 dark:hover:bg-gray-100',
      }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminPageLock({ locked = true, condition, config }: AdminPageLockProps) {
  const router = useRouter()

  const cfg: AdminLockConfig =
    config ??
    (condition ? PRESETS[condition] : PRESETS.inactive)

  const theme = getColorTheme(condition)

  const handleAction = (action?: AdminLockConfig['action']) => {
    if (!action) return
    if (action.onClick) return action.onClick()
    if (!action.href) return
    action.href.startsWith('mailto')
      ? (window.location.href = action.href)
      : router.push(action.href)
  }

  return (
    <AnimatePresence>
      {locked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-40 flex items-center justify-center"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gray-50/80 dark:bg-gray-900/85 backdrop-blur-[3px]" />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 mx-4 w-full max-w-xl"
          >
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-800 shadow-2xl shadow-gray-900/10 dark:shadow-gray-900/40 p-8 text-center">

              {/* Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex justify-center mb-5"
              >
                <div
                  className={`flex items-center justify-center w-18 h-18 lg:w-24 lg:h-24 rounded-2xl ${theme.iconBg} ${theme.iconText}`}
                >
                  <LockIllustration type={cfg.icon} />
                </div>
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
              >
                <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white mb-2 tracking-tight leading-snug">
                  {cfg.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-7">
                  {cfg.description}
                </p>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="flex flex-col gap-2.5"
              >
                {cfg.action && (
                  <button
                    onClick={() => handleAction(cfg.action)}
                    className={`w-full rounded-xl text-sm font-medium px-6 py-2.5 transition-colors cursor-pointer ${theme.button} ${theme.buttonHover}`}
                  >
                    {cfg.action.label}
                  </button>
                )}
                {cfg.secondaryAction && (
                  <button
                    onClick={() => handleAction(cfg.secondaryAction)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer text-gray-500 dark:text-gray-400 text-sm px-6 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                  >
                    {cfg.secondaryAction.label}
                  </button>
                )}
              </motion.div>

              <p className="mt-5 text-xs text-gray-400 dark:text-gray-600">
                You can still navigate to other pages from the sidebar.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}