/**
 * Image optimization utilities for better performance and delivery
 */

interface ImageConfig {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'png' | 'jpg';
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

interface OptimizedImageSources {
  webp?: string;
  avif?: string;
  fallback: string;
}

// CDN configuration for image optimization
const CDN_CONFIG = {
  // Using Cloudinary as an example - can be replaced with any image CDN
  baseUrl: 'https://res.cloudinary.com/degion/image/fetch',
  transformations: {
    quality: 'q_auto',
    format: 'f_auto',
    dpr: 'dpr_auto',
    progressive: 'fl_progressive'
  }
};

// Image format support detection
export class ImageFormatSupport {
  private static instance: ImageFormatSupport;
  private supportCache: Map<string, boolean> = new Map();

  private constructor() {}

  static getInstance(): ImageFormatSupport {
    if (!ImageFormatSupport.instance) {
      ImageFormatSupport.instance = new ImageFormatSupport();
    }
    return ImageFormatSupport.instance;
  }

  async supportsFormat(format: 'webp' | 'avif'): Promise<boolean> {
    if (this.supportCache.has(format)) {
      return this.supportCache.get(format)!;
    }

    const support = await this.checkFormatSupport(format);
    this.supportCache.set(format, support);
    return support;
  }

  private async checkFormatSupport(format: 'webp' | 'avif'): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => resolve(img.width === 1 && img.height === 1);
      img.onerror = () => resolve(false);
      
      // Test images for format support
      const testImages = {
        webp: 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
        avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
      };
      
      img.src = testImages[format];
    });
  }
}

// Image optimization service
export class ImageOptimizer {
  private static instance: ImageOptimizer;
  private formatSupport: ImageFormatSupport;
  private cache: Map<string, OptimizedImageSources> = new Map();

  private constructor() {
    this.formatSupport = ImageFormatSupport.getInstance();
  }

  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  // Generate optimized image sources with multiple formats
  async generateOptimizedSources(config: ImageConfig): Promise<OptimizedImageSources> {
    const cacheKey = this.getCacheKey(config);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const sources: OptimizedImageSources = {
      fallback: config.src
    };

    // Check if we should use CDN optimization
    if (this.shouldOptimizeWithCDN(config.src)) {
      const [supportsWebP, supportsAVIF] = await Promise.all([
        this.formatSupport.supportsFormat('webp'),
        this.formatSupport.supportsFormat('avif')
      ]);

      if (supportsAVIF) {
        sources.avif = this.generateCDNUrl(config, 'avif');
      }
      
      if (supportsWebP) {
        sources.webp = this.generateCDNUrl(config, 'webp');
      }

      sources.fallback = this.generateCDNUrl(config, 'auto');
    } else {
      // For GitHub URLs, try to find WebP alternatives
      sources.webp = this.tryWebPAlternative(config.src);
    }

    this.cache.set(cacheKey, sources);
    return sources;
  }

  // Generate CDN URL with optimizations
  private generateCDNUrl(config: ImageConfig, format: 'webp' | 'avif' | 'auto'): string {
    const params = new URLSearchParams();
    
    // Add transformations
    params.append('q', (config.quality || 85).toString());
    params.append('f', format === 'auto' ? 'auto' : format);
    
    if (config.width) {
      params.append('w', config.width.toString());
    }
    
    if (config.height) {
      params.append('h', config.height.toString());
    }
    
    // Add progressive loading for larger images
    if (!config.width || config.width > 100) {
      params.append('fl', 'progressive');
    }
    
    // Add DPR optimization
    params.append('dpr', 'auto');
    
    return `${CDN_CONFIG.baseUrl}/${params.toString()}/${encodeURIComponent(config.src)}`;
  }

  // Check if URL should be optimized with CDN
  private shouldOptimizeWithCDN(src: string): boolean {
    // Enable CDN optimization for external URLs
    return src.startsWith('http') && !src.includes('res.cloudinary.com');
  }

  // Try to find WebP alternative for GitHub URLs
  private tryWebPAlternative(src: string): string | undefined {
    if (src.includes('github.io') || src.includes('githubusercontent.com')) {
      // Try replacing .png with .webp
      if (src.endsWith('.png')) {
        return src.replace('.png', '.webp');
      }
      // Try replacing .jpg with .webp
      if (src.endsWith('.jpg') || src.endsWith('.jpeg')) {
        return src.replace(/\.(jpg|jpeg)$/, '.webp');
      }
    }
    return undefined;
  }

  private getCacheKey(config: ImageConfig): string {
    return `${config.src}-${config.width || 'auto'}-${config.height || 'auto'}-${config.quality || 85}`;
  }

  // Preload critical images
  preloadImage(src: string, priority: boolean = false): void {
    const link = document.createElement('link');
    link.rel = priority ? 'preload' : 'prefetch';
    link.as = 'image';
    link.href = src;
    
    if (priority) {
      link.setAttribute('fetchpriority', 'high');
    }
    
    document.head.appendChild(link);
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }
}

// Progressive image loading with blur effect
export class ProgressiveImageLoader {
  private static instance: ProgressiveImageLoader;
  private observer: IntersectionObserver;
  private loadedImages: Set<string> = new Set();

  private constructor() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadProgressiveImage(img);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );
  }

  static getInstance(): ProgressiveImageLoader {
    if (!ProgressiveImageLoader.instance) {
      ProgressiveImageLoader.instance = new ProgressiveImageLoader();
    }
    return ProgressiveImageLoader.instance;
  }

  observe(img: HTMLImageElement): void {
    if (this.loadedImages.has(img.src)) {
      this.showImage(img);
      return;
    }

    this.observer.observe(img);
  }

  private async loadProgressiveImage(img: HTMLImageElement): Promise<void> {
    const src = img.dataset.src || img.src;
    
    if (this.loadedImages.has(src)) {
      this.showImage(img);
      return;
    }

    try {
      // Create a new image to preload
      const newImg = new Image();
      
      // Add loading animation
      img.style.filter = 'blur(5px)';
      img.style.transition = 'filter 0.3s ease';
      
      newImg.onload = () => {
        img.src = src;
        this.showImage(img);
        this.loadedImages.add(src);
        this.observer.unobserve(img);
      };
      
      newImg.onerror = () => {
        this.handleImageError(img);
        this.observer.unobserve(img);
      };
      
      newImg.src = src;
    } catch (error) {
      this.handleImageError(img);
      this.observer.unobserve(img);
    }
  }

  private showImage(img: HTMLImageElement): void {
    img.style.filter = 'blur(0px)';
    img.classList.add('image-loaded');
  }

  private handleImageError(img: HTMLImageElement): void {
    // Set fallback image
    img.src = this.generateFallbackImage(img.alt || 'Token');
    img.style.filter = 'blur(0px)';
    img.classList.add('image-error');
  }

  private generateFallbackImage(alt: string): string {
    // Generate a simple SVG fallback
    const svg = `
      <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="25" fill="#00ffee"/>
        <text x="25" y="30" text-anchor="middle" fill="#000" font-size="12" font-family="Arial">
          ${alt.charAt(0).toUpperCase()}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  disconnect(): void {
    this.observer.disconnect();
    this.loadedImages.clear();
  }
}

// Image compression utility for user uploads
export class ImageCompressor {
  static async compressImage(
    file: File,
    maxWidth: number = 800,
    maxHeight: number = 600,
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

// Export singleton instances
export const imageOptimizer = ImageOptimizer.getInstance();
export const progressiveImageLoader = ProgressiveImageLoader.getInstance();
export const formatSupport = ImageFormatSupport.getInstance();