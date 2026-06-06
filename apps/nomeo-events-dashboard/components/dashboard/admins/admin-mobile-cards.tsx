// admin-mobile-cards.tsx
"use client";

import { cn } from '@/lib/utils';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontalCircle01Icon, UserIcon, FilterHorizontalIcon } from "@hugeicons/core-free-icons";
import { PaginationWithInfo } from "@/components/ui/pagination";

import { ActionDropdown, DropdownItem, AdminsSkeleton } from './admin-action-dropdown';
import { getInitials, getRoleColor, getStatusBadge, getStatusIcon } from './admin-types';
import type { AdminUser } from '@/hooks/use-admin-management';

interface AdminMobileCardsProps {
  admins: AdminUser[];
  selectedAdmins: Set<string>;
  isSuperAdmin: boolean;
  currentUserEmail?: string;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  currentPage: number;
  onPageChange: (page: number) => void;
  onToggleSelect: (id: string) => void;
  getAdminDropdownItems: (admin: AdminUser) => DropdownItem[];
  showSkeleton: boolean;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

export const EmptyState = ({ hasFilters, onClearFilters }: { hasFilters?: boolean; onClearFilters?: () => void }) => (
  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-10 text-center">
    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
      <HugeiconsIcon icon={UserIcon} className="h-6 w-6 text-gray-400 dark:text-gray-600" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No admins found</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {hasFilters ? 'No admins match your filters' : 'No admin records found'}
    </p>
    {hasFilters && onClearFilters && (
      <button
        onClick={onClearFilters}
        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 mt-4"
      >
        <HugeiconsIcon icon={FilterHorizontalIcon} className="h-4 w-4 mr-2" />
        Clear Filters
      </button>
    )}
  </div>
);

export const AdminMobileCards = ({
  admins,
  selectedAdmins,
  isSuperAdmin,
  currentUserEmail,
  pagination,
  currentPage,
  onPageChange,
  onToggleSelect,
  getAdminDropdownItems,
  showSkeleton,
  hasFilters,
  onClearFilters,
}: AdminMobileCardsProps) => {
  if (showSkeleton) {
    return <AdminsSkeleton />;
  }

  if (admins.length === 0) {
    return <EmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} />;
  }

  return (
    <>
      <div className="space-y-3">
        {admins.map((admin) => (
          <div key={admin._id} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              {isSuperAdmin && (
                <Checkbox 
                  checked={selectedAdmins.has(admin._id)} 
                  onCheckedChange={() => onToggleSelect(admin._id)}
                  disabled={admin.email === currentUserEmail}
                />
              )}
              <Avatar className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0">
                <AvatarFallback className="bg-transparent text-white text-xs font-bold">
                  {getInitials(admin.displayName || admin.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{admin.displayName || admin.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{admin.email}</p>
              </div>
              <Badge variant={getStatusBadge(admin.adminStatus)} className="gap-1">
                <HugeiconsIcon icon={getStatusIcon(admin.adminStatus)} size={12} />
                {admin.adminStatus}
              </Badge>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={cn("px-2 py-1 text-xs font-medium rounded-full capitalize", getRoleColor(admin.role))}>
                {admin.role.replace('_', ' ')}
              </span>
              <ActionDropdown
                trigger={
                  <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                    <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-4 w-4 text-gray-500" />
                  </button>
                }
                items={getAdminDropdownItems(admin)}
              />
            </div>
          </div>
        ))}
      </div>
      
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4">
          <PaginationWithInfo
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={(page) => onPageChange(page)}
            showInfo={true}
            showPageNumbers={false}
            maxVisiblePages={3}
          />
        </div>
      )}
    </>
  );
};