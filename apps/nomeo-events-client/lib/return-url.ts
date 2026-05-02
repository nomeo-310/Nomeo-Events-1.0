// lib/return-url.ts

const STORAGE_KEY = 'app_return_url';

/**
 * Save the current page URL to localStorage before redirecting to login
 * This allows us to redirect back after authentication
 */
export const saveReturnUrl = (url?: string) => {
  if (typeof window === 'undefined') return;
  
  const returnUrl = url || window.location.pathname + window.location.search;
  
  // Don't save auth-related pages
  const excludePatterns = ['/auth/', '/login', '/signup', '/forgot-password'];
  const shouldExclude = excludePatterns.some(pattern => returnUrl.includes(pattern));
  
  if (!shouldExclude && returnUrl !== '/' && returnUrl !== '') {
    localStorage.setItem(STORAGE_KEY, returnUrl);
  }
};

/**
 * Get and clear the saved return URL
 */
export const getAndClearReturnUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  const returnUrl = localStorage.getItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
  return returnUrl;
};

/**
 * Get return URL without clearing it (for checking)
 */
export const getReturnUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
};

/**
 * Clear the return URL without using it
 */
export const clearReturnUrl = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
};