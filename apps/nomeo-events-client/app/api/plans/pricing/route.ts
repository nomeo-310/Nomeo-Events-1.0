import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Plan } from '@/models/plan';
import { ApiResponse, PricingResponse, TierPricing, SupportedInterval } from '@/types/plan-type';
import { PlanInterval } from '@/models/plan-interval';

// ---------- FIXED HELPERS ----------
async function getAllIntervals() {
  await connectDB();
  return await PlanInterval.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
}

async function getIntervalMap() {
  const intervals = await getAllIntervals();
  const map = new Map();
  intervals.forEach(interval => {
    map.set(interval.slug, interval);
  });
  return map;
}

// ---------- MAIN API ----------
export async function GET() {
  try {
    await connectDB();

    const intervalMap = await getIntervalMap();
    const allIntervals = Array.from(intervalMap.values());

    const plans = await Plan.find({ isActive: true, isPublic: true })
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

    // monthly baseline for savings calculation
    const monthlyPrices: Record<string, number> = {};
    plans.forEach((plan: any) => {
      if (plan.interval === 'monthly') {
        monthlyPrices[plan.tier] = plan.priceKobo;
      }
    });

    const tiersMap = new Map<string, TierPricing>();

    for (const plan of plans as any[]) {
      const tier = plan.tier;
      const intervalData = intervalMap.get(plan.interval);

      if (!intervalData) {
        console.warn(`Interval "${plan.interval}" not found for plan ${plan.name}`);
        continue;
      }

      const safeMetadata =
        plan.metadata instanceof Map
          ? Object.fromEntries(plan.metadata)
          : typeof plan.metadata === 'object' && plan.metadata !== null
          ? plan.metadata
          : {};

      // ── Init tier entry (no features/limits here — they're per-interval now) ──
      if (!tiersMap.has(tier)) {
        tiersMap.set(tier, {
          tier,
          name: tier.charAt(0).toUpperCase() + tier.slice(1),
          description: plan.description || '',
          tagline: '',
          sortOrder: plan.sortOrder ?? 0,
          isActive: !!plan.isActive,
          isPopular: false,
          features: Array.isArray(plan.features) ? plan.features : [],
          limits: {
            maxEvents:            plan.maxEvents            ?? undefined,
            maxAttendeesPerEvent: plan.maxAttendeesPerEvent ?? undefined,
            maxTeamMembers:       plan.maxTeamMembers       ?? undefined,
            storageGb:            plan.storageGb            ?? undefined,
          },
          intervals: [],
          ctaText: 'Subscribe',
          metadata: safeMetadata,
        });
      }

      const tierData = tiersMap.get(tier)!;

      const months = intervalData.monthsCount || 1;
      const monthlyBaseline = monthlyPrices[tier] || (months === 1 ? plan.priceKobo : 0);

      const perMonthKobo = intervalData.slug === 'monthly' || months === 0
        ? plan.priceKobo
        : Math.round(plan.priceKobo / months);

      // ── Savings calculation ──
      let savings = null;
      if (intervalData.discount && intervalData.discount > 0) {
        const savingsAmount = Math.round(plan.priceKobo * (intervalData.discount / 100));
        if (savingsAmount > 0) {
          savings = {
            amount: savingsAmount,
            percent: intervalData.discount,
            text: `Save ${intervalData.discount}%`,
            detailedText: `Save ${intervalData.discount}% (${formatPrice(savingsAmount)})`
          };
        }
      }

      if (!savings && monthlyBaseline > 0 && months > 1) {
        const totalMonthlyCost = monthlyBaseline * months;
        const savingsAmount = totalMonthlyCost - plan.priceKobo;
        if (savingsAmount > 0) {
          const savingsPercent = Math.round((savingsAmount / totalMonthlyCost) * 100);
          savings = {
            amount: savingsAmount,
            percent: savingsPercent,
            text: `Save ${savingsPercent}%`,
            detailedText: `Save ${savingsPercent}% (${formatPrice(savingsAmount)})`
          };
        }
      }

      // ── Push interval with its own features & limits ──
      tierData.intervals.push({
        interval: intervalData.slug,
        priceKobo: plan.priceKobo,
        priceDisplay: formatPrice(plan.priceKobo),
        pricePerMonthKobo: perMonthKobo,
        pricePerMonthDisplay: `${formatPrice(perMonthKobo)}/month`,
        savings,
        badge: intervalData.discount ? `${intervalData.discount}% OFF` : null,
        isBestValue: intervalData.discount ? intervalData.discount >= 15 : false,
        isPopular: intervalData.popular || false,
        trialDays: plan.trialDays ?? 0,
        paystackPlanCode: plan.paystackPlanCode,
        isAvailable: true,
        sortOrder: intervalData.sortOrder ?? 0,
        features: Array.isArray(plan.features) ? plan.features : [],
        limits: {
          maxEvents:            plan.maxEvents            ?? undefined,
          maxAttendeesPerEvent: plan.maxAttendeesPerEvent ?? undefined,
          maxTeamMembers:       plan.maxTeamMembers       ?? undefined,
          storageGb:            plan.storageGb            ?? undefined,
        },
      });
    }

    // ── Build supportedIntervals from database ──
    const supportedIntervals: SupportedInterval[] = allIntervals.map(interval => ({
      value: interval.slug,
      label: interval.name,
      discount: interval.discount ? `${interval.discount}% OFF` : null,
      isPopular: interval.popular || false,
      sortOrder: interval.sortOrder ?? 0,
    }));

    const tiers = Array.from(tiersMap.values())
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((tier) => ({
        ...tier,
        intervals: tier.intervals.sort((a, b) => a.sortOrder - b.sortOrder),
      }));

    const defaultInterval = allIntervals.find(i => i.isDefault)?.slug || 'monthly';

    return NextResponse.json({
      success: true,
      data: {
        tiers,
        defaultInterval,
        supportedIntervals: supportedIntervals.sort((a, b) => a.sortOrder - b.sortOrder),
      } as PricingResponse,
      timestamp: new Date().toISOString()
    } as ApiResponse<PricingResponse>);

  } catch (error: any) {
    console.error('Failed to fetch pricing:', {
      message: error?.message,
      stack: error?.stack,
    });

    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to fetch pricing',
      timestamp: new Date().toISOString()
    } as ApiResponse, { status: 500 });
  }
}

// ---------- HELPER FUNCTIONS ----------
function formatPrice(priceKobo: number): string {
  return `NGN ${(priceKobo / 100).toLocaleString('en-NG')}`;
}