"use client";

import { useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  UserGroup03Icon as SeminarIcon,
  Video01Icon,
  LibraryIcon as AboutIcon,
  DashboardSquare01Icon as DashboardSquareIcon,
  Login01Icon as LoginIcon,
  MusicNote03Icon,
  Menu02Icon,
} from "@hugeicons/core-free-icons";
import { useModal } from "@/hooks/use-modal";
import { useScrollBehavior } from "@/hooks/use-scroll-behaviour";
import { useNavigationState } from "@/hooks/use-navigation-state";
import { authClient } from "@/lib/auth-client";
import { NavItem, NotificationItem } from "@/types/navigation-type";
import { AuthWrapper } from "@/components/root/auth/auth-wrapper";
import Logo from "./logo";
import DesktopNavLink from "./desktop-navlink";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import NotificationBell from "./notification-bell";
import NotificationDropdown from "./notification-dropdown";
import AvatarButton from "./avatar-button";
import UserDropdown from "./user-dropdown";
import MobileDrawer from "./mobile-drawer";

const Navigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { openModal, closeModal } = useModal();
  const { scrolled, navHidden } = useScrollBehavior();
  const {
    mobileOpen,
    setMobileOpen,
    userMenuOpen,
    setUserMenuOpen,
    notifOpen,
    setNotifOpen,
    notifCount,
    setNotifCount,
  } = useNavigationState();

  const { data: session } = authClient.useSession();
  const isLoggedIn = !!session?.user;
  const userName = session?.user?.name ?? "";
  const userEmail = session?.user?.email ?? "";
  const initials = userName
    .split(" ")
    .map((n: string) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navItems: NavItem[] = [
    { name: "Discover", href: "/", icon: Home01Icon },
    { name: "Seminars", href: "/seminars", icon: SeminarIcon },
    { name: "Webinars", href: "/webinars", icon: Video01Icon },
    { name: "Entertainment", href: "/entertainment", icon: MusicNote03Icon },
    { name: "About", href: "/about", icon: AboutIcon },
  ];

  const dashboardItem: NavItem = {
    name: "Dashboard",
    href: "/dashboard",
    icon: DashboardSquareIcon,
  };

  const notifications: NotificationItem[] = [
    { id: 1, title: "New webinar registration", time: "2 minutes ago", read: false },
    { id: 2, title: "Seminar reminder tomorrow", time: "1 hour ago", read: false },
    { id: 3, title: "New attendee joined your event", time: "3 hours ago", read: false },
  ];

  const isActive = (href: string): boolean =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleOpenLogin = useCallback(() => {
    openModal({
      title: "",
      size: "large",
      showCloseButton: true,
      closeOnEsc: true,
      closeOnOutsideClick: true,
      children: <AuthWrapper defaultView="login" onClose={closeModal} />,
    });
  }, [openModal, closeModal]);

  const handleLogout = useCallback(async () => {
    setUserMenuOpen(false);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }, [router]);

  // FIXED: Use arrow function that returns the opposite boolean value
  const handleNotifClick = (): void => {
    setNotifOpen(!notifOpen);  // Pass boolean directly, not a function
    setUserMenuOpen(false);
    if (notifCount > 0) setNotifCount(0);
  };

  // FIXED: Use arrow function that returns the opposite boolean value
  const handleUserClick = (): void => {
    setUserMenuOpen(!userMenuOpen);  // Pass boolean directly, not a function
    setNotifOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          navHidden ? "-translate-y-full" : "translate-y-0"
        } ${
          scrolled
            ? "bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800/60 shadow-sm"
            : "bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800/40"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center gap-3">
            <Logo/>

            <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
              {navItems.map((item) => (
                <DesktopNavLink key={item.name} item={item} isActive={isActive(item.href)} />
              ))}
            </nav>

            <div className="flex items-center gap-1 ml-auto">
              <ThemeToggle />

              {!isLoggedIn ? (
                <button
                  onClick={handleOpenLogin}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[13px] font-semibold transition-all duration-150 shadow-sm ml-1"
                >
                  <HugeiconsIcon icon={LoginIcon} size={14} />
                  <span className="hidden sm:inline">Sign in</span>
                </button>
              ) : (
                <>
                  <div className="relative">
                    <NotificationBell count={notifCount} onClick={handleNotifClick} />
                    <NotificationDropdown
                      isOpen={notifOpen}
                      onClose={() => setNotifOpen(false)}
                      notifications={notifications}
                      count={notifCount}
                    />
                  </div>

                  <Link
                    href="/dashboard"
                    className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                      isActive("/dashboard")
                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/5"
                    }`}
                  >
                    <HugeiconsIcon icon={DashboardSquareIcon} size={14} />
                    Dashboard
                  </Link>

                  <div className="relative">
                    <AvatarButton initials={initials} isOpen={userMenuOpen} onClick={handleUserClick} />
                    <UserDropdown
                      isOpen={userMenuOpen}
                      onClose={() => setUserMenuOpen(false)}
                      userName={userName}
                      userEmail={userEmail}
                      onLogout={handleLogout}
                    />
                  </div>
                </>
              )}

              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-white/5 transition-colors ml-0.5"
              >
                <HugeiconsIcon icon={Menu02Icon} size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="h-14" />

      <MobileDrawer
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navItems={navItems}
        dashboardItem={dashboardItem}
        isLoggedIn={isLoggedIn}
        isActive={isActive}
        onLogout={handleLogout}
        onOpenLogin={handleOpenLogin}
        userName={userName}
        userEmail={userEmail}
        initials={initials}
        notifCount={notifCount}
      />
    </>
  );
};

export default Navigation;