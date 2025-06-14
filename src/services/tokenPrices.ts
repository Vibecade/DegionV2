import { TokenPriceResponse } from '../types';
import { supabase, isSupabaseAvailable } from './supabaseClient';
import { logError } from '../utils/errorLogger';

export interface TokenPriceResponse {
  current_price: number;
  roi_value: number;
  ath?: number;
  atl?: number;
  ath_date?: string;
  atl_date?: string;
  error?: string;
}

export type TokenPriceError = {
  message: string;
  code: string;
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEY_PREFIX = 'token_price_';
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

// Fallback prices when API is not available
const FALLBACK_PRICES = {
  fuel: { price: 0.05, seedPrice: 0.02 },
  silencio: { price: 0.0006, seedPrice: 0.0006 },
  corn: { price: 0.07, seedPrice: 0.07 },
  giza: { price: 0.045, seedPrice: 0.045 },
  skate: { price: 0.08, seedPrice: 0.08 },
  resolv: { price: 0.10, seedPrice: 0.10 }
};

// Cache for ATH/ATL data - persisted in localStorage
const ATH_ATL_CACHE_KEY = 'ath_atl_cache';
const ATH_ATL_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface ATHATLData {
  ath?: number;
  atl?: number;
  ath_date?: string;
  atl_date?: string;
  timestamp: number;
}

// Get cached ATH/ATL data
function getCachedATHATL(tokenId: string): { ath?: number; atl?: number; ath_date?: string; atl_date?: string } | null {
  try {
    const cached = localStorage.getItem(`${ATH_ATL_CACHE_KEY}_${tokenId}`);
    if (!cached) return null;
    
    const data: ATHATLData = JSON.parse(cached);
    const now = Date.now();
    
    // ATH/ATL data is valid for 24 hours
    if (now - data.timestamp > ATH_ATL_CACHE_DURATION) {
      localStorage.removeItem(`${ATH_ATL_CACHE_KEY}_${tokenId}`);
      return null;
    }
    
    console.log(`📦 Using cached ATH/ATL for ${tokenId}`);
    return {
      ath: data.ath,
      atl: data.atl,
      ath_date: data.ath_date,
      atl_date: data.atl_date
    };
  } catch (error) {
    console.error('Error reading ATH/ATL cache:', error);
    return null;
  }
}

// Cache ATH/ATL data
function cacheATHATL(tokenId: string, ath?: number, atl?: number, ath_date?: string, atl_date?: string): void {
  try {
    const data: ATHATLData = {
      ath,
      atl,
      ath_date,
      atl_date,
      timestamp: Date.now()
    };
    localStorage.setItem(`${ATH_ATL_CACHE_KEY}_${tokenId}`, JSON.stringify(data));
    console.log(`💾 Cached ATH/ATL for ${tokenId}`, { ath, atl });
  } catch (error) {
    console.error('Error caching ATH/ATL data:', error);
  }
}

// Clear old cache on startup
function clearOldCache() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const { timestamp } = JSON.parse(cached);
            const now = Date.now();
            if (now - timestamp > CACHE_DURATION) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      }
    });
  } catch (error) {
    console.error('Error clearing old cache:', error);
  }
}

// Clear old cache on module load
clearOldCache();

interface CacheItem {
  data: TokenPriceResponse;
  timestamp: number;
}

function getCacheKey(tokenId: string): string {
  return `${CACHE_KEY_PREFIX}${tokenId}`;
}

function getFromCache(tokenId: string): TokenPriceResponse | null {
  try {
    const cacheKey = getCacheKey(tokenId);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const { data, timestamp }: CacheItem = JSON.parse(cached);
    const now = Date.now();
    
    if (now - timestamp > CACHE_DURATION) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    console.log(`📦 Using cached price for ${tokenId}`);
    return data;
  } catch (error) {
    console.error('Cache error:', error);
    return null;
  }
}

function setCache(tokenId: string, data: TokenPriceResponse): void {
  try {
    const cacheKey = getCacheKey(tokenId);
    const cacheItem: CacheItem = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
    console.log(`💾 Cached price for ${tokenId}`);
  } catch (error) {
    console.error('Cache error:', error);
  }
}

