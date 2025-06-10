import React, { useEffect, useState } from 'react';
import { memoryMonitor } from '../utils/performance';

interface PerformanceMetrics {
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [showMonitor, setShowMonitor] = useState(false);

  useEffect(() => {
    // Only show in development
    if (import.meta.env.DEV) {
      const startTime = performance.now();
      
      const updateMetrics = () => {
        const memory = memoryMonitor.getMemoryInfo();
        const loadTime = performance.now() - startTime;
        
        setMetrics({
          memoryUsage: memory ? Math.round(memory.usedJSHeapSize / 1048576) : 0,
          loadTime: Math.round(loadTime),
          renderTime: Math.round(performance.now())
        });
      };

      updateMetrics();
      const interval = setInterval(updateMetrics, 5000);

      // Show monitor with keyboard shortcut
      const handleKeyPress = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
          setShowMonitor(!showMonitor);
        }
      };

      window.addEventListener('keydown', handleKeyPress);

      return () => {
        clearInterval(interval);
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [showMonitor]);

  if (!import.meta.env.DEV || !showMonitor || !metrics) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/80 backdrop-blur-sm border border-[#00ffee]/30 rounded-lg p-3 text-xs font-mono">
      <div className="text-[#00ffee] font-semibold mb-2">Performance Monitor</div>
      <div className="space-y-1 text-gray-300">
        <div>Memory: {metrics.memoryUsage} MB</div>
        <div>Load: {metrics.loadTime} ms</div>
        <div>Render: {metrics.renderTime} ms</div>
      </div>
      <div className="text-gray-500 mt-2 text-xs">
        Ctrl+Shift+P to toggle
      </div>
    </div>
  );
};