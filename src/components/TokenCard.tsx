import { Link } from 'react-router-dom';
import { Token } from '../types';
import { logError } from '../utils/errorLogger';
import { useEffect, useState, useMemo, useCallback, memo, useRef, useLayoutEffect } from 'react';
import { getFuelPrice, getSilencioPrice, getCornPrice, getGizaPrice, getSkatePrice, getResolvPrice, clearAllPriceCaches } from '../services/tokenPrices';
import { getFragmetricPrice } from '../services/tokenPrices';
import { fetchTokenHolders, fetchTradingVolume } from '../services/duneApi';
import { getTokenInfo } from '../services/tokenInfo';
import { ArrowUpRight, Users, Wallet, LineChart, TrendingUp, Info } from 'lucide-react';
import { salesData } from '../data/sales';
import { formatUSDC, formatNumber } from '../utils/formatters';
import { VestingTimer } from './VestingTimer';
import { lazyImageLoader } from '../utils/performance';

interface TokenCardProps {
  token: Token;
  viewMode?: 'grid' | 'list' | 'compact';
  style?: React.CSSProperties;
}

const TokenCard = memo(({ token, viewMode = 'grid', style }: TokenCardProps) => {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const {
    id,
    name,
    status,
    launchDate,
    seedPrice,
    currentPrice: initialPrice,
    roi: initialRoi,
    investment: initialInvestment,
    vestingEnd
  } = token;

  // Add proper error handling
  const handleError = (error: Error, context: string) => {
    logError(error, `TokenCard:${context}`);
    // Show user-friendly error message
    setError('Failed to load token data');
  };

  const [currentPrice, setCurrentPrice] = useState(initialPrice);
  const [roi, setRoi] = useState(initialRoi);
  const [investment, setInvestment] = useState(initialInvestment);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [currentLaunchDate, setCurrentLaunchDate] = useState(launchDate);
  const [currentVestingEnd, setCurrentVestingEnd] = useState(vestingEnd);
  const [holders, setHolders] = useState<number>(0);
  const [volume24h, setVolume24h] = useState<number>(0);
  const [isLaunchingSoon, setIsLaunchingSoon] = useState<boolean>(false);

  const saleData = useMemo(() => 
    salesData.find(sale => sale.name.toLowerCase() === name.toLowerCase()),
    [name]
  );

  // Enhanced image loading with lazy loading utility
  useLayoutEffect(() => {
    if (!imageRef.current || !isInView) return;

    const img = imageRef.current;
    const imageSrc = getTokenImageSrc(token.id);
    
    // Set up the image for lazy loading
    img.dataset.src = imageSrc;
    
    // Use the lazy image loader utility
    lazyImageLoader.observe(img);
    
    // Handle image load success
    const handleImageLoad = () => {
      setImageLoaded(true);
      setImageError(false);
    };
    
    // Handle image load error with fallback
    const handleImageError = () => {
      setImageError(true);
      const fallbackSrc = getTokenFallbackSrc(token.id);
      if (fallbackSrc && img.src !== fallbackSrc) {
        img.src = fallbackSrc;
        img.onerror = () => {
          // Final fallback to default icon
          img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiMwMGZmZWUiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNiIgaGVpZ2h0PSIyNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIvPgo8cGF0aCBkPSJtMyA5IDktOSA5IDltLTkgOXY5Ci8+Cjwvc3ZnPgo8L3N2Zz4K';
          setImageLoaded(true);
        };
      } else {
        // Use default icon if no fallback available
        img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiMwMGZmZWUiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNiIgaGVpZ2h0PSIyNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIvPgo8cGF0aCBkPSJtMyA5IDktOSA5IDltLTkgOXY5Ci8+Cjwvc3ZnPgo8L3N2Zz4K';
        setImageLoaded(true);
      }
    };
    
    img.addEventListener('load', handleImageLoad);
    img.addEventListener('error', handleImageError);
    
    return () => {
      img.removeEventListener('load', handleImageLoad);
      img.removeEventListener('error', handleImageError);
    };
  }, [isInView, token.id]);

  // Intersection observer for lazy loading and performance
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Optimize image loading
  const getTokenImageSrc = (tokenId: string): string => {
    const tokenIdLower = tokenId.toLowerCase();
    if (tokenIdLower === 'yieldbasis') {
      return 'https://pbs.twimg.com/profile_images/1856040142462976000/YieldBasis_400x400.jpg';
    } else if (tokenIdLower === 'fragmetric') {
      return 'https://raw.githubusercontent.com/Sadpepedev/TheLegionProject/main/images/logos/Fragmetric.png';
    } else if (tokenIdLower === 'arcium') {
      return `https://sadpepedev.github.io/TheLegionProject/images/logos/${tokenIdLower}.png`;
    } else {
      return `https://sadpepedev.github.io/TheLegionProject/images/logos/${tokenIdLower}.png`;
    }
  };

  const getTokenFallbackSrc = (tokenId: string): string => {
    if (tokenId.toLowerCase() === 'arcium') {
      return '/ca6520f2-0b43-465d-bd4d-2d6c45de2f70.jpg';
    }
    return '';
  };

  // Check if token is launching within 24 hours
  useEffect(() => {
    if (!currentLaunchDate || currentStatus !== 'Pending TGE') return;
    
    const launch = new Date(currentLaunchDate).getTime();
    const now = new Date().getTime();
    const diff = launch - now;
    
    setIsLaunchingSoon(diff > 0 && diff <= 24 * 60 * 60 * 1000);
  }, [currentLaunchDate, currentStatus]);

  // Update token data from Legion API
  useEffect(() => {
    if (!isInView) return; // Only fetch data when card is in view

    const fetchTokenInfo = async () => {
      try {
        const tokenInfo = await getTokenInfo(id);
        if (tokenInfo) {
          if (tokenInfo.status) setCurrentStatus(tokenInfo.status);
          if (tokenInfo.launchDate) setCurrentLaunchDate(tokenInfo.launchDate);
        }
      } catch (error) {
        // Only log non-network errors to avoid spam
        if (error instanceof Error && !error.message.includes('Failed to fetch')) {
          handleError(error as Error, 'loadData');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenInfo();
  }, [id, isInView]);

  // Fetch Dune Analytics data
  useEffect(() => {
    if (!isInView || !saleData?.address) return;

      const fetchDuneData = async () => {
        try {
          const [holdersCount, tradingVolume] = await Promise.all([
            fetchTokenHolders(saleData.address),
            fetchTradingVolume(saleData.address)
          ]);
          setHolders(holdersCount);
          setVolume24h(tradingVolume);
        } catch (error) {
          handleError(error as Error, 'loadData');
        }
      };
      fetchDuneData();
  }, [id, saleData, isInView]);

  // Get live price data for tokens that are trading
  const fetchPrice = useCallback(async () => {
    const supportedTokens = ['fuel', 'silencio', 'corn', 'giza', 'skate', 'resolv', 'session', 'fragmetric'];
    if (!supportedTokens.includes(id.toLowerCase())) {
      return;
    }
    
    // For debugging corn specifically
    if (id.toLowerCase() === 'corn') {
      console.log('🌽 Clearing corn cache before fetch...');
      clearAllPriceCaches();
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await (async () => {
        switch (id.toLowerCase()) {
          case 'fuel': return await getFuelPrice();
          case 'silencio': return await getSilencioPrice();
          case 'corn': return await getCornPrice();
          case 'giza': return await getGizaPrice();
          case 'skate': return await getSkatePrice();
          case 'resolv': return await getResolvPrice();
          case 'session': return await getSessionPrice();
          case 'fragmetric': return await getFragmetricPrice();
          default: throw new Error('Unsupported token');
        }
      })();
      
      setIsUpdating(true);
      setCurrentPrice(`$${data.current_price.toFixed(6)}`);
      const seedPriceNum = parseFloat(seedPrice.replace('$', ''));
      const roiValue = ((data.current_price - seedPriceNum) / seedPriceNum) * 100;
      setRoi(`${roiValue.toFixed(2)}%`);
      setInvestment(`$${data.roi_value.toFixed(2)}`);
      setTimeout(() => setIsUpdating(false), 500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Only log rate limit errors as warnings, others as errors
      if (errorMessage.includes('429') || errorMessage.includes('Rate limited')) {
        console.warn(`Rate limited for ${id}, using cached/fallback data`);
      } else {
        console.error(`Price fetch failed for ${id}:`, errorMessage);
        logError(error as Error, 'TokenCard:fetchPrice', { tokenId: id });
      }
      
      // Don't set error state for rate limits, only for actual failures
      if (!errorMessage.includes('429') && !errorMessage.includes('Rate limited')) {
        setError('Failed to load current price data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, seedPrice]);

  useEffect(() => {
    const supportedTokens = ['fuel', 'silencio', 'corn', 'giza', 'skate', 'resolv', 'fragmetric'];
    if (supportedTokens.includes(id.toLowerCase()) && isInView) {
      fetchPrice();
      // Stagger intervals to avoid hitting rate limits
      const baseInterval = 120000; // 2 minutes base
      const stagger = supportedTokens.indexOf(id.toLowerCase()) * 10000; // 10 second stagger
      const interval = setInterval(fetchPrice, baseInterval + stagger);
      return () => clearInterval(interval);
    }
  }, [id, fetchPrice, isInView]);

  const roiNum = parseFloat(roi);
  const roiColorClass = !isNaN(roiNum) 
    ? roiNum < 0 ? "text-red-500" : "text-green-500"
    : "";

  const investNum = parseFloat(investment.replace(/\$/g, ""));
  const investColorClass = !isNaN(investNum)
    ? investNum < 1000 ? "investment-negative" : "investment-positive"
    : "";

  // Different layouts based on view mode
  if (viewMode === 'list') {
    return (
      <div style={style}>
      <Link 
        ref={cardRef}
        to={`/${id}`}
        aria-label={`View details for ${name}`}
        className="grid-item flex items-center p-4 sm:p-6 bg-black/30 rounded-lg group transition-transform duration-200 will-change-transform hover:scale-[1.01]"
      >
        <img 
          ref={imageRef}
          src={isInView ? getTokenImageSrc(id) : undefined}
          alt={`${name} Logo`}
          className={`token-logo w-12 h-12 rounded-full mr-4 transition-all duration-300 will-change-transform ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${imageError ? 'bg-gray-700' : ''}`}
          loading="lazy"
          decoding="async"
        />
        
        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full bg-gray-700/50 animate-pulse mr-4 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-[#00ffee]/30"></div>
          </div>
        )}
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-[#cfd0d1] font-orbitron">{name}</h3>
            <span className={`badge ${
              currentStatus === 'Live (Vested)' ? 'badge-live-vested' :
              isLaunchingSoon ? 'badge-launch-soon' :
              `badge-${currentStatus.toLowerCase().replace(' ', '-')}`
            } mt-1 inline-block text-xs`}>
              {currentStatus === 'Live (Vested)' ? 'Live (Vested)' :
               isLaunchingSoon ? 'Launching Soon' :
               currentStatus}
            </span>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-400">Price</div>
            <div className={`font-semibold ${isUpdating ? 'price-update' : ''}`}>{currentPrice}</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-400">ROI</div>
            <div className={`font-semibold ${roiColorClass} ${isUpdating ? 'price-update' : ''}`}>{roi}</div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-400">$1K Value</div>
            <div className={`font-semibold ${investColorClass} ${isUpdating ? 'price-update' : ''}`}>{investment}</div>
          </div>
          
          <div className="text-right">
            <ArrowUpRight className="w-5 h-5 text-[#00ffee] opacity-0 transform translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-110 ml-auto" />
          </div>
        </div>
      </Link>
      </div>
    );
  }

  if (viewMode === 'compact') {
    return (
      <div style={style}>
      <Link 
        ref={cardRef}
        to={`/${id}`}
        aria-label={`View details for ${name}`}
        className="grid-item flex flex-col p-3 bg-black/30 rounded-lg group transition-transform duration-200 will-change-transform hover:scale-[1.02]"
      >
        <div className="flex items-center mb-2">
          <img 
            src={getTokenImageSrc(id)}
            alt={`${name} Logo`}
            className="token-logo w-8 h-8 rounded-full mr-2 transition-opacity duration-200"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              const fallback = getTokenFallbackSrc(id);
              if (fallback) {
                target.src = fallback;
                target.onError = () => {
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiMwMGZmZWUiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNiIgaGVpZ2h0PSIyNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIvPgo8cGF0aCBkPSJtMyA5IDktOSA5IDltLTkgOXY5Ci8+Cjwvc3ZnPgo8L3N2Zz4K';
                };
              } else {
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiMwMGZmZWUiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNiIgaGVpZ2h0PSIyNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIvPgo8cGF0aCBkPSJtMyA5IDktOSA5IDltLTkgOXY5Ci8+Cjwvc3ZnPgo8L3N2Zz4K';
              }
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[#cfd0d1] truncate">{name}</div>
            <span className={`badge ${
              currentStatus === 'Live (Vested)' ? 'badge-live-vested' :
              isLaunchingSoon ? 'badge-launch-soon' :
              `badge-${currentStatus.toLowerCase().replace(' ', '-')}`
            } text-xs`}>
              {currentStatus === 'Live (Vested)' ? 'Live (Vested)' :
               isLaunchingSoon ? 'Launching Soon' :
               currentStatus}
            </span>
          </div>
        </div>
        
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">ROI:</span>
            <span className={`${roiColorClass} ${isUpdating ? 'price-update' : ''} font-semibold`}>{roi}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Price:</span>
            <span className={`${isUpdating ? 'price-update' : ''}`}>{currentPrice}</span>
          </div>
        </div>
      </Link>
      </div>
    );
  }

  // Default grid view
  if (error) {
    return (
      <div style={style}>
      <div className="grid-item flex flex-col items-center p-4 sm:p-6 bg-black/30 rounded-lg">
        <p className="text-red-400">{error}</p>
      </div>
      </div>
    );
  }

  return (
    <div style={style}>
    <Link 
      ref={cardRef}
      to={`/${id}`}
      aria-label={`View details for ${name}`}
      className="grid-item flex flex-col items-center p-4 sm:p-6 bg-black/30 rounded-lg group transition-transform duration-200 will-change-transform hover:scale-[1.02]"
    >
      <div className="flex items-center mb-4 relative w-full">
        <img 
          ref={imageRef}
          src={isInView ? getTokenImageSrc(id) : undefined}
          alt={`${name} Logo`}
          className={`token-logo w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] rounded-full mr-3 transition-all duration-300 will-change-transform ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          } ${imageError ? 'bg-gray-700' : ''}`}
          loading="lazy"
          decoding="async"
        />
        
        {/* Loading placeholder for grid view */}
        {!imageLoaded && (
          <div className="absolute top-0 left-0 w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] rounded-full bg-gray-700/50 animate-pulse mr-3 flex items-center justify-center">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#00ffee]/30"></div>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <span className="text-lg sm:text-xl font-semibold text-[#cfd0d1] block truncate font-orbitron">
            {name} ({id.toUpperCase()})
          </span>
          <span className={`badge ${
            currentStatus === 'Live (Vested)' ? 'badge-live-vested' :
            isLaunchingSoon ? 'badge-launch-soon' :
            `badge-${currentStatus.toLowerCase().replace(' ', '-')}`
          } mt-1 inline-block text-xs sm:text-sm`}>
            {currentStatus === 'Live (Vested)' ? 'Live (Vested)' :
             isLaunchingSoon ? 'Launching Soon' :
             currentStatus}
          </span>
        </div>
        <ArrowUpRight className="w-5 h-5 text-[#00ffee] opacity-0 transform translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:scale-110" />
      </div>

      <div className="w-full space-y-2 sm:space-y-3">
        <div className="data-row">
          <span className="data-label">Seed Price:</span>
          <span>{seedPrice}</span>
        </div>
        <div className="data-row">
          <span className="data-label">Current Price:</span>
          <span className={`${isUpdating ? 'price-update' : ''} ${isLoading ? 'animate-pulse' : ''} transition-all duration-300`}>
            {currentPrice}
          </span>
        </div>
        <div className="data-row">
          <span className="data-label">ROI:</span>
          <span className={`${roiColorClass} ${isUpdating ? 'price-update' : ''} ${isLoading ? 'animate-pulse' : ''} transition-all duration-300 font-semibold`}>
            {roi}
          </span>
        </div>
        <div className="data-row">
          <span className="data-label">$1000 Investment:</span>
          <span className={`${investColorClass} ${isUpdating ? 'price-update' : ''} ${isLoading ? 'animate-pulse' : ''} transition-all duration-300 font-semibold`}>
            {investment}
          </span>
        </div>
      </div>

      {saleData && (
        <div className="mt-4 w-full pt-4 border-t border-[#00ffee]/10 transition-all duration-300 group-hover:border-[#00ffee]/20">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyber-primary transition-all duration-300 group-hover:scale-110" />
                <span className="text-gray-400">Investors:</span>
              </div>
              <span>{formatNumber(saleData.participants)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-cyber-primary transition-all duration-300 group-hover:scale-110" />
                <span className="text-gray-400">Invested:</span>
              </div>
              <span>{formatUSDC(saleData.fundsRaisedUSDC)}</span>
            </div>
          </div>
        </div>
      )}

      {currentVestingEnd && (
        <div className="mt-4 w-full">
          <div className="flex justify-between items-center text-sm sm:text-base">
            <div className="flex flex-col gap-1 w-full">
              <span className="text-gray-400">Vesting:</span>
              <span className={`${currentVestingEnd.toLowerCase() === "tbd" ? "vesting-badge" : "no-vesting-badge"} text-xs transition-all duration-300`}>
                {currentVestingEnd}
              </span>
              {currentLaunchDate && /^\d{4}-\d{2}-\d{2}/.test(currentLaunchDate) && (
                <VestingTimer 
                  startDate={launchDate} 
                  vestingPeriod={currentVestingEnd}
                  onStatusChange={(started, completed) => {
                    if (started && currentStatus === 'Pending TGE') {
                      setCurrentStatus(completed ? 'Live' : 'Live (Vested)');
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Link>
    </div>
  );
});

export default TokenCard;
export { TokenCard };