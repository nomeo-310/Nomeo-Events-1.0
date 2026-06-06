// verifications-types.ts
import { cn } from "@/lib/utils";

export const getInitials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export const formatDate = (d: Date | string) =>
  d ? new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) : "N/A";

export const formatDateTime = (d: Date | string) =>
  d ? new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : "N/A";

export const hasValidValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const num = parseFloat(value);
    if (!isNaN(num)) return num !== 0;
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export const DOCUMENT_LABELS: Record<string, string> = {
  id_card: "National ID Card",
  passport: "International Passport",
  drivers_license: "Driver's License",
  cac_document: "CAC Document",
  proof_of_address: "Proof of Address",
};

export const DOCUMENT_COLORS: Record<string, string> = {
  id_card: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  passport: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  drivers_license: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  cac_document: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  proof_of_address: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
};

export interface DropdownItem {
  label: string;
  icon: any;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
  section?: string;
}