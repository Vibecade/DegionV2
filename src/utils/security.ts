/**
 * Security utilities for input validation and sanitization
 */

// Input validation utilities
export const validateInput = {
  // Validate email format
  email: (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  // Validate URL format
  url: (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  },

  // Validate token ID (alphanumeric, hyphens, underscores only)
  tokenId: (tokenId: string): boolean => {
    if (!tokenId || typeof tokenId !== 'string') return false;
    const tokenRegex = /^[a-zA-Z0-9_-]+$/;
    return tokenRegex.test(tokenId) && tokenId.length <= 50;
  },

  // Validate discussion title
  discussionTitle: (title: string): boolean => {
    if (!title || typeof title !== 'string') return false;
    return title.trim().length >= 3 && title.length <= 200;
  },

  // Validate discussion content
  discussionContent: (content: string): boolean => {
    if (!content || typeof content !== 'string') return false;
    return content.trim().length >= 10 && content.length <= 5000;
  },

  // Validate comment content
  commentContent: (content: string): boolean => {
    if (!content || typeof content !== 'string') return false;
    return content.trim().length >= 1 && content.length <= 1000;
  }
};

// Secure storage utilities
export const secureStorage = {
  // Set item with expiration
  setItem: (key: string, value: any, expirationMs?: number): void => {
    try {
      if (!key || typeof key !== 'string') {
        throw new Error('Invalid storage key');
      }
      
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
      if (!key || typeof key !== 'string') {
        return null;
      }
      
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
      if (!key || typeof key !== 'string') {
        return;
      }
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove item:', error);
    }
  },

  // Clear expired items
  clearExpired: (): void => {
    try {
      if (!localStorage) return;
      
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