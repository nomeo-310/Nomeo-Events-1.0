import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { UseNavigationStateReturn } from "@/types/navigation-type";

export const useNavigationState = (): UseNavigationStateReturn => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const [notifOpen, setNotifOpen] = useState<boolean>(false);
  const [notifCount, setNotifCount] = useState<number>(3);

  // Close ALL menus on every route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  return {
    mobileOpen,
    setMobileOpen,
    userMenuOpen,
    setUserMenuOpen,
    notifOpen,
    setNotifOpen,
    notifCount,
    setNotifCount,
  };
};