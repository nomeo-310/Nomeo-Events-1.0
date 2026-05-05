import { TierPricing, IntervalPricing, PlanInterval } from '@/hooks/use-plans';

/** Shape stored in PricingPage when a user clicks Subscribe */
export interface SelectedPlanForPayment {
  tier:    TierPricing;
  pricing: IntervalPricing;
  planId:  string;
  subscriptionId: string;
}

/** Re-export for convenience so consumers import from one place */
export type { TierPricing, IntervalPricing, PlanInterval };