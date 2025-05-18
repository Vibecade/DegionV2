import React from 'react';
import { ExternalLink, TrendingUp, LineChart } from 'lucide-react';
import { salesData } from '../data/sales';
import { formatUSDC } from '../utils/formatters';

export const Footer = () => {
  const totalInvestment = salesData.reduce((acc, sale) => acc + sale.fundsRaisedUSDC, 0);
  const totalInvestors = salesData.reduce((acc, sale) => acc + sale.participants, 0);
  const formattedInvestment = formatUSDC(totalInvestment);
  const [dollars, cents] = formattedInvestment.split('.');

  return (
    <footer className="mt-12 text-center space-y-4 pb-8">
      <div className="max-w-2xl mx-auto px-4 py-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-black/40 to-black/20 rounded-lg border border-[rgba(0,255,238,0.2)] p-6 hover:border-[rgba(0,255,238,0.4)] transition-all duration-300 group hover:shadow-[0_0_30px_rgba(0,255,238,0.15)]">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="font-orbitron text-[#00ffee]">Total Investment</span>
            </div>
            <p className="text-3xl font-bold font-orbitron bg-gradient-to-r from-[#00ffee] to-[#37fffc] bg-clip-text text-transparent animate-pulse">
              {formattedInvestment}
            </p>
          </div>
          <div className="bg-gradient-to-br from-black/40 to-black/20 rounded-lg border border-[rgba(0,255,238,0.2)] p-6 hover:border-[rgba(0,255,238,0.4)] transition-all duration-300 group hover:shadow-[0_0_30px_rgba(0,255,238,0.15)]">
            <div className="flex items-center justify-center gap-2 mb-2">
              <LineChart className="w-5 h-5" />
              <span className="font-orbitron text-[#00ffee]">Total Investors</span>
            </div>
            <p className="text-3xl font-bold font-orbitron bg-gradient-to-r from-[#00ffee] to-[#37fffc] bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
              {totalInvestors.toLocaleString()}
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