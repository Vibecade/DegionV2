import React, { useState, useRef, useEffect } from 'react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  placeholder?: string;
  onError?: () => void;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className = '',
  fallbackSrc,
  placeholder,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder || '');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
    };
    img.onerror = () => {
      if (fallbackSrc && !hasError) {
        setHasError(true);
        setCurrentSrc(fallbackSrc);
        setIsLoaded(true);
      } else {
        onError?.();
      }
    };
    img.src = src;
  }, [src, fallbackSrc, hasError, onError]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          loading="lazy"
        />
      )}
      
      {!isLoaded && (
        <div className={`absolute inset-0 bg-gray-700/20 animate-pulse ${className}`}>
          <div className="w-full h-full bg-gradient-to-r from-gray-700/10 via-gray-600/20 to-gray-700/10 animate-shimmer" />
        </div>
      )}
    </div>
  );
};