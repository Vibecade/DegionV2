import React, { memo } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner = memo(({ size = 'md', className = '' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="relative">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-[#00ffee]/20"></div>
        
        {/* Spinning ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00ffee] animate-spin"></div>
        
        {/* Inner glow */}
        <div className="absolute inset-1 rounded-full bg-[#00ffee]/10 animate-pulse"></div>
      </div>
    </div>
  );