// users-mobile-card.tsx
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ViewIcon,
  UnavailableIcon as BanIcon,
  ClockIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  CircleUnlock02Icon as UnlockIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { getInitials, getStatusBadge, getVerificationBadge, getStatusIcon, formatDate } from './users-types';
import type { Profile } from '@/hooks/use-profiles';

interface MobileUserCardProps {
  profile: Profile;
  isSelected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onSuspend: () => void;
  onLiftSuspension: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isScheduled: boolean;
}

export const MobileUserCard = ({
  profile,
  isSelected,
  onToggleSelect,
  onView,
  onSuspend,
  onLiftSuspension,
  isExpanded,
  onToggleExpand,
  isScheduled,
}: MobileUserCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
        <Avatar className="h-9 w-9 rounded-full flex-shrink-0">
          {profile.profilePicture?.secure_url ? (
            <AvatarImage src={profile.profilePicture.secure_url} alt={profile.fullName} />
          ) : null}
          <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">
            {getInitials(profile.fullName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{profile.fullName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile.contact.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={getStatusBadge(profile.activeStatus)} className="gap-1">
            <HugeiconsIcon icon={getStatusIcon(profile.activeStatus)} size={12} />
            {profile.activeStatus}
          </Badge>
          <button
            onClick={onToggleExpand}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <HugeiconsIcon
              icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
              className="h-4 w-4"
            />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Phone</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{profile.contact.phoneNumber}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Type</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">{profile.accountType}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Joined</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatDate(profile.createdAt)}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Verification</p>
              <Badge variant={getVerificationBadge(profile.verificationStatus)} className="mt-1">
                {profile.verificationStatus}
              </Badge>
            </div>
          </div>

          {profile.organizationName && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Organization</p>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{profile.organizationName}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {isScheduled ? (
              <div className="flex-1 flex items-center justify-center gap-2 h-8 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400">
                <HugeiconsIcon icon={ClockIcon} className="h-3 w-3" />
                Auto-deleted on {profile.metadata?.finalDeletionDate
                  ? formatDate(profile.metadata.finalDeletionDate)
                  : 'N/A'}
              </div>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs dark:border-gray-700"
                  onClick={onView}
                >
                  <HugeiconsIcon icon={ViewIcon} className="h-3 w-3 mr-1" /> View
                </Button>
                {profile.activeStatus === 'active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs border-amber-200 text-amber-600 dark:border-amber-800 dark:text-amber-400"
                    onClick={onSuspend}
                  >
                    <HugeiconsIcon icon={BanIcon} className="h-3 w-3 mr-1" /> Suspend
                  </Button>
                )}
                {profile.activeStatus === 'suspended' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs border-green-200 text-green-600 dark:border-green-800 dark:text-green-400"
                    onClick={onLiftSuspension}
                  >
                    <HugeiconsIcon icon={UnlockIcon} className="h-3 w-3 mr-1" /> Lift Suspension
                  </Button>
                )}
              </>
            )}
          </div>
          {isScheduled && profile.metadata?.finalDeletionDate && (
            <div className="col-span-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-lg p-2">
              <p className="text-[10px] text-blue-400 uppercase tracking-wide">Scheduled deletion</p>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {formatDate(profile.metadata.finalDeletionDate)}
              </p>
              {profile.metadata.deletionReason && (
                <p className="text-[10px] text-blue-400 mt-0.5">{profile.metadata.deletionReason}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};