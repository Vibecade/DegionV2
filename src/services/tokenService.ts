import { Token } from '../types';
import { supabase, isSupabaseAvailable, safeSupabaseOperation } from './supabaseClient';
import { logError } from '../utils/errorLogger';

// Cache for token data
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let tokenCache: { data: Token[]; timestamp: number } | null = null;

// Transform database row to Token interface
function transformDatabaseToken(dbToken: any): Token {
  return {
    id: dbToken.token_id,
    name: dbToken.name || dbToken.token_id,
    status: dbToken.status || 'ICO Soon',
    launchDate: dbToken.launch_date || 'TBD',
    seedPrice: dbToken.seed_price || 'TBD',
    currentPrice: '--', // Will be fetched separately
    roi: '--', // Will be calculated separately
    investment: '--', // Will be calculated separately
    vestingEnd: dbToken.vesting_end,
    description: dbToken.description,
    links: dbToken.links || {}
  };
}

// Get static fallback data
async function getStaticTokens(): Promise<Token[]> {
  try {
    const { tokens } = await import('../data/tokens');
    return tokens;
  } catch (error) {
    logError(error as Error, 'getStaticTokens');
    return [];
  }
}

// Fetch all tokens from database
export async function fetchTokensFromDatabase(): Promise<Token[]> {
  try {
    // Check cache first
    if (tokenCache && Date.now() - tokenCache.timestamp < CACHE_DURATION) {
      console.log('📦 Using cached token data');
      return tokenCache.data;
    }

    console.log('🔄 Fetching tokens from database');
    
    // Get static data as fallback
    const staticTokens = await getStaticTokens();
    
    // Try to fetch from Supabase with automatic fallback
    const { data, error, usedFallback } = await safeSupabaseOperation(
      () => supabase
        .from('token_info')
        .select('*')
        .order('name'),
      staticTokens
    );

    if (usedFallback) {
      console.warn('🔌 Using static token data due to database connection issues');
      return staticTokens;
    }

    if (error) {
      console.warn('Database error, falling back to static data:', error.message);
      return staticTokens;
    }

    if (!data || data.length === 0) {
      console.warn('No tokens found in database, using static data');
      return staticTokens;
    }

    // Transform database data to Token interface
    const tokens = data.map(transformDatabaseToken);
    
    // Update cache
    tokenCache = {
      data: tokens,
      timestamp: Date.now()
    };

    console.log(`✅ Fetched ${tokens.length} tokens from database`);
    return tokens;

  } catch (error) {
    logError(error as Error, 'fetchTokensFromDatabase');
    console.warn('Failed to fetch from database, falling back to static data');
    
    // Fallback to static data
    return await getStaticTokens();
  }
}

// Fetch single token details
export async function fetchTokenDetails(tokenId: string): Promise<Token | null> {
  try {
    console.log(`🔄 Fetching token details for ${tokenId}`);
    
    // Get static data as fallback
    const staticTokens = await getStaticTokens();
    const staticToken = staticTokens.find(t => t.id.toLowerCase() === tokenId.toLowerCase()) || null;
    
    // Try to fetch from Supabase with automatic fallback
    const { data, error, usedFallback } = await safeSupabaseOperation(
      () => supabase
        .from('token_info')
        .select('*')
        .eq('token_id', tokenId)
        .maybeSingle(),
      staticToken
    );

    if (usedFallback) {
      console.warn(`🔌 Using static data for token ${tokenId} due to database connection issues`);
      return staticToken;
    }

    if (error) {
      console.warn(`Database error for token ${tokenId}, using static data:`, error.message);
      return staticToken;
    }

    if (!data) {
      console.warn(`Token ${tokenId} not found in database, using static data`);
      return staticToken;
    }

    const token = transformDatabaseToken(data);
    console.log(`✅ Fetched token details for ${tokenId}`);
    return token;

  } catch (error) {
    logError(error as Error, 'fetchTokenDetails', { tokenId });
    
    // Fallback to static data
    const staticTokens = await getStaticTokens();
    return staticTokens.find(t => t.id.toLowerCase() === tokenId.toLowerCase()) || null;
  }
}

// Fetch token sales details
export async function fetchTokenSalesDetails(tokenId: string): Promise<any | null> {
  try {
    console.log(`🔄 Fetching sales details for ${tokenId}`);
    
    // Get static sales data as fallback
    let staticSalesData = null;
    try {
      const { salesData } = await import('../data/sales');
      staticSalesData = salesData.find(sale => sale.name.toLowerCase() === tokenId.toLowerCase()) || null;
    } catch (error) {
      console.warn('No static sales data available');
    }
    
    // Try to fetch from Supabase with automatic fallback
    const { data, error, usedFallback } = await safeSupabaseOperation(
      () => supabase
        .from('token_sales_details')
        .select('*')
        .eq('token_id', tokenId)
        .maybeSingle(),
      staticSalesData
    );

    if (usedFallback) {
      console.warn(`🔌 Using static sales data for token ${tokenId} due to database connection issues`);
      return staticSalesData;
    }

    if (error) {
      console.warn(`Sales details error for ${tokenId}, using static data:`, error.message);
      return staticSalesData;
    }

    if (!data) {
      console.warn(`Sales details not found for ${tokenId}, using static data`);
      return staticSalesData;
    }

    // Transform to match existing interface
    const salesDetails = {
      name: data.token_id,
      address: data.address,
      network: data.network,
      fundsRaisedUSDC: data.funds_raised_usdc || 0,
      participants: data.participants || 0,
      transactions: data.transactions || 0
    };

    console.log(`✅ Fetched sales details for ${tokenId}`);
    return salesDetails;

  } catch (error) {
    logError(error as Error, 'fetchTokenSalesDetails', { tokenId });
    
    // Fallback to static data
    try {
      const { salesData } = await import('../data/sales');
      return salesData.find(sale => sale.name.toLowerCase() === tokenId.toLowerCase()) || null;
    } catch (fallbackError) {
      logError(fallbackError as Error, 'fetchTokenSalesDetails:fallback', { tokenId });
      return null;
    }
  }
}

// Clear token cache (useful for forcing refresh)
export function clearTokenCache(): void {
  tokenCache = null;
  console.log('🗑️ Token cache cleared');
}

// Get last update time for tokens
export async function getTokensLastUpdate(): Promise<string | null> {
  try {
    const { data, error, usedFallback } = await safeSupabaseOperation(
      () => supabase
        .from('token_info')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1),
      null
    );

    if (usedFallback || error || !data || data.length === 0) {
      return null;
    }

    return new Date(data[0].updated_at).toLocaleString();
  } catch (error) {
    logError(error as Error, 'getTokensLastUpdate');
    return null;
  }
}