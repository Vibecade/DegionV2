import { createClient } from '@supabase/supabase-js';
import { TokenSale } from '../types';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Cache duration in milliseconds (3 days)
const CACHE_DURATION = 3 * 24 * 60 * 60 * 1000;

interface DuneDataRow {
  project_name: string;
  contract_address: string;
  network: string;
  funds_raised_usdc: string;
  participants: string;
}

export async function fetchDuneSalesData(): Promise<TokenSale[]> {
  try {
    // First, try to get cached data from Supabase
    const cachedData = await getCachedSalesData();
    if (cachedData && cachedData.length > 0) {
      return cachedData;
    }

    // If no cached data or API key is missing, use fallback data
    if (!import.meta.env.VITE_DUNE_API_KEY) {
      console.log('No Dune API key found, using fallback data');
      return await getFallbackSalesData();
    }

    // If we have an API key, fetch from Dune API
    const response = await fetch('https://api.dune.com/api/v1/query/4684680/results/csv?limit=1000', {
      headers: {
        'X-Dune-API-Key': import.meta.env.VITE_DUNE_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Dune data: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    const salesData = parseCsvData(csvText);
    
    // Cache the data in Supabase
    await cacheSalesData(salesData);
    
    return salesData;
  } catch (error) {
    console.error('Error fetching Dune data:', error);
    // Fallback to static data if API call fails
    return await getFallbackSalesData();
  }
}

function parseCsvData(csvText: string): TokenSale[] {
  // Skip header row and split by lines
  const rows = csvText.split('\n').slice(1).filter(row => row.trim() !== '');
  
  return rows.map(row => {
    const columns = row.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
    
    // Map CSV columns to our data structure
    const [project_name, contract_address, network, funds_raised_usdc, participants] = columns;
    
    return {
      name: project_name,
      address: contract_address,
      network: network.toLowerCase() as 'ethereum' | 'arbitrum',
      fundsRaisedUSDC: parseInt(funds_raised_usdc, 10) || 0,
      participants: parseInt(participants, 10) || 0,
      transactions: parseInt(participants, 10) || 0 // Using participants as transactions for now
    };
  });
}

async function getCachedSalesData(): Promise<TokenSale[] | null> {
  try {
    const { data, error } = await supabase
      .from('dune_sales_data')
      .select('data, updated_at')
      .eq('id', 1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    // Check if cache is still valid
    const updatedAt = new Date(data.updated_at);
    const now = new Date();
    if (now.getTime() - updatedAt.getTime() > CACHE_DURATION) {
      return null; // Cache expired
    }

    return data.data as TokenSale[];
  } catch (error) {
    console.error('Error getting cached sales data:', error);
    return null;
  }
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