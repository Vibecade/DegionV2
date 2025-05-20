import { TokenPriceResponse } from '../types';
import { createClient } from '@supabase/supabase-js';

export interface TokenPriceResponse {
  current_price: number;
  roi_value: number;
  error?: string;
}

export type TokenPriceError = {
  message: string;
  code: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that we have the required environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Create Supabase client with error handling
let supabase;
try {
  supabase = createClient(
    supabaseUrl,
    supabaseKey
  );
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  // Create a dummy client that will gracefully fail
  supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: new Error('Supabase client not initialized') })
        })
      }),
      upsert: async () => ({ error: new Error('Supabase client not initialized') })
    })
  };
}

const CACHE_DURATION = 30 * 1000; // 30 seconds in milliseconds
const CACHE_KEY_PREFIX = 'token_price_';

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
  } catch (error) {
    console.error('Cache error:', error);
  }
}
let lastRequestTime = 0;
const RATE_LIMIT_DELAY = 30 * 60 * 1000; // 30 minutes between requests
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 5000; // 5 seconds

async function rateLimit() {
  const now = Date.now();
  const timeToWait = Math.max(0, lastRequestTime + RATE_LIMIT_DELAY - now);
  if (timeToWait > 0) {
    console.log(`Rate limiting: waiting ${Math.round(timeToWait/60000)} minutes before next request`);
    await new Promise(resolve => setTimeout(resolve, timeToWait));
  }
  lastRequestTime = Date.now();
}

async function getStoredPrice(tokenId: string): Promise<TokenPriceResponse | null> {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase environment variables not configured. Skipping cache lookup.');
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
      console.log('No cached price data found');
      return null;
    }

    const now = new Date();
    const updated = new Date(data.updated_at);
    const age = now.getTime() - updated.getTime();

    if (age > CACHE_DURATION) {
      console.log('Using stale cache while waiting for rate limit');
      return {
        current_price: Number(data.price),
        roi_value: Number(data.roi_value)
      };
    }

    console.log('Using cached price data:', data);
    return {
      current_price: Number(data.price),
      roi_value: Number(data.roi_value)
    };
  } catch (error) {
    console.error('Error in getStoredPrice:', error);
    return null;
  }
}

async function storePrice(tokenId: string, price: number, roiValue: number) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase environment variables not configured. Skipping price storage.');
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

    if (error && error.code !== '23505') { // Ignore unique constraint violations
      console.error('Error storing price in Supabase:', error);
    }
  } catch (error) {
    console.error('Error in storePrice:', error);
  }
}

async function fetchWithRetry(url: string, retryCount = 0): Promise<Response> {
  try {
    await rateLimit();
    const response = await fetch(url);
    
    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`Rate limit hit, retrying in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithRetry(url, retryCount + 1);
    }
    
    return response;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`Network error, retrying in ${retryDelay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithRetry(url, retryCount + 1);
    }
    throw error;
  }
}

async function fetchWithCache(url: string, seedPrice: number, tokenId: string): Promise<TokenPriceResponse> {
  try {
    // Check client-side cache first
    const cachedData = getFromCache(tokenId);
    if (cachedData) {
      console.log('Using client-side cache for', tokenId);
      return cachedData;
    }

    // Try to get cached price from Supabase
    const cachedPrice = await getStoredPrice(tokenId);
    if (cachedPrice) {
      setCache(tokenId, cachedPrice);
      return cachedPrice;
    }

    const response = await fetchWithRetry(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    let price = 0;
    console.log('CoinGecko response:', data);
    
    if (data && typeof data === 'object') {
      const firstKey = Object.keys(data)[0];
      if (firstKey && data[firstKey] && typeof data[firstKey].usd === 'number') {
        price = data[firstKey].usd;
        console.log('Extracted price:', price);
      }
    }
    
    const roiValue = calculateRoi(price, seedPrice);
    const result = {
      current_price: price,
      roi_value: roiValue
    };

    // Store in Supabase if we got a valid price
    if (price > 0) {
      console.log('Storing new price in Supabase:', result);
      await storePrice(tokenId, price, roiValue);
      setCache(tokenId, result);
    }

    return result;
  } catch (error) {
    console.error(`Error fetching ${tokenId} price:`, error);
    // Return cached price if available, even if stale
    const staleCachedPrice = await getStoredPrice(tokenId);
    if (staleCachedPrice) {
      console.log('Using stale cached price due to error:', staleCachedPrice);
      return staleCachedPrice;
    }
    return { 
      current_price: 0, 
      roi_value: 0, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

export async function getFuelPrice(): Promise<TokenPrice> {
  return fetchWithCache(
    'https://api.coingecko.com/api/v3/simple/price?ids=fuel-network&vs_currencies=usd',
    0.02,
    'fuel'
  );
}

export async function getSilencioPrice(): Promise<TokenPrice> {
  return fetchWithCache(
    'https://api.coingecko.com/api/v3/simple/price?ids=silencio&vs_currencies=usd',
    0.0006,
    'silencio'
  );
}

export async function getCornPrice(): Promise<TokenPrice> {
  return fetchWithCache(
    'https://api.coingecko.com/api/v3/simple/price?ids=corn-3&vs_currencies=usd',
    0.07,
    'corn'
  );
}

export async function getGizaPrice(): Promise<TokenPrice> {
  return fetchWithCache(
    'https://api.coingecko.com/api/v3/simple/price?ids=giza&vs_currencies=usd',
    0.045,
    'giza'
  );
}

function calculateRoi(currentPrice: number, seedPrice: number): number {
  if (currentPrice <= 0 || seedPrice <= 0) {
    return 1000; // Return initial investment if prices are invalid
  }
  const roiPercentage = ((currentPrice - seedPrice) / seedPrice);
  const investmentValue = 1000 * (1 + roiPercentage);
  return Math.round(investmentValue * 100) / 100; // Round to 2 decimal places
}