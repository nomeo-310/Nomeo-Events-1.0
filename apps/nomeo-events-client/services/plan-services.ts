import { Plan } from '@/models/plan';
import {  PlanInterval, PlanTier, PricingResponse, TierPricing, IntervalPricing, SupportedInterval, PlansListResponse, PlanDocument, IPlanDocument } from '@/types/plan-type';

class PlanService {
  private getMonthsCount(interval: PlanInterval): number {
    const map: Record<PlanInterval, number> = {
      [PlanInterval.MONTHLY]: 1,
      [PlanInterval.QUARTERLY]: 3,
      [PlanInterval.BIANNUAL]: 6,
      [PlanInterval.ANNUAL]: 12,
      [PlanInterval.LIFETIME]: Infinity
    };
    return map[interval];
  }

  private getIntervalSortOrder(interval: PlanInterval): number {
    const order: Record<PlanInterval, number> = {
      [PlanInterval.MONTHLY]: 0,
      [PlanInterval.QUARTERLY]: 1,
      [PlanInterval.BIANNUAL]: 2,
      [PlanInterval.ANNUAL]: 3,
      [PlanInterval.LIFETIME]: 4
    };
    return order[interval];
  }

  private formatPrice(priceKobo: number): string {
    return `₦${(priceKobo / 100).toLocaleString('en-NG')}`;
  }

  private calculateSavings( currentPrice: number, monthlyPrice: number, months: number ) {
    if (months === 1 || !monthlyPrice || monthlyPrice === 0) return null;
    
    const totalMonthlyCost = monthlyPrice * months;
    const savingsAmount = totalMonthlyCost - currentPrice;
    
    if (savingsAmount <= 0) return null;
    
    const savingsPercent = Math.round((savingsAmount / totalMonthlyCost) * 100);
    
    return {
      amount: savingsAmount,
      percent: savingsPercent,
      text: `Save ${savingsPercent}%`,
      detailedText: `Save ${savingsPercent}% (${this.formatPrice(savingsAmount)})`
    };
  }

  private getTierDisplayName(tier: string): string {
    const names: Record<string, string> = {
      [PlanTier.FREE]: 'Free',
      [PlanTier.STARTER]: 'Starter',
      [PlanTier.BASIC]: 'Basic',
      [PlanTier.PRO]: 'Professional',
      [PlanTier.BUSINESS]: 'Business',
      [PlanTier.ENTERPRISE]: 'Enterprise'
    };
    return names[tier] || tier.charAt(0).toUpperCase() + tier.slice(1);
  }

  private getTierTagline(tier: string): string {
    const taglines: Record<string, string> = {
      [PlanTier.FREE]: 'Perfect for getting started',
      [PlanTier.STARTER]: 'Ideal for growing organizers',
      [PlanTier.BASIC]: 'Professional features for serious organizers',
      [PlanTier.PRO]: 'Advanced capabilities for large events',
      [PlanTier.BUSINESS]: 'Enterprise-grade tools for organizations',
      [PlanTier.ENTERPRISE]: 'Custom solutions for large-scale operations'
    };
    return taglines[tier] || '';
  }

  private getTierCTAText(tier: string): string {
    const ctas: Record<string, string> = {
      [PlanTier.FREE]: 'Get Started',
      [PlanTier.STARTER]: 'Start Free Trial',
      [PlanTier.BASIC]: 'Subscribe Now',
      [PlanTier.PRO]: 'Go Pro',
      [PlanTier.BUSINESS]: 'Contact Sales',
      [PlanTier.ENTERPRISE]: 'Contact Sales'
    };
    return ctas[tier] || 'Subscribe';
  }

  private getIntervalBadge(
    interval: PlanInterval,
    savings: { percent: number } | null,
    tier: string
  ): string | null {
    if (savings && savings.percent >= 20) return 'Best Value';
    if (savings && savings.percent >= 15) return `Save ${savings.percent}%`;
    if (savings && savings.percent >= 10) return `Save ${savings.percent}%`;
    if (interval === PlanInterval.ANNUAL && tier !== PlanTier.FREE) return 'Save 20%';
    if (interval === PlanInterval.BIANNUAL) return 'Save 17%';
    if (interval === PlanInterval.QUARTERLY) return 'Save 11%';
    return null;
  }

