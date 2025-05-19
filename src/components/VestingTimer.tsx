import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface VestingTimerProps {
  startDate: string;
  vestingPeriod: string;
}

export const VestingTimer = ({ startDate, vestingPeriod }: VestingTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const start = new Date(startDate).getTime();
      const now = new Date().getTime();
      
      // Check if vesting has started
      if (now < start) {
        setIsStarted(false);
        const difference = start - now;
        
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeLeft(`Starts in ${days}d ${hours}h ${minutes}m`);
        return;
      }

      setIsStarted(true);
      
      // Parse vesting period (e.g., "24 months", "12 months")
      const monthsMatch = vestingPeriod.match(/(\d+)\s*months?/i);
      if (!monthsMatch) {
        setTimeLeft('Invalid vesting period');
        return;
      }

      const vestingMonths = parseInt(monthsMatch[1]);
      const end = new Date(start);
      end.setMonth(end.getMonth() + vestingMonths);
      
      if (now >= end.getTime()) {
        setTimeLeft('Vesting Complete');
        return;
      }

      const difference = end.getTime() - now;
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${days}d ${hours}h ${minutes}m remaining`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [startDate, vestingPeriod]);

  return (
    <div className={`flex items-center gap-2 text-sm ${
      isStarted ? 'text-orange-400' : 'text-blue-400'
    }`}>
      <Timer className="w-4 h-4" />
      <span>{timeLeft}</span>
    </div>
  );
};