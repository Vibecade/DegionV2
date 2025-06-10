import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

// Skeleton loader for token cards
export const TokenCardSkeleton = () => (
  <div className="grid-item flex flex-col items-center p-4 sm:p-6 bg-black/30 rounded-lg animate-pulse">
    <div className="flex items-center mb-4 relative w-full">
      <div className="w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] rounded-full bg-gray-700/50 mr-3" />
      <div className="flex-1 min-w-0">
        <div className="h-5 bg-gray-700/50 rounded mb-2 w-3/4" />
        <div className="h-4 bg-gray-600/50 rounded-full w-20" />
      </div>
    </div>
    <div className="w-full space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex justify-between items-center py-2">
          <div className="h-4 bg-gray-700/50 rounded w-24" />
          <div className="h-4 bg-gray-600/50 rounded w-16" />
        </div>
      ))}
    </div>
  </div>
);

// Enhanced loading state for token page
export const TokenPageSkeleton = () => (
  <div className="min-h-screen bg-[#09131b] text-[#cfd0d1] p-4 sm:p-8">
    <div className="max-w-[1200px] mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center mb-8">
        <div className="h-5 w-20 bg-gray-700/50 rounded mr-4" />
        <div className="h-5 w-2 bg-gray-600/50 rounded mr-4" />
        <div className="h-5 w-32 bg-gray-700/50 rounded" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Token info skeleton */}
          <div className="glass-panel p-6 rounded-lg">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gray-700/50 mr-4" />
              <div>
                <div className="h-8 w-48 bg-gray-700/50 rounded mb-2" />
                <div className="h-6 w-24 bg-gray-600/50 rounded" />
              </div>
            </div>
            <div className="h-20 bg-gray-700/50 rounded" />
          </div>
          
          {/* Metrics skeleton */}
          <div className="glass-panel p-6 rounded-lg">
            <div className="h-6 w-32 bg-gray-700/50 rounded mb-6" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-black/20 p-4 rounded-lg">
                  <div className="h-4 w-20 bg-gray-700/50 rounded mb-2" />
                  <div className="h-6 w-16 bg-gray-600/50 rounded" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Chart skeleton */}
          <div className="glass-panel p-6 rounded-lg">
            <div className="h-6 w-24 bg-gray-700/50 rounded mb-6" />
            <div className="h-[500px] bg-gray-700/50 rounded" />
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Sidebar skeletons */}
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-panel p-6 rounded-lg">
              <div className="h-6 w-20 bg-gray-700/50 rounded mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-12 bg-gray-700/50 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Quick stats skeleton
export const QuickStatsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-black/20 rounded-xl border border-gray-700/30 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-6 h-6 bg-gray-700/50 rounded" />
          <div className="w-2 h-2 bg-gray-600/50 rounded-full" />
        </div>
        <div className="h-4 w-20 bg-gray-700/50 rounded mb-2" />
        <div className="h-8 w-16 bg-gray-600/50 rounded" />
      </div>
    ))}
  </div>
);

// Error state component
export const ErrorState = ({ 
  title = "Something went wrong", 
  message = "Please try again later", 
  onRetry 
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="text-red-400 mb-4">
      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-gray-300 mb-2 font-orbitron">{title}</h3>
    <p className="text-gray-400 text-center mb-6 max-w-md">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-primary">
        Try Again
      </button>
    )}
  </div>
);

// Empty state component
export const EmptyState = ({ 
  title = "No data available", 
  message = "Check back later for updates",
  icon = "📊"
}: {
  title?: string;
  message?: string;
  icon?: string;
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="text-6xl mb-4 opacity-50">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-300 mb-2 font-orbitron">{title}</h3>
    <p className="text-gray-400 text-center max-w-md">{message}</p>
  </div>
);