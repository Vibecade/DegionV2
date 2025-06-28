import React, { useState, useRef, useEffect, memo } from 'react';
import { imageOptimizer, progressiveImageLoader } from '../utils/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  className?: string;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: Event) => void;
  fallbackSrc?: string;
}

export const OptimizedImage = memo(({
  src,
  alt,
  width,
  height,
  quality = 85,
  className = '',
  style,
  loading = 'lazy',
  priority = false,
  onLoad,
  onError,
  fallbackSrc
}: OptimizedImageProps) => {
  const [imageSources, setImageSources] = useState<{
    webp?: string;
    avif?: string;
    fallback: string;
  }>({ fallback: src });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!loading || loading === 'eager');
  const imgRef = useRef<HTMLImageElement>(null);
  const pictureRef = useRef<HTMLElement>(null);

  // Generate optimized sources
  useEffect(() => {
    const generateSources = async () => {
      try {
        const sources = await imageOptimizer.generateOptimizedSources({
          src,
          alt,
          width,
          height,
          quality,
          loading,
          priority
        });
        setImageSources(sources);
      } catch (error) {
        console.warn('Failed to generate optimized sources:', error);
        setImageSources({ fallback: src });
      }
    };

    generateSources();
  }, [src, width, height, quality, loading, priority, alt]);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    if (pictureRef.current) {
      observer.observe(pictureRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [loading, isInView]);

  // Progressive loading
  useEffect(() => {
    if (imgRef.current && isInView) {
      progressiveImageLoader.observe(imgRef.current);
    }
  }, [isInView]);

  // Preload critical images
  useEffect(() => {
    if (priority && imageSources.fallback) {
      imageOptimizer.preloadImage(imageSources.fallback, true);
    }
  }, [priority, imageSources.fallback]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;
    
    // Try fallback source if available
    if (fallbackSrc && img.src !== fallbackSrc) {
      img.src = fallbackSrc;
      return;
    }
    
    // Generate SVG fallback
    const svgFallback = `data:image/svg+xml;base64,${btoa(`
      <svg width="${width || 50}" height="${height || 50}" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="25" cy="25" r="25" fill="#00ffee"/>
        <text x="25" y="30" text-anchor="middle" fill="#000" font-size="12" font-family="Arial">
          ${alt.charAt(0).toUpperCase()}
        </text>
      </svg>
    `)}`;
    
    img.src = svgFallback;
    setHasError(true);
    onError?.(event.nativeEvent);
  };

  const imageStyle: React.CSSProperties = {
    ...style,
    transition: 'filter 0.3s ease, opacity 0.3s ease',
    filter: isLoaded ? 'blur(0px)' : 'blur(5px)',
    opacity: isInView ? 1 : 0,
    ...(hasError && { filter: 'grayscale(100%)' })
  };

  // Don't render until in view for lazy loading
  if (!isInView) {
    return (
      <div
        ref={pictureRef as any}
        className={`${className} bg-gray-700/20 animate-pulse`}
        style={{
          width: width || 'auto',
          height: height || 'auto',
          ...style
        }}
      />
    );
  }

  return (
    <picture ref={pictureRef as any} className="optimized-image-container">
      {/* AVIF source for modern browsers */}
      {imageSources.avif && (
        <source srcSet={imageSources.avif} type="image/avif" />
      )}
      
      {/* WebP source for supported browsers */}
      {imageSources.webp && (
        <source srcSet={imageSources.webp} type="image/webp" />
      )}
      
      {/* Fallback image */}
      <img
        ref={imgRef}
        src={imageSources.fallback}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoaded ? 'image-loaded' : 'image-loading'} ${hasError ? 'image-error' : ''}`}
        style={imageStyle}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        decoding="async"
        {...(priority && { fetchPriority: 'high' as any })}
      />
      
      {/* Loading indicator */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/20 rounded-full">
          <div className="w-4 h-4 border-2 border-[#00ffee]/30 border-t-[#00ffee] rounded-full animate-spin" />
        </div>
      )}
    </picture>
  );
});

OptimizedImage.displayName = 'OptimizedImage';