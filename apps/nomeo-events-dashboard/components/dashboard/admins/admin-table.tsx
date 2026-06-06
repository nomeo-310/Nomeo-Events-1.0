// admin-table.tsx
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  MoreHorizontalCircle01Icon, 
  Mail01Icon,
  RefreshIcon,
  UserIcon 
} from "@hugeicons/core-free-icons";
import { PaginationWithInfo } from "@/components/ui/pagination";

import { ActionDropdown, DropdownItem, AdminsSkeleton } from './admin-action-dropdown';
import { getInitials, getRoleColor, getStatusBadge, getStatusIcon, formatDate } from './admin-types';
import type { AdminUser } from '@/hooks/use-admin-management';

interface AdminTableProps {
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
  onSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  getAdminDropdownItems: (admin: AdminUser) => DropdownItem[];
  isFetching?: boolean;
  isLoading?: boolean;
}

const EmptyState = () => (
  <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-10 text-center">
    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
      <HugeiconsIcon icon={UserIcon} className="h-6 w-6 text-gray-400 dark:text-gray-600" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No admins found</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400">No admin records found</p>
  </div>
);

export const AdminTable = ({
  admins,
  selectedAdmins,
  isSuperAdmin,
  currentUserEmail,
  pagination,
  currentPage,
  onPageChange,
  onSelectAll,
  onToggleSelect,
  getAdminDropdownItems,
  isFetching,
  isLoading,
}: AdminTableProps) => {
  const showSkeleton = isLoading || (isFetching && admins.length === 0);

  if (showSkeleton) {
    return <div className="p-6"><AdminsSkeleton /></div>;
  }

  if (admins.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="w-12">
          {isSuperAdmin && (
            <Checkbox
              checked={selectedAdmins.size === admins.length && admins.length > 0}
              onCheckedChange={onSelectAll}
            />
          )}
        </div>
        <div className="flex-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Admin</div>
        <div className="w-48 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contact</div>
        <div className="w-32 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</div>
        <div className="w-28 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</div>
        <div className="w-28 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Last Login</div>
        <div className="w-28 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Created</div>
        <div className="w-16 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800 relative">
        {isFetching && !isLoading && admins.length > 0 && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 z-10 flex items-start justify-center pt-20">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <HugeiconsIcon icon={RefreshIcon} className="h-5 w-5 animate-spin text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          </div>
        )}
        {admins.map((admin) => (
          <div
            key={admin._id}
            className={cn(
              "flex items-center px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
              admin.adminStatus === 'suspended' && "bg-amber-50/30 dark:bg-amber-900/10"
            )}
          >
            <div className="w-12">
              {isSuperAdmin && (
                <Checkbox 
                  checked={selectedAdmins.has(admin._id)} 
                  onCheckedChange={() => onToggleSelect(admin._id)}
                  disabled={admin.email === currentUserEmail}
                />
              )}
            </div>
            
            <div className="flex-1 flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0">
                <AvatarFallback className="bg-transparent text-white text-xs font-bold">
                  {getInitials(admin.displayName || admin.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{admin.displayName || admin.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{admin.name}</p>
              </div>
            </div>
            
            <div className="w-48">
              <div className="flex items-center gap-1.5 mb-1">
                <HugeiconsIcon icon={Mail01Icon} className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{admin.email}</span>
              </div>
            </div>
            
            <div className="w-32">
              <span className={cn("px-2 py-1 text-xs font-medium rounded-full capitalize", getRoleColor(admin.role))}>
                {admin.role.replace('_', ' ')}
              </span>
            </div>
            
            <div className="w-28">
              <Badge variant={getStatusBadge(admin.adminStatus)} className="gap-1">
                <HugeiconsIcon icon={getStatusIcon(admin.adminStatus)} size={12} />
                {admin.adminStatus}
              </Badge>
            </div>
            
            <div className="w-28">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {admin.lastLoginAt ? formatDate(admin.lastLoginAt) : 'Never'}
              </p>
              {admin.loginCount > 0 && (
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{admin.loginCount} logins</p>
              )}
            </div>
            
            <div className="w-28">
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(admin.createdAt)}</p>
            </div>
            
            <div className="w-16 flex items-center justify-center">
              <ActionDropdown
                trigger={
                  <button className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                }
                items={getAdminDropdownItems(admin)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-4">
          <PaginationWithInfo
            currentPage={currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={(page) => onPageChange(page)}
            showInfo={true}
            showPageNumbers={true}
            maxVisiblePages={5}
          />
        </div>
      )}
    </div>
  );
};