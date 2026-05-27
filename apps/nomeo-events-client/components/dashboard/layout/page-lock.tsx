'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  LockIcon,
  LicenseDraftIcon,
  Clock01Icon,
  UserIcon,
  Alert02Icon,
  CheckmarkBadge02Icon,
  Mail01Icon,          
} from '@hugeicons/core-free-icons'

// ─── Types ────────────────────────────────────────────────────────────────────

export type LockCondition =
  | 'subscription_expired'
  | 'subscription_required'
  | 'unverified'
  | 'verification_pending'
  | 'incomplete_profile'
  | 'suspended'
  | 'email_unverified'

export interface LockConfig {
  icon?: 'lock' | 'subscription' | 'verify' | 'pending' | 'profile' | 'suspended' | 'email'
  title: string
  description: string
  action?: { label: string; href?: string; onClick?: () => void }
  secondaryAction?: { label: string; href?: string; onClick?: () => void }
}

interface PageLockProps {
  condition?: LockCondition
  config?: LockConfig
  locked?: boolean
  onVerifyEmail?: () => void
}

// ─── Presets ──────────────────────────────────────────────────────────────────

// email_unverified preset is built dynamically in the component
// because its action.onClick depends on the onVerifyEmail prop
const STATIC_PRESETS: Record<Exclude<LockCondition, 'email_unverified'>, LockConfig> = {
  subscription_expired: {
    icon: 'subscription',
    title: 'Your trial has ended',
    description:
      'Your 14-day free trial has expired. Choose a plan to continue creating events and managing your profile.',
    action: { label: 'View plans', href: '/subscriptions' },
    secondaryAction: { label: 'Compare plans', href: '/pricing#comparison' },
  },
  subscription_required: {
    icon: 'lock',
    title: 'Upgrade to access this',
    description:
      'This feature is available on higher plans. Upgrade to unlock it and everything else your tier includes.',
    action: { label: 'Upgrade plan', href: '/subscriptions' },
  },
  unverified: {
    icon: 'verify',
    title: 'Verify your account',
    description:
      'Complete identity verification to publish events and receive payments. It only takes a few minutes.',
    action: { label: 'Start verification', href: '/dashboard/profile?activeTab=verification' },
  },
  verification_pending: {
    icon: 'pending',
    title: 'Verification in review',
    description:
      'Your documents have been submitted and are currently being reviewed by our team. This usually takes 1–2 business days. You will be notified once approved.',
    secondaryAction: { label: 'View submission', href: '/dashboard/profile?activeTab=verification' },
  },
  incomplete_profile: {
    icon: 'profile',
    title: 'Complete your profile',
    description:
      'Finish setting up your profile before you can create and publish events. Attendees trust complete profiles.',
    action: { label: 'Complete profile', href: '/dashboard/profile' },
  },
  suspended: {
    icon: 'suspended',
    title: 'Account suspended',
    description:
      'Your account has been temporarily suspended. Please contact our support team to resolve this.',
    action: { label: 'Contact support', href: 'mailto:support@nomeo.app' },
  },
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const LOCK_ILLUSTRATIONS = {
  lock:         LockIcon,
  subscription: LicenseDraftIcon,
  verify:       CheckmarkBadge02Icon,
  pending:      Clock01Icon,
  profile:      UserIcon,
  suspended:    Alert02Icon,
  email:        Mail01Icon,            // ← new
}

function LockIllustration({ type }: { type: LockConfig['icon'] }) {
  const IconComponent = LOCK_ILLUSTRATIONS[type ?? 'lock']
  return (
    <HugeiconsIcon
      icon={IconComponent}
      className="w-10 h-10 lg:w-12 lg:h-12"
    />
  )
}

// ─── Color themes per condition ───────────────────────────────────────────────

type ColorTheme = {
  iconBg: string
  iconText: string
  button: string
  buttonHover: string
}

function getColorTheme(condition?: LockCondition): ColorTheme {
  switch (condition) {
    case 'email_unverified':
      return {
        iconBg:      'bg-indigo-50 dark:bg-indigo-900/20',
        iconText:    'text-indigo-500 dark:text-indigo-400',
        button:      'bg-indigo-600 dark:bg-indigo-500 text-white',
        buttonHover: 'hover:bg-indigo-700 dark:hover:bg-indigo-400',
      }
    case 'verification_pending':
      return {
        iconBg:      'bg-amber-50 dark:bg-amber-900/20',
        iconText:    'text-amber-500 dark:text-amber-400',
        button:      'bg-amber-500 dark:bg-amber-400 text-white dark:text-amber-950',
        buttonHover: 'hover:bg-amber-600 dark:hover:bg-amber-300',
      }
    case 'suspended':
      return {
        iconBg:      'bg-red-50 dark:bg-red-900/20',
        iconText:    'text-red-500 dark:text-red-400',
        button:      'bg-red-500 dark:bg-red-400 text-white dark:text-red-950',
        buttonHover: 'hover:bg-red-600 dark:hover:bg-red-300',
      }
    case 'unverified':
      return {
        iconBg:      'bg-blue-50 dark:bg-blue-900/20',
        iconText:    'text-blue-500 dark:text-blue-400',
        button:      'bg-blue-500 dark:bg-blue-400 text-white dark:text-blue-950',
        buttonHover: 'hover:bg-blue-600 dark:hover:bg-blue-300',
      }
    case 'subscription_expired':
      return {
        iconBg:      'bg-orange-50 dark:bg-orange-900/20',
        iconText:    'text-orange-500 dark:text-orange-400',
        button:      'bg-orange-500 dark:bg-orange-400 text-white dark:text-orange-950',
        buttonHover: 'hover:bg-orange-600 dark:hover:bg-orange-300',
      }
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

export function PageLock({
  condition,
  config,
  locked = true,
  onVerifyEmail,           // ← new prop
}: PageLockProps) {
  const router = useRouter()

  // Build the email_unverified preset dynamically so onClick is wired up
  const emailUnverifiedPreset: LockConfig = {
    icon: 'email',
    title: 'Verify your email to continue',
    description:
      'You need to verify your email address before accessing this page. Check your inbox for the verification code we sent you.',
    action: {
      label: 'Verify email',
      onClick: onVerifyEmail, // ← opens auth modal from parent
    },
  }

  const cfg: LockConfig =
    config ??
    (condition === 'email_unverified'
      ? emailUnverifiedPreset
      : condition
      ? STATIC_PRESETS[condition]
      : STATIC_PRESETS.subscription_expired)

  const theme = getColorTheme(condition)

  const handleAction = (action?: LockConfig['action']) => {
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
                <div className={`flex items-center justify-center w-18 h-18 lg:w-24 lg:h-24 rounded-2xl ${theme.iconBg} ${theme.iconText}`}>
                  <LockIllustration type={cfg.icon ?? 'lock'} />
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