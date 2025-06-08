/**
 * Accessibility utilities and helpers
 */

// ARIA live region manager
export class LiveRegionManager {
  private static instance: LiveRegionManager;
  private liveRegion: HTMLElement | null = null;

  private constructor() {
    this.createLiveRegion();
  }

  static getInstance(): LiveRegionManager {
    if (!LiveRegionManager.instance) {
      LiveRegionManager.instance = new LiveRegionManager();
    }
    return LiveRegionManager.instance;
  }

  private createLiveRegion(): void {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    document.body.appendChild(this.liveRegion);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion) return;

    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
      }
    }, 1000);
  }
}

// Focus management utilities
export const focusManager = {
  // Trap focus within an element
  trapFocus: (element: HTMLElement): (() => void) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);

    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  },

  // Save and restore focus
  saveFocus: (): (() => void) => {
    const activeElement = document.activeElement as HTMLElement;
    return () => {
      if (activeElement && activeElement.focus) {
        activeElement.focus();
      }
    };
  },

  // Focus first focusable element
  focusFirst: (container: HTMLElement): void => {
    const focusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    
    if (focusable) {
      focusable.focus();
    }
  }
};

// Keyboard navigation helpers
export const keyboardUtils = {
  // Handle escape key
  onEscape: (callback: () => void) => (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      callback();
    }
  },

  // Handle enter/space for custom buttons
  onActivate: (callback: () => void) => (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  },

  // Arrow key navigation for lists
  handleArrowNavigation: (
    container: HTMLElement,
    selector: string = '[role="option"], button, [tabindex="0"]'
  ) => (e: KeyboardEvent) => {
    const items = Array.from(container.querySelectorAll(selector)) as HTMLElement[];
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'ArrowUp':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    items[nextIndex]?.focus();
  }
};

// Color contrast utilities
export const contrastUtils = {
  // Calculate relative luminance
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio
  getContrastRatio: (color1: string, color2: string): number => {
    const rgb1 = contrastUtils.hexToRgb(color1);
    const rgb2 = contrastUtils.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 1;

    const lum1 = contrastUtils.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = contrastUtils.getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Convert hex to RGB
  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  // Check if contrast meets WCAG standards
  meetsWCAG: (color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
    const ratio = contrastUtils.getContrastRatio(color1, color2);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  }
};

// Screen reader utilities
export const screenReaderUtils = {
  // Create visually hidden text
  createSROnlyText: (text: string): HTMLSpanElement => {
    const span = document.createElement('span');
    span.className = 'sr-only';
    span.textContent = text;
    span.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    return span;
  },

  // Format numbers for screen readers
  formatNumberForSR: (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)} million`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)} thousand`;
    }
    return num.toString();
  },

  // Format currency for screen readers
  formatCurrencyForSR: (amount: string): string => {
    const numericAmount = parseFloat(amount.replace(/[$,]/g, ''));
    if (isNaN(numericAmount)) return amount;
    
    return `${numericAmount} dollars`;
  },

  // Format percentage for screen readers
  formatPercentageForSR: (percentage: string): string => {
    const numericPercentage = parseFloat(percentage.replace('%', ''));
    if (isNaN(numericPercentage)) return percentage;
    
    const direction = numericPercentage >= 0 ? 'positive' : 'negative';
    return `${Math.abs(numericPercentage)} percent ${direction}`;
  }
};

// Export singleton instance
export const liveRegion = LiveRegionManager.getInstance();