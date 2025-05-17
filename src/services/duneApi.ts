import { DuneClient } from '@duneanalytics/client';
import { TokenSale, DuneQueryResult } from '../types';
import { supabase } from './supabaseClient';

const DUNE_API_KEY = import.meta.env.VITE_DUNE_API_KEY;
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours

const dune = new DuneClient(DUNE_API_KEY);

// Query IDs for different metrics
const QUERIES = {
  SALES_DATA: '4684680',
  TOKEN_HOLDERS: '4684681',
  TRADING_VOLUME: '4684682'
};

interface CachedData {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CachedData>();

async function fetchWithCache(queryId: string): Promise<any> {
  const cached = cache.get(queryId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const result = await dune.refresh(queryId);
    const data = await dune.getResult(result.execution_id);

    cache.set(queryId, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error(`Error fetching Dune query ${queryId}:`, error);
    throw error;
  }
}

export async function fetchDuneSalesData(): Promise<TokenSale[]> {
  try {
    const result = await fetchWithCache(QUERIES.SALES_DATA);
    const salesData = transformSalesData(result);
    await cacheSalesData(salesData);
    return salesData;
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return getFallbackSalesData();
  }
}

export async function fetchTokenHolders(tokenAddress: string): Promise<number> {
  try {
    const result = await fetchWithCache(QUERIES.TOKEN_HOLDERS);
    return result.data.find((row: any) => 
      row.token_address.toLowerCase() === tokenAddress.toLowerCase()
    )?.holders_count || 0;
  } catch (error) {
    console.error('Error fetching token holders:', error);
    return 0;
  }
}

export async function fetchTradingVolume(tokenAddress: string): Promise<number> {
  try {
    const result = await fetchWithCache(QUERIES.TRADING_VOLUME);
    return result.data.find((row: any) =>
      row.token_address.toLowerCase() === tokenAddress.toLowerCase()
    )?.volume_24h || 0;
  } catch (error) {
    console.error('Error fetching trading volume:', error);
    return 0;
  }
}

function transformSalesData(result: DuneQueryResult): TokenSale[] {
  if (!result?.data) return [];

  return result.data.map((row: any) => {
    return {
      name: row.project_name,
      address: row.contract_address,
      network: row.network.toLowerCase(),
      fundsRaisedUSDC: parseFloat(row.funds_raised_usdc),
      participants: parseInt(row.participants),
      transactions: parseInt(row.transactions)
    };
  });
}

async function cacheSalesData(salesData: TokenSale[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('dune_sales_data')
      .upsert(
        {
          id: 1, // Using a single row for simplicity
          data: salesData,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'id'
        }
      );

    if (error) {
      console.error('Error caching sales data:', error);
    }
  } catch (error) {
    console.error('Error in cacheSalesData:', error);
  }
}

async function getFallbackSalesData(): Promise<TokenSale[]> {
  // Import static data as fallback
  const { salesData } = await import('../data/sales');
  return salesData;
}