"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, Calendar03Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface EventTabItem {
  id: string;
  label: string;
  href: string;
  icon?: any;
  exactMatch?: boolean;
}

interface EventTabsProps {
  basePath?: string;
  showBackButton?: boolean;
  backButtonLabel?: string;
  onBackClick?: () => void;
  customTabs?: EventTabItem[];
  className?: string;
  variant?: "default" | "pills" | "underline";
}

const DEFAULT_TABS: EventTabItem[] = [
  {
    id: "events",
    label: "All Events",
    href: "/dashboard/events",
    icon: Calendar03Icon,
    exactMatch: true,
  },
  {
    id: "create-event",
    label: "Create Event",
    href: "/dashboard/events/create-event",
    icon: PlusSignIcon,
  },
];

export function EventTabs({basePath = "/dashboard/events", showBackButton = true, backButtonLabel = "Back", onBackClick, customTabs, className, variant = "underline" }: EventTabsProps) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = customTabs || DEFAULT_TABS;

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.push(basePath);
    }
  };

  const isActive = (tab: EventTabItem) => {
    if (tab.exactMatch) return pathname === tab.href;
    return pathname.startsWith(tab.href);
  };

  const getTabStyles = (active: boolean) => {
    if (variant === "pills") {
      return cn(
        "rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-violet-600 text-white shadow-sm"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      );
    }

    // Underline variant (default) - Clean & Smooth
    return cn(
      "relative px-6 py-4 text-sm font-medium whitespace-nowrap transition-all duration-300",
      "hover:text-foreground",
      active
        ? "text-violet-600 dark:text-violet-400"
        : "text-muted-foreground"
    );
  };

  return (
    <div className={cn("w-full mb-8", className)}>
      <div className="relative flex items-center border-b border-border pb-px">
        {/* Back Button */}
        {showBackButton && (
          <div className="flex-shrink-0 pr-6">
            <button
              onClick={handleBackClick}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 py-3 px-2 rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-violet-500"
              aria-label="Go back"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">{backButtonLabel}</span>
            </button>
          </div>
        )}

        {/* Tabs */}
        <nav className="flex flex-1 gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const active = isActive(tab);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "group inline-flex items-center gap-2 font-medium",
                  getTabStyles(active),
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                )}
                aria-current={active ? "page" : undefined}
              >
                {Icon && (
                  <HugeiconsIcon
                    icon={Icon}
                    className={cn(
                      "w-4 h-4 transition-colors",
                      active
                        ? "text-violet-600 dark:text-violet-400"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                )}
                <span>{tab.label}</span>

                {/* Smooth Active Underline Indicator */}
                {variant === "underline" && active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400 rounded-t-full transition-all duration-300" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}