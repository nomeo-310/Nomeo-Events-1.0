"use client"

import React, { useState, useEffect, useRef } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, Tick01Icon, Loading03Icon } from '@hugeicons/core-free-icons';
// react-paystack accesses window at module load — lazy loaded below to avoid SSR crash.

import { toast } from 'sonner';
import { useCoupon } from '@/hooks/use-plans';
import { TierPricing, IntervalPricing, PlanInterval } from './types';
import { useInitiatePayment, useVerifyPayment } from '@/hooks/use-payments';
import { useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@/hooks/use-subscription';

export enum PaymentPurpose {
  EVENT_REGISTRATION = 'event_registration',
  SUBSCRIPTION       = 'subscription',
}

interface PaymentModalProps {
  planId:         string;
  planSlug:       string;
  subscriptionId: string;
  tier:           TierPricing;
  pricing:        IntervalPricing;
  interval:       PlanInterval;
  userEmail:      string;
  userName:       string;
  onClose:        () => void;
  onSuccess:      () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  planId, planSlug, subscriptionId, tier, pricing, interval,
  userEmail, userName, onClose, onSuccess,
}) => {
  const { validate, validating, result, clear } = useCoupon();
  const [couponCode, setCouponCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const { subscribe, isSubscribing } = useSubscription();
  const queryClient = useQueryClient();

  // Lazy-load usePaystackPayment — react-paystack reads window at module load
  // time which crashes SSR. Loading it inside useEffect is safe.
  const [usePaystackPaymentHook, setUsePaystackPaymentHook] = useState<
    typeof import('react-paystack')['usePaystackPayment'] | null
  >(null);

  useEffect(() => {
    import('react-paystack').then((mod) => {
      setUsePaystackPaymentHook(() => mod.usePaystackPayment);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Payment state ───────────────────────────────────────────────────────────
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const hasCompletedRef = useRef(false);

  // ── CRITICAL: polling is only active after the user actually pays ───────────
  // We keep a separate flag for this so polling never starts on mount —
  // only after the Paystack modal closes following a real payment attempt.
  // This is the main reason 200+ payment records were created: polling was
  // starting immediately on mount and calling verify every 3s before the user
  // even opened the Paystack modal, which in turn called the server repeatedly.
  const [userHasPaid, setUserHasPaid] = useState(false);

  const [retryCount, setRetryCount] = useState(0);
  const { mutate: initiatePayment } = useInitiatePayment();

  const finalAmount = result?.valid && result.discountAmount
    ? pricing.priceKobo - result.discountAmount
    : pricing.priceKobo;

  const isFree = finalAmount === 0;

  // ── Initiate payment on mount and on retry ──────────────────────────────────
  // Creates a Payment record on the server and gets a Paystack reference.
  // Does NOT start polling — polling only starts after userHasPaid is set.
  useEffect(() => {
    if (isFree || !userEmail || !subscriptionId || !planId) return;

    hasCompletedRef.current = false;
    setPaymentReference(null);
    setUserHasPaid(false); // reset so polling doesn't start prematurely on retry
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
        },
      }
    );
  // retryCount re-runs this after abandonment. finalAmount re-runs after coupon.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount, finalAmount]);

  // ── Poll verify — ONLY after user has attempted payment ────────────────────
  // enabled is false until userHasPaid is set in handlePaystackClose/Success.
  // This prevents the hundreds-of-payments problem where polling was creating
  // verify calls (and therefore DB reads/writes) on every mount.
  const verifyQuery = useVerifyPayment(paymentReference ?? '', {
    enabled: !!paymentReference && userHasPaid && !hasCompletedRef.current,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.gatewayStatus;
      if (status === 'success' || status === 'failed' || status === 'abandoned') return false;
      return 3000;
    },
  });

  useEffect(() => {
    if (!verifyQuery.data || hasCompletedRef.current) return;

    const responseRef = verifyQuery.data.data?.reference;
    const status      = verifyQuery.data.data?.gatewayStatus;

    // Only act on data that belongs to the current reference.
    // Stale cached data from a previous attempt would otherwise fire this
    // effect immediately, showing the toast before the user does anything.
    if (!paymentReference || responseRef !== paymentReference) return;
    if (!status) return;

    if (status === 'success') {
      hasCompletedRef.current = true;
      activateSubscription(responseRef);
    } else if (status === 'failed' || status === 'abandoned') {
      // Evict from cache so it never re-triggers this block
      queryClient.removeQueries({ queryKey: ['payments', 'verify', responseRef] });
      setUserHasPaid(false);
      setPaymentReference(null);
      setRetryCount((c) => c + 1);
      toast.error(
        status === 'abandoned'
          ? 'Payment was not completed. Click Pay to try again.'
          : 'Payment failed. Please try again.'
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyQuery.data, paymentReference]);

  // ── Activate subscription after payment confirmed ──────────────────────────
  const activateSubscription = async (reference: string) => {
    setProcessing(true);
    try {
      await subscribe({
        planSlug,
        paystackReference: reference,
        ...(result?.valid && couponCode ? { couponCode } : {}),
      });
      toast.success('Payment successful! Your subscription is now active.');
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Payment processed but activation failed. Please contact support.');
    } finally {
      setProcessing(false);
    }
  };

  // ── Free subscription path ─────────────────────────────────────────────────
  const handleFreeSubscription = async () => {
    setProcessing(true);
    try {
      await subscribe({
        planSlug,
        paystackReference: '',
        ...(result?.valid && couponCode ? { couponCode } : {}),
      });
      toast.success('Subscription started successfully!');
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Failed to start subscription. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // ── Paystack callbacks ─────────────────────────────────────────────────────
  // onSuccess: user completed payment — start polling to confirm
  const handlePaystackSuccess = (response: { reference: string }) => {
    setUserHasPaid(true);
    // Safety net: if reference somehow changed, update it
    if (response.reference && response.reference !== paymentReference) {
      setPaymentReference(response.reference);
    }
  };

  // onClose: Paystack modal closed (paid or dismissed).
  // Start polling regardless — if they paid, verify will return success.
  // If they dismissed, verify will return pending then abandoned after timeout.
  const handlePaystackClose = () => {
    setUserHasPaid(true);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    await validate(couponCode, planId, interval);
  };

  const handleClose = () => {
    clear();
    setCouponCode('');
    onClose();
  };

  // ── Paystack config ────────────────────────────────────────────────────────
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

  // ── usePaystackPayment ─────────────────────────────────────────────────────
  // onSuccess and onClose are NOT part of HookConfig — they go as arguments
  // onSuccess and onClose are passed as an object to initializePayment() — not in the config.
  const paystackConfig = {
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    email:     userEmail,
    amount:    finalAmount,
    currency:  'NGN',
    reference: paymentReference ?? '',
    metadata:  { custom_fields: customFields },
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const initializePayment = usePaystackPaymentHook?.(paystackConfig) ?? null;

  const canPay = !!paymentReference && !!initializePayment && !isInitiating && !processing && !isSubscribing && !hasCompletedRef.current;

  const handlePayClick = () => {
    if (!canPay || !initializePayment) return;
    // Callbacks passed here as arguments — this is the correct react-paystack API.
    initializePayment({ onSuccess: handlePaystackSuccess, onClose: handlePaystackClose });
  };

  // ── Derived UI state ───────────────────────────────────────────────────────
  const isConfirming       = userHasPaid && (processing || isSubscribing);
  const isPreparingReference = isInitiating && !paymentReference;
  const priceDisplay       = `₦${(finalAmount / 100).toLocaleString('en-NG')}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Complete Subscription
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
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
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              What's included
            </p>
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
                <HugeiconsIcon icon={Tick01Icon} size={12} />
                {result.message} · Saved {result.discountPercentage}%
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

          {/* Confirming banner — only shown after user interacts with Paystack */}
          {isConfirming && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
              <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                Confirming your payment… please don't close this window.
              </p>
            </div>
          )}

          {/* Preparing banner */}
          {isPreparingReference && (
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <HugeiconsIcon icon={Loading03Icon} className="w-3 h-3 animate-spin shrink-0" />
              {retryCount > 0 ? 'Preparing a new payment session…' : 'Preparing payment…'}
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
                disabled={processing || isSubscribing}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {processing || isSubscribing ? (
                  <>
                    <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin inline mr-2" />
                    Processing...
                  </>
                ) : 'Start Free Trial'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePayClick}
                disabled={!canPay}
                className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {isPreparingReference ? (
                  <><HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin inline mr-2" />Preparing…</>
                ) : isConfirming ? (
                  <><HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin inline mr-2" />Confirming…</>
                ) : retryCount > 0 ? (
                  `Try Again — Pay ${priceDisplay}`
                ) : (
                  `Pay ${priceDisplay}`
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};