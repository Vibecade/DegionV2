// import { DuneClient } from '@dune/client'; // Dune API not yet set up
import { TokenSale, DuneQueryResult } from '../types';
import { supabase } from './supabaseClient';

// const DUNE_API_KEY = import.meta.env.VITE_DUNE_API_KEY;
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours

// const dune = new DuneClient(DUNE_API_KEY);

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

// Temporarily disabled until Dune API is set up
async function fetchWithCache(queryId: string): Promise<any> {
  return null;
}

export async function fetchDuneSalesData(): Promise<TokenSale[]> {
  try {
    // Temporarily return fallback data until Dune API is set up
    return getFallbackSalesData();
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return getFallbackSalesData();
  }
}

export async function fetchTokenHolders(tokenAddress: string): Promise<number> {
  try {
    // Temporarily return 0 until Dune API is set up
    return 0;
  } catch (error) {
    console.error('Error fetching token holders:', error);
    return 0;
  }
}

export async function fetchTradingVolume(tokenAddress: string): Promise<number> {
  try {
    // Temporarily return 0 until Dune API is set up
    return 0;
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