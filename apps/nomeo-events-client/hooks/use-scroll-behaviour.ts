import { UseScrollBehaviorReturn } from "@/types/navigation-type";
import { useState, useEffect, useRef } from "react";

export const useScrollBehavior = (): UseScrollBehaviorReturn => {
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [navHidden, setNavHidden] = useState<boolean>(false);
  const lastScrollY = useRef<number>(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      setNavHidden(y > lastScrollY.current && y > 80);
      lastScrollY.current = y;
    };
    
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { scrolled, navHidden };
};