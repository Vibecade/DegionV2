import React, { useState, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { TokenCard } from './TokenCard';
import { TokenCardSkeleton } from './TokenCardSkeleton';
import { Token } from '../types';
import { Search, Grid2x2 as Grid, List as ListIcon, BarChart3, Rocket, Clock } from 'lucide-react';

interface TokenGridProps {
  tokens: Token[];
  isLoading: boolean;
  searchTerm: string;
  statusFilter: string;
}

type ViewMode = 'grid' | 'list' | 'compact';

// Item heights for different view modes
const ITEM_HEIGHTS = {
  grid: 650,  // Further increased to accommodate longer token names and content
  list: 180,  // Increased for list items
  compact: 280  // Increased for compact cards
};

// Calculate how many items per row based on view mode
const getItemsPerRow = (viewMode: ViewMode): number => {
  switch (viewMode) {
    case 'grid':
      return window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
    case 'list':
      return 1;
    case 'compact':
      return window.innerWidth >= 1024 ? 4 : window.innerWidth >= 640 ? 2 : 1;
    default:
      return 1;
  }
};

export const TokenGrid: React.FC<TokenGridProps> = ({
  tokens,
  isLoading,
  searchTerm,
  statusFilter
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter tokens based on search and status
  const filteredTokens = useMemo(() => {
    return tokens.filter(token => {
      const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           token.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || token.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [tokens, searchTerm, statusFilter]);

  // Separate launching soon tokens for special highlighting
  const launchingSoonTokens = useMemo(() => 
    filteredTokens.filter(token => token.status === 'Launching Soon'),
    [filteredTokens]
  );

  const otherTokens = useMemo(() => 
    filteredTokens.filter(token => token.status !== 'Launching Soon'),
    [filteredTokens]
  );

  // Calculate virtual list properties
  const itemsPerRow = getItemsPerRow(viewMode);
  const itemHeight = ITEM_HEIGHTS[viewMode];
  const virtualItemCount = Math.ceil(otherTokens.length / itemsPerRow);
  
  // Virtual list height - show up to 6 rows initially, with a max height
  const listHeight = Math.min(itemHeight * 6, window.innerHeight * 0.7);

  // Render function for virtual list items
  const renderVirtualItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const startIndex = index * itemsPerRow;
    const endIndex = Math.min(startIndex + itemsPerRow, otherTokens.length);
    const rowTokens = otherTokens.slice(startIndex, endIndex);

    return (
      <div 
        style={{
          ...style,
          padding: '16px 12px',  // More vertical padding
          boxSizing: 'border-box'
        }} 
        className={`grid gap-4 sm:gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
            : viewMode === 'list'
            ? 'grid-cols-1'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        }`}
      >
        {rowTokens.map((token) => (
          <TokenCard 
            key={token.id} 
            token={token} 
            viewMode={viewMode}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`grid gap-4 sm:gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
          : viewMode === 'list'
          ? 'grid-cols-1'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      }`}>
        {[...Array(12)].map((_, index) => (
          <TokenCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (filteredTokens.length === 0) {
    return (
      <div className="text-center py-12 bg-black/20 rounded-lg border border-[rgba(0,255,238,0.1)]">
        <div className="mb-4">
          <Search className="w-12 h-12 mx-auto text-[#00ffee]/50" />
        </div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2 font-orbitron">No tokens found</h3>
        <p className="text-gray-400 mb-4">
          {searchTerm || statusFilter !== 'all' 
            ? "No tokens match your current search criteria."
            : "No tokens available at the moment."
          }
        </p>
        {(searchTerm || statusFilter !== 'all') && (
          <p className="text-sm text-gray-500">Try adjusting your search or filter settings.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {filteredTokens.length} token{filteredTokens.length !== 1 ? 's' : ''} 
            {launchingSoonTokens.length > 0 && (
              <span className="ml-2 text-[#00ffee]">
                ({launchingSoonTokens.length} launching soon)
              </span>
            )}
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex bg-black/30 border border-[rgba(0,255,238,0.2)] rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 transition-all duration-300 ${
              viewMode === 'grid'
                ? 'bg-[#00ffee]/20 text-[#00ffee]'
                : 'text-gray-400 hover:text-[#00ffee]'
            }`}
            title="Grid view"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 border-l border-[rgba(0,255,238,0.2)] transition-all duration-300 ${
              viewMode === 'list'
                ? 'bg-[#00ffee]/20 text-[#00ffee]'
                : 'text-gray-400 hover:text-[#00ffee]'
            }`}
            title="List view"
          >
            <ListIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`px-3 py-2 border-l border-[rgba(0,255,238,0.2)] transition-all duration-300 ${
              viewMode === 'compact'
                ? 'bg-[#00ffee]/20 text-[#00ffee]'
                : 'text-gray-400 hover:text-[#00ffee]'
            }`}
            title="Compact view"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Launching Soon Highlight Section */}
      {launchingSoonTokens.length > 0 && (
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/30 via-purple-800/20 to-purple-900/30 border-2 border-purple-500/40 p-6 backdrop-blur-sm">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-purple-500/10 animate-pulse"></div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.3)] animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600/30 to-purple-500/30 rounded-full border border-purple-400/50 backdrop-blur-sm">
                  <Rocket className="w-6 h-6 text-purple-300 animate-bounce" />
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-purple-100 bg-clip-text text-transparent font-orbitron">
                    Launching Soon
                  </h2>
                  <Clock className="w-6 h-6 text-purple-300 animate-pulse" />
                </div>
              </div>
              
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                  : viewMode === 'list'
                  ? 'grid-cols-1'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
              }`}>
                {launchingSoonTokens.map((token) => (
                  <div key={token.id} className="relative">
                    {/* Special glow for launching soon tokens */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/50 to-pink-500/50 rounded-lg blur opacity-75 animate-pulse"></div>
                    <div className="relative">
                      <TokenCard 
                        token={token} 
                        viewMode={viewMode}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-4">
                <p className="text-purple-200 text-sm font-medium">
                  🚀 These tokens are launching soon - don't miss out!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Virtualized Token List */}
      {otherTokens.length > 0 && (
        <div className="bg-black/10 rounded-lg border border-[rgba(0,255,238,0.1)] overflow-hidden" style={{ minHeight: '400px' }}>
          <List
            height={listHeight}
            itemCount={virtualItemCount}
            itemSize={itemHeight}
            width="100%"
            overscanCount={2}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0, 255, 238, 0.3) transparent'
            }}
          >
            {renderVirtualItem}
          </List>
        </div>
      )}
      
      {/* Show total count */}
      <div className="text-center text-sm text-gray-400 mt-4">
        {launchingSoonTokens.length > 0 && (
          <span className="text-purple-300 font-medium">
            {launchingSoonTokens.length} launching soon • 
          </span>
        )}
        <span className="ml-1">
          {otherTokens.length} other tokens with smooth scrolling
        </span>
      </div>
    </div>
  );
};