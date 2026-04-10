"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home01Icon,
  HeadsetIcon as SeminarIcon,
  Video01Icon,
  LibraryIcon as AboutIcon,
  DashboardSquare01Icon as DashboardSquareIcon,
  Login01Icon as LoginIcon,
  User03Icon as UserIcon,
  Menu02Icon as MenuIcon,
  Cancel01Icon as CloseIcon,
  ArrowDown02Icon as ArrowDown01Icon,
  Notification02Icon,
  DashboardSquare01Icon,
  Logout01Icon,
  Mail01Icon,
  CircleLock02Icon as Lock01Icon,
  ViewIcon as EyeIcon,
  ViewOffSlashIcon as EyeOffIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useModal } from "@/hooks/use-modal";
import { AuthWrapper } from "../root/auth/auth-wrapper";

// ==================== ANIMATION VARIANTS ====================
const animationVariants = {
  mobileMenu: {
    hidden: { x: "-100%" as const },
    visible: { 
      x: 0,
      transition: { 
        type: "spring" as const, 
        damping: 25, 
        stiffness: 200,
        when: "beforeChildren" as const,
        staggerChildren: 0.05
      }
    },
    exit: { 
      x: "-100%",
      transition: { 
        type: "spring" as const, 
        damping: 25, 
        stiffness: 200,
        when: "afterChildren" as const
      }
    }
  },
  overlay: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  },
  navItem: {
    hidden: { x: -20, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: "spring" as const, damping: 20, stiffness: 300 }
    },
    exit: { x: -20, opacity: 0 }
  },
  dropdown: {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring" as const, damping: 20, stiffness: 300 }
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      scale: 0.95,
      transition: { duration: 0.15 }
    }
  },
  mobileDropdown: {
    hidden: { y: "-100%", opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring" as const, damping: 25, stiffness: 300 }
    },
    exit: { 
      y: "-100%", 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  },
  badge: {
    initial: { scale: 0 },
    animate: { 
      scale: 1,
      transition: { type: "spring" as const, stiffness: 500, damping: 15 }
    },
    exit: { scale: 0 }
  }
};

// ==================== TYPES ====================
interface NavItem {
  name: string;
  href: string;
  icon: any;
}

interface Notification {
  id: number;
  title: string;
  time: string;
  read: boolean;
}


// ==================== DESKTOP NAVIGATION LINKS ====================
const DesktopNavLinks = ({ 
  navItems, 
  isLoggedIn, 
  dashboardItem, 
  isActive 
}: { 
  navItems: NavItem[];
  isLoggedIn: boolean;
  dashboardItem: NavItem;
  isActive: (href: string) => boolean;
}) => {
  return (
    <div className="hidden md:flex items-center space-x-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              relative flex items-center space-x-2 px-4 py-2 rounded-lg text-base font-medium transition-all duration-200
              ${
                active
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }
            `}
          >
            <HugeiconsIcon icon={Icon} size={18} />
            <span>{item.name}</span>
          </Link>
        );
      })}

      {isLoggedIn && (
        <Link
          href={dashboardItem.href}
          className={`
            relative flex items-center space-x-2 px-4 py-2 rounded-lg text-base font-medium transition-all duration-200
            ${
              isActive(dashboardItem.href)
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }
          `}
        >
          <HugeiconsIcon icon={DashboardSquare01Icon} size={18} />
          <span>Dashboard</span>
        </Link>
      )}
    </div>
  );
};

// ==================== LOGIN BUTTON ====================
const LoginButton = ({ isActive, onOpenLoginModal }: { isActive: (href: string) => boolean; onOpenLoginModal: () => void }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <button
        onClick={onOpenLoginModal}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
          bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md
        `}
      >
        <HugeiconsIcon icon={LoginIcon} size={18} />
        <span>Login</span>
      </button>
    </motion.div>
  );
};