// Get stored price from Supabase
async function getStoredPrice(tokenId: string): Promise<TokenPriceResponse | null> {
  try {
    if (!isSupabaseAvailable) {
      return null;
    }

    const { data, error } = await supabase
      .from('token_prices')
      .select('price, roi_value, ath, atl, updated_at')
      .eq('token_id', tokenId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching from Supabase:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    const now = new Date();
    const updated = new Date(data.updated_at);
    const age = now.getTime() - updated.getTime();

    // Use longer cache for stored prices (30 minutes)
    if (age > 30 * 60 * 1000) {
      console.log(`⏰ Supabase cache expired for ${tokenId}`);
      return null;
    }

    console.log(`🗄️ Using Supabase cached price for ${tokenId}`);
    return {
      current_price: Number(data.price),
      roi_value: Number(data.roi_value),
      ath: data.ath ? Number(data.ath) : undefined,
      atl: data.atl ? Number(data.atl) : undefined,
      ath_date: data.ath_date || undefined,
      atl_date: data.atl_date || undefined
    };
  } catch (error) {
    console.error('Error in getStoredPrice:', error);
    return null;
  }
}

// Store price in Supabase
async function storePrice(tokenId: string, price: number, roiValue: number, ath?: number, atl?: number, athDate?: string, atlDate?: string) {
  try {
    if (!isSupabaseAvailable) {
      console.warn(`⚠️ Cannot store price for ${tokenId} - Supabase not configured`);
      return;
    }

    const updateData: any = {
      token_id: tokenId,
      price,
      roi_value: roiValue,
      updated_at: new Date().toISOString()
    };

    if (ath !== undefined) updateData.ath = ath;
    if (atl !== undefined) updateData.atl = atl;
    if (athDate) updateData.ath_date = athDate;
    if (atlDate) updateData.atl_date = atlDate;

    const { error } = await supabase
      .from('token_prices')
      .upsert(updateData, {
        onConflict: 'token_id',
        ignoreDuplicates: false
      });

    if (error && error.code !== '23505') {
      console.error('Error storing price in Supabase:', error);
    } else {
      console.log(`💾 Stored price data for ${tokenId} in Supabase (ATH: $${ath}, ATL: $${atl})`);
    }
  } catch (error) {
    console.error('Error in storePrice:', error);
  }
}

// Retry mechanism for failed requests
async function retryRequest<T>(
  fn: () => Promise<T>,
  retries: number = 1,
  delay: number = 500
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay);
    }
    throw error;
  }
}

