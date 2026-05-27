// app/api/payments/[id]/with-plan-details/route.ts
import { connectDB } from '@/lib/mongoose';
import { PaymentService } from '@/services/payment-services';
import { Plan } from '@/models/plan';
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

/**
 * GET /api/payments/:id/with-plan-details
 * Returns a single payment document with COMPLETE plan details including:
 * - Full plan object (features, limits, tiers)
 * - Pricing breakdown (original amount, discount amount, final amount)
 * - Applied coupon information (if any)
 * - Plan intervals and trial information
 * - All plan discounts and coupons available at time of payment
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await connectDB();

    // Get the payment with populated plan and subscription
    const payment = await PaymentService.getById(id);
    
    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      );
    }

    // If this is a subscription payment, fetch the full plan details
    let planDetails = null;
    let pricingBreakdown = null;

    if (payment.purpose === 'subscription' && payment.planId) {
      const plan = await Plan.findById(payment.planId);
      
      if (plan) {
        // Calculate pricing with any applied coupon
        const couponCode = payment.couponCode;
        const pricing = plan.calculatePrice(plan.interval, couponCode);
        
        pricingBreakdown = {
          originalKobo: pricing.originalKobo,
          originalAmountFormatted: `${(pricing.originalKobo / 100).toFixed(2)} ${payment.currency}`,
          discountKobo: pricing.discountKobo,
          discountAmountFormatted: `${(pricing.discountKobo / 100).toFixed(2)} ${payment.currency}`,
          finalKobo: pricing.finalKobo,
          finalAmountFormatted: `${(pricing.finalKobo / 100).toFixed(2)} ${payment.currency}`,
          discountPercentage: pricing.discountKobo > 0 
            ? ((pricing.discountKobo / pricing.originalKobo) * 100).toFixed(2)
            : '0',
          couponApplied: pricing.couponApplied ? {
            code: pricing.couponApplied.code,
            description: pricing.couponApplied.description,
            discountType: pricing.couponApplied.discountType,
            discountValue: pricing.couponApplied.discountValue,
            discountFormatted: pricing.couponApplied.discountType === 'percentage'
              ? `${pricing.couponApplied.discountValue}%`
              : `${(pricing.couponApplied.discountValue / 100).toFixed(2)} ${payment.currency}`,
          } : null,
          discountApplied: pricing.discountApplied ? {
            name: pricing.discountApplied.name,
            description: pricing.discountApplied.description,
            discountType: pricing.discountApplied.discountType,
            discountValue: pricing.discountApplied.discountValue,
            discountFormatted: pricing.discountApplied.discountType === 'percentage'
              ? `${pricing.discountApplied.discountValue}%`
              : `${(pricing.discountApplied.discountValue / 100).toFixed(2)} ${payment.currency}`,
          } : null,
        };

        // Build complete plan details
        planDetails = {
          // Basic info
          _id: plan._id,
          name: plan.name,
          slug: plan.slug,
          tier: plan.tier,
          description: plan.description,
          isActive: plan.isActive,
          isPublic: plan.isPublic,
          
          // Pricing and billing
          pricing: {
            basePriceKobo: plan.priceKobo,
            basePriceFormatted: `${(plan.priceKobo / 100).toFixed(2)} ${plan.currency}`,
            currency: plan.currency,
            interval: plan.interval,
            intervalFormatted: plan.interval.charAt(0).toUpperCase() + plan.interval.slice(1),
            isFree: plan.isFree,
            trialDays: plan.trialDays,
            trialPeriodFormatted: plan.trialDays > 0 
              ? `${plan.trialDays} day${plan.trialDays > 1 ? 's' : ''}`
              : 'No trial',
          },
          
          // Features and limits
          features: plan.features.map((feature: any) => ({
            name: feature.name,
            description: feature.description,
            included: feature.included,
            limit: feature.limit,
            unit: feature.unit,
            limitFormatted: feature.limit 
              ? feature.limit === -1 
                ? 'Unlimited'
                : `${feature.limit} ${feature.unit || ''}`.trim()
              : 'Not available',
          })),
          
          limits: {
            maxEvents: plan.maxEvents,
            maxEventsFormatted: plan.maxEvents === -1 ? 'Unlimited' : plan.maxEvents || 'Not specified',
            maxAttendeesPerEvent: plan.maxAttendeesPerEvent,
            maxAttendeesPerEventFormatted: plan.maxAttendeesPerEvent === -1 ? 'Unlimited' : plan.maxAttendeesPerEvent || 'Not specified',
            maxTeamMembers: plan.maxTeamMembers,
            maxTeamMembersFormatted: plan.maxTeamMembers === -1 ? 'Unlimited' : plan.maxTeamMembers || 'Not specified',
            storageGb: plan.storageGb,
            storageFormatted: plan.storageGb ? `${plan.storageGb} GB` : 'Not specified',
          },
          
          // Available discounts (automatic)
          availableDiscounts: plan.discounts
            ?.filter((d: any) => d.isActive)
            .map((discount: any) => ({
              name: discount.name,
              description: discount.description,
              discountType: discount.discountType,
              discountValue: discount.discountValue,
              discountFormatted: discount.discountType === 'percentage'
                ? `${discount.discountValue}%`
                : `${(discount.discountValue / 100).toFixed(2)} ${plan.currency}`,
              interval: discount.interval,
              validPeriod: {
                startsAt: discount.startsAt,
                endsAt: discount.endsAt,
                isValid: (!discount.startsAt || new Date() >= new Date(discount.startsAt)) &&
                         (!discount.endsAt || new Date() <= new Date(discount.endsAt)),
              },
            })) || [],
          
          // Available coupons
          availableCoupons: plan.coupons
            ?.filter((c: any) => c.status === 'active')
            .map((coupon: any) => ({
              code: coupon.code,
              description: coupon.description,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              discountFormatted: coupon.discountType === 'percentage'
                ? `${coupon.discountValue}%`
                : `${(coupon.discountValue / 100).toFixed(2)} ${plan.currency}`,
              remainingRedemptions: coupon.maxRedemptions 
                ? coupon.maxRedemptions - coupon.redemptionCount
                : 'Unlimited',
              minAmountRequired: coupon.minAmountKobo 
                ? `${(coupon.minAmountKobo / 100).toFixed(2)} ${plan.currency}`
                : 'No minimum',
              applicableIntervals: coupon.applicableIntervals,
              expiresAt: coupon.expiresAt,
              isExpired: coupon.expiresAt ? new Date() > new Date(coupon.expiresAt) : false,
            })) || [],
          
          // Metadata
          sortOrder: plan.sortOrder,
          metadata: plan.metadata,
          paystackPlanCode: plan.paystackPlanCode,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
        };
      }
    }

    // Prepare the complete response
    const responseData = {
      // Payment information
      payment: {
        _id: payment._id,
        purpose: payment.purpose,
        provider: payment.provider,
        
        // Amounts
        amount: {
          intended: payment.amount,
          intendedFormatted: `${(payment.amount / 100).toFixed(2)} ${payment.currency}`,
          paid: payment.amountPaid,
          paidFormatted: `${(payment.amountPaid / 100).toFixed(2)} ${payment.currency}`,
          discount: payment.discountAmount,
          discountFormatted: `${(payment.discountAmount / 100).toFixed(2)} ${payment.currency}`,
        },
        
        // Coupon applied (historical)
        couponApplied: payment.couponCode ? {
          code: payment.couponCode,
          discountValue: payment.couponDiscount,
          discountFormatted: payment.couponDiscount 
            ? `${(payment.couponDiscount / 100).toFixed(2)} ${payment.currency}`
            : null,
        } : null,
        
        // Gateway information
        gateway: {
          status: payment.gatewayStatus,
          reference: payment.reference,
          paystackReference: payment.paystackReference,
          channel: payment.channel,
          response: payment.gatewayResponse,
          paidAt: payment.paidAt,
        },
        
        // Payment method details
        paymentMethod: payment.cardLast4 ? {
          type: payment.cardType,
          last4: payment.cardLast4,
          bank: payment.cardBank,
          authorizationCode: payment.authorizationCode,
        } : null,
        
        // Refund information
        refund: payment.refundedAt ? {
          refundedAt: payment.refundedAt,
          amount: payment.refundAmount,
          amountFormatted: payment.refundAmount 
            ? `${(payment.refundAmount / 100).toFixed(2)} ${payment.currency}`
            : null,
          reference: payment.refundReference,
          reason: payment.refundReason,
        } : null,
        
        // Context IDs
        context: {
          registrationId: payment.registrationId,
          eventId: payment.eventId,
          subscriptionId: payment.subscriptionId,
          planId: payment.planId,
        },
        
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
      
      // Full plan details with pricing breakdown
      planDetails: planDetails,
      pricingBreakdown: pricingBreakdown,
      
      // Summary for quick reference
      summary: planDetails ? {
        planName: planDetails.name,
        planTier: planDetails.tier,
        billingInterval: planDetails.pricing.intervalFormatted,
        subtotal: pricingBreakdown?.originalAmountFormatted,
        discount: pricingBreakdown?.discountAmountFormatted,
        total: pricingBreakdown?.finalAmountFormatted,
        amountPaid: payment.amountPaid ? `${(payment.amountPaid / 100).toFixed(2)} ${payment.currency}` : null,
        paymentStatus: payment.gatewayStatus,
        trialPeriod: planDetails.pricing.trialPeriodFormatted,
      } : null,
    };

    return NextResponse.json({ 
      success: true, 
      data: responseData 
    }, { status: 200 });
    
  } catch (error) {
    const message = (error as Error).message ?? 'Failed to fetch payment with plan details';
    const status = message.includes('not found') ? 404 : 500;
    console.error('[GET /api/payments/:id/with-plan-details]', error);
    return NextResponse.json({ success: false, message }, { status });
  }
}