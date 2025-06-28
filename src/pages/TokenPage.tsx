import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SEOHead } from '../components/SEOHead';
import { TokenSentiment, Token } from '../types';
import { getTokenSentiment, submitVote } from '../services/sentiment';
import { useOptimisticUpdates } from '../hooks/useOptimisticUpdates';
import { useNotifications } from '../components/NotificationSystem';
import { getTokenPrice } from '../services/tokenPrices';
import { fetchTokenDetails, fetchTokenSalesDetails } from '../services/tokenService';
import { seoUtils } from '../utils/seo';
import { useAnnouncement } from '../hooks/useAccessibility';
import { logError } from '../utils/errorLogger';
import { MessageSquare, ArrowLeft, ExternalLink, Wallet, Users, ArrowUpRight, ChevronRight } from 'lucide-react';
import TradingViewWidget from '../components/TradingViewWidget';
import { Footer } from '../components/Footer';
import { formatUSDC, formatNumber } from '../utils/formatters';

export const TokenPage = () => {
  const { tokenId } = useParams();
  const { addNotification } = useNotifications();
  const announce = useAnnouncement();
  const [token, setToken] = useState<Token | null>(null);
  const [baseSentiment, setBaseSentiment] = useState<TokenSentiment>({ rocket: 0, poop: 0 });
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [currentPrice, setCurrentPrice] = useState('--');
  const [roi, setRoi] = useState('--');
  const [investment, setInvestment] = useState('--');
  const [ath, setAth] = useState<string>('--');
  const [atl, setAtl] = useState<string>('--');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [saleData, setSaleData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Optimistic sentiment updates
  const {
    data: sentiment,
    isOptimistic: isSentimentOptimistic,
    error: sentimentError,
    updateOptimistically: updateSentimentOptimistically,
    resetError: resetSentimentError
  } = useOptimisticUpdates(
    baseSentiment,
    async (newSentiment: TokenSentiment) => {
      // This function should return the actual server data
      // In practice, we'll handle this in the vote submission
      return newSentiment;
    }
  );

  // Generate SEO data
  const seoTitle = token ? `${token.name} (${token.id.toUpperCase()}) - Legion ICO Performance | Degion.xyz` : 'Token Not Found | Degion.xyz';
  const seoDescription = token ? `Track ${token.name} token performance with real-time price${currentPrice !== '--' ? ` (${currentPrice})` : ''}, ROI${roi !== '--' ? ` (${roi})` : ''}, and community sentiment. Comprehensive analytics and investment tracking.` : 'Token not found on Degion.xyz';
  const seoKeywords = token ? seoUtils.generateKeywords(token.name, token.status, ['price tracking', 'investment analysis']) : '';

  // Load token data
  useEffect(() => {
    if (!tokenId) return;

    const loadTokenData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`🔄 Loading token data for ${tokenId}`);
        
        // Fetch token details from database
        const tokenData = await fetchTokenDetails(tokenId);
        if (!tokenData) {
          setError('Token not found');
          return;
        }
        
        setToken(tokenData);
        
        // Fetch sales data
        try {
          const salesDetails = await fetchTokenSalesDetails(tokenId);
          setSaleData(salesDetails);
        } catch (salesError) {
          console.warn(`Failed to fetch sales data for ${tokenId}:`, salesError);
        }

        // Load sentiment data
        try {
          const sentimentData = await getTokenSentiment(tokenId);
          setBaseSentiment(sentimentData);
        } catch (sentimentError) {
          console.warn(`Failed to fetch sentiment for ${tokenId}:`, sentimentError);
        }

        console.log(`✅ Loaded token data for ${tokenId}`);
      } catch (error) {
        logError(error as Error, 'TokenPage:loadTokenData', { tokenId });
        setError('Failed to load token data');
      } finally {
        setIsLoading(false);
      }
    };

    loadTokenData();
  }, [tokenId]);

  // Announce price updates to screen readers
  useEffect(() => {
    if (isUpdating && token) {
      announce(`${token.name} price updated to ${currentPrice}`, 'polite');
    }
  }, [isUpdating, currentPrice, token, announce]);

  // Fetch live price data for supported tokens
  useEffect(() => {
    if (!token || !tokenId) return;

    const supportedTokens = ['fuel', 'silencio', 'corn', 'giza', 'skate', 'resolv', 'session'];
    if (!supportedTokens.includes(tokenId.toLowerCase())) {
      return;
    }

    const fetchPrice = async () => {
      try {
        const seedPriceNum = parseFloat(token.seedPrice.replace('$', ''));
        if (isNaN(seedPriceNum)) return;

        // Map token IDs to CoinGecko IDs
        const coingeckoIds: { [key: string]: string } = {
          fuel: 'fuel-network',
          silencio: 'silencio',
          corn: 'corn',
          giza: 'giza',
          skate: 'skate',
          resolv: 'resolv',
          session: 'session'
        };

        const coingeckoId = coingeckoIds[tokenId.toLowerCase()];
        if (!coingeckoId) return;

        setIsUpdating(true);
        const data = await getTokenPrice(tokenId.toLowerCase(), seedPriceNum, coingeckoId);
        
        setCurrentPrice(`$${data.current_price.toFixed(6)}`);
        const roiValue = ((data.current_price - seedPriceNum) / seedPriceNum) * 100;
        setRoi(`${roiValue.toFixed(2)}%`);
        setInvestment(`$${data.roi_value.toFixed(2)}`);
        
        // Update ATH/ATL if available
        if (data.ath && data.ath > 0) {
          const athDate = data.ath_date ? ` (${new Date(data.ath_date).toLocaleDateString()})` : '';
          setAth(`$${data.ath.toFixed(6)}${athDate}`);
        }
        if (data.atl && data.atl > 0) {
          const atlDate = data.atl_date ? ` (${new Date(data.atl_date).toLocaleDateString()})` : '';
          setAtl(`$${data.atl.toFixed(6)}${atlDate}`);
        }
        
        setTimeout(() => setIsUpdating(false), 500);
      } catch (error) {
        console.warn(`Price fetch failed for ${tokenId}, using fallback`);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [tokenId, token]);

  const loadSentiment = async () => {
    if (!tokenId) return;
    try {
      const data = await getTokenSentiment(tokenId);
      setBaseSentiment(data);
    } catch (error) {
      console.warn('Failed to load sentiment:', error);
    }
  };

  const handleVote = async (type: 'rocket' | 'poop') => {
    if (!tokenId || isVoting || hasVoted) return;

    setIsVoting(true);
    setVoteError('');
    resetSentimentError();

    // Calculate optimistic sentiment update
    const optimisticSentiment = {
      ...sentiment,
      [type]: sentiment[type] + 1
    };

    try {
      // Update UI optimistically
      await updateSentimentOptimistically(optimisticSentiment);
      
      const success = await submitVote(tokenId, type, (newSentiment) => {
        // This callback handles both optimistic updates and reverts
        updateSentimentOptimistically(newSentiment);
      });
      
      if (success) {
        setHasVoted(true);
        // Refresh actual sentiment data
        const actualSentiment = await getTokenSentiment(tokenId);
        setBaseSentiment(actualSentiment);
        await updateSentimentOptimistically(actualSentiment);
        
        addNotification({
          type: 'success',
          title: 'Vote Submitted',
          message: `Your ${type === 'rocket' ? 'bullish' : 'bearish'} vote has been recorded!`
        });
      } else {
        setVoteError('You have already voted for this token today');
        addNotification({
          type: 'warning',
          title: 'Already Voted',
          message: 'You have already voted for this token today'
        });
      }
    } catch (error) {
      setVoteError('Failed to submit vote. Please try again later.');
      addNotification({
        type: 'error',
        title: 'Vote Failed',
        message: 'Failed to submit your vote. Please try again later.'
      });
    } finally {
      setIsVoting(false);
    }
  };

  const getTradingViewSymbol = (id: string) => {
    switch (id.toLowerCase()) {
      case 'fuel':
        return 'KUCOIN:FUELUSDT';
      case 'silencio':
        return 'KUCOIN:SLCUSDT';
      case 'corn':
        return 'MEXC:CORNUSDT';
      case 'giza':
        return 'KUCOIN:GIZAUSDT';
      case 'skate':
        return 'UNISWAP3ETH:SKATEUSDC_4A480F.USD';
      case 'resolv':
        return 'MEXC:RESOLVUSDT';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09131b] text-[#cfd0d1] p-4 sm:p-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-700/50 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-700/50 rounded"></div>
                <div className="h-48 bg-gray-700/50 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-700/50 rounded"></div>
                <div className="h-48 bg-gray-700/50 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="min-h-screen bg-[#09131b] text-[#cfd0d1] p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#00ffee] mb-4 font-orbitron">
            {error || 'Token Not Found'}
          </h1>
          <Link 
            to="/"
            className="inline-flex items-center px-6 py-3 border border-[#00ffee] rounded-full text-[#00ffee] hover:bg-[#00ffee] hover:text-[#09131b] transition-all hover:shadow-[0_0_20px_rgba(0,255,238,0.3)]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const {
    name,
    seedPrice,
    links
  } = token;

  const totalVotes = sentiment.rocket + sentiment.poop;
  const rocketPercentage = totalVotes > 0 ? (sentiment.rocket / totalVotes) * 100 : 0;
  const poopPercentage = totalVotes > 0 ? (sentiment.poop / totalVotes) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#09131b] text-[#cfd0d1] p-4 sm:p-8">
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl={`https://degion.xyz/${tokenId}`}
      />
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center">
            <Link 
              to="/"
              className="inline-flex items-center text-[#00ffee] hover:text-[#37fffc] transition-colors group"
              aria-label="Return to home page"
            >
              <ArrowLeft className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-4 h-4 mx-2 text-gray-500" />
            <span className="text-gray-300">{name}</span>
          </div>
          <Link
            to={`/${tokenId}/discussions`}
            className="inline-flex items-center px-4 py-2 bg-[#00ffee] text-black rounded-lg hover:bg-[#37fffc] transition-colors shadow-[0_0_20px_rgba(0,255,238,0.2)] hover:shadow-[0_0_30px_rgba(0,255,238,0.4)]"
            aria-label={`View discussions for ${name}`}
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            View Discussions
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <div className="glass-panel p-6 sm:p-8 rounded-lg">
              <div className="flex items-center mb-6">
                <img 
                  src={(() => {
                    const tokenIdLower = token.id.toLowerCase();
                    if (tokenIdLower === 'fragmetric') {
                      return 'https://raw.githubusercontent.com/Sadpepedev/TheLegionProject/main/images/logos/Fragmetric.png';
                    } else if (tokenIdLower === 'arcium') {
                      return `https://sadpepedev.github.io/TheLegionProject/images/logos/${tokenIdLower}.png`;
                    } else {
                      return `https://sadpepedev.github.io/TheLegionProject/images/logos/${tokenIdLower}.png`;
                    }
                  })()}
                  alt={`${name} Logo`}
                  className="w-16 h-16 rounded-full mr-4 animate-float"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    if (token.id.toLowerCase() === 'arcium') {
                      target.src = '/ca6520f2-0b43-465d-bd4d-2d6c45de2f70.jpg';
                      target.onError = () => {
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiMwMGZmZWUiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNiIgaGVpZ2h0PSIyNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIvPgo8cGF0aCBkPSJtMyA5IDktOSA5IDltLTkgOXY5Ci8+Cjwvc3ZnPgo8L3N2Zz4K';
                      };
                    } else {
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiMwMGZmZWUiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNiIgaGVpZ2h0PSIyNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIvPgo8cGF0aCBkPSJtMyA5IDktOSA5IDltLTkgOXY5Ci8+Cjwvc3ZnPgo8L3N2Zz4K';
                    }
                  }}
                />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#00ffee] title-glow mb-2 font-orbitron">{name}</h1>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className={`badge badge-${token.status.toLowerCase().replace(' ', '-')}`}>
                      {token.status}
                    </span>
                    <span className="text-gray-400">{token.launchDate}</span>
                  </div>
                </div>
              </div>

              {token.description && (
                <p className="text-gray-300 bg-black/20 p-4 rounded-lg border border-[rgba(0,255,238,0.1)] leading-relaxed">
                  {token.description}
                </p>
              )}
            </div>

            <div className="glass-panel p-6 sm:p-8 rounded-lg">
              <h2 className="text-xl font-bold text-[#00ffee] mb-6 font-orbitron">Token Metrics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="hover-card bg-black/20 p-4 rounded-lg border border-[rgba(0,255,238,0.1)]">
                  <div className="text-gray-400 text-sm mb-1">Seed Price</div>
                  <div className="text-xl font-semibold">{seedPrice}</div>
                </div>
                <div className="hover-card bg-black/20 p-4 rounded-lg border border-[rgba(0,255,238,0.1)]">
                  <div className="text-gray-400 text-sm mb-1">Current Price</div>
                  <div className={`text-xl font-semibold ${isUpdating ? 'price-update' : ''}`}>
                    {currentPrice}
                  </div>
                </div>
                <div className="hover-card bg-black/20 p-4 rounded-lg border border-[rgba(0,255,238,0.1)]">
                  <div className="text-gray-400 text-sm mb-1">ROI</div>
                  <div className={`text-xl font-semibold ${parseFloat(roi) >= 0 ? "text-green-500" : "text-red-500"} ${isUpdating ? 'price-update' : ''}`}>
                    {roi}
                  </div>
                </div>
                <div className="hover-card bg-black/20 p-4 rounded-lg border border-[rgba(0,255,238,0.1)]">
                  <div className="text-gray-400 text-sm mb-1">$1000 Investment Now Worth</div>
                  <div className={`text-xl font-semibold ${parseFloat(investment.replace(/\$/, '')) >= 1000 ? "text-green-500" : "text-red-500"} ${isUpdating ? 'price-update' : ''}`}>
                    {investment}
                  </div>
                </div>
                
                {/* ATH Card */}
                <div className="hover-card bg-black/20 p-4 rounded-lg border border-[rgba(0,255,238,0.1)]">
                  <div className="text-gray-400 text-sm mb-1">All-Time High</div>
                  <div className={`text-xl font-semibold text-green-400 ${isUpdating ? 'price-update' : ''}`}>
                    {ath}
                  </div>
                </div>
                
                {/* ATL Card */}
                <div className="hover-card bg-black/20 p-4 rounded-lg border border-[rgba(0,255,238,0.1)]">
                  <div className="text-gray-400 text-sm mb-1">All-Time Low</div>
                  <div className={`text-xl font-semibold text-red-400 ${isUpdating ? 'price-update' : ''}`}>
                    {atl}
                  </div>
                </div>
              </div>
            </div>

            {saleData && (
              <div className="glass-panel p-6 sm:p-8 rounded-lg">
                <h2 className="text-xl font-bold text-[#00ffee] mb-6 font-orbitron">Sale Data</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="hover-card bg-black/20 p-6 rounded-lg border border-[rgba(0,255,238,0.1)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Network</span>
                      <span className="capitalize">{saleData.network}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Participants</span>
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#00ffee]" />
                        {formatNumber(saleData.participants)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Funds Raised</span>
                      <span className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-[#00ffee]" />
                        {formatUSDC(saleData.fundsRaisedUSDC)}
                      </span>
                    </div>
                  </div>
                  <div className="hover-card bg-black/20 p-6 rounded-lg border border-[rgba(0,255,238,0.1)]">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-400">Contract Address</span>
                      <a
                        href={`https://${saleData.network === 'ethereum' ? 'etherscan.io' : 'arbiscan.io'}/address/${saleData.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#00ffee] hover:text-[#37fffc] transition-colors group"
                      >
                        View
                        <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                    <div className="font-mono text-sm break-all text-gray-300 bg-black/30 p-3 rounded border border-[rgba(0,255,238,0.05)]">
                      {saleData.address}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="glass-panel p-6 sm:p-8 rounded-lg">
              <h2 className="text-xl font-bold text-[#00ffee] mb-6 font-orbitron">Price Chart</h2>
              <div className="h-[500px] bg-black/20 rounded-lg border border-[rgba(0,255,238,0.1)]">
                {getTradingViewSymbol(token.id) ? (
                  <TradingViewWidget symbol={getTradingViewSymbol(token.id)} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Chart not available for this token
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <div className="glass-panel p-6 rounded-lg">
              <h2 className="text-xl font-bold text-[#00ffee] mb-4 font-orbitron">Links</h2>
              <div className="space-y-3">
                {links?.website && (
                  <a 
                    href={links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full p-3 bg-black/20 rounded-lg border border-[rgba(0,255,238,0.1)] text-[#00ffee] hover:text-[#37fffc] transition-colors group"
                  >
                    <span>Website</span>
                    <ExternalLink className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </a>
                )}
                {links?.twitter && (
                  <a 
                    href={links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full p-3 bg-black/20 rounded-lg border border-[rgba(0,255,238,0.1)] text-[#00ffee] hover:text-[#37fffc] transition-colors group"
                  >
                    <span>Twitter</span>
                    <ExternalLink className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </a>
                )}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-lg">
              <h2 className="text-xl font-bold text-[#00ffee] mb-6 font-orbitron">Community Sentiment</h2>
              
              {/* Show optimistic state indicator */}
              {isSentimentOptimistic && (
                <div className="mb-4 p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    Updating vote...
                  </div>
                </div>
              )}
              
              {/* Show sentiment error */}
              {sentimentError && (
                <div className="mb-4 p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {sentimentError}
                  <button 
                    onClick={resetSentimentError}
                    className="ml-2 underline hover:no-underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              
              <div className="flex justify-center space-x-4 mb-6">
                <button 
                  className={`flex-1 py-3 px-4 rounded-lg text-white transition-all relative ${
                    hasVoted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                  } ${isVoting || isSentimentOptimistic ? 'animate-pulse' : ''} bg-green-500/20 border border-green-500/30 hover:bg-green-500/30`}
                  onClick={() => handleVote('rocket')}
                  disabled={hasVoted || isVoting || isSentimentOptimistic}
                  title={hasVoted ? 'Already voted' : 'Vote Rocket'}
                >
                  {isSentimentOptimistic && (
                    <div className="absolute inset-0 bg-green-500/10 rounded-lg animate-pulse"></div>
                  )}
                  🚀 Bullish
                </button>
                <button 
                  className={`flex-1 py-3 px-4 rounded-lg text-white transition-all relative ${
                    hasVoted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                  } ${isVoting || isSentimentOptimistic ? 'animate-pulse' : ''} bg-red-500/20 border border-red-500/30 hover:bg-red-500/30`}
                  onClick={() => handleVote('poop')}
                  disabled={hasVoted || isVoting || isSentimentOptimistic}
                  title={hasVoted ? 'Already voted' : 'Vote Poop'}
                >
                  {isSentimentOptimistic && (
                    <div className="absolute inset-0 bg-red-500/10 rounded-lg animate-pulse"></div>
                  )}
                  💩 Bearish
                </button>
              </div>

              {voteError && (
                <div className="text-red-500 text-center mb-4 text-sm bg-red-500/10 p-2 rounded-lg">
                  {voteError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>🚀 Bullish ({sentiment.rocket} votes)</span>
                    <span className={isSentimentOptimistic ? 'text-blue-400' : ''}>
                      {rocketPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isSentimentOptimistic ? 'bg-green-400 animate-pulse' : 'bg-green-500'
                      }`}
                      style={{ width: `${rocketPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>💩 Bearish ({sentiment.poop} votes)</span>
                    <span className={isSentimentOptimistic ? 'text-blue-400' : ''}>
                      {poopPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isSentimentOptimistic ? 'bg-red-400 animate-pulse' : 'bg-red-500'
                      }`}
                      style={{ width: `${poopPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-400 mt-4 p-2 bg-black/20 rounded-lg">
                  <span className={isSentimentOptimistic ? 'text-blue-400' : ''}>
                    {totalVotes} total votes in the last 24h
                  </span>
                  {isSentimentOptimistic && (
                    <div className="text-xs text-blue-400 mt-1">
                      (updating...)
                    </div>
                  )}
                </div>
              </div>
            </div>

            {token.vestingEnd && (
              <div className="glass-panel p-6 rounded-lg">
                <h2 className="text-xl font-bold text-[#00ffee] mb-4 font-orbitron">Vesting</h2>
                <div className="hover-card bg-black/20 p-4 rounded-lg border border-[rgba(0,255,238,0.1)]">
                  <div className="text-gray-400 text-sm mb-1">Vesting Period</div>
                  <div className="text-xl font-semibold">{token.vestingEnd}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};