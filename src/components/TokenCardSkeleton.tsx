import React from 'react';

export const TokenCardSkeleton = () => {
  return (
    <div className="grid-item flex flex-col items-center p-4 sm:p-6 bg-black/30 rounded-lg animate-pulse">
      <div className="flex items-center mb-4 relative w-full">
        {/* Logo skeleton */}
        <div className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] rounded-full bg-gray-700/50 mr-3 animate-pulse" />
        
        <div className="flex-1 min-w-0">
          {/* Token name skeleton */}
          <div className="h-5 sm:h-6 bg-gray-700/50 rounded mb-2 w-3/4 animate-pulse" />
          {/* Status badge skeleton */}
          <div className="h-4 bg-gray-600/50 rounded-full w-20 animate-pulse" />
        </div>
        
        {/* Arrow skeleton */}
        <div className="w-5 h-5 bg-gray-700/50 rounded animate-pulse" />
      </div>

      {/* Data rows skeleton */}
      <div className="w-full space-y-2 sm:space-y-3">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="flex justify-between items-center py-2 border-b border-[#00ffee]/10 last:border-0">
            <div className="h-4 bg-gray-700/50 rounded w-24 animate-pulse" />
            <div className="h-4 bg-gray-600/50 rounded w-16 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Sale data skeleton */}
      <div className="mt-4 w-full pt-4 border-t border-[#00ffee]/10">
        <div className="grid grid-cols-1 gap-2">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-700/50 rounded animate-pulse" />
                <div className="h-3 bg-gray-700/50 rounded w-16 animate-pulse" />
              </div>
              <div className="h-3 bg-gray-600/50 rounded w-12 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Vesting skeleton */}
      <div className="mt-4 w-full">
        <div className="flex flex-col gap-1 w-full">
          <div className="h-3 bg-gray-700/50 rounded w-16 animate-pulse" />
          <div className="h-6 bg-gray-600/50 rounded w-32 animate-pulse" />
        </div>
      </div>
    </div>
  );
};