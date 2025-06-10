import { TokenPriceResponse } from '../types';
import { supabase, isSupabaseAvailable } from './supabaseClient';
import { logError } from '../utils/errorLogger';

export interface TokenPriceResponse {
  current_price: number;
  roi_value: number;
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
  skate: { price: 0.08, seedPrice: 0.08 }
};

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
      .select('price, roi_value, updated_at')
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
      roi_value: Number(data.roi_value)
    };
  } catch (error) {
    console.error('Error in getStoredPrice:', error);
    return null;
  }
}

// Store price in Supabase
async function storePrice(tokenId: string, price: number, roiValue: number) {
  try {
    if (!isSupabaseAvailable) {
      console.warn(`⚠️ Cannot store price for ${tokenId} - Supabase not configured`);
      return;
    }

    const { error } = await supabase
      .from('token_prices')
      .upsert(
        {
          token_id: tokenId,
          price,
          roi_value: roiValue,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'token_id',
          ignoreDuplicates: false
        }
      );

    if (error && error.code !== '23505') {
      console.error('Error storing price in Supabase:', error);
    } else {
      console.log(`💾 Stored price for ${tokenId} in Supabase`);
    }
  } catch (error) {
    console.error('Error in storePrice:', error);
  }
}

// Retry mechanism for failed requests
async function retryRequest<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2);
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
  console.log(`🔄 Using fallback price for ${tokenId}: $${fallback.price}`);
  return {
    current_price: fallback.price,
    roi_value: roiValue
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
    const cachedPrice = await getStoredPrice(tokenId);
    if (cachedPrice) {
      setCache(tokenId, cachedPrice);
      return cachedPrice;
    }

    // If no CoinGecko ID provided, use fallback
    if (!coingeckoId) {
      const fallbackResult = getFallbackPrice(tokenId);
      setCache(tokenId, fallbackResult);
      return fallbackResult;
    }

    // Try to fetch fresh data from CoinGecko
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd`;
      const data = await fetchTokenPrice(url, tokenId);
      
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
        const result = {
          current_price: price,
          roi_value: roiValue
        };

        // Store and cache the result
        await storePrice(tokenId, price, roiValue);
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