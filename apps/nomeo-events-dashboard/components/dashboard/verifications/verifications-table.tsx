// verifications-table.tsx
import { HugeiconsIcon } from "@hugeicons/react";
import {
  RefreshIcon,
  FilterHorizontalIcon,
  UserIcon,
  Building02Icon,
  ViewIcon,
  CheckmarkBadge02Icon as BadgeCheckIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { TableSkeleton } from './verifications-skeletons';
import { getInitials, hasValidValue, formatDate, DOCUMENT_LABELS, DOCUMENT_COLORS } from './verifications-types';

interface VerificationsTableProps {
  profiles: any[];
  selectedVerifications: Set<string>;
  isFetching: boolean;
  isLoading: boolean;
  hasFilters: boolean;
  onSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (profile: any) => void;
  onClearFilters: () => void;
}

export const VerificationsTable = ({
  profiles,
  selectedVerifications,
  isFetching,
  isLoading,
  hasFilters,
  onSelectAll,
  onToggleSelect,
  onOpenDetail,
  onClearFilters,
}: VerificationsTableProps) => {
  const showSkeleton = isLoading || (isFetching && profiles.length === 0);

  if (showSkeleton) {
    return <TableSkeleton />;
  }

  if (profiles.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <HugeiconsIcon icon={BadgeCheckIcon} className="h-6 w-6 text-gray-400 dark:text-gray-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          No pending verifications
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {hasFilters ? "No submissions match your filters" : "All verification requests have been processed"}
        </p>
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <HugeiconsIcon icon={FilterHorizontalIcon} className="h-4 w-4 mr-2" />
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Table header */}
      <div className="flex items-center px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="w-12">
          <Checkbox
            checked={selectedVerifications.size === profiles.length && profiles.length > 0}
            onCheckedChange={onSelectAll}
          />
        </div>
        <div className="flex-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">User</div>
        <div className="w-52 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Location</div>
        <div className="w-40 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Account</div>
        <div className="w-56 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Documents</div>
        <div className="w-28 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Submitted</div>
        <div className="w-24 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pending</div>
        <div className="w-24 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Action</div>
      </div>

      {/* Table body */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800 relative">
        {isFetching && !isLoading && profiles.length > 0 && (
          <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 z-10 flex items-start justify-center pt-16">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <HugeiconsIcon icon={RefreshIcon} className="h-4 w-4 animate-spin text-indigo-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Refreshing…</span>
            </div>
          </div>
        )}

        {profiles.map((profile: any) => (
          <div
            key={profile._id}
            className="flex items-center px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
          >
            <div className="w-12">
              <Checkbox
                checked={selectedVerifications.has(profile._id)}
                onCheckedChange={() => onToggleSelect(profile._id)}
              />
            </div>
            
            {/* User */}
            <div className="flex-1 flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-full flex-shrink-0">
                {profile.avatar && <AvatarImage src={profile.avatar} alt={profile.fullName} />}
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-xs font-bold">
                  {getInitials(profile.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {profile.fullName}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{profile.email}</p>
              </div>
            </div>

            {/* Location */}
            <div className="w-52">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {profile.city || "—"}
              </p>
              <p className="text-[11px] text-gray-400">{profile.state || "—"}</p>
            </div>

            {/* Account type */}
            <div className="w-40">
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={profile.accountType === "organization" ? Building02Icon : UserIcon}
                  className={cn("h-3.5 w-3.5",
                    profile.accountType === "organization" ? "text-purple-500" : "text-green-500"
                  )}
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {profile.accountType}
                </span>
              </div>
              {hasValidValue(profile.organizationName) && (
                <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[130px]">
                  {profile.organizationName}
                </p>
              )}
            </div>

            {/* Documents */}
            <div className="w-56 flex flex-wrap gap-1">
              {hasValidValue(profile.documentTypes) && profile.documentTypes?.map((dt: string) => (
                <span key={dt} className={cn("px-2 py-0.5 text-[10px] rounded-full font-medium", DOCUMENT_COLORS[dt])}>
                  {DOCUMENT_LABELS[dt] || dt}
                </span>
              ))}
            </div>

            {/* Submitted */}
            <div className="w-28">
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(profile.submittedAt)}</p>
            </div>

            {/* Days pending */}
            <div className="w-24">
              {hasValidValue(profile.daysPending) && profile.daysPending > 0 && (
                <span className={cn("text-xs font-semibold",
                  profile.daysPending > 7
                    ? "text-red-600 dark:text-red-400"
                    : profile.daysPending > 3
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {profile.daysPending}d
                </span>
              )}
            </div>

            {/* Action */}
            <div className="w-24 flex justify-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpenDetail(profile)}
                className="h-8 text-xs dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <HugeiconsIcon icon={ViewIcon} className="h-3.5 w-3.5 mr-1.5" />
                Review
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};