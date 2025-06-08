import { useEffect, useRef } from 'react';
import { liveRegion, focusManager, keyboardUtils } from '../utils/accessibility';

// Hook for managing focus trap in modals/dialogs
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const cleanup = focusManager.trapFocus(containerRef.current);
    focusManager.focusFirst(containerRef.current);

    return cleanup;
  }, [isActive]);

  return containerRef;
};

// Hook for announcing changes to screen readers
export const useAnnouncement = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    liveRegion.announce(message, priority);
  };

  return announce;
};

// Hook for keyboard navigation
export const useKeyboardNavigation = (
  containerRef: React.RefObject<HTMLElement>,
  selector?: string
) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = keyboardUtils.handleArrowNavigation(container, selector);
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, selector]);
};

// Hook for escape key handling
export const useEscapeKey = (callback: () => void, isActive: boolean = true) => {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = keyboardUtils.onEscape(callback);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [callback, isActive]);
};

// Hook for managing page title and announcements
export const usePageTitle = (title: string, announceChange: boolean = true) => {
  const announce = useAnnouncement();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    if (announceChange && previousTitle !== title) {
      announce(`Page changed to ${title}`);
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title, announceChange, announce]);
};

// Hook for managing reduced motion preferences
export const useReducedMotion = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  useEffect(() => {
    if (prefersReducedMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
      document.documentElement.style.setProperty('--transition-duration', '0.01ms');
    }
  }, [prefersReducedMotion]);

  return prefersReducedMotion;
};