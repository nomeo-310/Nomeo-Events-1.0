// plans-types.ts

export type ManagementTab = 'plans' | 'tiers' | 'intervals';

export const CURRENCY_OPTIONS = ['NGN', 'USD', 'EUR', 'GBP'];

export interface EmptyStateGuidance {
  title: string;
  description: string;
  steps?: string[];
  examples?: string[];
  actionLabel: string;
  actionTab?: ManagementTab;
}

export const formatPrice = (priceKobo: number, currency: string = 'NGN') => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceKobo / 100);
};

export const formatDate = (date: string | Date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};