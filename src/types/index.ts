export interface Token {
  id: string;
  name: string;
  status: 'Live' | 'Pending TGE' | 'ICO Soon';
  launchDate: string;
  seedPrice: string;
  currentPrice: string;
  roi: string;
  investment: string;
  vestingEnd?: string;
  description?: string;
  links?: {
    website?: string;
    twitter?: string;
  };
}

export interface TokenPrice {
  current_price: number;
  roi_value: number;
}

export interface TokenSentiment {
  rocket: number;
  poop: number;
}

export interface TradingViewConfig {
  symbol: string;
  interval: string;
  timezone: string;
  theme: string;
  style: string;
  locale: string;
  allow_symbol_change: boolean;
  calendar: boolean;
  support_host: string;
}

export interface TokenSale {
  name: string;
  address: string;
  network: 'ethereum' | 'arbitrum';
  fundsRaisedUSDC: number;
  participants: number;
  transactions: number;
}