import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceChangeIndicatorProps {
  currentPrice: string;
  previousPrice?: string;
  className?: string;
}

export const PriceChangeIndicator: React.FC<PriceChangeIndicatorProps> = ({
  currentPrice,
  previousPrice,
  className = ''
}) => {
  const [change, setChange] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (!previousPrice || currentPrice === '--' || previousPrice === '--') return;

    const current = parseFloat(currentPrice.replace('$', ''));
    const previous = parseFloat(previousPrice.replace('$', ''));

    if (current > previous) {
      setChange('up');
    } else if (current < previous) {
      setChange('down');
    } else {
      setChange('neutral');
    }

    // Trigger animation
    setShowAnimation(true);
    const timer = setTimeout(() => setShowAnimation(false), 2000);
    return () => clearTimeout(timer);
  }, [currentPrice, previousPrice]);

  const getIcon = () => {
    switch (change) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getColorClass = () => {
    switch (change) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${getColorClass()} ${className}`}>
      <span className={`transition-all duration-300 ${showAnimation ? 'scale-125' : 'scale-100'}`}>
        {getIcon()}
      </span>
      {showAnimation && (
        <span className="text-xs animate-pulse">
          {change === 'up' ? '+' : change === 'down' ? '-' : ''}
        </span>
      )}
    </div>
  );
};