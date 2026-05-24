// hooks/use-admin-logs.ts
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export interface AdminLog {
  _id: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  adminRole: string;
  action: string;
  actionCategory: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  details: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  changes?: {
    field: string;
    oldValue?: any;
    newValue?: any;
  }[];
  ipAddress: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  reason?: string;
  status: 'success' | 'failed' | 'partial';
  errorMessage?: string;
  reversible: boolean;
  revertedAt?: Date;
  revertedBy?: string;
  reversionReason?: string;
  metadata: Record<string, any>;
  affectedCount?: number;
  duration?: number;
  createdAt: Date;
}

export interface GetAdminLogsParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  adminId?: string;
  adminRole?: string;
  action?: string;
  actionCategory?: string;
  severity?: string;
  status?: string;
  targetType?: string;
  targetId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface LogsResponse {
  data: AdminLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    roles: string[];
    actions: string[];
    categories: string[];
    severities: string[];
    statuses: string[];
    targetTypes: string[];
  };
}

export const useGetAdminLogs = (params: GetAdminLogsParams) => {
  return useQuery({
    queryKey: ['admin-logs', params],
    queryFn: async () => {
      const { data } = await axios.get<LogsResponse>('/api/admin/logs', { params });
      return data;
    },
    enabled: true,
  });
};

export const useGetAdminLogStats = (days: number = 30) => {
  return useQuery({
    queryKey: ['admin-logs-stats', days],
    queryFn: async () => {
      const { data } = await axios.get('/api/admin/logs/stats', { params: { days } });
      return data;
    },
    enabled: true,
  });
};

export const useGetAdminLog = (id: string | null) => {
  return useQuery({
    queryKey: ['admin-log', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/admin/logs/${id}`);
      return data.data as AdminLog;
    },
    enabled: !!id,
  });
};