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
      // Handle different date formats
      let startTime;
      if (startDate.includes('T') || startDate.includes('Z')) {
        // ISO format
        startTime = new Date(startDate).getTime();
      } else if (startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format - treat as UTC
        startTime = new Date(startDate + 'T00:00:00Z').getTime();
      } else {
        // Other formats
        startTime = new Date(startDate).getTime();
      }
      
      const now = new Date().getTime();
      const vestingMatch = vestingPeriod.match(/(\d+)\s*months?/i);
      const initialUnlock = vestingPeriod.match(/(\d+)%\s*at\s*TGE/i);
      
      // Set initial unlock percentage
      if (initialUnlock) {
        const unlockPercent = parseInt(initialUnlock[1]);
        setInitialUnlockPercent(unlockPercent);
      }
      
      const wasStarted = isStarted;
      const wasComplete = isComplete;
      
      // Check if vesting has started
      if (now < startTime) {
        setIsStarted(false);
        setIsComplete(false);
        if (wasStarted !== false && onStatusChange) {
          onStatusChange(false);
        }
        const difference = startTime - now;
        
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
      // Check for "linearly over X months" pattern
      const linearVestingMatch = vestingPeriod.match(/(\d+)%.*?linearly\s+over\s+(\d+)\s*months?/i);
      
      if (!vestingMatch && !initialUnlock && !linearVestingMatch) {
        setTimeLeft('Invalid vesting period');
        return;
      }

      // Determine vesting duration
      let vestingMonths = 0;
      if (linearVestingMatch) {
        vestingMonths = parseInt(linearVestingMatch[2]); // Get months from "linearly over X months"
      } else if (vestingMatch) {
        vestingMonths = parseInt(vestingMatch[1]);
      }
      
      const end = new Date(startTime);
      end.setMonth(end.getMonth() + vestingMonths);
      
      // Calculate vesting progress
      const totalDuration = end.getTime() - startTime;
      const elapsed = now - startTime;
      
      // If there's an initial unlock, adjust the progress calculation
      if (initialUnlockPercent > 0) {
        if (vestingMonths > 0) {
          const remainingPercent = 100 - initialUnlockPercent;
          const vestingProgress = (elapsed / totalDuration) * remainingPercent;
          setVestingProgress(Math.min(100, initialUnlockPercent + vestingProgress));
        } else {
          // If no vesting period, just show initial unlock
          setVestingProgress(initialUnlockPercent);
        }
      } else {
        const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        setVestingProgress(progress);
      }

      // Check if vesting is complete
      if (vestingMonths > 0 && now >= end.getTime()) {
        setTimeLeft('Vesting Complete');
        setVestingProgress(100);
        setIsComplete(true);
        if (!wasComplete && onStatusChange) {
          onStatusChange(true, true);
        }
        return;
      } else if (vestingMonths === 0 && initialUnlockPercent === 100) {
        // 100% at TGE case
        setTimeLeft('Vesting Complete');
        setVestingProgress(100);
        setIsComplete(true);
        if (!wasComplete && onStatusChange) {
          onStatusChange(true, true);
        }
        return;
      }

      // Show remaining time if there's still vesting
      if (vestingMonths > 0) {
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
      } else {
        // No vesting period, just show that initial unlock is available
        if (initialUnlockPercent > 0) {
          setTimeLeft(`${initialUnlockPercent}% unlocked at TGE`);
        }
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [startDate, vestingPeriod, isStarted, isComplete, onStatusChange]);

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
        <div className="relative w-full h-5 bg-[rgba(0,255,238,0.1)] rounded-full overflow-hidden backdrop-blur-sm border border-[rgba(0,255,238,0.2)]">
          <div 
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
            style={progressBarStyle}
          />
          {initialUnlockPercent > 0 && (
            <div 
              className="absolute top-0 h-full w-[2px] bg-[rgba(0,255,238,1)] shadow-[0_0_20px_rgba(0,255,238,1)] z-10"
              style={{ left: `${initialUnlockPercent}%` }}
            >
              <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-[#00ffee] font-bold">
                {initialUnlockPercent}%
              </div>
            </div>
          )}
          <div className="absolute top-1/2 right-2 transform -translate-y-1/2 text-xs text-[#00ffee] font-bold">
            {Math.round(vestingProgress)}%
          </div>
        </div>
      )}
    </div>
  );
};