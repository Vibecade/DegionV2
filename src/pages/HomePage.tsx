import { useState, useEffect } from 'react';
import { TokenCard } from '../components/TokenCard';
import { TokenCardSkeleton } from '../components/TokenCardSkeleton';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { tokens } from '../data/tokens';
import { salesData } from '../data/sales';
import { SupportModal } from '../components/SupportModal';
import { Footer } from '../components/Footer';
import { Heart, Search, Filter, RefreshCw, ExternalLink, TrendingUp, LineChart } from 'lucide-react';
import { getLastUpdateTime } from '../services/tokenInfo';
import { formatUSDC, formatNumber } from '../utils/formatters';

const DuneLink = ({ children }: { children: React.ReactNode }) => (
  <a
    href="https://dune.com/jsuh/legion"
    target="_blank"
    rel="noopener noreferrer"
    className="absolute top-2 right-2 px-2 py-1 text-xs text-[#00ffee]/60 hover:text-[#00ffee] flex items-center gap-1 rounded-lg hover:bg-[#00ffee]/10 transition-all duration-300 group/link cursor-pointer"
  >
    {children}
    <ExternalLink className="w-3 h-3 transform group-hover/link:translate-x-0.5 transition-transform" />
  </a>
);

export const HomePage = () => {
  const [view] = useState<'grid' | 'table'>('grid');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'roi'>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const totalInvestment = salesData.reduce((acc, sale) => acc + sale.fundsRaisedUSDC, 0);
  const totalInvestors = salesData.reduce((acc, sale) => acc + sale.participants, 0);

  // Sort tokens by status priority
  const sortedTokens = [...tokens].sort((a, b) => {
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
  });

  useEffect(() => {
    const fetchLastUpdate = async () => {
      setIsLoading(true);
      const time = await getLastUpdateTime();
      setLastUpdate(time);
      // Simulate loading time for better UX
      setTimeout(() => setIsLoading(false), 1000);
    };

    fetchLastUpdate();
  }, []);

  const filteredTokens = sortedTokens.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         token.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || token.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleSortChange = (newSortBy: 'name' | 'status' | 'roi') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

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
          
          <div className="max-w-2xl mx-auto px-4 py-4 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <a
                href="https://dune.com/jsuh/legion"
                target="_blank"
                rel="noopener noreferrer"
                className="relative overflow-hidden bg-gradient-to-br from-black/40 via-black/30 to-black/20 rounded-xl border border-[rgba(0,255,238,0.2)] p-8 hover:border-[rgba(0,255,238,0.4)] transition-all duration-500 group hover:shadow-[0_0_50px_rgba(0,255,238,0.2)] cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#00ffee]/5 via-transparent to-[#37fffc]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center justify-center gap-3 mb-4">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-orbitron text-[#00ffee] text-lg text-center">Total Investment</span>
                </div>
                <p className="relative text-4xl sm:text-5xl font-bold font-orbitron bg-gradient-to-r from-[#00ffee] via-[#37fffc] to-[#00ffee] bg-clip-text text-transparent group-hover:animate-pulse text-center group/tooltip cursor-help">
                  {formatUSDC(totalInvestment)}
                  <span className="text-[#00ffee]">*</span>
                  <span className="absolute -top-1 -left-1 blur-sm opacity-50">{formatUSDC(totalInvestment)}</span>
                  <span className="invisible group-hover/tooltip:visible absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-sm py-2 px-4 rounded-lg whitespace-nowrap border border-[#00ffee]/20">
                    Solana sales data currently not shown
                  </span>
                </p>
              </a>
              <a
                href="https://dune.com/jsuh/legion"
                target="_blank"
                rel="noopener noreferrer"
                className="relative overflow-hidden bg-gradient-to-br from-black/40 via-black/30 to-black/20 rounded-xl border border-[rgba(0,255,238,0.2)] p-8 hover:border-[rgba(0,255,238,0.4)] transition-all duration-500 group hover:shadow-[0_0_50px_rgba(0,255,238,0.2)] cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#00ffee]/5 via-transparent to-[#37fffc]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center justify-center gap-3 mb-4">
                  <LineChart className="w-5 h-5" />
                  <span className="font-orbitron text-[#00ffee] text-lg text-center">Total Investors</span>
                </div>
                <p className="relative text-4xl sm:text-5xl font-bold font-orbitron bg-gradient-to-r from-[#00ffee] via-[#37fffc] to-[#00ffee] bg-clip-text text-transparent transform group-hover:scale-110 transition-transform duration-500 text-center group/tooltip cursor-help">
                  {formatNumber(totalInvestors)}
                  <span className="text-[#00ffee]">*</span>
                  <span className="absolute -top-1 -left-1 blur-sm opacity-50">{formatNumber(totalInvestors)}</span>
                  <span className="invisible group-hover/tooltip:visible absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-sm py-2 px-4 rounded-lg whitespace-nowrap border border-[#00ffee]/20">
                    Solana sales data currently not shown
                  </span>
                </p>
              </a>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex flex-col lg:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/30 border border-[rgba(0,255,238,0.2)] rounded-lg pl-10 pr-4 py-2 text-[#cfd0d1] focus:outline-none focus:border-[#00ffee] transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-black/30 border border-[rgba(0,255,238,0.2)] rounded-lg pl-10 pr-8 py-2 text-[#cfd0d1] appearance-none focus:outline-none focus:border-[#00ffee] transition-colors"
                  >
                    <option value="all">All Statuses</option>
                    <option value="live">Live</option>
                    <option value="pending tge">Pending TGE</option>
                    <option value="ico soon">ICO Soon</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
                
                <div className="flex bg-black/30 border border-[rgba(0,255,238,0.2)] rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleSortChange('status')}
                    className={`px-3 py-2 text-sm transition-colors ${
                      sortBy === 'status' 
                        ? 'bg-[#00ffee]/20 text-[#00ffee]' 
                        : 'text-gray-400 hover:text-[#00ffee]'
                    }`}
                  >
                    Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    onClick={() => handleSortChange('name')}
                    className={`px-3 py-2 text-sm transition-colors border-l border-[rgba(0,255,238,0.2)] ${
                      sortBy === 'name' 
                        ? 'bg-[#00ffee]/20 text-[#00ffee]' 
                        : 'text-gray-400 hover:text-[#00ffee]'
                    }`}
                  >
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    onClick={() => handleSortChange('roi')}
                    className={`px-3 py-2 text-sm transition-colors border-l border-[rgba(0,255,238,0.2)] ${
                      sortBy === 'roi' 
                        ? 'bg-[#00ffee]/20 text-[#00ffee]' 
                        : 'text-gray-400 hover:text-[#00ffee]'
                    }`}
                  >
                    ROI {sortBy === 'roi' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </div>
              </div>
            </div>

            {lastUpdate && (
              <div className="flex items-center justify-center mb-4 text-sm text-gray-400">
                <RefreshCw className="w-3 h-3 mr-2" />
                Last updated: {lastUpdate}
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(9)].map((_, index) => (
                  <TokenCardSkeleton key={index} />
                ))}
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="text-center py-12 bg-black/20 rounded-lg border border-[rgba(0,255,238,0.1)]">
                <div className="mb-4">
                  <Search className="w-12 h-12 mx-auto text-[#00ffee]/50" />
                </div>
                <p className="text-gray-400 mb-2">No tokens found matching your criteria.</p>
                <p className="text-sm text-gray-500">Try adjusting your search or filter settings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 [&>*:last-child:nth-child(3n-1)]:sm:col-span-2 [&>*:last-child:nth-child(3n-1)]:sm:mx-auto [&>*:last-child:nth-child(3n-2)]:lg:col-span-3 [&>*:last-child:nth-child(3n-2)]:lg:mx-auto">
                {filteredTokens.map((token, index) => (
                  <div key={token.id} className="stagger-animation">
                    <TokenCard token={token} />
                  </div>
                ))}
              </div>
            )}
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