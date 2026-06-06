// admin-stat-cards.tsx
"use client";

interface AdminStats {
  total: number;
  byRole: {
    super_admin: number;
    admin: number;
    moderator: number;
    support: number;
  };
  byStatus: {
    active: number;
    suspended: number;
    inactive: number;
  };
  activePercentage: number;
}

export const AdminStatCards = ({ stats }: { stats: AdminStats }) => {
  if (stats.total === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">Total Admins</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">Super Admins</p>
        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.byRole.super_admin}</p>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">Admins</p>
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.byRole.admin}</p>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.byStatus.active}</p>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">Active %</p>
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.round(stats.activePercentage)}%</p>
      </div>
    </div>
  );
};