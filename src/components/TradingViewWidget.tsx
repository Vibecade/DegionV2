import React, { useEffect, useRef, memo, useState, useCallback } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
}

function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadWidget = useCallback(() => {
    if (!container.current || !symbol || isLoaded) return;

    const scriptId = `tradingview-widget-${symbol}`;
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    try {
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
        script.type = "text/javascript";
        script.async = true;
        script.defer = true;
      }

      const config = {
        autosize: true,
        symbol: symbol,
        interval: "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        enable_publishing: false,
        allow_symbol_change: false,
        calendar: false,
        support_host: "https://www.tradingview.com",
        hide_top_toolbar: true,
        hide_side_toolbar: true,
        save_image: false,
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        gridColor: "rgba(0, 255, 238, 0.1)",
        disabled_features: [
          "header_widget",
          "left_toolbar",
          "timeline_marks",
          "control_bar",
          "border_around_the_chart",
          "popup_hints"
        ]
      };

      script.innerHTML = JSON.stringify(config);

      // Create a new container for the widget
      const widgetContainer = document.createElement('div');
      widgetContainer.className = 'tradingview-widget-container__widget h-[calc(100%-32px)] w-full';
      
      // Clear existing content
      if (container.current) {
        container.current.innerHTML = '';
        container.current.appendChild(widgetContainer);
        container.current.appendChild(script);
      }

      script.onload = () => setIsLoaded(true);
      script.onerror = () => {
        setError('Failed to load TradingView chart');
      };

    } catch (err) {
      console.error('Error initializing TradingView widget:', err);
      setError('Failed to initialize chart');
    }
  }, [symbol, isLoaded]);
  }, [symbol]);

  useEffect(() => {
    if (!container.current || !symbol) return;

    // Reset loaded state when symbol changes
    setIsLoaded(false);
    setError(null);
    
    // Load the widget with a slight delay to ensure proper initialization
    const timeoutId = setTimeout(loadWidget, 300);

    return () => {
      clearTimeout(timeoutId);
    };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black/20 rounded-lg border border-[rgba(0,255,238,0.1)] p-8">
        <div className="mb-4 text-[#00ffee]/50">
          <svg className="w-16 h-16 mx-auto\" fill="none\" stroke="currentColor\" viewBox="0 0 24 24">
            <path strokeLinecap="round\" strokeLinejoin="round\" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2 font-orbitron">Chart Unavailable</h3>
        <p className="text-gray-400 text-center text-sm leading-relaxed">
          The trading chart for this token is currently unavailable. 
          <br />
          Please check back later or visit the token's official trading platform.
        </p>
      </div>
    );
  }

  return (
    <div className="tradingview-widget-container h-full w-full relative" ref={container}>
      <div className="absolute bottom-0 left-0 right-0 p-1 text-center">
        <a 
          href="https://www.tradingview.com/" 
          rel="noopener nofollow" 
          target="_blank"
          className="text-xs text-[#00ffee] hover:text-[#37fffc] transition-colors"
        >
          Track all markets on TradingView
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);