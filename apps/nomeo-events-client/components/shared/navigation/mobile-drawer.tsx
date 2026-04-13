"use client";

import { useEffect } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Login01Icon as LoginIcon,
  Logout01Icon,
  User03Icon as UserIcon,
  DashboardSquare01Icon,
  Notification02Icon,
  Cancel01Icon as CloseIcon,
} from "@hugeicons/core-free-icons";
import { MobileDrawerProps } from "@/types/navigation-type";
import Logo from "./logo";

const MobileDrawer = ({
  isOpen,
  onClose,
  navItems,
  dashboardItem,
  isLoggedIn,
  isActive,
  onLogout,
  onOpenLogin,
  userName,
  userEmail,
  initials,
  notifCount,
}: MobileDrawerProps) => {
  // Lock body scroll only while drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div aria-hidden={!isOpen}>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
        className={`fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
        className={`fixed inset-y-0 left-0 w-[300px] z-50 flex flex-col bg-white dark:bg-gray-950 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <Logo onClick={onClose} />
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <HugeiconsIcon icon={CloseIcon} size={18} />
          </button>
        </div>

        {isLoggedIn && (
          <div className="mx-3 mt-3 px-3 py-3 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {initials || <HugeiconsIcon icon={UserIcon} size={16} />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{userName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail}</p>
            </div>
            {notifCount > 0 && (
              <span className="ml-auto flex-shrink-0 w-5 h-5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Menu
          </p>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors duration-150 ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={18}
                  className={active ? "text-indigo-500" : "text-gray-400 dark:text-gray-500"}
                />
                {item.name}
              </Link>
            );
          })}

          {isLoggedIn && (
            <>
              <p className="px-3 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Account
              </p>
              <Link
                href={dashboardItem.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-colors duration-150 ${
                  isActive(dashboardItem.href)
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                <HugeiconsIcon
                  icon={DashboardSquare01Icon}
                  size={18}
                  className={isActive(dashboardItem.href) ? "text-indigo-500" : "text-gray-400 dark:text-gray-500"}
                />
                Dashboard
              </Link>
              <Link
                href="/profile"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors duration-150"
              >
                <HugeiconsIcon icon={UserIcon} size={18} className="text-gray-400 dark:text-gray-500" />
                Profile
              </Link>
              <Link
                href="/notifications"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors duration-150"
              >
                <div className="relative">
                  <HugeiconsIcon icon={Notification02Icon} size={18} className="text-gray-400 dark:text-gray-500" />
                  {notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                  )}
                </div>
                Notifications
              </Link>
            </>
          )}
        </nav>

        <div className="flex-shrink-0 p-3 border-t border-gray-100 dark:border-gray-800">
          {!isLoggedIn ? (
            <button
              onClick={() => { onClose(); onOpenLogin(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors duration-200 shadow-sm"
            >
              <HugeiconsIcon icon={LoginIcon} size={16} />
              Sign in
            </button>
          ) : (
            <button
              onClick={() => { onClose(); onLogout(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 text-sm font-semibold transition-colors duration-200"
            >
              <HugeiconsIcon icon={Logout01Icon} size={16} />
              Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;