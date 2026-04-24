'use client';

import { useEffect, useRef } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Cancel01Icon as XIcon,
  Alert02Icon as AlertIcon,
  CheckmarkCircle01Icon as CheckCircleIcon,
  Mail01Icon as MailIcon,
  InformationCircleIcon as InfoIcon,
  LockIcon,
  CreditCardIcon as CardIcon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatDate, formatTime } from './public-event-helpers';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegistrationConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;

  event: {
    title: string;
    startDate?: string;     // e.g. ISO string or formatted date
    endDate?: string;          // e.g. "Saturday, May 10 · 2:00 PM"
    location?: string;
    isFree: boolean;
    price?: number;         // e.g. 2500  (in kobo/cents if applicable)
    currency?: string;      // e.g. "NGN" | "USD"
    imageUrl?: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function RegistrationConfirmModal({ open, onClose, onConfirm, isSubmitting = false, event }: RegistrationConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      // Move focus to confirm button for accessibility
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const isPaid = !event.isFree;

  return (
    /* Backdrop */
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Blurred scrim */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full sm:max-w-3xl bg-white dark:bg-gray-900',
          'rounded-2xl shadow-2xl',
          'flex flex-col overflow-hidden',
          'animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200',
        )}
      >
        {/* ── Header ── */}
        <div className={cn(
          'flex items-start justify-between gap-3 p-5 border-b',
          isPaid
            ? 'border-amber-100 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/30'
            : 'border-indigo-100 bg-indigo-50/60 dark:border-indigo-900/40 dark:bg-indigo-950/30',
        )}>
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={cn(
              'mt-0.5 flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full',
              isPaid
                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400'
                : 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400',
            )}>
              <HugeiconsIcon icon={isPaid ? CardIcon : CheckCircleIcon} size={18} />
            </div>
            {/* Title */}
            <div>
              <h2 id="modal-title" className="text-base font-semibold text-gray-900 dark:text-white leading-tight">
                {isPaid ? 'Confirm Payment & Registration' : 'Confirm Registration'}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {isPaid ? 'Review details before completing payment' : 'Almost there — confirm your spot'}
              </p>
            </div>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors disabled:pointer-events-none"
            aria-label="Close"
          >
            <HugeiconsIcon icon={XIcon} size={16} />
          </button>
        </div>

        {/* ── Event summary ── */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                alt=""
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                {event.title}
              </p>
              {event.startDate && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{formatDate(event.startDate)}, {formatTime(event.startDate)} - {formatDate(event.endDate)}, {formatTime(event.endDate)}</p>
              )}
              {event.location && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{event.location}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Price row (paid only) ── */}
        {isPaid && event.price !== undefined && (
          <div className="px-5 pb-3">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50">
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
                <HugeiconsIcon icon={LockIcon} size={12} />
                Amount to pay
              </div>
              <span className="text-sm font-bold text-amber-800 dark:text-amber-300">
                {formatCurrency(event.price, event.currency)}
              </span>
            </div>
          </div>
        )}

        {/* ── Free badge ── */}
        {!isPaid && (
          <div className="px-5 pb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
              <HugeiconsIcon icon={CheckCircleIcon} size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                This is a free event — no payment required
              </span>
            </div>
          </div>
        )}

        {/* ── Warning notices ── */}
        <div className="px-5 pb-4 space-y-2">
          {/* Non-cancellable */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40">
            <HugeiconsIcon
              icon={AlertIcon}
              size={14}
              className="mt-0.5 flex-shrink-0 text-red-500 dark:text-red-400"
            />
            <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
              <span className="font-semibold">This registration cannot be cancelled.</span>{' '}
              Once confirmed, your spot is secured and{isPaid ? ' your payment is final.' : ' this action cannot be undone.'}
            </p>
          </div>

          {/* Email receipt */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
            <HugeiconsIcon
              icon={MailIcon}
              size={14}
              className="mt-0.5 flex-shrink-0 text-blue-500 dark:text-blue-400"
            />
            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
              A confirmation{isPaid ? ' & payment receipt' : ''} will be sent to your registered email address.
            </p>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="px-5 pb-5 flex flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 h-10 py-2 text-sm border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={cn(
              'flex-1 h-10 py-2 text-sm font-semibold text-white transition-all',
              isPaid
                ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600'
                : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600',
              isSubmitting && 'opacity-75 cursor-not-allowed',
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing…
              </span>
            ) : isPaid ? (
              `Pay & Register`
            ) : (
              'Yes, Register Me'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}