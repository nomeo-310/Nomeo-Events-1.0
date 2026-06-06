// admin-modals.tsx
"use client";

import React from 'react';
import { HugeiconsIcon } from "@hugeicons/react";
import {  KeyIcon } from "@hugeicons/core-free-icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReusableModal, ConfirmModal, ActionModal } from '@/components/ui/reusable-modal';

import { getInitials, formatDateTime, getRoleColor, getStatusBadge, getStatusIcon } from './admin-types';
import type { AdminUser } from '@/hooks/use-admin-management';

interface ViewAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: AdminUser | null;
}

export const ViewAdminModal = ({ isOpen, onClose, admin }: ViewAdminModalProps) => (
  <ReusableModal
    isOpen={isOpen}
    onClose={onClose}
    title="Admin Details"
    description="Complete information about the administrator"
    size="full"
    className="!max-w-4xl"
    actions={[{ label: 'Close', onClick: onClose, variant: 'outline' }]}
  >
    {admin && (
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <Avatar className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg ring-4 ring-white dark:ring-gray-900 flex-shrink-0">
            <AvatarFallback className="bg-transparent text-white text-xl font-bold">
              {getInitials(admin.displayName || admin.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{admin.displayName || admin.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{admin.name}</p>
            <div className="flex gap-2 mt-2">
              <span className={cn("px-2 py-1 text-xs font-medium rounded-full", getRoleColor(admin.role))}>
                {admin.role.replace('_', ' ').toUpperCase()}
              </span>
              <Badge variant={getStatusBadge(admin.adminStatus)} className="gap-1">
                <HugeiconsIcon icon={getStatusIcon(admin.adminStatus)} size={12} />
                {admin.adminStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{admin.email}</p>
            </div>
          </div>
        </div>

        {/* Account Metadata */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Account Metadata</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(admin.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Login</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{admin.lastLoginAt ? formatDateTime(admin.lastLoginAt) : 'Never'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Login Count</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{admin.loginCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Onboarded</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{admin.isOnboarded ? 'Yes' : 'No'}</p>
            </div>
            {admin.lastLoginIP && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Last Login IP</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{admin.lastLoginIP}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  </ReusableModal>
);

// Import missing
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: () => void;
  formData: {
    email: string;
    name: string;
    displayName: string;
    role: 'super_admin' | 'admin' | 'moderator' | 'support';
    sendEmail: boolean;
  };
  onFormChange: (data: any) => void;
  isLoading: boolean;
}

export const CreateAdminModal = ({ isOpen, onClose, onCreate, formData, onFormChange, isLoading }: CreateAdminModalProps) => (
  <ActionModal
    isOpen={isOpen}
    onClose={onClose}
    onAction={onCreate}
    title="Add New Admin"
    description="Create a new administrator account"
    actionLabel="Create Admin"
    cancelLabel="Cancel"
    actionVariant="danger"
    isLoading={isLoading}
    size="md"
    closeOnAction={false}
  >
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Email *</Label>
        <Input
          type="email"
          placeholder="admin@example.com"
          value={formData.email}
          onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
          className="mt-1.5 dark:bg-gray-800 dark:border-gray-700"
          required
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Full Name *</Label>
        <Input
          placeholder="John Doe"
          value={formData.name}
          onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
          className="mt-1.5 dark:bg-gray-800 dark:border-gray-700"
          required
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Display Name *</Label>
        <Input
          placeholder="John D."
          value={formData.displayName}
          onChange={(e) => onFormChange({ ...formData, displayName: e.target.value })}
          className="mt-1.5 dark:bg-gray-800 dark:border-gray-700"
          required
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Role *</Label>
        <Select value={formData.role} onValueChange={(v) => onFormChange({ ...formData, role: v as any })}>
          <SelectTrigger className="mt-1.5 dark:bg-gray-800 dark:border-gray-700 lg:h-11 h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-800 dark:border-gray-700 p-1">
            <SelectItem value="support">Support</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="sendEmail"
          checked={formData.sendEmail}
          onCheckedChange={(checked) => onFormChange({ ...formData, sendEmail: checked as boolean })}
        />
        <Label htmlFor="sendEmail" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          Send invitation email
        </Label>
      </div>
    </div>
  </ActionModal>
);

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
  admin: AdminUser | null;
  passwordData: { newPassword: string; confirmPassword: string };
  onPasswordChange: (data: any) => void;
  isLoading: boolean;
}

export const ResetPasswordModal = ({ isOpen, onClose, onReset, admin, passwordData, onPasswordChange, isLoading }: ResetPasswordModalProps) => (
  <ActionModal
    isOpen={isOpen}
    onClose={onClose}
    onAction={onReset}
    title="Reset Password"
    description={`Reset password for ${admin?.displayName}`}
    actionLabel="Reset Password"
    cancelLabel="Cancel"
    actionVariant="primary"
    isLoading={isLoading}
    size="md"
    closeOnAction={false}
  >
    <div className="space-y-4">
      <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-lg">
        <HugeiconsIcon icon={KeyIcon} className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1.5">Password Reset Details:</p>
          <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
            <li>· Admin: {admin?.displayName}</li>
            <li>· Email: {admin?.email}</li>
            <li>· A password reset email will be sent</li>
          </ul>
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">New Password *</Label>
        <Input
          type="password"
          placeholder="Enter new password"
          value={passwordData.newPassword}
          onChange={(e) => onPasswordChange({ ...passwordData, newPassword: e.target.value })}
          className="mt-1.5 dark:bg-gray-800 dark:border-gray-700"
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Confirm Password *</Label>
        <Input
          type="password"
          placeholder="Confirm new password"
          value={passwordData.confirmPassword}
          onChange={(e) => onPasswordChange({ ...passwordData, confirmPassword: e.target.value })}
          className="mt-1.5 dark:bg-gray-800 dark:border-gray-700"
        />
      </div>
    </div>
  </ActionModal>
);

interface RoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  actionLabel: string;
  admin: AdminUser | null;
  newRole: string;
  reason: string;
  onReasonChange: (reason: string) => void;
  isLoading: boolean;
  icon: any;
  iconColor: string;
}

export const RoleChangeModal = ({ isOpen, onClose, onConfirm, title, description, actionLabel, admin, newRole, reason, onReasonChange, isLoading, icon, iconColor }: RoleChangeModalProps) => (
  <ActionModal
    isOpen={isOpen}
    onClose={onClose}
    onAction={onConfirm}
    title={title}
    description={description}
    actionLabel={actionLabel}
    cancelLabel="Cancel"
    actionVariant={actionLabel === 'Promote' ? 'danger' : 'secondary'}
    isLoading={isLoading}
    size="md"
    closeOnAction={false}
  >
    <div className="space-y-4">
      <div className={`flex gap-3 p-4 ${iconColor === 'green' ? 'bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/50' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50'} rounded-lg`}>
        <HugeiconsIcon icon={icon} className={`h-4 w-4 ${iconColor === 'green' ? 'text-green-500 dark:text-green-400' : 'text-amber-500 dark:text-amber-400'} flex-shrink-0 mt-0.5`} />
        <div>
          <p className={`text-sm font-semibold ${iconColor === 'green' ? 'text-green-800 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'} mb-1.5`}>
            {title} Details:
          </p>
          <ul className={`space-y-1 text-xs ${iconColor === 'green' ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
            <li>· Admin: {admin?.displayName}</li>
            <li>· Current Role: {admin?.role}</li>
            <li>· New Role: {newRole}</li>
          </ul>
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason for {title}</Label>
        <Textarea
          placeholder={`Enter the reason for ${title.toLowerCase()}...`}
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          className="mt-1.5 dark:bg-gray-800 dark:border-gray-700"
          rows={3}
        />
      </div>
    </div>
  </ActionModal>
);

interface ConfirmModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  children: React.ReactNode;
  isLoading: boolean;
}

export const ConfirmModalWrapper = ({ isOpen, onClose, onConfirm, title, description, confirmLabel, children, isLoading }: ConfirmModalWrapperProps) => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={title}
    description={description}
    confirmLabel={confirmLabel}
    cancelLabel="Cancel"
    confirmVariant="danger"
    isLoading={isLoading}
    size="md"
  >
    {children}
  </ConfirmModal>
);