import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';

interface VestingTimerProps { 
  startDate: string;
  vestingPeriod: string;
  onStatusChange?: (isStarted: boolean, completed?: boolean) => void;
}

export const VestingTimer = ({ startDate, vestingPeriod, onStatusChange }: VestingTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isStarted, setIsStarted] = useState(false);
  const [vestingProgress, setVestingProgress] = useState(0);
  const [initialUnlockPercent, setInitialUnlockPercent] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const start = new Date(startDate).getTime();
      const now = new Date().getTime();
      const vestingMatch = vestingPeriod.match(/(\d+)\s*months?/i);
      const initialUnlock = vestingPeriod.match(/(\d+)%\s*at\s*TGE/i);
      
      // Set initial unlock percentage
      if (initialUnlock && !isStarted) {
        setInitialUnlockPercent(parseInt(initialUnlock[1]));
        setVestingProgress(parseInt(initialUnlock[1]));
      }
      
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
      
      // Calculate vesting progress
      const totalDuration = end.getTime() - start;
      const elapsed = now - start;
      let progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      
      // If there's an initial unlock, adjust the progress calculation
      if (initialUnlockPercent > 0) {
        const remainingPercent = 100 - initialUnlockPercent;
        const adjustedProgress = Math.max(
          initialUnlockPercent,
          initialUnlockPercent + (remainingPercent * (progress / 100))
        );
        setVestingProgress(adjustedProgress);
      } else {
        setVestingProgress(progress);
      }
      
      if (now >= end.getTime()) {
        setTimeLeft('Vesting Complete');
        setVestingProgress(100);
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

  const progressBarStyle = {
    background: `linear-gradient(to right, 
      rgba(0, 255, 238, 0.3) 0%,
      rgba(0, 255, 238, 0.5) ${vestingProgress}%, 
      rgba(0, 255, 238, 0.1) ${vestingProgress}%,
      rgba(0, 255, 238, 0.1) 100%)`
  };

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 text-sm ${
        isStarted ? 'text-orange-400' : 'text-blue-400'
      } mb-1`}>
        <Timer className="w-4 h-4" />
        <span>{timeLeft}</span>
      </div>
      {isStarted && !timeLeft.includes('Complete') && (
        <div className="relative w-full h-4 bg-[rgba(0,255,238,0.1)] rounded-full overflow-hidden backdrop-blur-sm border border-[rgba(0,255,238,0.2)]">
          <div 
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
            style={progressBarStyle}
          />
          {initialUnlockPercent > 0 && (
            <div 
              className="absolute top-0 h-full w-[2px] bg-[rgba(0,255,238,0.8)] shadow-[0_0_10px_rgba(0,255,238,0.8)] z-10"
              style={{ left: `${initialUnlockPercent}%` }}
            >
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-[10px] text-[#00ffee] font-semibold">
                {initialUnlockPercent}%
              </div>
            </div>
          )}
          <div className="absolute top-1/2 right-2 transform -translate-y-1/2 text-[10px] text-[#00ffee] font-semibold">
            {Math.round(vestingProgress)}%
          </div>
        </div>
      )}
    </div>
  );
};