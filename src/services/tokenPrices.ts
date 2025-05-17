import { TokenPrice } from '../types';
import { createClient } from '@supabase/supabase-js';

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

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
let lastRequestTime = 0;
const RATE_LIMIT_DELAY = 120 * 1000; // 120 seconds between requests

async function rateLimit() {
  const now = Date.now();
  const timeToWait = Math.max(0, lastRequestTime + RATE_LIMIT_DELAY - now);
  if (timeToWait > 0) {
    await new Promise(resolve => setTimeout(resolve, timeToWait));
  }
  lastRequestTime = Date.now();
}

async function getStoredPrice(tokenId: string): Promise<TokenPrice | null> {
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
      return null;
    }

    const now = new Date();
    const updated = new Date(data.updated_at);
    const age = now.getTime() - updated.getTime();

    if (age > CACHE_DURATION) {
      return null;
    }

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

async function fetchWithCache(url: string, seedPrice: number, tokenId: string): Promise<TokenPrice> {
  try {
    // Try to get cached price from Supabase
    const cachedPrice = await getStoredPrice(tokenId);
    if (cachedPrice) {
      return cachedPrice;
    }

    await rateLimit();

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    let price = 0;
    if (data && typeof data === 'object') {
      const firstKey = Object.keys(data)[0];
      if (firstKey && data[firstKey] && typeof data[firstKey].usd === 'number') {
        price = data[firstKey].usd;
      }
    }
    
    const roiValue = calculateRoi(price, seedPrice);
    const result = {
      current_price: price,
      roi_value: roiValue
    };

    // Store in Supabase if we got a valid price
    if (price > 0) {
      await storePrice(tokenId, price, roiValue);
    }

    return result;
  } catch (error) {
    console.error(`Error fetching ${tokenId} price:`, error);
    return { current_price: 0, roi_value: 0 };
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

function calculateRoi(currentPrice: number, seedPrice: number): number {
  if (currentPrice <= 0 || seedPrice <= 0) {
    return 1000; // Return initial investment if prices are invalid
  }
  const roiPercentage = ((currentPrice - seedPrice) / seedPrice);
  const investmentValue = 1000 * (1 + roiPercentage);
  return Math.round(investmentValue * 100) / 100; // Round to 2 decimal places
}