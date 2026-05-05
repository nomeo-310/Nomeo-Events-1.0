// hooks/use-paystack-flow.ts
'use client';

import { useState } from 'react';
import { useInitiatePayment, useVerifyPayment } from '@/hooks/use-payments';
import { toast } from 'sonner';

export enum PaymentPurpose {
  EVENT_REGISTRATION = 'event_registration',
  SUBSCRIPTION = 'subscription'
}

interface UsePaystackFlowOptions {
  onPaymentConfirmed: (reference: string) => Promise<void>;
  onPaymentFailed?: () => void;
}

// For event registration
interface EventFlowInput {
  purpose: PaymentPurpose.EVENT_REGISTRATION;
  email: string;
  amount: number; // kobo
  registrationId: string;
  eventId: string;
  couponCode?: string;
  couponDiscount?: number;
  discountAmount?: number;
}

// For subscription
interface SubscriptionFlowInput {
  purpose: PaymentPurpose.SUBSCRIPTION;
  email: string;
  amount: number;
  subscriptionId: string;
  planId: string;
  couponCode?: string;
  couponDiscount?: number;
  discountAmount?: number;
}

type FlowInput = EventFlowInput | SubscriptionFlowInput;

export function usePaystackFlow({ onPaymentConfirmed, onPaymentFailed }: UsePaystackFlowOptions) {
  const [reference, setReference] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const { mutate: initiatePayment, isPending: isInitiating } = useInitiatePayment();

  // Polls every 3s after modal closes, stops on success/failure
  useVerifyPayment(reference ?? '', {
    enabled: !!reference,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.gatewayStatus;
      if (status === 'success' || status === 'failed' || status === 'abandoned') return false;
      return 3000;
    },
    onSuccess: async (data) => {
      const status = data.data.gatewayStatus;
      if (status === 'success' && !isConfirming) {
        setIsConfirming(true);
        try {
          await onPaymentConfirmed(data.data.reference);
        } finally {
          setIsConfirming(false);
        }
      } else if (status === 'failed' || status === 'abandoned') {
        toast.error('Payment was not completed. Please try again.');
        onPaymentFailed?.();
        setReference(null);
        setAccessCode(null);
      }
    },
  });

  // Call this BEFORE opening the Paystack modal
  // Returns accessCode to pass into PaystackButton
  const initiate = (input: FlowInput): Promise<{ accessCode: string; reference: string }> => {
    return new Promise((resolve, reject) => {
      initiatePayment(input, {
        onSuccess: ({ data }) => {
          setAccessCode(data.accessCode);
          setReference(data.reference);
          resolve({ accessCode: data.accessCode, reference: data.reference });
        },
        onError: (err) => {
          toast.error('Could not start payment. Please try again.');
          reject(err);
        },
      });
    });
  };

  // Drop this directly into PaystackButton.onSuccess
  const onPaystackSuccess = (response: { reference: string }) => {
    // Reference already set from initiate() — polling is already running
    // Just make sure it matches (it will)
    if (!reference) setReference(response.reference);
  };

  return {
    initiate,
    onPaystackSuccess,
    accessCode,
    reference,
    isInitiating,
    isConfirming,
  };
}