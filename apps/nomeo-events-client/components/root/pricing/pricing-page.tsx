"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { ChampionIcon, SparklesIcon, ArrowRight01Icon, Tick01Icon, ArrowDataTransferHorizontalIcon as CompareIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { usePricing, PlanTier } from '@/hooks/use-plans';
import { authClient } from '@/lib/auth-client';
import { useModal } from '@/hooks/use-modal';
import { AuthWrapper } from '@/components/root/auth/auth-wrapper';
import { saveReturnUrl } from '@/lib/return-url';
import { toast } from 'sonner';

import { SelectedPlanForPayment, TierPricing, IntervalPricing } from './types';
import { PricingSkeleton } from './pricing-skeleton';
import { ErrorState } from './error-state';
import { TierRow } from './tier-row';
import { MobilePlanSelector } from './mobile-plan-selector';
import { LimitStat, FeatureRow } from './plan-display-atoms';
import { CompareModal } from './compare-modal';
import { ConfirmationModal } from './confirmation-modal';
import { PaymentModal } from './payment-modal';

export const PricingPage: React.FC = () => {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const { openModal, closeModal } = useModal();

  const { tiers, supportedIntervals, isLoading, isError, error, selectedInterval, setSelectedInterval, getPricingForTier, refetch } = usePricing();

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedTier,            setSelectedTier]            = useState<PlanTier | null>(null);
  const [showPaymentModal,        setShowPaymentModal]        = useState(false);
  const [showConfirmationModal,   setShowConfirmationModal]   = useState(false);
  const [showCompareModal,        setShowCompareModal]        = useState(false);
  const [selectedPlansForCompare, setSelectedPlansForCompare] = useState<PlanTier[]>([]);
  const [selectedPlanForPayment,  setSelectedPlanForPayment]  = useState<SelectedPlanForPayment | null>(null);

  const isLoggedIn = !!session;

  // ── Auth modals ────────────────────────────────────────────────────────────
  const handleOpenLogin = useCallback(() => {
    openModal({
      title: '', size: 'large', showCloseButton: true,
      closeOnEsc: true, closeOnOutsideClick: true,
      children: <AuthWrapper defaultView="login" onClose={closeModal} />,
    });
  }, [openModal, closeModal]);

  const handleOpenSignup = useCallback(() => {
    openModal({
      title: '', size: 'large', showCloseButton: true,
      closeOnEsc: true, closeOnOutsideClick: true,
      children: <AuthWrapper defaultView="signup" onClose={closeModal} />,
    });
  }, [openModal, closeModal]);

  // ── Default plan selection ─────────────────────────────────────────────────
  useEffect(() => {
    if (tiers.length > 0 && !selectedTier) {
      const firstPaid = tiers.find((t) => t.tier !== PlanTier.FREE);
      setSelectedTier(firstPaid?.tier ?? tiers[0]?.tier ?? null);
    }
  }, [tiers, selectedTier]);

  // ── Subscribe flow ─────────────────────────────────────────────────────────
  // No pre-created pending subscription. We only resolve planId + planSlug
  // here so PaymentModal can call POST /api/payments/initiate with just
  // { purpose, email, amount, planId }.
  // The subscription record is created by POST /api/subscriptions AFTER
  // payment is verified — mirroring exactly how registration works.
  const handleSubscribeClick = async (tier: TierPricing, pricing: IntervalPricing) => {
    if (!session) { saveReturnUrl(); handleOpenLogin(); return; }

    try {
      const res  = await fetch(`/api/plans/tier/${tier.tier}`);
      const data = await res.json();

      if (!data.success) {
        toast.error('Could not load plan details. Please try again.');
        return;
      }

      const planDoc = data.data.plans.find((p: any) => p.interval === pricing.interval);

      if (!planDoc) {
        toast.error('Plan not found for this billing interval.');
        return;
      }

      setSelectedPlanForPayment({
        tier,
        pricing,
        planId: planDoc._id ?? '',
        slug:   planDoc.slug ?? '',
        subscriptionId: '', // intentionally empty — created post-payment
      });

      setShowConfirmationModal(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleConfirmSubscription = () => {
    setShowConfirmationModal(false);
    setShowPaymentModal(true);
  };

  const handleClosePayment = () => {
    setShowPaymentModal(false);
    setSelectedPlanForPayment(null);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedPlanForPayment(null);
    router.push('/dashboard/subscriptions');
  };

  // ── Early returns ──────────────────────────────────────────────────────────
  if (isLoading) return <PricingSkeleton />;
  if (isError)   return <ErrorState error={error?.message ?? 'Failed to load pricing'} onRetry={refetch} />;

  const displayTier    = tiers.find((t) => t.tier === selectedTier);
  const displayPricing = displayTier ? getPricingForTier(displayTier) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* Hero / interval picker */}
      <div className="border-gray-100 dark:border-gray-800 py-12 sm:py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-500 dark:text-gray-400 px-4 sm:px-0">
            Choose the perfect plan for your event management needs.
            All paid plans include a 14-day free trial.
          </p>

          {/* Interval toggle */}
          <div className="mt-6 sm:mt-8 inline-flex p-1 rounded-full bg-gray-100 dark:bg-gray-800 gap-1">
            {supportedIntervals.map((interval) => (
              <button
                key={interval.value}
                onClick={() => setSelectedInterval(interval.value)}
                className={cn(
                  'relative px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200',
                  selectedInterval === interval.value
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200',
                )}
              >
                {interval.label}
                {interval.discount && (
                  <span className={cn(
                    'ml-0.5 sm:ml-1 text-[10px] sm:text-xs font-semibold',
                    selectedInterval === interval.value ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-500',
                  )}>
                    {interval.discount}
                  </span>
                )}
                {interval.isPopular && selectedInterval !== interval.value && (
                  <span className="absolute -top-2 -right-1 bg-amber-400 text-amber-900 text-[9px] font-bold px-1 py-0.5 rounded-full leading-none hidden sm:inline-block">
                    Popular
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Compare button — desktop only */}
          <div className="mt-6 hidden lg:block">
            <button
              onClick={() => setShowCompareModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <HugeiconsIcon icon={CompareIcon} size={15} />
              Compare Plans
              {selectedPlansForCompare.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">
                  {selectedPlansForCompare.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto px-4 pb-16 sm:pb-20">
        <MobilePlanSelector
          tiers={tiers}
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
          getPricingForTier={getPricingForTier}
        />

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0">
            <div className="sticky top-6 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1 mb-4">
                Select a plan
              </p>
              {tiers.map((tier) => (
                <TierRow
                  key={tier.tier}
                  tier={tier}
                  pricing={getPricingForTier(tier)}
                  isSelected={selectedTier === tier.tier}
                  onSelect={() => setSelectedTier(tier.tier)}
                />
              ))}
            </div>
          </aside>

          {/* Right detail panel */}
          <div className="flex-1 min-w-0 space-y-4">
            {displayTier && displayPricing ? (
              <>
                <div className={cn(
                  'rounded-xl border p-4 sm:p-6',
                  displayTier.isPopular
                    ? 'border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20'
                    : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30',
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{displayTier.name}</h2>
                        {displayTier.isPopular && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                            <HugeiconsIcon icon={ChampionIcon} size={11} /> Most Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{displayTier.description}</p>
                    </div>

                    <div className="text-left sm:text-right flex-shrink-0 space-y-0.5">
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {displayPricing.priceDisplay}
                      </div>
                      <div className="text-xs text-gray-400">
                        per {selectedInterval}
                        {selectedInterval !== 'monthly' && displayPricing.pricePerMonthDisplay && (
                          <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                            · {displayPricing.pricePerMonthDisplay}
                          </span>
                        )}
                      </div>
                      {displayPricing.savings && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                          {displayPricing.savings.text}
                        </span>
                      )}
                      {displayPricing.trialDays > 0 && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                          {displayPricing.trialDays}-day free trial
                        </p>
                      )}
                    </div>
                  </div>

                  {displayTier.tier !== PlanTier.FREE && (
                    <div className="mt-6">
                      <button
                        onClick={() => handleSubscribeClick(displayTier, displayPricing)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] bg-indigo-600 hover:bg-indigo-700 text-white shadow-md w-full sm:w-auto justify-center"
                      >
                        <HugeiconsIcon icon={SparklesIcon} size={14} />
                        Start {displayTier.name} trial
                        <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                      </button>
                      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-center sm:text-left">
                        No credit card required · Cancel anytime
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/30">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Plan limits</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <LimitStat value={displayTier.limits.maxEvents === undefined ? '∞' : String(displayTier.limits.maxEvents)} label="Max Events" />
                    <LimitStat value={displayTier.limits.maxAttendeesPerEvent === undefined ? '∞' : displayTier.limits.maxAttendeesPerEvent.toLocaleString()} label="Attendees / event" />
                    <LimitStat value={displayTier.limits.maxTeamMembers === undefined ? '∞' : String(displayTier.limits.maxTeamMembers)} label="Team members" />
                    <LimitStat value={displayTier.limits.storageGb === undefined ? '∞' : `${displayTier.limits.storageGb} GB`} label="Storage" />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/30">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">All features</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                    {displayTier.features.map((f, i) => (
                      <FeatureRow key={i} name={f.name} included={f.included} limit={f.limit} unit={f.unit} description={f.description} />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-400">Select a plan to see details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA banner — unauthenticated only */}
      {!isLoggedIn && (
        <div className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 mt-8">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 lg:py-12">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-semibold text-white">Ready to grow your events?</h3>
                <p className="text-indigo-100 text-xs sm:text-sm max-w-lg">
                  Join thousands of event organizers. Start your 14-day free trial on any paid plan — no credit card required. Cancel anytime.
                </p>
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start mt-3">
                  {['No credit card required', '14-day free trial', 'Cancel anytime'].map((item) => (
                    <span key={item} className="inline-flex items-center gap-1.5 text-xs text-indigo-100">
                      <HugeiconsIcon icon={Tick01Icon} size={12} /> {item}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => { saveReturnUrl(); handleOpenSignup(); }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-700 text-sm font-semibold hover:bg-gray-50 transition-all active:scale-[0.98] shadow-lg whitespace-nowrap"
              >
                <HugeiconsIcon icon={SparklesIcon} size={16} />
                Get Started Right Now
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showConfirmationModal && selectedPlanForPayment && (
        <ConfirmationModal
          open={showConfirmationModal}
          tier={selectedPlanForPayment.tier}
          pricing={selectedPlanForPayment.pricing}
          interval={selectedInterval}
          onClose={() => { setShowConfirmationModal(false); setSelectedPlanForPayment(null); }}
          onConfirm={handleConfirmSubscription}
        />
      )}

      {showPaymentModal && selectedPlanForPayment && session?.user && (
        <PaymentModal
          planSlug={selectedPlanForPayment.slug}
          planId={selectedPlanForPayment.planId}
          tier={selectedPlanForPayment.tier}
          pricing={selectedPlanForPayment.pricing}
          interval={selectedInterval}
          userEmail={session.user.email}
          userName={session.user.name ?? ''}
          onClose={handleClosePayment}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {showCompareModal && (
        <CompareModal
          tiers={tiers}
          selectedTiers={selectedPlansForCompare}
          selectedInterval={selectedInterval}
          onClose={() => setShowCompareModal(false)}
          onUpdateSelection={setSelectedPlansForCompare}
          getPricingForTier={getPricingForTier}
        />
      )}
    </div>
  );
};

export default PricingPage;