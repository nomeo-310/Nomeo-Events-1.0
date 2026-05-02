// components/FooterLinks.tsx
"use client";

import Link from "next/link";
import { FooterLinksProps } from "@/types/footer-type";
import { LegalModalName } from "@/hooks/use-legal";
import { useSmoothScroll } from "@/hooks/use-smooth-scroll";

const FooterLinks = ({ links, title, onLegalClick }: FooterLinksProps) => {
  const { handleScrollLinkClick } = useSmoothScroll();

  return (
    <div>
      <h3 className="text-white font-semibold text-lg mb-4">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.name}>
            {link.isModal ? (
              <button
                onClick={() => onLegalClick?.(link.name as LegalModalName)}
                className="text-sm text-gray-400 hover:text-indigo-400 transition-colors cursor-pointer"
              >
                {link.name}
              </button>
            ) : (
              <Link
                href={link.href}
                onClick={(e) => handleScrollLinkClick(e, link.href)}
                className="text-sm text-gray-400 hover:text-indigo-400 transition-colors"
              >
                {link.name}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FooterLinks;