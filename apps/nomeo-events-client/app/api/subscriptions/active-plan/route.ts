// app/api/subscriptions/active-plan/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongoose';
import { Subscription } from '@/models/subscription';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    // findActiveByUser already populates planId with the full Plan document
    const subscription = await Subscription.findActiveByUser(currentUser.id);

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const plan = subscription.planId as any; // populated Plan document

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          status:             subscription.status,
          interval:           subscription.interval,
          planTier:           subscription.planTier,
          planName:           subscription.planName,
          currentPeriodEnd:   subscription.currentPeriodEnd,
          cancelAtPeriodEnd:  subscription.cancelAtPeriodEnd,
          trialEnd:           subscription.trialEnd ?? null,
          isInTrial:          subscription.isInTrial(),
          // Limits snapshot on subscription (fast path — no join needed)
          maxEvents:            subscription.maxEvents            ?? null,
          maxAttendeesPerEvent: subscription.maxAttendeesPerEvent ?? null,
          maxTeamMembers:       subscription.maxTeamMembers       ?? null,
          storageGb:            subscription.storageGb            ?? null,
        },
        // Full plan document — includes features array for getPlanLimits()
        plan: {
          _id:                  plan._id,
          name:                 plan.name,
          slug:                 plan.slug,
          tier:                 plan.tier,
          interval:             plan.interval,
          isFree:               plan.isFree,
          priceKobo:            plan.priceKobo,
          currency:             plan.currency,
          trialDays:            plan.trialDays,
          maxEvents:            plan.maxEvents            ?? null,
          maxAttendeesPerEvent: plan.maxAttendeesPerEvent ?? null,
          maxTeamMembers:       plan.maxTeamMembers       ?? null,
          storageGb:            plan.storageGb            ?? null,
          features:             Array.isArray(plan.features) ? plan.features : [],
        },
      },
    });

  } catch (error: any) {
    console.error('Failed to fetch active plan:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch active plan' },
      { status: 500 }
    );
  }
}