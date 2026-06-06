// users-table.tsx
import React from 'react';
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon, 
  Building02Icon, 
  Mail01Icon, 
  SmartPhone02Icon as Phone01Icon, 
  RefreshIcon, 
  MoreHorizontalCircle01Icon,
  Delete03Icon,
  ViewIcon,
  UnavailableIcon as BanIcon,
  ClockIcon,
  UserCheck01Icon,
  UserRemove01Icon,
  CheckmarkBadge02Icon as BadgeCheckIcon,
  CircleUnlock02Icon as UnlockIcon,
} from "@hugeicons/core-free-icons";
import { cn } from '@/lib/utils';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { ActionDropdown } from './users-components';
import { UsersSkeleton } from './users-skeletons';
import { getInitials, getStatusBadge, getVerificationBadge, getStatusIcon, formatDate } from './users-types';
import type { Profile } from '@/hooks/use-profiles';
import type { DropdownItem, UserTab } from './users-types';

interface UsersTableProps {
  profiles: Profile[];
  selectedUsers: Set<string>;
  activeTab: UserTab;
  isFetching: boolean;
  isLoading: boolean;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onView: (profile: Profile) => void;
  onDeactivate: (id: string, reason?: string) => void;
  onReactivate: (id: string) => void;
  onSuspend: (profile: Profile) => void;
  onLiftSuspension: (profile: Profile) => void;
  onDelete: (profile: Profile) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
}

export const UsersTable = ({
  profiles,
  selectedUsers,
  activeTab,
  isFetching,
  isLoading,
  onToggleSelect,
  onSelectAll,
  onView,
  onDeactivate,
  onReactivate,
  onSuspend,
  onLiftSuspension,
  onDelete,
  hasFilters,
  onClearFilters,
}: UsersTableProps) => {
  const showSkeleton = isLoading || (isFetching && profiles.length === 0);

  if (showSkeleton) {
    return <div className="p-6"><UsersSkeleton /></div>;
  }

  if (profiles.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <HugeiconsIcon icon={UserIcon} className="h-6 w-6 text-gray-400 dark:text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No users found</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {hasFilters ? 'No users match your filters' : 'No user records found'}
        </p>
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Table Header */}
      <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="w-12">
          <Checkbox
            checked={selectedUsers.size === profiles.length && profiles.length > 0}
            onCheckedChange={onSelectAll}
          />
        </div>
        <div className="flex-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">User</div>
        <div className="w-48 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contact</div>
        <div className="w-32 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</div>
        <div className="w-28 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</div>
        <div className="w-28 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Verification</div>
        <div className="w-28 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Joined</div>
        <div className="w-16 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800 relative">
        {isFetching && !isLoading && profiles.length > 0 && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-10 flex items-start justify-center pt-20">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          </div>
        )}
        {profiles.map((profile) => (
          <div
            key={profile._id}
            className={cn(
              "flex items-center px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
              profile.activeStatus === 'suspended' && "bg-amber-50/30 dark:bg-amber-900/10"
            )}
          >
            <div className="w-12">
              <Checkbox checked={selectedUsers.has(profile._id)} onCheckedChange={() => onToggleSelect(profile._id)} />
            </div>
            
            <div className="flex-1 flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0">
                {profile.profilePicture?.secure_url ? (
                  <AvatarImage src={profile.profilePicture.secure_url} alt={profile.fullName} />
                ) : null}
                <AvatarFallback className="bg-transparent text-white text-xs font-bold">
                  {getInitials(profile.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{profile.displayName || profile.fullName}</p>
              </div>
            </div>
            
            <div className="w-48">
              <div className="flex items-center gap-1.5 mb-1">
                <HugeiconsIcon icon={Mail01Icon} className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{profile.contact.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Phone01Icon} className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-600 dark:text-gray-400">{profile.contact.phoneNumber}</span>
              </div>
            </div>
            
            <div className="w-32">
              <div className="flex items-center gap-1.5">
                {profile.accountType === 'organization' ? (
                  <HugeiconsIcon icon={Building02Icon} className="h-3.5 w-3.5 text-blue-500" />
                ) : (
                  <HugeiconsIcon icon={UserIcon} className="h-3.5 w-3.5 text-green-500" />
                )}
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">{profile.accountType}</span>
              </div>
              {profile.organizationName && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{profile.organizationName}</p>
              )}
            </div>
            
            <div className="w-28">
              <Badge variant={getStatusBadge(profile.activeStatus)} className="gap-1">
                <HugeiconsIcon icon={getStatusIcon(profile.activeStatus)} size={12} />
                {profile.activeStatus}
              </Badge>
              {profile.suspensionReason && profile.activeStatus === 'suspended' && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 truncate max-w-[100px]">
                  {profile.suspensionReason}
                </p>
              )}
            </div>
            
            <div className="w-28">
              <Badge variant={getVerificationBadge(profile.verificationStatus)} className="gap-1">
                {profile.verificationStatus === 'verified' && <HugeiconsIcon icon={BadgeCheckIcon} size={12} />}
                {profile.verificationStatus}
              </Badge>
            </div>
            
            <div className="w-28">
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(profile.createdAt)}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{format(new Date(profile.createdAt), 'HH:mm')}</p>
            </div>

            {activeTab === 'scheduled' && (
              <div className="w-28">
                <p className="text-[10px] text-blue-500 dark:text-blue-400 font-medium">Final deletion</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {profile.metadata?.finalDeletionDate
                    ? formatDate(profile.metadata.finalDeletionDate)
                    : 'N/A'}
                </p>
              </div>
            )}
            
            <div className="w-16 flex items-center justify-center gap-1">
              {activeTab === 'scheduled' ? (
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800"
                  title="Managed by cron job"
                >
                  <HugeiconsIcon icon={ClockIcon} className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[10px] text-gray-400">Auto</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onView(profile)}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="View Details"
                  >
                    <HugeiconsIcon icon={ViewIcon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  <ActionDropdown
                    trigger={
                      <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    }
                    items={[
                      { label: 'View Details', icon: ViewIcon, onClick: () => onView(profile) },
                      { divider: true, section: 'Account Actions' } as const,
                      ...(profile.activeStatus === 'active'
                        ? [
                            { label: 'Deactivate', icon: UserRemove01Icon, onClick: () => onDeactivate(profile._id) },
                            { label: 'Suspend', icon: BanIcon, onClick: () => onSuspend(profile) }
                          ]
                        : profile.activeStatus === 'deactivated'
                        ? [{ label: 'Reactivate', icon: UserCheck01Icon, onClick: () => onReactivate(profile._id) }]
                        : profile.activeStatus === 'suspended'
                        ? [{ label: 'Lift Suspension', icon: UnlockIcon, onClick: () => onLiftSuspension(profile) }]
                        : []
                      ),
                      { divider: true } as const,
                      { label: 'Permanently Delete', icon: Delete03Icon, onClick: () => onDelete(profile), danger: true },
                    ]}
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};