import React, { useState, useMemo } from 'react';
import { TokenCard } from './TokenCard';
import { TokenCardSkeleton } from './TokenCardSkeleton';
import { Token } from '../types';
import { Search, Grid, List, BarChart3 } from 'lucide-react';

interface TokenGridProps {
  tokens: Token[];
  isLoading: boolean;
  searchTerm: string;
  statusFilter: string;
}

type ViewMode = 'grid' | 'list' | 'compact';

export const TokenGrid: React.FC<TokenGridProps> = ({
  tokens,
  isLoading,
  searchTerm,
  statusFilter
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter tokens based on search and status
  const filteredTokens = useMemo(() => {
    return tokens.filter(token => {
      const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           token.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || token.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [tokens, searchTerm, statusFilter]);

  // Paginate tokens
  const paginatedTokens = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTokens.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTokens, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTokens.length / itemsPerPage);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  if (isLoading) {
    return (
      <div className={`grid gap-4 sm:gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
          : viewMode === 'list'
          ? 'grid-cols-1'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      }`}>
        {[...Array(itemsPerPage)].map((_, index) => (
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
          </span>
          
          {/* Items per page */}
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="bg-black/30 border border-[rgba(0,255,238,0.2)] rounded-lg px-3 py-1 text-sm text-[#cfd0d1] focus:outline-none focus:border-[#00ffee]"
          >
            <option value={6}>6 per page</option>
            <option value={12}>12 per page</option>
            <option value={24}>24 per page</option>
            <option value={filteredTokens.length}>Show all</option>
          </select>
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
            <List className="w-4 h-4" />
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

      {/* Token Grid */}
      <div className={`grid gap-4 sm:gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
          : viewMode === 'list'
          ? 'grid-cols-1'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      }`}>
        {paginatedTokens.map((token, index) => (
          <div key={token.id} className="stagger-animation" style={{ animationDelay: `${index * 0.1}s` }}>
            <TokenCard token={token} viewMode={viewMode} />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-black/30 border border-[rgba(0,255,238,0.2)] rounded-lg text-gray-400 hover:text-[#00ffee] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            Previous
          </button>
          
          {/* Page Numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  currentPage === pageNum
                    ? 'bg-[#00ffee] text-black font-semibold'
                    : 'bg-black/30 border border-[rgba(0,255,238,0.2)] text-gray-400 hover:text-[#00ffee]'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-black/30 border border-[rgba(0,255,238,0.2)] rounded-lg text-gray-400 hover:text-[#00ffee] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};