  private convertToPlanDocument(mongooseDoc: IPlanDocument | null): PlanDocument | null {
    if (!mongooseDoc) return null;
    
    return {
      _id: mongooseDoc._id.toString(),
      name: mongooseDoc.name,
      slug: mongooseDoc.slug,
      tier: mongooseDoc.tier,
      description: mongooseDoc.description,
      isActive: mongooseDoc.isActive,
      isPublic: mongooseDoc.isPublic,
      priceKobo: mongooseDoc.priceKobo,
      currency: mongooseDoc.currency,
      interval: mongooseDoc.interval,
      paystackPlanCode: mongooseDoc.paystackPlanCode,
      isFree: mongooseDoc.isFree,
      trialDays: mongooseDoc.trialDays,
      maxEvents: mongooseDoc.maxEvents,
      maxAttendeesPerEvent: mongooseDoc.maxAttendeesPerEvent,
      maxTeamMembers: mongooseDoc.maxTeamMembers,
      storageGb: mongooseDoc.storageGb,
      features: mongooseDoc.features,
      discounts: mongooseDoc.discounts,
      coupons: mongooseDoc.coupons,
      sortOrder: mongooseDoc.sortOrder,
      metadata: mongooseDoc.metadata ? Object.fromEntries(mongooseDoc.metadata) : {},
      createdAt: mongooseDoc.createdAt.toISOString(),
      updatedAt: mongooseDoc.updatedAt.toISOString()
    };
  }

  private convertManyToPlanDocuments(mongooseDocs: IPlanDocument[]): PlanDocument[] {
    return mongooseDocs.map((doc: IPlanDocument) => this.convertToPlanDocument(doc)!).filter(Boolean);
  }

  async getPricingComparison(): Promise<PricingResponse> {
    const plans = await Plan.find({
      isActive: true,
      isPublic: true
    })
    .select('-__v')
    .sort({ sortOrder: 1, tier: 1, interval: 1 })
    .lean() as unknown as IPlanDocument[];

    if (!plans.length) {
      throw new Error('No plans found');
    }

    const monthlyPrices: Record<string, number> = {};
    plans.forEach((plan: IPlanDocument) => {
      if (plan.interval === PlanInterval.MONTHLY) {
        monthlyPrices[plan.tier] = plan.priceKobo;
      }
    });

    const tiersMap = new Map<string, TierPricing>();

    for (const plan of plans) {
      const tier = plan.tier;
      
      if (!tiersMap.has(tier)) {
        tiersMap.set(tier, {
          tier: tier as PlanTier,
          name: this.getTierDisplayName(tier),
          description: plan.description || '',
          tagline: this.getTierTagline(tier),
          sortOrder: plan.sortOrder,
          isActive: plan.isActive,
          isPopular: tier === PlanTier.BASIC || tier === PlanTier.PRO,
          features: plan.features || [],
          limits: {
            maxEvents: plan.maxEvents,
            maxAttendeesPerEvent: plan.maxAttendeesPerEvent,
            maxTeamMembers: plan.maxTeamMembers,
            storageGb: plan.storageGb
          },
          intervals: [],
          ctaText: this.getTierCTAText(tier),
          metadata: plan.metadata ? Object.fromEntries(plan.metadata) : {}
        });
      }

      const tierData = tiersMap.get(tier)!;
      const months = this.getMonthsCount(plan.interval as PlanInterval);
      const monthlyBaseline = monthlyPrices[tier] || (months === 1 ? plan.priceKobo : 0);
      const perMonthKobo = plan.interval === PlanInterval.MONTHLY 
        ? plan.priceKobo 
        : Math.round(plan.priceKobo / months);
      const savings = this.calculateSavings(plan.priceKobo, monthlyBaseline, months);
      const badge = this.getIntervalBadge(plan.interval as PlanInterval, savings, tier);
      const isBestValue = badge === 'Best Value';
      const isPopular = plan.interval === PlanInterval.ANNUAL && 
        (tier === PlanTier.BASIC || tier === PlanTier.STARTER);

      tierData.intervals.push({
        interval: plan.interval as PlanInterval,
        priceKobo: plan.priceKobo,
        priceDisplay: this.formatPrice(plan.priceKobo),
        pricePerMonthKobo: perMonthKobo,
        pricePerMonthDisplay: `${this.formatPrice(perMonthKobo)}/month`,
        savings,
        badge,
        isBestValue,
        isPopular,
        trialDays: plan.trialDays || 0,
        paystackPlanCode: plan.paystackPlanCode,
        isAvailable: true,
        sortOrder: this.getIntervalSortOrder(plan.interval as PlanInterval)
      });
    }

    const tiers = Array.from(tiersMap.values())
      .sort((a: TierPricing, b: TierPricing) => a.sortOrder - b.sortOrder)
      .map((tier: TierPricing) => ({
        ...tier,
        intervals: tier.intervals.sort((a: IntervalPricing, b: IntervalPricing) => a.sortOrder - b.sortOrder)
      }));

    const supportedIntervals: SupportedInterval[] = [
      { value: PlanInterval.MONTHLY, label: 'Monthly', discount: null, sortOrder: 0 },
      { value: PlanInterval.QUARTERLY, label: 'Quarterly', discount: 'Save 11%', sortOrder: 1 },
      { value: PlanInterval.BIANNUAL, label: 'Biannual', discount: 'Save 17%', sortOrder: 2 },
      { value: PlanInterval.ANNUAL, label: 'Annual', discount: 'Save 20%', isPopular: true, sortOrder: 3 }
    ];

    return {
      tiers,
      defaultInterval: PlanInterval.MONTHLY,
      supportedIntervals: supportedIntervals.sort((a: SupportedInterval, b: SupportedInterval) => a.sortOrder - b.sortOrder)
    };
  }

