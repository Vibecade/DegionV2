import React from 'react';
import { ExternalLink, TrendingUp, LineChart } from 'lucide-react';
import { salesData } from '../data/sales';
import { formatUSDC, formatNumber } from '../utils/formatters';

export const Footer = () => {
  return (
    <footer className="mt-12 text-center space-y-4 pb-8">
      <div className="max-w-2xl mx-auto px-4 py-6 bg-black/30 rounded-lg border border-[rgba(0,255,238,0.1)]">
        <p className="text-sm text-gray-400 mb-4">
          Disclaimer: We are not affiliated with Legion and do not offer financial or trading advice. 
          This website is purely for informational purposes to assist in tracking prior ICO performance. 
          Always conduct your own research before making any investment decisions.
        </p>
        <div className="flex items-center justify-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
          <a 
            href="https://x.com/dustybeerbong" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[#00ffee] hover:text-[#37fffc] transition-colors group text-sm border-r border-[#00ffee]/20 pr-4"
          >
            <span>Built by Sadpepe.exe</span>
            <ExternalLink className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a 
            href="https://x.com/Kroneastus" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[#00ffee] hover:text-[#37fffc] transition-colors group text-sm"
          >
            <span>Sales Data by Kroneastus</span>
            <ExternalLink className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
          </a>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500">© 2025 Degion.xyz. All rights reserved.</p>
    </footer>
  );
};