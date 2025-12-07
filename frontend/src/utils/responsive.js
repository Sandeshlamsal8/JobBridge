/**
 * Responsive Utility Functions for JobBridge
 * Helps with device detection and responsive behavior
 */

/**
 * Check if the current device is mobile
 * @returns {boolean}
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

/**
 * Check if the current device is tablet
 * @returns {boolean}
 */
export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

/**
 * Check if the current device is desktop
 * @returns {boolean}
 */
export const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1024;
};

/**
 * Get current breakpoint
 * @returns {'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'}
 */
export const getCurrentBreakpoint = () => {
  if (typeof window === 'undefined') return 'lg';
  
  const width = window.innerWidth;
  
  if (width < 475) return 'xs';
  if (width < 640) return 'sm';
  if (width < 768) return 'md';
  if (width < 1024) return 'lg';
  if (width < 1280) return 'xl';
  return '2xl';
};

/**
 * Check if device supports touch
 * @returns {boolean}
 */
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * Get viewport dimensions
 * @returns {{width: number, height: number}}
 */
export const getViewportSize = () => {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

/**
 * Check if device is in landscape mode
 * @returns {boolean}
 */
export const isLandscape = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
};

/**
 * Check if device is in portrait mode
 * @returns {boolean}
 */
export const isPortrait = () => {
  if (typeof window === 'undefined') return false;
  return window.innerHeight > window.innerWidth;
};

/**
 * Add resize event listener with debounce
 * @param {Function} callback - Function to call on resize
 * @param {number} delay - Debounce delay in ms (default: 250)
 * @returns {Function} Cleanup function
 */
export const onResize = (callback, delay = 250) => {
  if (typeof window === 'undefined') return () => {};
  
  let timeoutId;
  
  const handleResize = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
  
  window.addEventListener('resize', handleResize);
  
  // Return cleanup function
  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener('resize', handleResize);
  };
};

/**
 * Detect iOS device
 * @returns {boolean}
 */
export const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

/**
 * Detect Android device
 * @returns {boolean}
 */
export const isAndroid = () => {
  if (typeof window === 'undefined') return false;
  return /Android/.test(navigator.userAgent);
};

/**
 * Get safe area insets for notched devices
 * @returns {{top: string, right: string, bottom: string, left: string}}
 */
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return { top: '0px', right: '0px', bottom: '0px', left: '0px' };
  }
  
  const style = getComputedStyle(document.documentElement);
  
  return {
    top: style.getPropertyValue('env(safe-area-inset-top)') || '0px',
    right: style.getPropertyValue('env(safe-area-inset-right)') || '0px',
    bottom: style.getPropertyValue('env(safe-area-inset-bottom)') || '0px',
    left: style.getPropertyValue('env(safe-area-inset-left)') || '0px',
  };
};

/**
 * Responsive class helper - returns classes based on breakpoint
 * @param {Object} classes - Object with breakpoint keys and class values
 * @returns {string}
 * 
 * @example
 * responsiveClass({
 *   xs: 'text-sm',
 *   md: 'text-base',
 *   lg: 'text-lg'
 * })
 */
export const responsiveClass = (classes) => {
  const breakpoint = getCurrentBreakpoint();
  const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const currentIndex = breakpoints.indexOf(breakpoint);
  
  // Find the closest matching breakpoint
  for (let i = currentIndex; i >= 0; i--) {
    if (classes[breakpoints[i]]) {
      return classes[breakpoints[i]];
    }
  }
  
  return classes.default || '';
};

/**
 * Prevent body scroll (useful for modals on mobile)
 */
export const disableBodyScroll = () => {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
};

/**
 * Enable body scroll
 */
export const enableBodyScroll = () => {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
};

/**
 * Smooth scroll to element
 * @param {string} elementId - ID of element to scroll to
 * @param {number} offset - Offset from top (default: 0)
 */
export const scrollToElement = (elementId, offset = 0) => {
  if (typeof document === 'undefined') return;
  
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth',
  });
};

export default {
  isMobile,
  isTablet,
  isDesktop,
  getCurrentBreakpoint,
  isTouchDevice,
  getViewportSize,
  isLandscape,
  isPortrait,
  onResize,
  isIOS,
  isAndroid,
  getSafeAreaInsets,
  responsiveClass,
  disableBodyScroll,
  enableBodyScroll,
  scrollToElement,
};
