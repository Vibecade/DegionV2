import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface VestingTimerProps { 
  startDate: string;
  vestingPeriod: string;
  onStatusChange?: (isStarted: boolean) => void;
}

export const VestingTimer = ({ startDate, vestingPeriod, onStatusChange }: VestingTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isStarted, setIsStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const start = new Date(startDate).getTime();
      const now = new Date().getTime();
      const vestingMatch = vestingPeriod.match(/(\d+)\s*months?/i);
      const initialUnlock = vestingPeriod.match(/(\d+)%\s*at\s*TGE/i);
      const wasStarted = isStarted;
      const wasComplete = isComplete;
      
      // Check if vesting has started
      if (now < start) {
        setIsStarted(false);
        setIsComplete(false);
        if (wasStarted !== false && onStatusChange) {
          onStatusChange(false);
        }
        const difference = start - now;
        
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        // Format with leading zeros for hours and minutes
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        setTimeLeft(`Starts in ${days}d ${formattedHours}h ${formattedMinutes}m`);
        return;
      }

      setIsStarted(true);
      if (wasStarted !== true && onStatusChange) {
        onStatusChange(true);
      }
      
      // Handle different vesting formats
      if (!vestingMatch && !initialUnlock) {
        setTimeLeft('Invalid vesting period');
        return;
      }

      const vestingMonths = vestingMatch ? parseInt(vestingMatch[1]) : 0;
      const end = new Date(start);
      end.setMonth(end.getMonth() + vestingMonths);
      
      if (now >= end.getTime()) {
        setTimeLeft('Vesting Complete');
        setIsComplete(true);
        if (!wasComplete && onStatusChange) {
          onStatusChange(true, true);
        }
        return;
      }

      const difference = end.getTime() - now;
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      // Format with leading zeros
      const formattedHours = hours.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      
      if (initialUnlock) {
        const unlockPercent = parseInt(initialUnlock[1]);
        setTimeLeft(`${100 - unlockPercent}% unlocking: ${days}d ${formattedHours}h ${formattedMinutes}m`);
      } else {
        setTimeLeft(`${days}d ${formattedHours}h ${formattedMinutes}m remaining`);
      }
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