// Fetch token price from CoinGecko API
async function fetchTokenPrice(url: string, tokenId: string): Promise<any> {
  try {
    console.log(`🌐 Fetching price for ${tokenId}`);
    const response = await retryRequest(() => fetch(url));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ Fetch failed for ${tokenId}:`, error);
    throw error;
  }
}

function getFallbackPrice(tokenId: string): TokenPriceResponse {
  const fallback = FALLBACK_PRICES[tokenId as keyof typeof FALLBACK_PRICES];
  if (!fallback) {
    return { current_price: 0, roi_value: 1000 };
  }
  
  const roiValue = calculateRoi(fallback.price, fallback.seedPrice);
  
  // Try to get cached ATH/ATL data
  const cachedATHATL = getCachedATHATL(tokenId);
  
  console.log(`🔄 Using fallback price for ${tokenId}: $${fallback.price}`);
  return {
    current_price: fallback.price,
    roi_value: roiValue,
    ath: cachedATHATL?.ath,
    atl: cachedATHATL?.atl,
    ath_date: cachedATHATL?.ath_date,
    atl_date: cachedATHATL?.atl_date
  };
}

function calculateRoi(currentPrice: number, seedPrice: number): number {
  if (currentPrice <= 0 || seedPrice <= 0) {
    return 1000; // Return initial investment if prices are invalid
  }
  const roiPercentage = ((currentPrice - seedPrice) / seedPrice);
  const investmentValue = 1000 * (1 + roiPercentage);
  return Math.round(investmentValue * 100) / 100; // Round to 2 decimal places
}

// Generic token price fetcher
export async function getTokenPrice(tokenId: string, seedPrice: number, coingeckoId?: string): Promise<TokenPriceResponse> {
  try {
    console.log(`💰 Fetching price for ${tokenId}`);
    
    // Check client-side cache first
    const cachedData = getFromCache(tokenId);
    if (cachedData) {
      return cachedData;
    }

    // Try to get cached price from Supabase
    try {
      const cachedPrice = await getStoredPrice(tokenId);
      if (cachedPrice) {
        setCache(tokenId, cachedPrice);
        return cachedPrice;
      }
    } catch (supabaseError) {
      console.warn(`⚠️ Supabase cache failed for ${tokenId}:`, supabaseError);
    }

    // If no CoinGecko ID provided, use fallback
    if (!coingeckoId) {
      const fallbackResult = getFallbackPrice(tokenId);
      setCache(tokenId, fallbackResult);
      return fallbackResult;
    }

    // Try to fetch fresh data from CoinGecko
    try {
      // First fetch basic price data
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      let price = 0;
      
      if (data && typeof data === 'object') {
        const tokenData = data[coingeckoId];
        if (tokenData && typeof tokenData.usd === 'number') {
          price = tokenData.usd;
          console.log(`💲 Fresh price for ${tokenId}: $${price}`);
        }
      }
      
      if (price > 0) {
        const roiValue = calculateRoi(price, seedPrice);
        
        // Try to fetch detailed data including ATH/ATL
        let ath, atl, ath_date, atl_date;
        
        try {
          // Fetch detailed market data for ATH/ATL
          const detailUrl = `https://api.coingecko.com/api/v3/coins/${coingeckoId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
          const detailController = new AbortController();
          const detailTimeoutId = setTimeout(() => detailController.abort(), 3000); // 3 second timeout for detailed data
          
          const detailResponse = await fetch(detailUrl, { 
            signal: detailController.signal,
            headers: {
              'Accept': 'application/json',
            }
          });
          clearTimeout(detailTimeoutId);
          
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            
            if (detailData.market_data) {
              ath = detailData.market_data.ath?.usd;
              atl = detailData.market_data.atl?.usd;
              ath_date = detailData.market_data.ath_date?.usd;
              atl_date = detailData.market_data.atl_date?.usd;
              
              // Cache the ATH/ATL data
              if (ath || atl) {
                cacheATHATL(tokenId, ath, atl, ath_date, atl_date);
              }
            }
          }
        } catch (detailError) {
          console.warn(`⚠️ Failed to fetch ATH/ATL for ${tokenId}, using cached data:`, detailError);
          // Use cached data if available
          const cachedATHATL = getCachedATHATL(tokenId);
          if (cachedATHATL) {
            ath = cachedATHATL.ath;
            atl = cachedATHATL.atl;
            ath_date = cachedATHATL.ath_date;
            atl_date = cachedATHATL.atl_date;
          }
        }
        
        const result = {
          current_price: price,
          roi_value: roiValue,
          ath,
          atl,
          ath_date,
          atl_date
        };

        // Store and cache the result
        try {
          await storePrice(tokenId, price, roiValue, result.ath, result.atl, result.ath_date, result.atl_date);
        } catch (storeError) {
          console.warn(`⚠️ Failed to store price for ${tokenId}:`, storeError);
        }
        setCache(tokenId, result);
        return result;
      }
    } catch (fetchError) {
      console.warn(`⚠️ Failed to fetch fresh price for ${tokenId}:`, fetchError);
    }

    // If all else fails, use fallback price
    const fallbackResult = getFallbackPrice(tokenId);
    setCache(tokenId, fallbackResult);
    return fallbackResult;

  } catch (error) {
    logError(error as Error, 'getTokenPrice', { tokenId });
    return getFallbackPrice(tokenId);
  }
}

// Specific token price functions (maintained for backward compatibility)
export async function getFuelPrice(): Promise<TokenPriceResponse> {
  return getTokenPrice('fuel', 0.02, 'fuel-network');
}

export async function getSilencioPrice(): Promise<TokenPriceResponse> {
  return getTokenPrice('silencio', 0.0006, 'silencio');
}

export async function getCornPrice(): Promise<TokenPriceResponse> {
  return getTokenPrice('corn', 0.07, 'corn-3');
}

export async function getGizaPrice(): Promise<TokenPriceResponse> {
  return getTokenPrice('giza', 0.045, 'giza');
}

export async function getSkatePrice(): Promise<TokenPriceResponse> {
  return getTokenPrice('skate', 0.08, 'skate');
}

export async function getResolvPrice(): Promise<TokenPriceResponse> {
  return getTokenPrice('resolv', 0.10, 'resolv');
}