  async getAllPlans(filters?: { tier?: PlanTier[];  interval?: PlanInterval[]; isActive?: boolean; isPublic?: boolean }): Promise<PlansListResponse> {
    const query: any = {};
    
    if (filters?.tier && filters.tier.length) query.tier = { $in: filters.tier };
    if (filters?.interval && filters.interval.length) query.interval = { $in: filters.interval };
    if (filters?.isActive !== undefined) query.isActive = filters.isActive;
    if (filters?.isPublic !== undefined) query.isPublic = filters.isPublic;

    const mongoosePlans = await Plan.find(query)
      .sort({ sortOrder: 1, tier: 1, interval: 1 })
      .lean() as unknown as IPlanDocument[];

    return {
      plans: this.convertManyToPlanDocuments(mongoosePlans),
      total: mongoosePlans.length,
      filters: filters || {}
    };
  }

  async getPlanBySlug(slug: string): Promise<PlanDocument | null> {
    const mongoosePlan = await Plan.findOne({ slug, isActive: true })
      .lean() as unknown as IPlanDocument | null;
    return this.convertToPlanDocument(mongoosePlan);
  }

  async getPlansByTier(tier: PlanTier): Promise<PlanDocument[]> {
    const mongoosePlans = await Plan.find({ tier, isActive: true })
      .sort({ interval: 1 })
      .lean() as unknown as IPlanDocument[];
    return this.convertManyToPlanDocuments(mongoosePlans);
  }

  async validateCoupon(code: string, planId: string, interval: PlanInterval): Promise<{ valid: boolean; discountAmount?: number; discountPercentage?: number; message?: string; }> {
    const plan = await Plan.findById(planId);
    if (!plan) return { valid: false, message: 'Plan not found' };

    const coupon = plan.coupons.find((c: any) => c.code === code.toUpperCase());
    if (!coupon) return { valid: false, message: 'Invalid coupon code' };
    if (coupon.status !== 'active') return { valid: false, message: 'Coupon is no longer active' };
    if (coupon.expiresAt && new Date() > coupon.expiresAt) return { valid: false, message: 'Coupon has expired' };
    if (coupon.maxRedemptions && coupon.redemptionCount >= coupon.maxRedemptions) {
      return { valid: false, message: 'Coupon has reached maximum redemptions' };
    }
    if (coupon.applicableIntervals && !coupon.applicableIntervals.includes(interval)) {
      return { valid: false, message: `Coupon not applicable for ${interval} billing` };
    }
    if (coupon.minAmountKobo && plan.priceKobo < coupon.minAmountKobo) {
      return { valid: false, message: `Minimum purchase of ${this.formatPrice(coupon.minAmountKobo)} required` };
    }

    let discountAmount = 0;
    let discountPercentage = 0;

    if (coupon.discountType === 'percentage') {
      discountPercentage = coupon.discountValue;
      discountAmount = (plan.priceKobo * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
      discountPercentage = (discountAmount / plan.priceKobo) * 100;
    }

    return { valid: true, discountAmount, discountPercentage, message: 'Coupon applied successfully!' };
  }
}

export default new PlanService();