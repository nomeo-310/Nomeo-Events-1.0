import { LegalModalName } from "@/hooks/use-legal";

export interface FooterLink {
  name: string;
  href: string;
  isModal?: boolean;
}

export interface SocialLink {
  name: string;
  icon: any;
  href: string;
}

export interface FooterLinksData {
  platform: FooterLink[];
  resources: FooterLink[];
  legal: FooterLink[];
}

export interface BrandColumnProps {
  onContactClick?: () => void;
}

export interface FooterLinksProps {
  links: FooterLink[];
  title: string;
  onLegalClick?: (linkName: LegalModalName) => void;
}

export interface NewsletterSectionProps {
  onSubscribe?: (email: string) => void;
}

export interface BottomBarProps {
  currentYear: number;
  onLegalClick: (linkName: LegalModalName) => void;
}