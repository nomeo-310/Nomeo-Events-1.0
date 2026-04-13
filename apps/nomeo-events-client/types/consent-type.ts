export interface ConsentPreferences {
  necessary: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  socialMedia: boolean;
}

export interface UserConsent {
  id: string;
  userId?: string;
  type: ConsentType;
  accepted: boolean;
  acceptedAt: Date;
  ipAddress?: string;
  version: string;
}

export type ConsentType = 
  | "privacy_policy"
  | "terms_of_use"
  | "cookie_policy"
  | "data_processing"
  | "marketing_consent"
  | "age_verification"
  | "event_terms";

export interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline?: () => void;
  onCustomize?: () => void;
  title?: string;
}