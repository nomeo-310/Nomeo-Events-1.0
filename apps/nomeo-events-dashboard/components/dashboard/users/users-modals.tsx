// users-modals.tsx
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ClockIcon,
  AlertCircleIcon,
  CheckmarkBadge02Icon as BadgeCheckIcon,
  SecurityCheckIcon as ShieldCheckIcon
} from "@hugeicons/core-free-icons";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReusableModal, ActionModal, ConfirmModal } from '@/components/ui/reusable-modal';

import { getInitials, getStatusBadge, getVerificationBadge, getStatusIcon, formatDateTime } from './users-types';
import type { Profile } from '@/hooks/use-profiles';

// ─── View User Modal ─────────────────────────────────────────────────────────
interface ViewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
}

export const ViewUserModal = ({ isOpen, onClose, profile }: ViewUserModalProps) => (
  <ReusableModal
    isOpen={isOpen}
    onClose={onClose}
    title="User Details"
    description="Complete information about the user account"
    size="full"
    className="!max-w-5xl"
    actions={[{ label: 'Close', onClick: onClose, variant: 'outline' }]}
  >
    {profile && (
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <Avatar className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg ring-4 ring-white dark:ring-gray-900 flex-shrink-0">
            {profile.profilePicture?.secure_url ? (
              <AvatarImage src={profile.profilePicture.secure_url} alt={profile.fullName} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-bold">
              {getInitials(profile.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{profile.fullName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{profile.displayName || profile.fullName}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant={getStatusBadge(profile.activeStatus)} className="gap-1">
                <HugeiconsIcon icon={getStatusIcon(profile.activeStatus)} size={12} />
                {profile.activeStatus}
              </Badge>
              <Badge variant={getVerificationBadge(profile.verificationStatus)} className="gap-1">
                {profile.verificationStatus === 'verified' && <HugeiconsIcon icon={BadgeCheckIcon} size={12} />}
                {profile.verificationStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Personal Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Full Name</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{profile.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Display Name</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{profile.displayName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Account Type</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{profile.accountType}</p>
            </div>
            {profile.organizationName && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Organization</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{profile.organizationName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{profile.contact.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Phone Number</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{profile.contact.phoneNumber}</p>
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Location</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">City</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{profile.location.city || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">State</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{profile.location.state || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Account Metadata */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Account Metadata</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDateTime(profile.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Active</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{profile.lastActiveAt ? formatDateTime(profile.lastActiveAt) : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    )}
  </ReusableModal>
);

// ─── Suspend Modal ───────────────────────────────────────────────────────────
interface SuspendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  profile: Profile | null;
  isLoading: boolean;
  suspendReason: string;
  setSuspendReason: (value: string) => void;
  suspendDuration: string;
  setSuspendDuration: (value: string) => void;
}

export const SuspendModal = ({
  isOpen,
  onClose,
  onConfirm,
  profile,
  isLoading,
  suspendReason,
  setSuspendReason,
  suspendDuration,
  setSuspendDuration,
}: SuspendModalProps) => (
  <ActionModal
    isOpen={isOpen}
    onClose={onClose}
    onAction={onConfirm}
    title="Suspend Account"
    description="This will temporarily suspend the user's account"
    actionLabel="Suspend Account"
    cancelLabel="Cancel"
    actionVariant="secondary"
    isLoading={isLoading}
    disabled={!suspendReason}
    size="md"
  >
    <div className="space-y-4">
      <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-lg">
        <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1.5">Suspension Details:</p>
          <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
            <li>· User: {profile?.fullName}</li>
            <li>· Email: {profile?.contact.email}</li>
            <li>· Suspension will hide all events and block access</li>
          </ul>
        </div>
      </div>
      
      <div>
        <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason for Suspension</Label>
        <Textarea
          placeholder="Enter the reason for suspension..."
          value={suspendReason}
          onChange={(e) => setSuspendReason(e.target.value)}
          className="mt-1.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          rows={3}
        />
      </div>
      
      <div>
        <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Suspension Duration (days)</Label>
        <Select value={suspendDuration} onValueChange={(v) => setSuspendDuration(v ?? "14")}>
          <SelectTrigger className="mt-1.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
            <SelectItem value="365">1 year</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </ActionModal>
);

// ─── Lift Suspension Modal ───────────────────────────────────────────────────
interface LiftSuspensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  profile: Profile | null;
  isLoading: boolean;
}

export const LiftSuspensionModal = ({ isOpen, onClose, onConfirm, profile, isLoading }: LiftSuspensionModalProps) => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Lift Suspension"
    description={`Are you sure you want to lift the suspension for ${profile?.fullName}'s account?`}
    confirmLabel="Lift Suspension"
    cancelLabel="Cancel"
    confirmVariant="danger"
    isLoading={isLoading}
    size="md"
  >
    <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50 rounded-lg mt-4">
      <HugeiconsIcon icon={ShieldCheckIcon} className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1.5">Lifting suspension will:</p>
        <ul className="space-y-1 text-xs text-green-700 dark:text-green-400">
          <li>· Restore full account access</li>
          <li>· Reactivate all events</li>
          <li>· Resume subscription if applicable</li>
          <li>· Send confirmation email to the user</li>
        </ul>
      </div>
    </div>
  </ConfirmModal>
);

// ─── Delete Modal ────────────────────────────────────────────────────────────
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  profile: Profile | null;
  isLoading: boolean;
  deleteReason: string;
  setDeleteReason: (value: string) => void;
  hardDelete: boolean;
  setHardDelete: (value: boolean) => void;
}

export const DeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  profile,
  isLoading,
  deleteReason,
  setDeleteReason,
  hardDelete,
  setHardDelete,
}: DeleteModalProps) => (
  <ConfirmModal
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Delete Account"
    description={`Are you sure you want to ${hardDelete ? 'permanently delete' : 'schedule deletion for'} ${profile?.fullName}'s account? ${!hardDelete ? 'This will give a 30-day grace period before permanent deletion.' : 'This action cannot be undone.'}`}
    confirmLabel={hardDelete ? 'Permanently Delete' : 'Schedule Deletion'}
    cancelLabel="Cancel"
    confirmVariant="danger"
    isLoading={isLoading}
    size="md"
  >
    <div className="mt-4 space-y-4">
      <div>
        <Label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Reason for Deletion</Label>
        <Textarea
          placeholder="Enter the reason for deletion..."
          value={deleteReason}
          onChange={(e) => setDeleteReason(e.target.value)}
          className="mt-1.5 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          rows={2}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Checkbox
          id="hardDelete"
          checked={hardDelete}
          onCheckedChange={(checked) => setHardDelete(checked as boolean)}
        />
        <Label htmlFor="hardDelete" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          Permanently delete immediately (no grace period)
        </Label>
      </div>
      {!hardDelete && (
        <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
          <HugeiconsIcon icon={ClockIcon} className="h-3 w-3" />
          Account will be scheduled for deletion with a 30-day grace period
        </p>
      )}
    </div>
  </ConfirmModal>
);