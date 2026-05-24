'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

interface ReusableModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: ModalAction[];
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  showCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[90vw]',
};

export function ReusableModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  actions,
  size = 'md',
  closable = true,
  showCloseButton = true,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  footer,
  className,
  maxHeight = '80vh',
}: ReusableModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && closable && e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeOnEscape, closable, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnOutsideClick && closable && e.target === e.currentTarget) {
      onClose();
    }
  };

  const getActionButtonStyles = (variant: ModalAction['variant'] = 'primary') => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white';
      case 'danger':
        return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white';
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white';
      case 'outline':
      default:
        return 'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700';
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-200"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={cn(
          "relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full flex flex-col overflow-hidden",
          "animate-in fade-in zoom-in duration-200",
          sizeClasses[size],
          className
        )}
        style={{ maxHeight }}
      >
        {/* Header - Fixed */}
        <div className={cn("flex items-start justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0", !title && !description && "border-b-0")}>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
          {showCloseButton && closable && (
            <button
              onClick={onClose}
              className="ml-4 flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          {children}
        </div>

        {/* Footer - Fixed */}
        {(footer || (actions && actions.length > 0)) && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex-shrink-0">
            {footer ? (
              footer
            ) : actions && (
              <div className="flex justify-end gap-3">
                {actions.map((action, index) => (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    disabled={action.disabled || action.loading}
                    className={cn(
                      "min-w-[80px] px-4 h-10 lg:h-11",
                      getActionButtonStyles(action.variant)
                    )}
                  >
                    {action.loading && (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    )}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// Confirmation Modal - Pre-configublue for confirm/cancel actions
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger' | 'secondary';
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  size = 'md',
}: ConfirmModalProps) {
  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description=""
      size={size}
      maxHeight="60vh"
      actions={[
        {
          label: cancelLabel,
          onClick: onClose,
          variant: 'outline',
          disabled: isLoading,
        },
        {
          label: confirmLabel,
          onClick: onConfirm,
          variant: confirmVariant,
          loading: isLoading,
          disabled: isLoading,
        },
      ]}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
          confirmVariant === 'danger' 
            ? "bg-blue-100 dark:bg-blue-900/30" 
            : "bg-blue-100 dark:bg-blue-900/30"
        )}>
          {confirmVariant === 'danger' ? (
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
    </ReusableModal>
  );
}

// Action Modal - For forms and complex content
interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  actionLabel: string;
  cancelLabel?: string;
  actionVariant?: 'primary' | 'danger' | 'secondary';
  isLoading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnAction?: boolean;
}

export function ActionModal({
  isOpen,
  onClose,
  onAction,
  title,
  description,
  children,
  actionLabel,
  cancelLabel = 'Cancel',
  actionVariant = 'primary',
  isLoading = false,
  disabled = false,
  size = 'md',
  closeOnAction = true,
}: ActionModalProps) {
  const handleAction = () => {
    onAction();
    if (closeOnAction) {
      onClose();
    }
  };

  return (
    <ReusableModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      maxHeight="80vh"
      actions={[
        {
          label: cancelLabel,
          onClick: onClose,
          variant: 'outline',
          disabled: isLoading,
        },
        {
          label: actionLabel,
          onClick: handleAction,
          variant: actionVariant,
          loading: isLoading,
          disabled: disabled || isLoading,
        },
      ]}
    >
      {children}
    </ReusableModal>
  );
}