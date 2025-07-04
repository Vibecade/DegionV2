import { useState, useEffect, useMemo, useCallback } from 'react';
import { SearchAndFilters } from '../components/SearchAndFilters';
import { TokenGrid } from '../components/TokenGrid';
import { QuickStats } from '../components/QuickStats';
import { SupportModal } from '../components/SupportModal';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { fetchTokensFromDatabase, getTokensLastUpdate } from '../services/tokenService';
import { fetchTokenSalesDetails } from '../services/tokenService';
import { Token } from '../types';
import { Heart, ExternalLink, TrendingUp, LineChart } from 'lucide-react';
import { formatUSDC, formatNumber } from '../utils/formatters';
import { logError } from '../utils/errorLogger';

export const HomePage = () => {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'roi'>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [totalInvestors, setTotalInvestors] = useState(0);

  // Load tokens from database
  useEffect(() => {
    const loadTokens = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('🔄 Loading tokens from database...');
        const fetchedTokens = await fetchTokensFromDatabase();
        setTokens(fetchedTokens);
        
        // Calculate totals from sales data
        let totalFunds = 0;
        let totalParticipants = 0;
        
        for (const token of fetchedTokens) {
          try {
            const salesData = await fetchTokenSalesDetails(token.id);
            if (salesData) {
              totalFunds += salesData.fundsRaisedUSDC || 0;
              totalParticipants += salesData.participants || 0;
            }
          } catch (salesError) {
            console.warn(`Failed to fetch sales data for ${token.id}:`, salesError);
          }
        }
        
        setTotalInvestment(totalFunds);
        setTotalInvestors(totalParticipants);
        
        console.log(`✅ Loaded ${fetchedTokens.length} tokens`);
      } catch (error) {
        logError(error as Error, 'HomePage:loadTokens');
        setError('Failed to load tokens. Please try refreshing the page.');
        console.error('Failed to load tokens:', error);
      } finally {
        // Reduced loading time for better performance
        setTimeout(() => setIsLoading(false), 300);
      }
    };

    loadTokens();
  }, []);

  // Get last update time
  useEffect(() => {
    const fetchLastUpdate = async () => {
      try {
        const time = await getTokensLastUpdate();
        setLastUpdate(time);
      } catch (error) {
        console.warn('Failed to get last update time:', error);
      }
    };

    fetchLastUpdate();
  }, []);

  // Sort tokens by status priority
  const sortedTokens = useMemo(() => [...tokens].sort((a, b) => {
    if (sortBy === 'name') {
      const result = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? result : -result;
    } else if (sortBy === 'roi') {
      // Helper function to parse ROI values properly
      const parseROI = (roiString: string): number => {
        // Handle "--" or empty values
        if (roiString === '--' || roiString === '' || !roiString) {
          return -Infinity; // Put these at the bottom when sorting ascending
        }
        
        // Remove % symbol and parse
        const numericValue = parseFloat(roiString.replace('%', ''));
        return isNaN(numericValue) ? -Infinity : numericValue;
      };
      
      const aRoi = parseROI(a.roi);
      const bRoi = parseROI(b.roi);
      const result = aRoi - bRoi;
      return sortOrder === 'asc' ? result : -result;
    } else {
      // Default status sorting
      const statusPriority = {
        'Live (Vested)': 1,
        'Live': 1,
        'Launching Soon': 3,
        'Pending TGE': 4,
        'ICO Soon': 5,
        'Cancelled': 6
      };
      
      const aPriority = statusPriority[a.status as keyof typeof statusPriority] ?? 999;
      const bPriority = statusPriority[b.status as keyof typeof statusPriority] ?? 999;
      
      // First sort by priority
      if (aPriority < bPriority) return -1;
      if (aPriority > bPriority) return 1;
      
      // For same priority, ensure Live comes before Live (Vested)
      if (aPriority === 1) {
        if (a.status === 'Live' && b.status === 'Live (Vested)') return -1;
        if (a.status === 'Live (Vested)' && b.status === 'Live') return 1;
      }
      
      // If priorities are the same, sort alphabetically by name
      return a.name.localeCompare(b.name);
    }
  }), [tokens, sortBy, sortOrder]);

  const filteredTokens = useMemo(() => sortedTokens.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         token.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || token.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  }), [sortedTokens, searchTerm, statusFilter]);

  const handleSortChange = useCallback((newSortBy: 'name' | 'status' | 'roi') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  }, [sortBy, sortOrder]);

  // Calculate quick stats
  const quickStats = useMemo(() => {
    const liveTokens = tokens.filter(t => t.status === 'Live' || t.status === 'Live (Vested)').length;
    const pendingTokens = tokens.filter(t => t.status === 'Pending TGE').length;
    const ICOSoon = tokens.filter(t => t.status === 'ICO Soon').length;
    
    // Calculate average ROI for tokens with valid ROI data
    const tokensWithROI = tokens.filter(t => t.roi !== '--' && !isNaN(parseFloat(t.roi)));
    const averageROI = tokensWithROI.length > 0 
      ? tokensWithROI.reduce((sum, t) => sum + parseFloat(t.roi), 0) / tokensWithROI.length
      : 0;
    
    return {
      liveTokens,
      pendingTokens,
      averageROI,
      ICOSoon
    };
  }, [tokens]);

  // Refresh tokens
  const refreshTokens = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedTokens = await fetchTokensFromDatabase();
      setTokens(fetchedTokens);
      const time = await getTokensLastUpdate();
      setLastUpdate(time);
    } catch (error) {
      logError(error as Error, 'HomePage:refreshTokens');
      setError('Failed to refresh tokens');
    } finally {
      setIsLoading(false);
    }
  }, []);

  if (error) {
    return (
      <div className="relative min-h-screen">
        <div className="relative z-10 flex flex-col items-center pt-4">
          <main className="w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 glass-panel rounded-lg">
            <div className="text-center py-12">
              <div className="mb-4 text-red-400">
                <ExternalLink className="w-12 h-12 mx-auto" />
              </div>
              <h1 className="text-2xl font-bold text-red-400 mb-4 font-orbitron">Error Loading Data</h1>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={refreshTokens}
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Try Again'}
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 flex flex-col items-center pt-4">
        <main className="w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 glass-panel rounded-lg">
          <div className="logo-container">
            <img
              src="https://sadpepedev.github.io/TheLegionProject/images/logos/degion.png"
              alt="Degion Logo"
              className="degion"
            />
            <img
              src="https://sadpepedev.github.io/TheLegionProject/images/logos/legion.png"
              alt="Legion Logo"
              className="legion-hover"
            />
          </div>
          
          <div className="mb-8">
            {/* Quick Stats */}
            <QuickStats
              totalInvestment={totalInvestment}
              totalInvestors={totalInvestors}
              liveTokens={quickStats.liveTokens}
              pendingTokens={quickStats.pendingTokens}
              ICOSoon={quickStats.ICOSoon}
              lastUpdate={lastUpdate}
            />

            {/* Search and Filters */}
            <SearchAndFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
              onRefresh={refreshTokens}
              isLoading={isLoading}
              tokenCount={tokens.length}
              filteredCount={filteredTokens.length}
            />

            {/* Token Grid */}
            <TokenGrid
              tokens={sortedTokens}
              isLoading={isLoading}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
            />
          </div>

          <div className="flex items-center justify-center mt-8 mb-8 text-center">
            <button
              className="group relative px-8 py-4 bg-black/30 rounded-lg overflow-hidden
                          border border-cyber-primary/30 hover:border-cyber-primary
                          transition-all duration-500 backdrop-blur-sm"
              onClick={() => setIsSupportModalOpen(true)}
            >
              {/* Animated background gradient */}
              <span className="absolute inset-0 bg-gradient-to-r from-cyber-primary/0 via-cyber-primary/20 to-cyber-primary/0
                                translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              {/* Glow effect */}
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                bg-cyber-primary/20 blur-xl" />
              
              <span className="relative flex items-center gap-2 text-cyber-primary group-hover:text-white
                                transition-colors duration-300 font-orbitron tracking-wider">
                <Heart className="w-5 h-5 animate-pulse" />
                Support Degion.xyz
              </span>
            </button>
          </div>

          <Footer />
        </main>
      </div>
      <SupportModal 
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </div>
  );
};