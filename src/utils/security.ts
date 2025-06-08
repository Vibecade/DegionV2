/**
 * Security utilities for input validation and sanitization
 */

// Rate limiting for client-side operations
export class ClientRateLimit {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Input validation utilities
export const validateInput = {
  // Validate email format
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  // Validate URL format
  url: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  },

  // Validate token ID (alphanumeric, hyphens, underscores only)
  tokenId: (tokenId: string): boolean => {
    const tokenRegex = /^[a-zA-Z0-9_-]+$/;
    return tokenRegex.test(tokenId) && tokenId.length <= 50;
  },

  // Validate discussion title
  discussionTitle: (title: string): boolean => {
    return title.trim().length >= 3 && title.length <= 200;
  },

  // Validate discussion content
  discussionContent: (content: string): boolean => {
    return content.trim().length >= 10 && content.length <= 5000;
  },

  // Validate comment content
  commentContent: (content: string): boolean => {
    return content.trim().length >= 1 && content.length <= 1000;
  }
};

// Content Security Policy helpers
export const CSP = {
  // Generate nonce for inline scripts
  generateNonce: (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  },

  // Validate external URLs against allowlist
  isAllowedDomain: (url: string): boolean => {
    const allowedDomains = [
      'api.coingecko.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'sadpepedev.github.io',
      'raw.githubusercontent.com',
      'dune.com',
      'etherscan.io',
      'arbiscan.io',
      'tradingview.com',
      's3.tradingview.com'
    ];

    try {
      const urlObj = new URL(url);
      return allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
    } catch {
      return false;
    }
  }
};

// Secure storage utilities
export const secureStorage = {
  // Set item with expiration
  setItem: (key: string, value: any, expirationMs?: number): void => {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        expiration: expirationMs ? Date.now() + expirationMs : null
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to store item:', error);
    }
  },

  // Get item with expiration check
  getItem: (key: string): any => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const item = JSON.parse(stored);
      
      // Check expiration
      if (item.expiration && Date.now() > item.expiration) {
        localStorage.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.warn('Failed to retrieve item:', error);
      return null;
    }
  },

  // Remove item
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove item:', error);
    }
  },

  // Clear expired items
  clearExpired: (): void => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const item = JSON.parse(stored);
            if (item.expiration && Date.now() > item.expiration) {
              localStorage.removeItem(key);
            }
          } catch {
            // Invalid JSON, skip
          }
        }
      });
    } catch (error) {
      console.warn('Failed to clear expired items:', error);
    }
  }
};

// Error boundary helpers
export const errorReporting = {
  // Log error with context
  logError: (error: Error, context: string, additionalData?: any): void => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalData
    };

    // In production, send to error reporting service
    console.error('Error logged:', errorData);
  },

  // Create safe error message for users
  getSafeErrorMessage: (error: Error): string => {
    // Don't expose internal error details to users
    const safeMessages: Record<string, string> = {
      'NetworkError': 'Network connection error. Please check your internet connection.',
      'TypeError': 'An unexpected error occurred. Please try again.',
      'ReferenceError': 'An unexpected error occurred. Please try again.',
      'SyntaxError': 'Data format error. Please try again.',
      'RangeError': 'Invalid input range. Please check your input.',
      'URIError': 'Invalid URL format.',
    };

    return safeMessages[error.constructor.name] || 'An unexpected error occurred. Please try again.';
  }
};

// Performance monitoring
export const performance = {
  // Mark performance milestone
  mark: (name: string): void => {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  },

  // Measure performance between marks
  measure: (name: string, startMark: string, endMark?: string): void => {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
  },

  // Get performance entries
  getEntries: (type?: string): PerformanceEntry[] => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      return type ? performance.getEntriesByType(type) : performance.getEntries();
    }
    return [];
  }
};