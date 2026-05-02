import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan } from '@/models/plan';
import {
  ApiResponse,
  PricingResponse,
  PlanInterval,
  PlanTier,
  IntervalPricing,
  TierPricing,
  SupportedInterval
} from '@/types/plan-type';

// ---------- helpers (unchanged mostly) ----------
function getMonthsCount(interval: PlanInterval): number {
  const map: Record<PlanInterval, number> = {
    [PlanInterval.MONTHLY]: 1,
    [PlanInterval.QUARTERLY]: 3,
    [PlanInterval.BIANNUAL]: 6,
    [PlanInterval.ANNUAL]: 12,
    [PlanInterval.LIFETIME]: Infinity
  };
  return map[interval];
}

function getIntervalSortOrder(interval: PlanInterval): number {
  const order: Record<PlanInterval, number> = {
    [PlanInterval.MONTHLY]: 0,
    [PlanInterval.QUARTERLY]: 1,
    [PlanInterval.BIANNUAL]: 2,
    [PlanInterval.ANNUAL]: 3,
    [PlanInterval.LIFETIME]: 4
  };
  return order[interval];
}

function formatPrice(priceKobo: number): string {
  return `NGN ${(priceKobo / 100).toLocaleString('en-NG')}`;
}

function calculateSavings(currentPrice: number, monthlyPrice: number, months: number) {
  if (months === 1 || !monthlyPrice || monthlyPrice === 0 || !isFinite(months)) return null;

  const totalMonthlyCost = monthlyPrice * months;
  const savingsAmount = totalMonthlyCost - currentPrice;

  if (savingsAmount <= 0) return null;

  const savingsPercent = Math.round((savingsAmount / totalMonthlyCost) * 100);

  return {
    amount: savingsAmount,
    percent: savingsPercent,
    text: `Save ${savingsPercent}%`,
    detailedText: `Save ${savingsPercent}% (${formatPrice(savingsAmount)})`
  };
}

// ---------- FIXED API ----------
export async function GET() {
  try {
    await connectDB();

    const plans = await Plan.find({
      isActive: true,
      isPublic: true
    })
      .select('-__v')
      .sort({ sortOrder: 1, tier: 1, interval: 1 })
      .lean();

    if (!plans || plans.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No plans found',
        timestamp: new Date().toISOString()
      } as ApiResponse, { status: 404 });
    }

    // ✅ monthly baseline
    const monthlyPrices: Record<string, number> = {};
    plans.forEach((plan: any) => {
      if (plan.interval === PlanInterval.MONTHLY) {
        monthlyPrices[plan.tier] = plan.priceKobo;
      }
    });

    const tiersMap = new Map<string, TierPricing>();

    for (const plan of plans as any[]) {
      const tier = plan.tier;

      // ✅ FIX: safe metadata handling
      const safeMetadata =
        plan.metadata instanceof Map
          ? Object.fromEntries(plan.metadata)
          : typeof plan.metadata === 'object' && plan.metadata !== null
          ? plan.metadata
          : {};

      if (!tiersMap.has(tier)) {
        tiersMap.set(tier, {
          tier: tier as PlanTier,
          name: tier.charAt(0).toUpperCase() + tier.slice(1),
          description: plan.description || '',
          tagline: '',
          sortOrder: plan.sortOrder ?? 0,
          isActive: !!plan.isActive,
          isPopular: tier === PlanTier.BASIC || tier === PlanTier.PRO,
          features: Array.isArray(plan.features) ? plan.features : [],
          limits: {
            maxEvents: plan.maxEvents ?? 0,
            maxAttendeesPerEvent: plan.maxAttendeesPerEvent ?? 0,
            maxTeamMembers: plan.maxTeamMembers ?? 0,
            storageGb: plan.storageGb ?? 0
          },
          intervals: [],
          ctaText: 'Subscribe',
          metadata: safeMetadata
        });
      }

      const tierData = tiersMap.get(tier)!;

      const interval = plan.interval as PlanInterval;
      const months = getMonthsCount(interval);

      // ⚠️ FIX: avoid Infinity math
      const monthlyBaseline =
        monthlyPrices[tier] || (months === 1 ? plan.priceKobo : 0);

      const perMonthKobo =
        interval === PlanInterval.MONTHLY || !isFinite(months)
          ? plan.priceKobo
          : Math.round(plan.priceKobo / months);

      const savings = calculateSavings(
        plan.priceKobo,
        monthlyBaseline,
        months
      );

      tierData.intervals.push({
        interval,
        priceKobo: plan.priceKobo,
        priceDisplay: formatPrice(plan.priceKobo),
        pricePerMonthKobo: perMonthKobo,
        pricePerMonthDisplay: `${formatPrice(perMonthKobo)}/month`,
        savings,
        badge: null,
        isBestValue: false,
        isPopular: false,
        trialDays: plan.trialDays ?? 0,
        paystackPlanCode: plan.paystackPlanCode,
        isAvailable: true,
        sortOrder: getIntervalSortOrder(interval)
      });
    }

    const tiers = Array.from(tiersMap.values())
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((tier) => ({
        ...tier,
        intervals: tier.intervals.sort((a, b) => a.sortOrder - b.sortOrder)
      }));

    const supportedIntervals: SupportedInterval[] = [
      { value: PlanInterval.MONTHLY, label: 'Monthly', discount: null, sortOrder: 0 },
      { value: PlanInterval.QUARTERLY, label: 'Quarterly', discount: 'Save 11%', sortOrder: 1 },
      { value: PlanInterval.BIANNUAL, label: 'Biannual', discount: 'Save 17%', sortOrder: 2 },
      { value: PlanInterval.ANNUAL, label: 'Annual', discount: 'Save 20%', isPopular: true, sortOrder: 3 }
    ];

    return NextResponse.json({
      success: true,
      data: {
        tiers,
        defaultInterval: PlanInterval.MONTHLY,
        supportedIntervals: supportedIntervals.sort((a, b) => a.sortOrder - b.sortOrder)
      } as PricingResponse,
      timestamp: new Date().toISOString()
    } as ApiResponse<PricingResponse>);
  } catch (error: any) {
    console.error('Failed to fetch pricing:', {
      message: error?.message,
      stack: error?.stack
    });

    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to fetch pricing',
      timestamp: new Date().toISOString()
    } as ApiResponse, { status: 500 });
  }
}