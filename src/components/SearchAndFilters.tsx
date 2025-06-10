import React, { useState, useCallback, useMemo } from 'react';
import { Search, Filter, RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import { debounce } from '../utils/performance';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  sortBy: 'name' | 'status' | 'roi';
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: 'name' | 'status' | 'roi') => void;
  onRefresh: () => void;
  isLoading: boolean;
  tokenCount: number;
  filteredCount: number;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  onRefresh,
  isLoading,
  tokenCount,
  filteredCount
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Debounced search to improve performance
  const debouncedSearch = useCallback(
    debounce((term: string) => onSearchChange(term), 300),
    [onSearchChange]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    setLocalSearchTerm('');
    onSearchChange('');
  };

  const clearAllFilters = () => {
    setLocalSearchTerm('');
    onSearchChange('');
    onStatusFilterChange('all');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Main Search and Filter Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tokens by name or symbol..."
            value={localSearchTerm}
            onChange={handleSearchChange}
            className="w-full bg-black/30 border border-[rgba(0,255,238,0.2)] rounded-lg pl-10 pr-12 py-3 text-[#cfd0d1] focus:outline-none focus:border-[#00ffee] transition-all duration-300 focus:shadow-[0_0_20px_rgba(0,255,238,0.1)]"
          />
          {localSearchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex gap-2 flex-wrap lg:flex-nowrap">
          {/* Status Filter */}
          <div className="relative min-w-[160px]">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full bg-black/30 border border-[rgba(0,255,238,0.2)] rounded-lg pl-10 pr-8 py-3 text-[#cfd0d1] appearance-none focus:outline-none focus:border-[#00ffee] transition-all duration-300"
            >
              <option value="all">All Statuses</option>
              <option value="live">Live</option>
              <option value="live (vested)">Live (Vested)</option>
              <option value="pending tge">Pending TGE</option>
              <option value="ico soon">ICO Soon</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex bg-black/30 border border-[rgba(0,255,238,0.2)] rounded-lg overflow-hidden">
            <button
              onClick={() => onSortChange('status')}
              className={`px-4 py-3 text-sm transition-all duration-300 ${
                sortBy === 'status' 
                  ? 'bg-[#00ffee]/20 text-[#00ffee] shadow-[inset_0_0_10px_rgba(0,255,238,0.2)]' 
                  : 'text-gray-400 hover:text-[#00ffee] hover:bg-[#00ffee]/5'
              }`}
            >
              Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => onSortChange('name')}
              className={`px-4 py-3 text-sm transition-all duration-300 border-l border-[rgba(0,255,238,0.2)] ${
                sortBy === 'name' 
                  ? 'bg-[#00ffee]/20 text-[#00ffee] shadow-[inset_0_0_10px_rgba(0,255,238,0.2)]' 
                  : 'text-gray-400 hover:text-[#00ffee] hover:bg-[#00ffee]/5'
              }`}
            >
              Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => onSortChange('roi')}
              className={`px-4 py-3 text-sm transition-all duration-300 border-l border-[rgba(0,255,238,0.2)] ${
                sortBy === 'roi' 
                  ? 'bg-[#00ffee]/20 text-[#00ffee] shadow-[inset_0_0_10px_rgba(0,255,238,0.2)]' 
                  : 'text-gray-400 hover:text-[#00ffee] hover:bg-[#00ffee]/5'
              }`}
            >
              ROI {sortBy === 'roi' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-4 py-3 bg-black/30 border border-[rgba(0,255,238,0.2)] rounded-lg text-gray-400 hover:text-[#00ffee] transition-all duration-300 ${
              showAdvancedFilters ? 'bg-[#00ffee]/10 text-[#00ffee]' : ''
            }`}
            title="Advanced filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-4 py-3 bg-black/30 border border-[rgba(0,255,238,0.2)] rounded-lg text-gray-400 hover:text-[#00ffee] transition-all duration-300 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(0,255,238,0.1)]"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-4">
          <span>
            Showing {filteredCount} of {tokenCount} tokens
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-[#00ffee] hover:text-[#37fffc] transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-xs">Active filters:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-[#00ffee]/20 text-[#00ffee] rounded text-xs">
                Search: "{searchTerm}"
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-2 py-1 bg-[#00ffee]/20 text-[#00ffee] rounded text-xs">
                Status: {statusFilter}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div className="glass-panel p-4 rounded-lg border border-[rgba(0,255,238,0.1)] animate-in fade-in duration-300">
          <h3 className="text-lg font-semibold text-[#00ffee] mb-4 font-orbitron">Advanced Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Quick Status Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Quick Status Filters</label>
              <div className="space-y-2">
                {[
                  { value: 'live', label: 'Live Tokens', color: 'green' },
                  { value: 'pending tge', label: 'Pending TGE', color: 'yellow' },
                  { value: 'ico soon', label: 'ICO Soon', color: 'blue' }
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => onStatusFilterChange(statusFilter === value ? 'all' : value)}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-all duration-300 ${
                      statusFilter === value
                        ? `border-${color}-500 bg-${color}-500/20 text-${color}-400`
                        : 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Performance Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Performance</label>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 rounded-lg border border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300 transition-all duration-300">
                  Positive ROI Only
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg border border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300 transition-all duration-300">
                  High Performers (&gt;100% ROI)
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg border border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300 transition-all duration-300">
                  Recently Launched
                </button>
              </div>
            </div>

            {/* Vesting Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Vesting Status</label>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 rounded-lg border border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300 transition-all duration-300">
                  No Vesting
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg border border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300 transition-all duration-300">
                  Vesting Active
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg border border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300 transition-all duration-300">
                  Vesting Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};