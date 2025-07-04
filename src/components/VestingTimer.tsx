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
      
      // Parse vesting period - handle new database format
      const vestingMatch = vestingPeriod.match(/(\d+)[-\s]*month/i);
      const initialUnlock = vestingPeriod.match(/(\d+)%\s*at\s*TGE/i);
      const lockupMatch = vestingPeriod.match(/(\d+)[-\s]*month\s*lockup/i);
      const cliffMatch = vestingPeriod.match(/(\d+)[-\s]*month\s*cliff/i);
      const linearMatch = vestingPeriod.match(/(\d+)[-\s]*month\s*linear/i);
      
      // Set initial unlock percentage
      if (initialUnlock) {
        const unlockPercent = parseInt(initialUnlock[1]);
        setInitialUnlockPercent(unlockPercent);
      } else if (vestingPeriod.includes('100% at TGE')) {
        setInitialUnlockPercent(100);
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
      
      // Handle different vesting formats from database
      let vestingMonths = 0;
      let lockupMonths = 0;
      
      // Parse lockup period
      if (lockupMatch) {
        lockupMonths = parseInt(lockupMatch[1]);
      } else if (cliffMatch) {
        lockupMonths = parseInt(cliffMatch[1]);
      }
      
      // Parse vesting period
      if (linearMatch) {
        vestingMonths = parseInt(linearMatch[1]);
      } else if (vestingMatch) {
        vestingMonths = parseInt(vestingMatch[1]);
      }
      
      // Handle "100% at TGE" case
      if (vestingPeriod.includes('100% at TGE') || initialUnlockPercent === 100) {
        setTimeLeft('Vesting Complete');
        setVestingProgress(100);
        setIsComplete(true);
        if (!wasComplete && onStatusChange) {
          onStatusChange(true, true);
        }
        return;
      }
      
      // Calculate vesting timeline
      const lockupEnd = new Date(startTime);
      lockupEnd.setMonth(lockupEnd.getMonth() + lockupMonths);
      
      const vestingEnd = new Date(lockupEnd.getTime());
      vestingEnd.setMonth(vestingEnd.getMonth() + vestingMonths);
      
      // Calculate progress
      if (lockupMonths > 0 && now < lockupEnd.getTime()) {
        // Still in lockup period
        const lockupProgress = (now - startTime) / (lockupEnd.getTime() - startTime);
        setVestingProgress(initialUnlockPercent);
        
        const difference = lockupEnd.getTime() - now;
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        setTimeLeft(`Lockup ends in ${days}d ${formattedHours}h ${formattedMinutes}m`);
        return;
      }
      
      // In vesting period
      if (vestingMonths > 0 && now < vestingEnd.getTime()) {
        const vestingStart = lockupMonths > 0 ? lockupEnd.getTime() : startTime;
        const vestingDuration = vestingEnd.getTime() - vestingStart;
        const vestingElapsed = now - vestingStart;
        
        const remainingPercent = 100 - initialUnlockPercent;
        const vestingProgress = (vestingElapsed / vestingDuration) * remainingPercent;
        setVestingProgress(Math.min(100, initialUnlockPercent + vestingProgress));
        
        const difference = vestingEnd.getTime() - now;
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        setTimeLeft(`${days}d ${formattedHours}h ${formattedMinutes}m remaining`);
        return;
      }
      
      // Vesting complete
      setTimeLeft('Vesting Complete');
      setVestingProgress(100);
      setIsComplete(true);
      if (!wasComplete && onStatusChange) {
        onStatusChange(true, true);
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