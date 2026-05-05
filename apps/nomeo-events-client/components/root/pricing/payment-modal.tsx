"use client"

import React, { useState, useEffect, useRef } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, Tick01Icon, Loading03Icon } from '@hugeicons/core-free-icons';

const PaystackButton = dynamic(
  () => import('react-paystack').then((mod) => mod.PaystackButton),
  { ssr: false }
);

import { toast } from 'sonner';
import { useCoupon } from '@/hooks/use-plans';
import { TierPricing, IntervalPricing, PlanInterval } from './types';
import dynamic from 'next/dynamic';
import { useInitiatePayment, useVerifyPayment } from '@/hooks/use-payments';

export enum PaymentPurpose {
  EVENT_REGISTRATION = 'event_registration',
  SUBSCRIPTION = 'subscription'
}

interface PaymentModalProps {
  planId:         string;
  subscriptionId: string; // must exist before modal opens — pass from your subscription creation
  tier:           TierPricing;
  pricing:        IntervalPricing;
  interval:       PlanInterval;
  userEmail:      string;
  userName:       string;
  onClose:        () => void;
  onSuccess:      () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  planId, subscriptionId, tier, pricing, interval, userEmail, userName, onClose, onSuccess,
}) => {
  const { validate, validating, result, clear } = useCoupon();
  const [couponCode, setCouponCode] = useState('');
  const [processing, setProcessing] = useState(false);

  // ── Payment state ───────────────────────────────────────────────────────────
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const hasCompletedRef = useRef(false);
  // Track the last amount we initiated for — so we re-initiate if coupon changes
  const initiatedForAmountRef = useRef<number | null>(null);

  const finalAmount = result?.valid && result.discountAmount
    ? pricing.priceKobo - result.discountAmount
    : pricing.priceKobo;

  const isFree = finalAmount === 0;

  const { mutate: initiatePayment } = useInitiatePayment();

  // ── Initiate payment whenever finalAmount changes (or on first mount for paid plans)
  // This runs:
  //   1. On mount — creates the Payment record with initial amount
  //   2. When a coupon is applied — re-creates with discounted amount + new reference
  // We skip if isFree (no Paystack needed) or if the amount hasn't changed
  useEffect(() => {
    if (isFree || !userEmail || !subscriptionId || !planId) return;
    if (initiatedForAmountRef.current === finalAmount) return; // same amount, skip

    initiatedForAmountRef.current = finalAmount;
    setPaymentReference(null); // clear old reference while we get a new one
    hasCompletedRef.current = false; // allow polling to re-run
    setIsInitiating(true);

    initiatePayment(
      {
        purpose: PaymentPurpose.SUBSCRIPTION,
        email: userEmail,
        amount: finalAmount,
        subscriptionId,
        planId,
        ...(result?.valid && {
          couponCode,
          couponDiscount: result.discountPercentage,
          discountAmount: result.discountAmount,
        }),
      },
      {
        onSuccess: ({ data }) => {
          setPaymentReference(data.reference);
          setIsInitiating(false);
        },
        onError: () => {
          toast.error('Could not prepare payment. Please try again.');
          setIsInitiating(false);
          initiatedForAmountRef.current = null; // allow retry
        },
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalAmount, isFree]);

  // ── Poll verify every 3s after Paystack modal closes ───────────────────────
  // Webhook fires server-to-server and updates gatewayStatus.
  // Polling detects that update and activates the subscription on the frontend.
  const verifyQuery = useVerifyPayment(paymentReference ?? '', {
    enabled: !!paymentReference && !hasCompletedRef.current,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.gatewayStatus;
      if (status === 'success' || status === 'failed' || status === 'abandoned') return false;
      return 3000;
    },
  });

  // React Query v5 — handle verify result via useEffect (onSuccess removed from useQuery)
  useEffect(() => {
    if (!verifyQuery.data || hasCompletedRef.current) return;
    const status = verifyQuery.data.data?.gatewayStatus;
    if (!status) return;

    if (status === 'success') {
      hasCompletedRef.current = true;
      activateSubscription(verifyQuery.data.data.reference);
    } else if (status === 'failed' || status === 'abandoned') {
      toast.error('Payment was not completed. Please try again.');
      // Reset so user can retry — re-initiate will run via the amount useEffect
      setPaymentReference(null);
      initiatedForAmountRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyQuery.data]);

  // ── Activate subscription after payment confirmed ───────────────────────────
  // Called by polling when gatewayStatus = success.
  // The webhook may have already activated it — your API should be idempotent.
  const activateSubscription = async (reference: string) => {
    setProcessing(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          tier: tier.tier,
          interval,
          amount: finalAmount / 100,
          status: 'active',
          trialDays: pricing.trialDays,
          paymentReference: reference,
          // transactionId omitted — webhook already has it via verify()
        }),
      });
      if (!res.ok) throw new Error('Subscription activation failed');
      toast.success('Payment successful! Your subscription is now active.');
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Payment processed but activation failed. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  // ── Paystack success callback — store reference, let polling do the rest ───
  // Do NOT call /api/subscriptions here. The webhook handles it server-side.
  // Polling (useVerifyPayment) will detect the confirmed status and call activateSubscription.
  const handlePaystackSuccess = (response: { reference: string }) => {
    if (!paymentReference) setPaymentReference(response.reference);
    // polling is already running (enabled: !!paymentReference) — status will resolve shortly
  };

  // ── Free path — unchanged, no Paystack involved ─────────────────────────────
  const handleFreeSubscription = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId, tier: tier.tier, interval, amount: 0,
          status: 'active', trialDays: pricing.trialDays,
        }),
      });
      if (!res.ok) throw new Error('Subscription failed');
      toast.success('Subscription started successfully!');
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Failed to start subscription. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (couponCode) await validate(couponCode, planId, interval);
    // After validation, result.discountAmount updates → finalAmount changes
    // → the useEffect above re-initiates with the discounted amount automatically
  };

  const handleClose = () => {
    clear();
    setCouponCode('');
    onClose();
  };

  // ── Paystack metadata (unchanged) ─────────────────────────────────────────
  const customFields = [
    { display_name: 'Plan Tier',        variable_name: 'plan_tier',        value: tier.tier },
    { display_name: 'Plan Name',        variable_name: 'plan_name',        value: tier.name },
    { display_name: 'Billing Interval', variable_name: 'billing_interval', value: interval },
    { display_name: 'Customer Name',    variable_name: 'customer_name',    value: userName },
    { display_name: 'Customer Email',   variable_name: 'customer_email',   value: userEmail },
    { display_name: 'Trial Days',       variable_name: 'trial_days',       value: pricing.trialDays.toString() },
    ...(result?.valid ? [
      { display_name: 'Coupon Code',         variable_name: 'coupon_code',         value: couponCode },
      { display_name: 'Discount Percentage', variable_name: 'discount_percentage', value: result.discountPercentage?.toString() ?? '' },
      { display_name: 'Discount Amount',     variable_name: 'discount_amount',     value: ((result.discountAmount ?? 0) / 100).toString() },
    ] : []),
  ];

  // Real reference from DB — not a random client-side string
  const paystackConfig = {
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    email: userEmail,
    amount: finalAmount,
    currency: 'NGN',
    reference: paymentReference ?? '',          // ← real DB reference
    metadata: { custom_fields: customFields },
    onSuccess: handlePaystackSuccess,            // ← just stores reference
    onClose: () => {},
  };

  const isAwaitingConfirmation = !!paymentReference && processing;
  const buttonDisabled = processing || isInitiating || !paymentReference;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Complete Subscription</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">

          {/* Plan summary */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{tier.name} Plan</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">{interval} billing</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{pricing.priceDisplay}</p>
              {pricing.savings && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{pricing.savings.text}</p>
              )}
            </div>
          </div>

          {/* Feature preview */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">What's included</p>
            <div className="space-y-1.5">
              {tier.features.slice(0, 4).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <HugeiconsIcon icon={Tick01Icon} size={12} className="text-emerald-500" />
                  <span>{feature.name}</span>
                </div>
              ))}
              {tier.features.length > 4 && (
                <p className="text-xs text-gray-400 ml-5">+{tier.features.length - 4} more features</p>
              )}
            </div>
          </div>

          {/* Coupon */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Coupon code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="SAVE20"
                className="flex-1 px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              />
              <button
                onClick={handleApplyCoupon}
                disabled={validating || !couponCode}
                className="px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                {validating ? 'Checking…' : 'Apply'}
              </button>
            </div>
            {result?.valid && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <HugeiconsIcon icon={Tick01Icon} size={12} /> {result.message} · Saved {result.discountPercentage}%
              </p>
            )}
            {result?.valid === false && result?.message && (
              <p className="text-xs text-red-500 dark:text-red-400">{result.message}</p>
            )}
          </div>

          {/* Price breakdown */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="text-sm text-gray-900 dark:text-white">{pricing.priceDisplay}</span>
            </div>
            {result?.valid && result.discountAmount && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-emerald-600 dark:text-emerald-400">Discount</span>
                <span className="text-sm text-emerald-600 dark:text-emerald-400">
                  -₦{(result.discountAmount / 100).toLocaleString('en-NG')}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="text-base font-semibold text-gray-900 dark:text-white">Total due</span>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₦{(finalAmount / 100).toLocaleString('en-NG')}
                </p>
                {result?.valid && (
                  <p className="text-xs text-gray-400 line-through">{pricing.priceDisplay}</p>
                )}
              </div>
            </div>
          </div>

          {/* Trial notice */}
          {pricing.trialDays > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-950 rounded-lg p-3 border border-indigo-100 dark:border-indigo-900">
              <p className="text-xs text-center text-indigo-600 dark:text-indigo-400">
                ✨ You won't be charged for {pricing.trialDays} days — free trial included
              </p>
            </div>
          )}

          {/* Confirming banner — shown while polling resolves after modal closes */}
          {isAwaitingConfirmation && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
              <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                Confirming your payment… please don't close this window.
              </p>
            </div>
          )}

          {/* Preparing banner — shown while initiatePayment is in flight */}
          {isInitiating && !isFree && (
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <HugeiconsIcon icon={Loading03Icon} className="w-3 h-3 animate-spin shrink-0" />
              Preparing payment…
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Cancel
            </button>

            {isFree ? (
              <button
                onClick={handleFreeSubscription}
                disabled={processing}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {processing ? (
                  <><HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin inline mr-2" />Processing...</>
                ) : 'Start Free Trial'}
              </button>
            ) : (
              <PaystackButton
                {...paystackConfig}
                text={
                  isInitiating   ? 'Preparing…'
                  : processing   ? 'Confirming…'
                  : `Pay ₦${(finalAmount / 100).toLocaleString('en-NG')}`
                }
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50 transition-all active:scale-[0.98] cursor-pointer"
                // Disabled until we have a real reference from the server
                disabled={buttonDisabled}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};