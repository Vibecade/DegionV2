import React from 'react';
import { TrendingUp, LineChart, DollarSign, Users, Activity, Clock } from 'lucide-react';
import { formatUSDC, formatNumber } from '../utils/formatters';

interface QuickStatsProps {
  totalInvestment: number;
  totalInvestors: number;
  liveTokens: number;
  pendingTokens: number;
  averageROI: number;
  lastUpdate?: string;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  totalInvestment,
  totalInvestors,
  liveTokens,
  pendingTokens,
  averageROI,
  lastUpdate
}) => {
  const stats = [
    {
      icon: DollarSign,
      label: 'Total Investment',
      value: formatUSDC(totalInvestment),
      color: 'text-green-400',
      bgColor: 'from-green-500/20 to-green-600/10',
      borderColor: 'border-green-500/30'
    },
    {
      icon: Users,
      label: 'Total Investors',
      value: formatNumber(totalInvestors),
      color: 'text-blue-400',
      bgColor: 'from-blue-500/20 to-blue-600/10',
      borderColor: 'border-blue-500/30'
    },
    {
      icon: Activity,
      label: 'Live Tokens',
      value: liveTokens.toString(),
      color: 'text-[#00ffee]',
      bgColor: 'from-[#00ffee]/20 to-[#37fffc]/10',
      borderColor: 'border-[#00ffee]/30'
    },
    {
      icon: Clock,
      label: 'Pending TGE',
      value: pendingTokens.toString(),
      color: 'text-yellow-400',
      bgColor: 'from-yellow-500/20 to-yellow-600/10',
      borderColor: 'border-yellow-500/30'
    },
    {
      icon: TrendingUp,
      label: 'Avg ROI',
      value: `${averageROI.toFixed(1)}%`,
      color: averageROI >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: averageROI >= 0 ? 'from-green-500/20 to-green-600/10' : 'from-red-500/20 to-red-600/10',
      borderColor: averageROI >= 0 ? 'border-green-500/30' : 'border-red-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`relative overflow-hidden bg-gradient-to-br ${stat.bgColor} rounded-xl border ${stat.borderColor} p-6 hover:scale-105 transition-all duration-300 group cursor-pointer`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative flex items-center justify-between mb-4">
            <stat.icon className={`w-6 h-6 ${stat.color} group-hover:scale-110 transition-transform duration-300`} />
            <div className={`w-2 h-2 rounded-full ${stat.color.replace('text-', 'bg-')} animate-pulse`} />
          </div>
          
          <div className="relative">
            <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} font-orbitron group-hover:text-shadow-glow transition-all duration-300`}>
              {stat.value}
            </p>
          </div>
          
          {/* Animated border */}
          <div className="absolute inset-0 rounded-xl border-2 border-transparent bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
        </div>
      ))}
      
      {lastUpdate && (
        <div className="sm:col-span-2 lg:col-span-5 flex items-center justify-center text-sm text-gray-400 mt-4">
          <Clock className="w-4 h-4 mr-2" />
          Last updated: {lastUpdate}
        </div>
      )}
    </div>
  );
};