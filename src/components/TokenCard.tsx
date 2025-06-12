import { Link } from 'react-router-dom';
import { Token } from '../types';
import { logError } from '../utils/errorLogger';
import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { getFuelPrice, getSilencioPrice, getCornPrice, getGizaPrice, getSkatePrice, getResolvPrice } from '../services/tokenPrices';
import { fetchTokenHolders, fetchTradingVolume } from '../services/duneApi';
import { getTokenInfo } from '../services/tokenInfo';
import { ArrowUpRight, Users, Wallet, LineChart, TrendingUp, Info } from 'lucide-react';
import { salesData } from '../data/sales';
import { formatUSDC, formatNumber } from '../utils/formatters';
import { VestingTimer } from './VestingTimer';

interface TokenCardProps {
  token: Token;
  viewMode?: 'grid' | 'list' | 'compact';
}

const TokenCard = memo(({ token, viewMode = 'grid' }: TokenCardProps) => {
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
    const fetchTokenInfo = async () => {
      try {
        const tokenInfo = await getTokenInfo(id);
        if (tokenInfo) {
          if (tokenInfo.status) setCurrentStatus(tokenInfo.status);
          if (tokenInfo.launchDate) setCurrentLaunchDate(tokenInfo.launchDate);
          if (tokenInfo.vestingEnd) setCurrentVestingEnd(tokenInfo.vestingEnd);
        }
      } catch (error) {
        handleError(error as Error, 'loadData');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenInfo();
  }, [id]);

  // Fetch Dune Analytics data
  useEffect(() => {
    if (saleData?.address) {
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
    }
  }, [id, saleData]);

  // Get live price data for tokens that are trading
  const fetchPrice = useCallback(async () => {
    if (!['fuel', 'silencio', 'corn', 'giza', 'skate', 'resolv'].includes(id.toLowerCase())) {
      return;
    }
    
    setIsLoading(true);
    try {
      const data = await (async () => {
        switch (id.toLowerCase()) {
          case 'fuel': return await getFuelPrice();
          case 'silencio': return await getSilencioPrice();
          case 'corn': return await getCornPrice();
          case 'giza': return await getGizaPrice();
          case 'skate': return await getSkatePrice();
          case 'resolv': return await getResolvPrice();
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
      // Silently handle price fetch errors - fallback prices will be used
      console.warn(`Price fetch failed for ${id}, using fallback`);
    } finally {
      setIsLoading(false);
    }
  }, [id, seedPrice]);

  useEffect(() => {
    if (['fuel', 'silencio', 'corn', 'giza', 'skate', 'resolv'].includes(id.toLowerCase())) {
      fetchPrice();
      const interval = setInterval(fetchPrice, 60000); // Reduced frequency
      return () => clearInterval(interval);
    }
  }, [id, fetchPrice]);

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
      <Link 
        to={`/${id}`}
        aria-label={`View details for ${name}`}
        className="grid-item flex items-center p-4 sm:p-6 bg-black/30 rounded-lg group transition-all duration-300 hover:scale-[1.01]"
      >
        <img 
          src={(() => {
            const tokenId = id.toLowerCase();
            if (tokenId === 'fragmetric') {
              return 'https://raw.githubusercontent.com/Sadpepedev/TheLegionProject/main/images/logos/Fragmetric.png';
            } else if (tokenId === 'arcium') {
              return `https://sadpepedev.github.io/TheLegionProject/images/logos/${tokenId}.png`;
            } else {
              return `https://sadpepedev.github.io/TheLegionProject/images/logos/${tokenId}.png`;
            }
          })()}
          alt={`${name} Logo`}
          className="token-logo w-12 h-12 rounded-full mr-4 transition-all duration-300"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            if (id.toLowerCase() === 'arcium') {
              target.src = '/ca6520f2-0b43-465d-bd4d-2d6c45de2f70.jpg';
              target.onError = () => {
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiMwMGZmZWUiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNiIgaGVpZ2h0PSIyNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIvPgo8cGF0aCBkPSJtMyA5IDktOSA5IDltLTkgOXY5Ci8+Cjwvc3ZnPgo8L3N2Zz4K';
              };
            } else {
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiMwMGZmZWUiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNiIgaGVpZ2h0PSIyNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIvPgo8cGF0aCBkPSJtMyA5IDktOSA5IDltLTkgOXY5Ci8+Cjwvc3ZnPgo8L3N2Zz4K';
            }
          }}
        />
        
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
    );
  }

  if (viewMode === 'compact') {
    return (
      <Link 
        to={`/${id}`}
        aria-label={`View details for ${name}`}
        className="grid-item flex flex-col p-3 bg-black/30 rounded-lg group transition-all duration-300 hover:scale-[1.02]"
      >
        <div className="flex items-center mb-2">
          <img 
            src={(() => {
              const tokenId = id.toLowerCase();
              if (tokenId === 'fragmetric') {
                return 'https://raw.githubusercontent.com/Sadpepedev/TheLegionProject/main/images/logos/Fragmetric.png';
              } else if (tokenId === 'arcium') {
                return `https://sadpepedev.github.io/TheLegionProject/images/logos/${tokenId}.png`;
              } else {
                return `https://sadpepedev.github.io/TheLegionProject/images/logos/${tokenId}.png`;
              }
            })()}
            alt={`${name} Logo`}
            className="token-logo w-8 h-8 rounded-full mr-2"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              if (id.toLowerCase() === 'arcium') {
                target.src = '/ca6520f2-0b43-465d-bd4d-2d6c45de2f70.jpg';
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
    );
  }

  // Default grid view
  if (error) {
    return (
      <div className="grid-item flex flex-col items-center p-4 sm:p-6 bg-black/30 rounded-lg">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <Link 
      to={`/${id}`}
      aria-label={`View details for ${name}`}
      className="grid-item flex flex-col items-center p-4 sm:p-6 bg-black/30 rounded-lg group transition-all duration-300 hover:scale-[1.02]"
    >
      <div className="flex items-center mb-4 relative w-full">
        <img 
          src={(() => {
            const tokenId = id.toLowerCase();
            if (tokenId === 'fragmetric') {
              return 'https://raw.githubusercontent.com/Sadpepedev/TheLegionProject/main/images/logos/Fragmetric.png';
            } else if (tokenId === 'arcium') {
              // Try the standard path first, then fallback will handle it
              return `https://sadpepedev.github.io/TheLegionProject/images/logos/${tokenId}.png`;
            } else {
              return `https://sadpepedev.github.io/TheLegionProject/images/logos/${tokenId}.png`;
            }
          })()}
          alt={`${name} Logo`}
          className="token-logo w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] rounded-full mr-3 transition-all duration-300"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            // For Arcium specifically, try the downloaded image first
            if (id.toLowerCase() === 'arcium') {
              target.src = '/ca6520f2-0b43-465d-bd4d-2d6c45de2f70.jpg';
              target.onError = () => {
                // Final fallback to generic crypto logo
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiMwMGZmZWUiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNiIgaGVpZ2h0PSIyNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIvPgo8cGF0aCBkPSJtMyA5IDktOSA5IDltLTkgOXY5Ii8+Cjwvc3ZnPgo8L3N2Zz4K';
              };
            } else {
              // Generic fallback for other tokens
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjUiIGN5PSIyNSIgcj0iMjUiIGZpbGw9IiMwMGZmZWUiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNiIgaGVpZ2h0PSIyNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIvPgo8cGF0aCBkPSJtMyA5IDktOSA5IDltLTkgOXY5Ii8+Cjwvc3ZnPgo8L3N2Zz4K';
            }
          }}
        />
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
  );
});

export default TokenCard;

export { TokenCard }

export { TokenCard }