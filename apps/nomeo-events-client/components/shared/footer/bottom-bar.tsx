"use client";

import { LegalModalName } from "@/hooks/use-legal";
import { BottomBarProps } from "@/types/footer-type";

const BottomBar = ({ currentYear, onLegalClick }: BottomBarProps) => {
  const legalItems = [
    { name: "Privacy Policy", key: "Privacy Policy" },
    { name: "Terms of Use", key: "Terms of Use" },
    { name: "Cookie Policy", key: "Cookie Policy" },
    { name: "Data Protection", key: "Data Protection" },
  ];

  return (
    <div className="mt-8 pt-8 border-t border-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
        <div className="text-gray-400">
          <span>© {currentYear} Nomeo Events. </span>
          <span>All rights reserved.</span>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {legalItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onLegalClick(item.key as LegalModalName) }
              className="text-gray-400 hover:text-indigo-400 transition-colors text-xs"
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BottomBar;