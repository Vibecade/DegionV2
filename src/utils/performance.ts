/**
 * Performance optimization utilities
 */

// Image lazy loading with intersection observer
export class LazyImageLoader {
  private observer: IntersectionObserver;
  private images: Set<HTMLImageElement> = new Set();

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
        rootMargin: '100px 0px', // Increased for better UX
        threshold: 0.01
      }
    );
  }

  observe(img: HTMLImageElement): void {
    this.images.add(img);
    this.observer.observe(img);
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (src) {
      // Preload the image
      const preloadImg = new Image();
      preloadImg.onload = () => {
        img.src = src;
        img.removeAttribute('data-src');
        img.classList.add('loaded');
      };
      preloadImg.src = src;
      img.src = src;
      img.removeAttribute('data-src');
      this.observer.unobserve(img);
      this.images.delete(img);
    }
  }

  disconnect(): void {
    this.observer.disconnect();
    this.images.clear();
  }
}

// Request idle callback wrapper
export const scheduleWork = (callback: () => void, options?: { timeout?: number }) => {
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(callback, options);
  } else {
    // Fallback for browsers without requestIdleCallback
    return setTimeout(callback, 0);
  }
};

// Cancel scheduled work
export const cancelWork = (id: number) => {
  if ('cancelIdleCallback' in window) {
    cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300,
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
  limit: number = 100
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

// Resource loading optimization
export const resourceLoader = {
  // Preload critical resources
  preloadResource: (href: string, as: string, crossorigin?: string): void => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (crossorigin) link.crossOrigin = crossorigin;
    document.head.appendChild(link);
  },

  // Prefetch resources for future navigation
  prefetchResource: (href: string): void => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  },

  // Load script dynamically
  loadScript: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  },

  // Load CSS dynamically
  loadCSS: (href: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
      document.head.appendChild(link);
    });
  }
};

// Bundle size optimization helpers
export const bundleOptimization = {
  // Dynamic import with error handling
  dynamicImport: async <T>(importFn: () => Promise<T>): Promise<T | null> => {
    try {
      return await importFn();
    } catch (error) {
      console.error('Dynamic import failed:', error);
      return null;
    }
  },

  // Check if feature is supported before loading polyfill
  loadPolyfillIfNeeded: async (
    feature: string,
    polyfillLoader: () => Promise<any>
  ): Promise<void> => {
    if (!(feature in window)) {
      try {
        await polyfillLoader();
      } catch (error) {
        console.error(`Failed to load polyfill for ${feature}:`, error);
      }
    }
  }
};

// Performance metrics collection
export const performanceMetrics = {
  // Measure component render time
  measureRender: (componentName: string, renderFn: () => void): void => {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    console.log(`${componentName} render time: ${endTime - startTime}ms`);
  },

  // Measure API call performance
  measureAPICall: async <T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    try {
      const result = await apiCall();
      const endTime = performance.now();
      console.log(`${apiName} API call time: ${endTime - startTime}ms`);
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(`${apiName} API call failed after ${endTime - startTime}ms:`, error);
      throw error;
    }
  },

  // Get Core Web Vitals
  getCoreWebVitals: (): Promise<any> => {
    return new Promise((resolve) => {
      const vitals: any = {};

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        vitals.lcp = entries[entries.length - 1].startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        vitals.fid = entries[0].processingStart - entries[0].startTime;
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        vitals.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

      // Return vitals after a delay to collect data
      setTimeout(() => resolve(vitals), 3000);
    });
  }
};

// Export singleton instances
export const lazyImageLoader = new LazyImageLoader();