// ==================== NOTIFICATION DROPDOWN ====================
const NotificationDropdown = ({
  isOpen,
  onClose,
  isMobile,
  notifications,
  notificationCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  notifications: Notification[];
  notificationCount: number;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={onClose}
            />
          )}
          <motion.div
            variants={isMobile ? animationVariants.mobileDropdown : animationVariants.dropdown}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              ${isMobile 
                ? "fixed top-0 left-0 right-0 max-h-[80vh] overflow-y-auto" 
                : "absolute right-0 mt-2 w-80 rounded-md"
              }
              bg-white dark:bg-gray-800 shadow-xl z-50 border border-gray-200 dark:border-gray-700 overflow-hidden
            `}
            style={{ 
              transformOrigin: isMobile ? "top" : "top right",
            }}
          >
            <div className={`${isMobile ? "sticky top-0" : ""} bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center`}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Notifications
                {notificationCount > 0 && (
                  <span className="ml-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                    {notificationCount}
                  </span>
                )}
              </h3>
              {isMobile && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <HugeiconsIcon icon={CloseIcon} size={20} />
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                >
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {notification.time}
                  </p>
                </motion.div>
              ))}
            </div>
            <div className={`${isMobile ? "sticky bottom-0" : ""} bg-white dark:bg-gray-800 px-4 py-2 border-t border-gray-200 dark:border-gray-700`}>
              <Link
                href="/notifications"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline block text-center font-medium"
                onClick={onClose}
              >
                View all notifications
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ==================== USER MENU DROPDOWN ====================
const UserMenuDropdown = ({
  isOpen,
  onClose,
  isMobile,
  onLogout,
}: {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  onLogout: () => void;
}) => {
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem("user_email") : null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={onClose}
            />
          )}
          <motion.div
            variants={isMobile ? animationVariants.mobileDropdown : animationVariants.dropdown}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              ${isMobile 
                ? "fixed top-0 left-0 right-0" 
                : "absolute right-0 mt-2 w-64 rounded-md"
              }
              bg-white dark:bg-gray-800 shadow-xl z-50 border border-gray-200 dark:border-gray-700 overflow-hidden
            `}
            style={{ 
              transformOrigin: isMobile ? "top" : "top right",
            }}
          >
            <div className={`${isMobile ? "sticky top-0" : ""} bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center`}>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  John Doe
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {userEmail || "john@example.com"}
                </p>
              </div>
              {isMobile && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <HugeiconsIcon icon={CloseIcon} size={20} />
                </button>
              )}
            </div>
            <div className="py-2 px-2">
              <Link
                href="/profile"
                className="rounded-md flex items-center space-x-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                onClick={onClose}
              >
                <HugeiconsIcon icon={UserIcon} size={16} />
                <span>Profile</span>
              </Link>
              <button
                onClick={onLogout}
                className="rounded-md flex items-center space-x-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition"
              >
                <HugeiconsIcon icon={Logout01Icon} size={16} className="rotate-180" />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ==================== NOTIFICATION ICON ====================
const NotificationIcon = ({
  notificationCount,
  onClick,
}: {
  notificationCount: number;
  onClick: () => void;
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      aria-label="Notifications"
    >
      <HugeiconsIcon icon={Notification02Icon} size={20} />
      <AnimatePresence>
        {notificationCount > 0 && (
          <motion.span
            variants={animationVariants.badge}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          >
            {notificationCount > 9 ? "9+" : notificationCount}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// ==================== USER MENU BUTTON ====================
const UserMenuButton = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
    >
      <div className="size-8 lg:size-10 flex rounded-full bg-indigo-600 items-center justify-center text-white text-sm lg:text-base font-medium">
        JD
      </div>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <HugeiconsIcon icon={ArrowDown01Icon} size={16} className="text-gray-500" />
      </motion.div>
    </motion.button>
  );
};

// ==================== MOBILE MENU BUTTON ====================
const MobileMenuButton = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      aria-label="Toggle menu"
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <HugeiconsIcon icon={CloseIcon} size={24} />
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <HugeiconsIcon icon={MenuIcon} size={24} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// ==================== MOBILE SIDE MENU ====================
const MobileSideMenu = ({
  isOpen,
  onClose,
  navItems,
  isLoggedIn,
  dashboardItem,
  isActive,
  notificationCount,
  onLogout,
  onOpenLoginModal,
}: {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  isLoggedIn: boolean;
  dashboardItem: NavItem;
  isActive: (href: string) => boolean;
  notificationCount: number;
  onLogout: () => void;
  onOpenLoginModal: () => void;
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={animationVariants.overlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          <motion.div
            variants={animationVariants.mobileMenu}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="md:hidden fixed top-0 left-0 bottom-0 w-80 bg-white dark:bg-gray-900 shadow-2xl z-50"
          >
            <div className="flex flex-col h-full">
              <motion.div 
                variants={animationVariants.navItem}
                className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800"
              >
                <motion.span 
                  whileHover={{ scale: 1.05 }}
                  className="text-lg font-bold bg-indigo-600 bg-clip-text text-transparent"
                >
                  Nomeo Events
                </motion.span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <HugeiconsIcon icon={CloseIcon} size={20} />
                </motion.button>
              </motion.div>

              <div className="flex-1 overflow-y-auto py-4">
                <div className="px-4 space-y-1">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <motion.div
                        key={item.name}
                        variants={animationVariants.navItem}
                        custom={index}
                        whileHover={{ x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Link
                          href={item.href}
                          className={`
                            flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200
                            ${
                              active
                                ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }
                          `}
                        >
                          <HugeiconsIcon icon={Icon} size={20} />
                          <span className="font-medium text-base">{item.name}</span>
                        </Link>
                      </motion.div>
                    );
                  })}

                  {isLoggedIn && (
                    <motion.div
                      variants={animationVariants.navItem}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        href={dashboardItem.href}
                        className={`
                          flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200
                          ${
                            isActive(dashboardItem.href)
                              ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }
                        `}
                      >
                        <HugeiconsIcon icon={DashboardSquare01Icon} size={20} />
                        <span className="font-medium text-base">Dashboard</span>
                      </Link>
                    </motion.div>
                  )}
                </div>
              </div>

              <motion.div 
                variants={animationVariants.navItem}
                className={`p-4 border-t border-gray-200 dark:border-gray-800 ${
                  notificationCount > 0 ? "bg-red-50 dark:bg-red-950/20" : ""
                }`}
              >
                {!isLoggedIn ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onOpenLoginModal}
                    className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all duration-200 w-full"
                  >
                    <HugeiconsIcon icon={LoginIcon} size={20} />
                    <span>Login</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onLogout}
                    className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 w-full font-medium transition-all duration-200"
                  >
                    <HugeiconsIcon icon={Logout01Icon} size={20} className="rotate-180" />
                    <span>Logout</span>
                  </motion.button>
                )}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ==================== LOGO ====================
