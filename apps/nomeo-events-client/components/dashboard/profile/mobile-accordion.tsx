"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";

interface MobileAccordionProps {
  tab: {
    id: string;
    label: string;
    mobileLabel: string;
  };
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const MobileAccordion = ({ tab, isOpen, onToggle, children }: MobileAccordionProps) => {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">{tab.label}</span>
        </div>
        <HugeiconsIcon 
          icon={ArrowDown01Icon} 
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-6 pt-2 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};