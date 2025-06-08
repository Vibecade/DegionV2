import { useParams, Link } from 'react-router-dom';
import { tokens } from '../data/tokens';
import { useEffect, useState } from 'react';
import { SEOHead } from '../components/SEOHead';
import { TokenSentiment } from '../types';
import { getTokenSentiment, submitVote } from '../services/sentiment';
import { getFuelPrice, getSilencioPrice, getCornPrice, getGizaPrice } from '../services/tokenPrices';
import { getTokenInfo } from '../services/tokenInfo';
import { seoUtils } from '../utils/seo';
import { useAnnouncement } from '../hooks/useAccessibility';
import { MessageSquare, ArrowLeft, ExternalLink, Wallet, Users, ArrowUpRight, ChevronRight } from 'lucide-react';
import TradingViewWidget from '../components/TradingViewWidget';
import { Footer } from '../components/Footer';
import { salesData } from '../data/sales';
import { formatUSDC, formatNumber } from '../utils/formatters';

export const TokenPage = () => {
  const { tokenId } = useParams();
  const token = tokens.find(t => t.id.toLowerCase() === tokenId?.toLowerCase());
  const announce = useAnnouncement();
  const [sentiment, setSentiment] = useState<TokenSentiment>({ rocket: 0, poop: 0 });
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [currentPrice, setCurrentPrice] = useState(token?.currentPrice || '--');
  const [roi, setRoi] = useState(token?.roi || '--');
  const [investment, setInvestment] = useState(token?.investment || '--');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(token?.status || '');
  const [currentLaunchDate, setCurrentLaunchDate] = useState(token?.launchDate || '');
  const [currentDescription, setCurrentDescription] = useState(token?.description || '');
  const [currentVestingEnd, setCurrentVestingEnd] = useState(token?.vestingEnd || '');
  
  const saleData = salesData.find(sale => sale.name.toLowerCase() === token?.name.toLowerCase());

  // Generate SEO data
  const seoTitle = token ? `${token.name} (${token.id.toUpperCase()}) - Legion ICO Performance | Degion.xyz` : 'Token Not Found | Degion.xyz';
  const seoDescription = token ? `Track ${token.name} token performance with real-time price${currentPrice !== '--' ? ` (${currentPrice})` : ''}, ROI${roi !== '--' ? ` (${roi})` : ''}, and community sentiment. Comprehensive analytics and investment tracking.` : 'Token not found on Degion.xyz';
  const seoKeywords = token ? seoUtils.generateKeywords(token.name, currentStatus, ['price tracking', 'investment analysis']) : '';

  useEffect(() => {
    if (tokenId) {
      loadSentiment();
    }
  }, [tokenId]);

  // Announce price updates to screen readers
  useEffect(() => {
    if (isUpdating && token) {
      announce(`${token.name} price updated to ${currentPrice}`, 'polite');
    }
  }, [isUpdating, currentPrice, token, announce]);

  // Update token data from Legion API
  useEffect(() => {
    if (!token || !tokenId) return;

    const fetchTokenInfo = async () => {
      try {
        const tokenInfo = await getTokenInfo(tokenId);
        if (tokenInfo) {
          if (tokenInfo.status) setCurrentStatus(tokenInfo.status);
          if (tokenInfo.launchDate) setCurrentLaunchDate(tokenInfo.launchDate);
          if (tokenInfo.description) setCurrentDescription(tokenInfo.description);
          if (tokenInfo.vestingEnd) setCurrentVestingEnd(tokenInfo.vestingEnd);
        }
      } catch (error) {
        console.error(`Error fetching ${tokenId} info:`, error);
      }
    };

    fetchTokenInfo();
  }, [tokenId, token]);

  // Fetch live price data
  useEffect(() => {
    if (!token || !tokenId) return;

    if (tokenId.toLowerCase() === 'fuel' || tokenId.toLowerCase() === 'silencio' || tokenId.toLowerCase() === 'corn' || tokenId.toLowerCase() === 'giza') {
      const fetchPrice = async () => {
        setIsLoading(true);
        try {
          const data = await (async () => {
            switch (tokenId.toLowerCase()) {
              case 'fuel': return await getFuelPrice();
              case 'silencio': return await getSilencioPrice();
              case 'corn': return await getCornPrice();
              case 'giza': return await getGizaPrice();
              default: throw new Error('Unsupported token');
            }
          })();
          
          setIsUpdating(true);
          setCurrentPrice(`$${data.current_price.toFixed(6)}`);
          const seedPriceNum = parseFloat(token.seedPrice.replace('$', ''));
          const roiValue = ((data.current_price - seedPriceNum) / seedPriceNum) * 100;
          setRoi(`${roiValue.toFixed(2)}%`);
          setInvestment(`$${data.roi_value.toFixed(2)}`);
          setTimeout(() => setIsUpdating(false), 500);
        } catch (error) {
          console.error(`Error fetching ${tokenId} price:`, error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPrice();
      const interval = setInterval(fetchPrice, 30000);
      return () => clearInterval(interval);
    }
  }, [tokenId, token]);

  const loadSentiment = async () => {
    if (!tokenId) return;
    const data = await getTokenSentiment(tokenId);
    setSentiment(data);
  };

  const handleVote = async (type: 'rocket' | 'poop') => {
    if (!tokenId || isVoting || hasVoted) return;

    setIsVoting(true);
    setVoteError('');

    try {
      const success = await submitVote(tokenId, type);
      if (success) {
        setHasVoted(true);
        await loadSentiment();
      } else {
        setVoteError('You have already voted for this token today');
      }
    } catch (error) {
      setVoteError('Failed to submit vote. Please try again later.');
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
      default:
        return '';
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#09131b] text-[#cfd0d1] p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#00ffee] mb-4 font-orbitron">Token Not Found</h1>
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
                  src={`https://sadpepedev.github.io/TheLegionProject/images/logos/${token.id.toLowerCase()}.png`}
                  alt={`${name} Logo`}
                  className="w-16 h-16 rounded-full mr-4 animate-float"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = 'https://sadpepedev.github.io/TheLegionProject/images/logos/placeholder.png';
                  }}
                />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#00ffee] title-glow mb-2 font-orbitron">{name}</h1>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className={`badge badge-${currentStatus.toLowerCase().replace(' ', '-')}`}>
                      {currentStatus}
                    </span>
                    <span className="text-gray-400">{currentLaunchDate}</span>
                  </div>
                </div>
              </div>

              {currentDescription && (
                <p className="text-gray-300 bg-black/20 p-4 rounded-lg border border-[rgba(0,255,238,0.1)] leading-relaxed">
                  {currentDescription}
                </p>
              )}
            </div>

            <div className="glass-panel p-6 sm:p-8 rounded-lg">
              <h2 className="text-xl font-bold text-[#00ffee] mb-6 font-orbitron">Token Metrics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="hover-card bg-black/20 p-4 rounded-lg border border-[rgba(0,255,238,0.1)]">
                  <div className="text-gray-400 text-sm mb-1">Seed Price</div>
                  <div className="text-xl font-semibold">{seedPrice}</div>
                </div>
                <div className="hover-card bg-black/20 p-4 rounded-lg border border-[rgba(0,255,238,0.1)]">
                  <div className="text-gray-400 text-sm mb-1">Current Price</div>
                  <div className={`text-xl font-semibold ${isUpdating ? 'price-update' : ''} ${isLoading ? 'animate-pulse' : ''}`}>
                    {currentPrice}
                  </div>
                </div>
                <div className="hover-card bg-black/20 p-4 rounded-lg border border-[rgba(0,255,238,0.1)]">
                  <div className="text-gray-400 text-sm mb-1">ROI</div>
                  <div className={`text-xl font-semibold ${parseFloat(roi) >= 0 ? "text-green-500" : "text-red-500"} ${isUpdating ? 'price-update' : ''} ${isLoading ? 'animate-pulse' : ''}`}>
                    {roi}
                  </div>
                </div>
                <div className="hover-card bg-black/20 p-4 rounded-lg border border-[rgba(0,255,238,0.1)]">
                  <div className="text-gray-400 text-sm mb-1">$1000 Investment Now Worth</div>
                  <div className={`text-xl font-semibold ${parseFloat(investment.replace(/\$/, '')) >= 1000 ? "text-green-500" : "text-red-500"} ${isUpdating ? 'price-update' : ''} ${isLoading ? 'animate-pulse' : ''}`}>
                    {investment}
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
              
              <div className="flex justify-center space-x-4 mb-6">
                <button 
                  className={`flex-1 py-3 px-4 rounded-lg text-white transition-all ${
                    hasVoted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                  } ${isVoting ? 'animate-pulse' : ''} bg-green-500/20 border border-green-500/30 hover:bg-green-500/30`}
                  onClick={() => handleVote('rocket')}
                  disabled={hasVoted || isVoting}
                  title={hasVoted ? 'Already voted' : 'Vote Rocket'}
                >
                  🚀 Bullish
                </button>
                <button 
                  className={`flex-1 py-3 px-4 rounded-lg text-white transition-all ${
                    hasVoted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                  } ${isVoting ? 'animate-pulse' : ''} bg-red-500/20 border border-red-500/30 hover:bg-red-500/30`}
                  onClick={() => handleVote('poop')}
                  disabled={hasVoted || isVoting}
                  title={hasVoted ? 'Already voted' : 'Vote Poop'}
                >
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
                    <span>{rocketPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${rocketPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>💩 Bearish ({sentiment.poop} votes)</span>
                    <span>{poopPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${poopPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-400 mt-4 p-2 bg-black/20 rounded-lg">
                  {totalVotes} total votes in the last 24h
                </div>
              </div>
            </div>

            {currentVestingEnd && (
              <div className="glass-panel p-6 rounded-lg">
                <h2 className="text-xl font-bold text-[#00ffee] mb-4 font-orbitron">Vesting</h2>
                <div className="hover-card bg-black/20 p-4 rounded-lg border border-[rgba(0,255,238,0.1)]">
                  <div className="text-gray-400 text-sm mb-1">Vesting Period</div>
                  <div className="text-xl font-semibold">{currentVestingEnd}</div>
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