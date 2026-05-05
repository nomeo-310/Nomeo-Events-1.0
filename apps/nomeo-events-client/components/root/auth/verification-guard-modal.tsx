// components/root/auth/verification-guard-modal.tsx
"use client";

import { AuthWrapper } from "./auth-wrapper";

interface Props {
  email: string;
  onClose: () => void;
}

export function VerificationGuardModal({ email, onClose }: Props) {
  return (
    <AuthWrapper
      defaultView="verify-email"
      defaultEmail={email}
      onClose={onClose}
    />
  );
}