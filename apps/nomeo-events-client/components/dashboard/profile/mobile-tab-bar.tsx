"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon, ViewIcon, StarIcon, UserGroup03Icon, CrownIcon, CreditCardIcon, Shield01Icon, MapsLocation01Icon, Link05Icon } from "@hugeicons/core-free-icons";

const TABS = [
  { id: "basic", label: "Basic", icon: UserGroup03Icon },
  { id: "organization", label: "Org", icon: Building03Icon },
  { id: "professional", label: "Pro", icon: CrownIcon },
  { id: "contact", label: "Contact", icon: MapsLocation01Icon },
  { id: "social", label: "Social", icon: Link05Icon },
  { id: "payment", label: "Payment", icon: CreditCardIcon },
  { id: "visibility", label: "View", icon: ViewIcon },
  { id: "verification", label: "Verify", icon: Shield01Icon },
] as const;

type TabId = typeof TABS[number]["id"];

interface MobileTabBarProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

export const MobileTabBar = ({ activeTab, onTabChange }: MobileTabBarProps) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around items-center px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-3 px-2 flex-1 transition-colors ${
                isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <HugeiconsIcon icon={Icon} className="w-5 h-5" />
              <span className="text-xs mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};