const Logo = () => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
        <span className="lg:text-2xl text-lg font-bold bg-indigo-600 bg-clip-text text-transparent">
          Nomeo Events
        </span>
      </Link>
    </motion.div>
  );
};

// ==================== MAIN NAVIGATION COMPONENT ====================
const Navigation = () => {
  const pathname = usePathname();
  const { openModal, closeModal } = useModal();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(10);
  const [isMobile, setIsMobile] = useState(false);

  // Check login status on mount
  useEffect(() => {
    const token = localStorage.getItem("nomeo_token");
    setIsLoggedIn(!!token);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && !(event.target as Element).closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
      if (notificationOpen && !(event.target as Element).closest('.notification-container')) {
        setNotificationOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen, notificationOpen]);

  // Navigation items
  const navItems: NavItem[] = [
    { name: "Discover", href: "/", icon: Home01Icon },
    { name: "Seminars", href: "/seminars", icon: SeminarIcon },
    { name: "Webinars", href: "/webinars", icon: Video01Icon },
    { name: "About", href: "/about", icon: AboutIcon },
  ];

  const dashboardItem: NavItem = {
    name: "Dashboard",
    href: "/dashboard",
    icon: DashboardSquareIcon,
  };

  // Sample notifications data
  const notifications: Notification[] = [
    {
      id: 1,
      title: "New webinar registration",
      time: "2 minutes ago",
      read: false,
    },
    {
      id: 2,
      title: "Seminar reminder tomorrow",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      title: "New attendee joined your event",
      time: "3 hours ago",
      read: false,
    },
  ];

  const isActive = (href: string): boolean => {
    if (href === "/") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleOpenLoginModal = () => {
    openModal({
      title: "",
      size: "large",
      showCloseButton: true,
      closeOnEsc: true,
      closeOnOutsideClick: true,
      children: (
        <AuthWrapper
          defaultView="login"
          onSuccess={() => {
            console.log("Authentication successful!");
            // Update your app state here
          }}
          onClose={closeModal}
        />
      ),
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("nomeo_token");
    localStorage.removeItem("user_email");
    setIsLoggedIn(false);
    setUserMenuOpen(false);
    // Optional: Show success message
    // You can also add a toast notification here
  };

  const handleNotificationClick = () => {
    setNotificationOpen(!notificationOpen);
    if (notificationCount > 0) {
      setNotificationCount(0);
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${
            scrolled
              ? "bg-white/95 dark:bg-gray-900/95 shadow-lg backdrop-blur-md border-b border-gray-200 dark:border-gray-800"
              : "bg-white dark:bg-gray-900 shadow-md"
          }
        `}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo />

            <DesktopNavLinks
              navItems={navItems}
              isLoggedIn={isLoggedIn}
              dashboardItem={dashboardItem}
              isActive={isActive}
            />

            <div className="flex items-center space-x-3">
              {!isLoggedIn ? (
                <LoginButton 
                  isActive={isActive} 
                  onOpenLoginModal={handleOpenLoginModal}
                />
              ) : (
                <>
                  <div className="relative notification-container">
                    <NotificationIcon
                      notificationCount={notificationCount}
                      onClick={handleNotificationClick}
                    />
                    <NotificationDropdown
                      isOpen={notificationOpen}
                      onClose={() => setNotificationOpen(false)}
                      isMobile={isMobile}
                      notifications={notifications}
                      notificationCount={notificationCount}
                    />
                  </div>

                  <div className="relative user-menu-container">
                    <UserMenuButton
                      isOpen={userMenuOpen}
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                    />
                    <UserMenuDropdown
                      isOpen={userMenuOpen}
                      onClose={() => setUserMenuOpen(false)}
                      isMobile={isMobile}
                      onLogout={handleLogout}
                    />
                  </div>
                </>
              )}

              <MobileMenuButton
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
          </div>
        </div>

        <MobileSideMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          navItems={navItems}
          isLoggedIn={isLoggedIn}
          dashboardItem={dashboardItem}
          isActive={isActive}
          notificationCount={notificationCount}
          onLogout={handleLogout}
          onOpenLoginModal={handleOpenLoginModal}
        />
      </motion.nav>

      <div className="h-16" />
    </>
  );
};

export default Navigation;