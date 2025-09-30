/**
 * Performance optimization utilities
 */

// Image lazy loading with intersection observer
export class LazyImageLoader {
  private observer: IntersectionObserver;
  private images: Set<HTMLImageElement> = new Set();
  private preloadedImages: Set<string> = new Set();

  constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
          }
        });
      },
      {
        rootMargin: '100px 0px', // Increased for better UX with optimized images
        threshold: 0.01
      }
    );
  }

  observe(img: HTMLImageElement): void {
    this.images.add(img);
    
    // Check if image is already preloaded
    if (this.preloadedImages.has(img.src)) {
      this.loadImage(img);
    } else {
      this.observer.observe(img);
    }
  }

  preloadImage(src: string): void {
    if (this.preloadedImages.has(src)) return;
    
    const img = new Image();
    img.onload = () => {
      this.preloadedImages.add(src);
    };
    img.src = src;
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
      img.classList.add('loaded');
      this.observer.unobserve(img);
      this.images.delete(img);
    }
  }

  disconnect(): void {
    this.observer.disconnect();
    this.images.clear();
  }
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 150, // Reduced for better responsiveness
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 16 // ~60fps for smooth scrolling
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memory usage monitoring
export const memoryMonitor = {
  // Get memory usage info (if available)
  getMemoryInfo: (): any => {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  },

  // Log memory usage
  logMemoryUsage: (context: string): void => {
    const memory = memoryMonitor.getMemoryInfo();
    if (memory) {
      console.log(`Memory usage (${context}):`, {
        used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`
      });
    }
  },

  // Check if memory usage is high
  isMemoryUsageHigh: (): boolean => {
    const memory = memoryMonitor.getMemoryInfo();
    if (!memory) return false;
    
    const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    return usageRatio > 0.8; // 80% threshold
  }
};

// Scroll performance optimization
export const scrollOptimizer = {
  // Passive event listeners for better scroll performance
  addPassiveListener: (element: Element, event: string, handler: EventListener) => {
    element.addEventListener(event, handler, { passive: true });
  },

  // Throttled scroll handler
  createScrollHandler: (callback: () => void, throttleMs: number = 16) => {
    return throttle(callback, throttleMs);
  },

  // Optimize scroll container
  optimizeScrollContainer: (element: HTMLElement) => {
    element.style.willChange = 'scroll-position';
    element.style.transform = 'translateZ(0)'; // Force hardware acceleration
    element.style.backfaceVisibility = 'hidden';
  },

  // Clean up scroll optimizations
  cleanupScrollContainer: (element: HTMLElement) => {
    element.style.willChange = 'auto';
    element.style.transform = '';
    element.style.backfaceVisibility = '';
  }
};

// Export singleton instances
export const lazyImageLoader = new LazyImageLoader();