import { ReactNode } from "react";

export interface NavItem {
  name: string;
  href: string;
  icon: any;
}

export interface NotificationItem {
  id: number;
  title: string;
  time: string;
  read: boolean;
}

export interface LogoProps {
  onClick?: () => void;
}

export interface DesktopNavLinkProps {
  item: NavItem;
  isActive: boolean;
}

export interface NotificationBellProps {
  count: number;
  onClick: () => void;
}

export interface AvatarButtonProps {
  initials: string;
  isOpen: boolean;
  onClick: () => void;
}

export interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  width: string;
  children: ReactNode;
}

export interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  count: number;
}

export interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  dashboardItem: NavItem;
  isLoggedIn: boolean;
  isActive: (href: string) => boolean;
  onLogout: () => void;
  onOpenLogin: () => void;
  userName: string;
  userEmail: string;
  initials: string;
  notifCount: number;
}

export interface UseScrollBehaviorReturn {
  scrolled: boolean;
  navHidden: boolean;
}

export interface UseNavigationStateReturn {
  mobileOpen: boolean;
  setMobileOpen: (value: boolean) => void;
  userMenuOpen: boolean;
  setUserMenuOpen: (value: boolean) => void;
  notifOpen: boolean;
  setNotifOpen: (value: boolean) => void;
  notifCount: number;
  setNotifCount: (value: number) => void;
}