// hooks/use-pending-verification.ts
import { useQuery } from "@tanstack/react-query";
import { type Profile } from "./use-profiles";

interface PendingVerificationStats {
  totalPending: number;
  withIdCard: number;
  withPassport: number;
  withDriversLicense: number;
  withCacDocument: number;
  withProofOfAddress: number;
  individualAccounts: number;
  organizationAccounts: number;
}

interface PendingVerificationResponse {
  success: boolean;
  data: Profile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats: PendingVerificationStats;
}

export interface GetPendingVerificationParams {
  page?: number;
  limit?: number;
  search?: string;
  documentType?: string;
  startDate?: string;
  endDate?: string;
  accountType?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

async function fetchPendingVerification(params: GetPendingVerificationParams = {}): Promise<PendingVerificationResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.search) searchParams.set("search", params.search);
  if (params.documentType) searchParams.set("documentType", params.documentType);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.accountType) searchParams.set("accountType", params.accountType);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  
  const response = await fetch(`/api/admin/profiles/pending-verification?${searchParams.toString()}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch pending verification profiles");
  }
  
  return response.json();
}

export function useGetPendingVerification(params: GetPendingVerificationParams = {}) {
  return useQuery({
    queryKey: ["pending-verification", params],
    queryFn: () => fetchPendingVerification(params),
    staleTime: 30000, // 30 seconds
  });
}