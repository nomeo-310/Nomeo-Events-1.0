"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, TelephoneIcon } from "@hugeicons/core-free-icons";
import { socialLinks } from "./data/social-links";
import { BrandColumnProps } from "@/types/footer-type";

const BrandColumn = ({ onContactClick }: BrandColumnProps) => {
  return (
    <div className="space-y-4">
      <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
        Nomeo Events
      </div>
      <p className="text-sm text-gray-400 leading-relaxed">
        Where moments meet magic. The all-in-one event management platform for seminars, webinars, and entertainment events.
      </p>

      <div className="space-y-2 pt-2">
        <a
          href="mailto:hello@nomeoevents.com"
          className="flex items-center space-x-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors"
        >
          <HugeiconsIcon icon={Mail01Icon} size={16} />
          <span>hello@nomeoevents.com</span>
        </a>
        <a
          href="tel:+1234567890"
          className="flex items-center space-x-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors"
        >
          <HugeiconsIcon icon={TelephoneIcon} size={16} />
          <span>+1 (234) 567-890</span>
        </a>
      </div>

      <div className="flex space-x-3 pt-4">
        {socialLinks.map((social) => (
          <a
            key={social.name}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-indigo-600 transition-colors duration-200"
            aria-label={social.name}
          >
            <HugeiconsIcon icon={social.icon} size={18} />
          </a>
        ))}
      </div>
    </div>
  );
};

export default BrandColumn;