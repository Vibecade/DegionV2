import { useState, useEffect, useMemo, useCallback } from 'react';
import { SearchAndFilters } from '../components/SearchAndFilters';
import { TokenGrid } from '../components/TokenGrid';
import { QuickStats } from '../components/QuickStats';
import { SupportModal } from '../components/SupportModal';
import { Footer } from '../components/Footer';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ToastProvider, useToast } from '../components/Toast';
import { SearchWithSuggestions } from '../components/SearchWithSuggestions';
import { QuickStatsSkeleton, ErrorState } from '../components/LoadingStates';
import { fetchTokensFromDatabase, getTokensLastUpdate } from '../services/tokenService';
import { fetchTokenSalesDetails } from '../services/tokenService';
import { Token } from '../types';
import { Heart, ExternalLink, TrendingUp, LineChart, RefreshCw } from 'lucide-react';
import { formatUSDC, formatNumber } from '../utils/formatters';
import { logError } from '../utils/errorLogger';

const HomePageContent = () => {
  const { addToast } = useToast();
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false);

  // Load tokens from database
  useEffect(() => {
    const loadTokens = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('🔄 Loading tokens from database...');
        const fetchedTokens = await fetchTokensFromDatabase();
        setTokens(fetchedTokens);
        
        // Check if we're using fallback data by looking at console warnings
        // This is a simple heuristic - in a real app you might want to return this info from the service
        const isUsingFallback = fetchedTokens.length > 0 && fetchedTokens.every(token => 
          token.id && token.name && token.status
        );
        setIsUsingFallbackData(!isUsingFallback);
        
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
        
        // Show appropriate success toast
        if (fetchedTokens.length > 0) {
          addToast({
            type: 'success',
            title: isUsingFallbackData ? 'Data loaded (offline mode)' : 'Data loaded successfully',
            message: `${fetchedTokens.length} tokens loaded${isUsingFallbackData ? ' from local data' : ''}`,
            duration: 3000
          });
        } else {
          addToast({
            type: 'warning',
            title: 'No data available',
            message: 'No token data could be loaded',
            duration: 5000
          });
        }
      } catch (error) {
        logError(error as Error, 'HomePage:loadTokens');
        setError('Failed to load tokens. The application will try to use local data.');
        console.error('Failed to load tokens:', error);
        
        // Show error toast with more helpful message
        addToast({
          type: 'error',
          title: 'Connection issues detected',
          message: 'Using local data. Some features may be limited.',
          action: {
            label: 'Retry',
            onClick: () => window.location.reload()
          },
          duration: 8000
        });
      } finally {
        // Simulate loading time for better UX
        setTimeout(() => setIsLoading(false), 1000);
      }
    };

    loadTokens();
  }, [addToast]);

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
    setIsRefreshing(true);
    try {
      const fetchedTokens = await fetchTokensFromDatabase();
      setTokens(fetchedTokens);
      const time = await getTokensLastUpdate();
      setLastUpdate(time);
      setError(null); // Clear any previous errors
      
      addToast({
        type: 'success',
        title: 'Data refreshed',
        message: 'All token data has been updated',
        duration: 3000
      });
    } catch (error) {
      logError(error as Error, 'HomePage:refreshTokens');
      
      addToast({
        type: 'warning',
        title: 'Refresh completed with issues',
        message: 'Some data may be from local cache',
        duration: 5000
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [addToast]);

  if (error && tokens.length === 0) {
    return (
      <div className="relative min-h-screen">
        <div className="relative z-10 flex flex-col items-center pt-4">
          <main className="w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 glass-panel rounded-lg">
            <ErrorState
              title="Connection Issues"
              message="Unable to load data. Please check your internet connection and try again."
              onRetry={refreshTokens}
            />
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
          
          {/* Connection status indicator */}
          {isUsingFallbackData && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span>Running in offline mode - using local data</span>
              </div>
            </div>
          )}
          
          <div className="mb-8">
            {/* Quick Stats */}
            {isLoading ? (
              <QuickStatsSkeleton />
            ) : (
              <QuickStats
                totalInvestment={totalInvestment}
                totalInvestors={totalInvestors}
                liveTokens={quickStats.liveTokens}
                pendingTokens={quickStats.pendingTokens}
                ICOSoon={quickStats.ICOSoon}
                lastUpdate={lastUpdate}
              />
            )}

            {/* Enhanced Search */}
            <div className="mb-6">
              <SearchWithSuggestions
                tokens={tokens}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                placeholder="Search tokens by name or symbol..."
              />
            </div>

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
              isLoading={isRefreshing}
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

export const HomePage = () => (
  <ToastProvider>
    <HomePageContent />
  </ToastProvider>
);