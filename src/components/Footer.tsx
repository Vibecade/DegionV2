import React from 'react';
import { ExternalLink, TrendingUp, LineChart } from 'lucide-react';
import { salesData } from '../data/sales';
import { formatUSDC, formatNumber } from '../utils/formatters';

export const Footer = () => {
  const totalInvestment = salesData.reduce((acc, sale) => acc + sale.fundsRaisedUSDC, 0);
  const totalInvestors = salesData.reduce((acc, sale) => acc + sale.participants, 0);

  return (
    <footer className="mt-12 text-center space-y-4 pb-8">
      <div className="max-w-2xl mx-auto px-4 py-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-black/40 via-black/30 to-black/20 rounded-xl border border-[rgba(0,255,238,0.2)] p-8 hover:border-[rgba(0,255,238,0.4)] transition-all duration-500 group hover:shadow-[0_0_50px_rgba(0,255,238,0.2)]">
            <a
              href="https://dune.com/jsuh/legion"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 px-2 py-1 text-xs text-[#00ffee]/60 hover:text-[#00ffee] flex items-center gap-1 rounded-lg hover:bg-[#00ffee]/10 transition-all duration-300 group/link"
            >
              <span>View on Dune</span>
              <ExternalLink className="w-3 h-3 transform group-hover/link:translate-x-0.5 transition-transform" />
            </a>
            <div className="absolute inset-0 bg-gradient-to-r from-[#00ffee]/5 via-transparent to-[#37fffc]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center justify-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5" />
              <span className="font-orbitron text-[#00ffee] text-lg">Total Investment</span>
            </div>
            <p className="relative text-4xl sm:text-5xl font-bold font-orbitron bg-gradient-to-r from-[#00ffee] via-[#37fffc] to-[#00ffee] bg-clip-text text-transparent group-hover:animate-pulse">
              {formatUSDC(totalInvestment)}
              <span className="absolute -top-1 -left-1 blur-sm opacity-50">{formatUSDC(totalInvestment)}</span>
            </p>
          </div>
          <div className="relative overflow-hidden bg-gradient-to-br from-black/40 via-black/30 to-black/20 rounded-xl border border-[rgba(0,255,238,0.2)] p-8 hover:border-[rgba(0,255,238,0.4)] transition-all duration-500 group hover:shadow-[0_0_50px_rgba(0,255,238,0.2)]">
            <a
              href="https://dune.com/jsuh/legion"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-2 right-2 px-2 py-1 text-xs text-[#00ffee]/60 hover:text-[#00ffee] flex items-center gap-1 rounded-lg hover:bg-[#00ffee]/10 transition-all duration-300 group/link"
            >
              <span>View on Dune</span>
              <ExternalLink className="w-3 h-3 transform group-hover/link:translate-x-0.5 transition-transform" />
            </a>
            <div className="absolute inset-0 bg-gradient-to-r from-[#00ffee]/5 via-transparent to-[#37fffc]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center justify-center gap-3 mb-4">
              <LineChart className="w-5 h-5" />
              <span className="font-orbitron text-[#00ffee] text-lg">Total Investors</span>
            </div>
            <p className="relative text-4xl sm:text-5xl font-bold font-orbitron bg-gradient-to-r from-[#00ffee] via-[#37fffc] to-[#00ffee] bg-clip-text text-transparent transform group-hover:scale-110 transition-transform duration-500">
              {formatNumber(totalInvestors)}
              <span className="absolute -top-1 -left-1 blur-sm opacity-50">{formatNumber(totalInvestors)}</span>
            </p>
          </div>
        </div>
      </div>
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