import React, { useEffect, useRef, memo, useState } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
}

function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!container.current || !symbol) return;

    const scriptId = `tradingview-widget-${symbol}`;
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const loadWidget = () => {
      try {
        if (!script) {
          script = document.createElement("script");
          script.id = scriptId;
          script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
          script.type = "text/javascript";
          script.async = true;
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

        script.onerror = () => {
          setError('Failed to load TradingView chart');
        };

      } catch (err) {
        console.error('Error initializing TradingView widget:', err);
        setError('Failed to initialize chart');
      }
    };

    // Load the widget with a slight delay to ensure proper initialization
    const timeoutId = setTimeout(loadWidget, 100);

    return () => {
      clearTimeout(timeoutId);
      if (container.current) {
        container.current.innerHTML = '';
      }
      script?.remove();
    };
  }, [symbol]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-black/20 rounded-lg">
        <p className="text-gray-400">{error}</p>
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

const getTradingViewSymbol = (id: string) => {
  switch (id.toLowerCase()) {
    case 'fuel':
      return 'KUCOIN:FUELUSDT';
    case 'silencio':
      return 'KUCOIN:SLCUSDT';
    case 'corn':
      return 'MEXC:CORNUSDT';
    default:
      return '';
  }
};

export default memo(TradingViewWidget);