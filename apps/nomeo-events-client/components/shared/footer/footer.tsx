"use client";


import { LegalModalName, useLegalModals } from "../../../hooks/use-legal";
import BottomBar from "./bottom-bar";
import BrandColumn from "./brand-column";
import { footerLinks } from "./data/footer-links";
import FooterLinks from "./footer-links";
import NewsletterSection from "./newsletter-section";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { openLegalModal } = useLegalModals();

  const handleLegalClick = (linkName: LegalModalName) => {
    openLegalModal(linkName);
  };

  const handleSubscribe = (email: string) => {
    console.log("Subscribed with email:", email);
    // Add your newsletter subscription logic here
  };

  return (
    <footer className="relative bg-gray-900 dark:bg-black text-gray-300">
      {/* Gradient border top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Column */}
          <BrandColumn />

          {/* Platform Links */}
          <FooterLinks
            links={footerLinks.platform}
            title="Platform"
          />

          {/* Resources Links */}
          <FooterLinks
            links={footerLinks.resources}
            title="Resources"
          />

          {/* Legal Links */}
          <FooterLinks
            links={footerLinks.legal}
            title="Legal"
            onLegalClick={handleLegalClick}
          />
        </div>

        {/* Newsletter Section */}
        <NewsletterSection onSubscribe={handleSubscribe} />

        {/* Bottom Bar */}
        <BottomBar
          currentYear={currentYear}
          onLegalClick={handleLegalClick}
        />
      </div>
    </footer>
  );
};

export default Footer;