// services/plan-service.ts
import { Plan } from '@/models/plan';
import { PricingResponse, TierPricing, IntervalPricing, SupportedInterval, PlansListResponse, PlanDocument, IPlanDocument } from '@/types/plan-type';

class PlanService {
  // Helper to get months count from interval (now dynamic)
  private getMonthsCount(interval: string): number {
    // You could fetch from database, but for pricing display we use common values
    const map: Record<string, number> = {
      'daily': 0.033,
      'weekly': 0.23,
      'monthly': 1,
      'quarterly': 3,
      'biannual': 6,
      'semi-annual': 6,
      'annual': 12,
      'yearly': 12,
      'lifetime': Infinity
    };
    return map[interval.toLowerCase()] || 1;
  }

  private getIntervalSortOrder(interval: string): number {
    const order: Record<string, number> = {
      'daily': 0,
      'weekly': 1,
      'monthly': 2,
      'quarterly': 3,
      'biannual': 4,
      'semi-annual': 4,
      'annual': 5,
      'yearly': 5,
      'lifetime': 6
    };
    return order[interval.toLowerCase()] || 99;
  }

  private formatPrice(priceKobo: number): string {
    return `₦${(priceKobo / 100).toLocaleString('en-NG')}`;
  }

  private calculateSavings(currentPrice: number, monthlyPrice: number, months: number) {
    if (months === 1 || !monthlyPrice || monthlyPrice === 0 || months === Infinity) return null;
    
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
    // Capitalize first letter
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  }

  private getTierTagline(tier: string): string {
    const taglines: Record<string, string> = {
      'free': 'Perfect for getting started',
      'starter': 'Ideal for growing organizers',
      'basic': 'Professional features for serious organizers',
      'pro': 'Advanced capabilities for large events',
      'business': 'Enterprise-grade tools for organizations',
      'enterprise': 'Custom solutions for large-scale operations'
    };
    return taglines[tier.toLowerCase()] || 'Flexible plan for your needs';
  }

  private getTierCTAText(tier: string): string {
    const ctas: Record<string, string> = {
      'free': 'Get Started',
      'starter': 'Start Free Trial',
      'basic': 'Subscribe Now',
      'pro': 'Go Pro',
      'business': 'Contact Sales',
      'enterprise': 'Contact Sales'
    };
    return ctas[tier.toLowerCase()] || 'Subscribe';
  }

  private getIntervalBadge(
    interval: string,
    savings: { percent: number } | null,
    tier: string
  ): string | null {
    if (savings && savings.percent >= 20) return 'Best Value';
    if (savings && savings.percent >= 15) return `Save ${savings.percent}%`;
    if (savings && savings.percent >= 10) return `Save ${savings.percent}%`;
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

    // Get monthly baseline prices
    const monthlyPrices: Record<string, number> = {};
    plans.forEach((plan: IPlanDocument) => {
      if (plan.interval === 'monthly') {
        monthlyPrices[plan.tier] = plan.priceKobo;
      }
    });

    // Get unique tiers
    const tiersMap = new Map<string, TierPricing>();

    for (const plan of plans) {
      const tier = plan.tier;
      
      if (!tiersMap.has(tier)) {
        tiersMap.set(tier, {
          tier: tier,
          name: this.getTierDisplayName(tier),
          description: plan.description || '',
          tagline: this.getTierTagline(tier),
          sortOrder: plan.sortOrder,
          isActive: plan.isActive,
          isPopular: tier === 'basic' || tier === 'pro',
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
      const months = this.getMonthsCount(plan.interval);
      const monthlyBaseline = monthlyPrices[tier] || (months === 1 ? plan.priceKobo : 0);
      const perMonthKobo = plan.interval === 'monthly' 
        ? plan.priceKobo 
        : months !== Infinity 
          ? Math.round(plan.priceKobo / months)
          : plan.priceKobo;
      const savings = this.calculateSavings(plan.priceKobo, monthlyBaseline, months);
      const badge = this.getIntervalBadge(plan.interval, savings, tier);
      const isBestValue = badge === 'Best Value';
      const isPopular = plan.interval === 'annual' && (tier === 'basic' || tier === 'starter');

      tierData.intervals.push({
        interval: plan.interval,
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
        sortOrder: this.getIntervalSortOrder(plan.interval)
      });
    }

    const tiers = Array.from(tiersMap.values())
      .sort((a: TierPricing, b: TierPricing) => a.sortOrder - b.sortOrder)
      .map((tier: TierPricing) => ({
        ...tier,
        intervals: tier.intervals.sort((a: IntervalPricing, b: IntervalPricing) => a.sortOrder - b.sortOrder)
      }));

    // Get unique intervals from database for supported intervals
    const uniqueIntervals = [...new Set(plans.map(p => p.interval))];
    const supportedIntervals: SupportedInterval[] = uniqueIntervals.map(interval => ({
      value: interval,
      label: interval.charAt(0).toUpperCase() + interval.slice(1),
      discount: null,
      sortOrder: this.getIntervalSortOrder(interval)
    })).sort((a, b) => a.sortOrder - b.sortOrder);

    // Ensure monthly is default if exists
    const defaultInterval = supportedIntervals.find(i => i.value === 'monthly')?.value || supportedIntervals[0]?.value || 'monthly';

    return {
      tiers,
      defaultInterval,
      supportedIntervals
    };
  }

  async getAllPlans(filters?: { 
    tier?: string[]; 
    interval?: string[]; 
    isActive?: boolean; 
    isPublic?: boolean 
  }): Promise<PlansListResponse> {
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

  async getPlansByTier(tier: string): Promise<PlanDocument[]> {
    const mongoosePlans = await Plan.find({ tier, isActive: true })
      .sort({ interval: 1 })
      .lean() as unknown as IPlanDocument[];
    return this.convertManyToPlanDocuments(mongoosePlans);
  }

  async getPlansByInterval(interval: string): Promise<PlanDocument[]> {
    const mongoosePlans = await Plan.find({ interval, isActive: true })
      .sort({ tier: 1 })
      .lean() as unknown as IPlanDocument[];
    return this.convertManyToPlanDocuments(mongoosePlans);
  }

  async getAvailableTiers(): Promise<string[]> {
    const tiers = await Plan.distinct('tier', { isActive: true });
    return tiers.sort();
  }

  async getAvailableIntervals(): Promise<string[]> {
    const intervals = await Plan.distinct('interval', { isActive: true });
    return intervals.sort((a, b) => this.getIntervalSortOrder(a) - this.getIntervalSortOrder(b));
  }

  async validateCoupon(code: string, planId: string, interval: string): Promise<{ 
    valid: boolean; 
    discountAmount?: number; 
    discountPercentage?: number; 
    message?: string; 
  }> {
    const plan = await Plan.findById(planId);
    if (!plan) return { valid: false, message: 'Plan not found' };

    const coupon = plan.coupons.find((c: any) => c.code === code.toUpperCase());
    if (!coupon) return { valid: false, message: 'Invalid coupon code' };
    if (coupon.status !== 'active') return { valid: false, message: 'Coupon is no longer active' };
    if (coupon.expiresAt && new Date() > coupon.expiresAt) return { valid: false, message: 'Coupon has expired' };
    if (coupon.maxRedemptions && coupon.redemptionCount >= coupon.maxRedemptions) {
      return { valid: false, message: 'Coupon has reached maximum redemptions' };
    }
    if (coupon.applicableIntervals && coupon.applicableIntervals.length > 0 && !coupon.applicableIntervals.includes(interval)) {
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