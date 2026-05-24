// components/admin/onboarding-provider.tsx
"use client";

import { ScriptErrorBoundary } from "../ui/script-error-boundary";
import { OnboardingModal } from "./onboarding-modal";

interface OnboardingProviderProps {
  needsOnboarding: boolean;
  userData: {
    email: string;
    name: string;
    displayName: string;
  } | null;
}

export function Onboarding({ needsOnboarding, userData }: OnboardingProviderProps) {
  
  if (!needsOnboarding || !userData) {
    return null;
  }

  return (
    <ScriptErrorBoundary>
      <OnboardingModal
        isOpen={true}
        onComplete={() => {
          window.location.href = '/admin/dashboard';
        }}
        userData={userData}
      />
    </ScriptErrorBoundary>
  );
}