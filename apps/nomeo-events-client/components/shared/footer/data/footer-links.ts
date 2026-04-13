import { FooterLinksData } from "@/types/footer-type";

export const footerLinks: FooterLinksData = {
  platform: [
    { name: "Discover Events", href: "/" },
    { name: "Seminars", href: "/seminars" },
    { name: "Webinars", href: "/webinars" },
    { name: "Entertainment", href: "/entertainment" },
  ],
  resources: [
    { name: "How It Works", href: "/how-it-works" },
    { name: "Pricing", href: "/pricing" },
    { name: "Help Center", href: "/help" },
    { name: "Blog", href: "/blog" },
    { name: "Community", href: "/community" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy", isModal: true },
    { name: "Terms of Use", href: "/terms", isModal: true },
    { name: "Cookie Policy", href: "/cookies", isModal: true },
    { name: "Data Protection", href: "/data-protection", isModal: true },
  ],
};