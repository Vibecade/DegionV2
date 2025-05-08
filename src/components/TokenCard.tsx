import { Link } from 'react-router-dom';
import { Token } from '../types';
import { useEffect, useState } from 'react';
import { getFuelPrice, getSilencioPrice } from '../services/tokenPrices';
import { getTokenInfo } from '../services/tokenInfo';
import { ArrowUpRight, Users, Wallet } from 'lucide-react';
import { salesData } from '../data/sales';
import { formatUSDC, formatNumber } from '../utils/formatters';

interface TokenCardProps {
  token: Token;
}

export const TokenCard = ({ token }: TokenCardProps) => {
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

  const [currentPrice, setCurrentPrice] = useState(initialPrice);
  const [roi, setRoi] = useState(initialRoi);
  const [investment, setInvestment] = useState(initialInvestment);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [currentLaunchDate, setCurrentLaunchDate] = useState(launchDate);
  const [currentVestingEnd, setCurrentVestingEnd] = useState(vestingEnd);

  const saleData = salesData.find(sale => sale.name.toLowerCase() === name.toLowerCase());

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
        console.error(`Error fetching ${id} info:`, error);
      }
    };

    fetchTokenInfo();
  }, [id]);

  // Get live price data for tokens that are trading
  useEffect(() => {
    if (id.toLowerCase() === 'fuel' || id.toLowerCase() === 'silencio') {
      const fetchPrice = async () => {
        setIsLoading(true);
        try {
          const data = id.toLowerCase() === 'fuel' 
            ? await getFuelPrice()
            : await getSilencioPrice();
          
          setIsUpdating(true);
          setCurrentPrice(`$${data.current_price.toFixed(6)}`);
          const seedPriceNum = parseFloat(seedPrice.replace('$', ''));
          const roiValue = ((data.current_price - seedPriceNum) / seedPriceNum) * 100;
          setRoi(`${roiValue.toFixed(2)}%`);
          setInvestment(`$${data.roi_value.toFixed(2)}`);
          setTimeout(() => setIsUpdating(false), 500);
        } catch (error) {
          console.error(`Error fetching ${id} price:`, error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPrice();
      const interval = setInterval(fetchPrice, 30000);
      return () => clearInterval(interval);
    }
  }, [id, seedPrice]);

  const roiNum = parseFloat(roi);
  const roiColorClass = !isNaN(roiNum) 
    ? roiNum < 0 ? "text-red-500" : "text-green-500"
    : "";

  const investNum = parseFloat(investment.replace(/\$/g, ""));
  const investColorClass = !isNaN(investNum)
    ? investNum < 1000 ? "investment-negative" : "investment-positive"
    : "";

  return (
    <Link 
      to={`/${id}`}
      className="grid-item flex flex-col items-center p-4 sm:p-6 bg-black/30 rounded-lg group"
    >
      <div className="flex items-center mb-4 relative w-full">
        <img 
          src={`https://sadpepedev.github.io/TheLegionProject/images/logos/${id.toLowerCase()}.png`}
          alt={`${name} Logo`}
          className="token-logo w-[40px] h-[40px] sm:w-[50px] sm:h-[50px] rounded-full mr-3"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = 'https://sadpepedev.github.io/TheLegionProject/images/logos/placeholder.png';
          }}
        />
        <div className="flex-1 min-w-0">
          <span className="text-lg sm:text-xl font-semibold text-[#cfd0d1] block truncate font-orbitron">
            {name} ({id.toUpperCase()})
          </span>
          <span className={`badge badge-${currentStatus.toLowerCase().replace(' ', '-')} mt-1 inline-block text-xs sm:text-sm`}>
            {currentStatus}
          </span>
        </div>
        <ArrowUpRight className="w-5 h-5 text-[#00ffee] opacity-0 transform translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
      </div>

      <div className="w-full space-y-2 sm:space-y-3">
        <div className="data-row">
          <span className="data-label">Seed Price:</span>
          <span>{seedPrice}</span>
        </div>
        <div className="data-row">
          <span className="data-label">Current Price:</span>
          <span className={`${isUpdating ? 'price-update' : ''} ${isLoading ? 'animate-pulse' : ''}`}>
            {currentPrice}
          </span>
        </div>
        <div className="data-row">
          <span className="data-label">ROI:</span>
          <span className={`${roiColorClass} ${isUpdating ? 'price-update' : ''} ${isLoading ? 'animate-pulse' : ''}`}>
            {roi}
          </span>
        </div>
        <div className="data-row">
          <span className="data-label">$1000 Investment:</span>
          <span className={`${investColorClass} ${isUpdating ? 'price-update' : ''} ${isLoading ? 'animate-pulse' : ''}`}>
            {investment}
          </span>
        </div>
      </div>

      {saleData && (
        <div className="mt-4 w-full pt-4 border-t border-[#00ffee]/10">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00ffee]" />
                <span className="text-gray-400">Investors:</span>
              </div>
              <span>{formatNumber(saleData.participants)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#00ffee]" />
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
            <span className="text-gray-400">Vesting:</span>
            <span className={currentVestingEnd.toLowerCase() === "tbd" ? "vesting-badge" : "no-vesting-badge"}>
              {currentVestingEnd}
            </span>
          </div>
        </div>
      )}
    </Link>
  );
};