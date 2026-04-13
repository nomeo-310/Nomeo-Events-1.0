import { useNestedModalStore } from "@/stores/nested-modal-store";
import { TermsOfUseContent } from "../components/root/consent/terms-of-use";
import { PrivacyPolicyContent } from "../components/root/consent/privacy-policy";
import { EventTermsContent } from "../components/root/consent/event-terms";
import { CookiePolicyContent } from "../components/root/consent/cookie-policy";
import { MarketingConsentContent } from "../components/root/consent/marketing-consent";
import { DataProcessingContent } from "../components/root/consent/data-processing";
import { 
  CircleLock01Icon, 
  CookieIcon, 
  File01Icon, 
  Megaphone01Icon, 
  Pdf02Icon, 
  Shield01Icon 
} from "@hugeicons/core-free-icons";
import { ReactNode } from "react";

// Define the types for legal modal items
interface LegalModalItem {
  title: string;
  description: string;
  icon: any; // Hugeicons icon component type
  content: ReactNode;
}

// Define the legal modal names as a union type for type safety
export type LegalModalName = 
  | "Terms of Use"
  | "Privacy Policy"
  | "Event Terms"
  | "Cookie Policy"
  | "Marketing Consent"
  | "Data Protection";

// Define the map type
type LegalModalsMap = Record<LegalModalName, LegalModalItem>;

// Define the return type of the hook
interface UseLegalModalsReturn {
  openLegalModal: (modalName: LegalModalName) => void;
}

export const useLegalModals = (): UseLegalModalsReturn => {
  const { openNestedModal } = useNestedModalStore();

  const legalModalsMap: LegalModalsMap = {
    "Terms of Use": {
      title: "Terms of Use",
      description: "Please read our terms and conditions",
      icon: Pdf02Icon,
      content: <TermsOfUseContent />,
    },
    "Privacy Policy": {
      title: "Privacy Policy",
      description: "Learn how we protect your data",
      icon: CircleLock01Icon,
      content: <PrivacyPolicyContent />,
    },
    "Event Terms": {
      title: "Event Terms & Conditions",
      description: "Terms specific to event registration and participation",
      icon: File01Icon,
      content: <EventTermsContent />,
    },
    "Cookie Policy": {
      title: "Cookie Policy",
      description: "How we use cookies to improve your experience",
      icon: CookieIcon,
      content: <CookiePolicyContent />,
    },
    "Marketing Consent": {
      title: "Marketing Consent",
      description: "Manage your communication preferences",
      icon: Megaphone01Icon,
      content: <MarketingConsentContent />,
    },
    "Data Protection": {
      title: "Data Protection",
      description: "How we handle and protect your personal data",
      icon: Shield01Icon,
      content: <DataProcessingContent />,
    },
  };

  const openLegalModal = (modalName: LegalModalName): void => {
    const modal = legalModalsMap[modalName];
    if (!modal) {
      console.error(`Modal "${modalName}" not found`);
      return;
    }

    openNestedModal({
      title: modal.title,
      description: modal.description,
      size: "large",
      icon: modal.icon,
      showCloseButton: true,
      closeOnEsc: true,
      closeOnOutsideClick: true,
      children: modal.content,
    });
  };

  return { openLegalModal };
};