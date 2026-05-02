// hooks/useSmoothScroll.ts
'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect } from 'react';

export const useSmoothScroll = () => {
  const pathname = usePathname();

  // Function to scroll to a section
  const scrollToSection = useCallback((sectionId: string, behavior: ScrollBehavior = 'smooth') => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior,
        block: 'start',
      });
    }
  }, []);

  // Handle click on scroll links
  const handleScrollLinkClick = useCallback((
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    // Check if it's a section link on the about page
    if (href.includes('#') && pathname === '/about') {
      e.preventDefault();
      const sectionId = href.split('#')[1];
      
      if (sectionId) {
        scrollToSection(sectionId);
        // Update URL without causing page reload
        window.history.pushState(null, '', href);
      }
    }
  }, [pathname, scrollToSection]);

  // Handle initial hash on page load
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash) {
        const sectionId = window.location.hash.slice(1);
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          scrollToSection(sectionId);
        }, 100);
      }
    };

    // Handle initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [scrollToSection]);

  return {
    scrollToSection,
    handleScrollLinkClick,
  };
};