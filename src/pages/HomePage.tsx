import { useState, useEffect } from 'react';
import { TokenCard } from '../components/TokenCard';
import { tokens } from '../data/tokens';
import { SupportModal } from '../components/SupportModal';
import { Footer } from '../components/Footer';
import { Heart, Search, Filter, RefreshCw } from 'lucide-react';
import { getLastUpdateTime } from '../services/tokenInfo';

export const HomePage = () => {
  const [view] = useState<'grid' | 'table'>('grid');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Sort tokens to prioritize live projects
  const sortedTokens = [...tokens].sort((a, b) => {
    if (a.status === 'Live' && b.status !== 'Live') return -1;
    if (a.status !== 'Live' && b.status === 'Live') return 1;
    return 0;
  });

  useEffect(() => {
    const fetchLastUpdate = async () => {
      const time = await getLastUpdateTime();
      setLastUpdate(time);
    };

    fetchLastUpdate();
  }, []);

  const filteredTokens = sortedTokens.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         token.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || token.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

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
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
            </div>

            {lastUpdate && (
              <div className="flex items-center justify-center mb-4 text-sm text-gray-400">
                <RefreshCw className="w-3 h-3 mr-2" />
                Last updated: {lastUpdate}
              </div>
            )}

            {filteredTokens.length === 0 ? (
              <div className="text-center py-12 bg-black/20 rounded-lg border border-[rgba(0,255,238,0.1)]">
                <p className="text-gray-400">No tokens found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredTokens.map(token => (
                  <TokenCard key={token.id} token={token} />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-center mt-8 mb-8">
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