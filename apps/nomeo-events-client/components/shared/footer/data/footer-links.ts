// data/footer-links.ts
import { FooterLinksData } from "@/types/footer-type";

export const footerLinks: FooterLinksData = {
  platform: [
    { name: "Discover Events", href: "/" },
    { name: "Events", href: "/events" },
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/about#contact" },
  ],
  resources: [
    { name: "How It Works", href: "/about#how-it-works" },
    { name: "FAQs", href: "/about#faq" },
    { name: "Help Center", href: "/help-center" },
    { name: "Community", href: "/help-center#community" },
    { name: "Ticket Support", href: "/help-center#ticket" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy", isModal: true },
    { name: "Terms of Use", href: "/terms", isModal: true },
    { name: "Cookie Policy", href: "/cookies", isModal: true },
    { name: "Data Protection", href: "/data-protection", isModal: true },
  ],
};