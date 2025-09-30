import { Token } from '../types';
import { supabase, isSupabaseAvailable } from './supabaseClient';
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

// Fetch all tokens from database
export async function fetchTokensFromDatabase(): Promise<Token[]> {
  try {
    if (!isSupabaseAvailable) {
      console.log('📱 Using offline mode - Supabase not configured, loading static data');
      const { tokens } = await import('../data/tokens');
      return tokens;
    }

    // Check cache first
    if (tokenCache && Date.now() - tokenCache.timestamp < CACHE_DURATION) {
      console.log('📦 Using cached token data');
      return tokenCache.data;
    }

    // Test Supabase connectivity before making the call
    try {
      const testResponse = await supabase.from('token_info').select('count').limit(0);
      if (testResponse.error && testResponse.error.message.includes('Failed to fetch')) {
        console.warn('🔌 Supabase connectivity issue, falling back to static data');
        const { tokens } = await import('../data/tokens');
        return tokens;
      }
    } catch (connectivityError) {
      console.warn('🔌 Supabase connectivity test failed, falling back to static data');
      const { tokens } = await import('../data/tokens');
      return tokens;
    }

    console.log('🔄 Fetching tokens from Supabase database');
    const { data, error } = await supabase
      .from('token_info')
      .select('*')
      .order('name');

    if (error) {
      if (error.message.includes('Failed to fetch')) {
        console.warn('🔌 Network error fetching from database, falling back to static data');
        const { tokens } = await import('../data/tokens');
        return tokens;
      } else {
        throw new Error(`Database error: ${error.message}`);
      }
    }

    if (!data || data.length === 0) {
      console.warn('No tokens found in database, falling back to static data');
      const { tokens } = await import('../data/tokens');
      return tokens;
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
    try {
      const { tokens } = await import('../data/tokens');
      return tokens;
    } catch (fallbackError) {
      logError(fallbackError as Error, 'fetchTokensFromDatabase:fallback');
      return [];
    }
  }
}

// Fetch single token details
export async function fetchTokenDetails(tokenId: string): Promise<Token | null> {
  try {
    if (!isSupabaseAvailable) {
      console.log('📱 Using offline mode - falling back to static data');
      const { tokens } = await import('../data/tokens');
      return tokens.find(t => t.id.toLowerCase() === tokenId.toLowerCase()) || null;
    }

    // Test connectivity first
    try {
      const testResponse = await supabase.from('token_info').select('count').limit(0);
      if (testResponse.error && testResponse.error.message.includes('Failed to fetch')) {
        console.warn('🔌 Supabase connectivity issue, falling back to static data');
        const { tokens } = await import('../data/tokens');
        return tokens.find(t => t.id.toLowerCase() === tokenId.toLowerCase()) || null;
      }
    } catch (connectivityError) {
      console.warn('🔌 Supabase connectivity test failed, falling back to static data');
      const { tokens } = await import('../data/tokens');
      return tokens.find(t => t.id.toLowerCase() === tokenId.toLowerCase()) || null;
    }

    console.log(`🔄 Fetching token details for ${tokenId} from Supabase`);
    const { data, error } = await supabase
      .from('token_info')
      .select('*')
      .eq('token_id', tokenId)
      .maybeSingle();

    if (error) {
      if (error.message.includes('Failed to fetch')) {
        console.warn(`🔌 Network error fetching ${tokenId}, falling back to static data`);
        const { tokens } = await import('../data/tokens');
        return tokens.find(t => t.id.toLowerCase() === tokenId.toLowerCase()) || null;
      } else {
        throw new Error(`Database error: ${error.message}`);
      }
    }

    if (!data) {
      console.warn(`Token ${tokenId} not found in database, checking static data`);
      const { tokens } = await import('../data/tokens');
      return tokens.find(t => t.id.toLowerCase() === tokenId.toLowerCase()) || null;
    }

    const token = transformDatabaseToken(data);
    console.log(`✅ Fetched token details for ${tokenId}`);
    return token;

  } catch (error) {
    logError(error as Error, 'fetchTokenDetails', { tokenId });
    
    // Fallback to static data
    try {
      const { tokens } = await import('../data/tokens');
      return tokens.find(t => t.id.toLowerCase() === tokenId.toLowerCase()) || null;
    } catch (fallbackError) {
      logError(fallbackError as Error, 'fetchTokenDetails:fallback', { tokenId });
      return null;
    }
  }
}

// Fetch token sales details
export async function fetchTokenSalesDetails(tokenId: string): Promise<any | null> {
  try {
    if (!isSupabaseAvailable) {
      console.log('📱 Using offline mode - falling back to static sales data');
      const { salesData } = await import('../data/sales');
      return salesData.find(sale => sale.name.toLowerCase() === tokenId.toLowerCase()) || null;
    }

    // Test connectivity first
    try {
      const testResponse = await supabase.from('token_sales_details').select('count').limit(0);
      if (testResponse.error && testResponse.error.message.includes('Failed to fetch')) {
        console.warn('🔌 Supabase connectivity issue, falling back to static sales data');
        const { salesData } = await import('../data/sales');
        return salesData.find(sale => sale.name.toLowerCase() === tokenId.toLowerCase()) || null;
      }
    } catch (connectivityError) {
      console.warn('🔌 Supabase connectivity test failed, falling back to static sales data');
      const { salesData } = await import('../data/sales');
      return salesData.find(sale => sale.name.toLowerCase() === tokenId.toLowerCase()) || null;
    }

    console.log(`🔄 Fetching sales details for ${tokenId} from Supabase`);
    const { data, error } = await supabase
      .from('token_sales_details')
      .select('*')
      .eq('token_id', tokenId)
      .maybeSingle();

    if (error) {
      if (error.message.includes('Failed to fetch')) {
        console.warn(`🔌 Network error fetching sales details for ${tokenId}, falling back to static data`);
      } else {
        console.warn(`Sales details error for ${tokenId}: ${error.message}`);
      }
      const { salesData } = await('../data/sales');
      return salesData.find(sale => sale.name.toLowerCase() === tokenId.toLowerCase()) || null;
    }

    if (!data) {
      console.warn(`Sales details not found for ${tokenId}, checking static data`);
      const { salesData } = await import('../data/sales');
      return salesData.find(sale => sale.name.toLowerCase() === tokenId.toLowerCase()) || null;
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
    if (!isSupabaseAvailable) {
      return null;
    }

    // Test connectivity first
    try {
      const testResponse = await supabase.from('token_info').select('count').limit(0);
      if (testResponse.error && testResponse.error.message.includes('Failed to fetch')) {
        return null;
      }
    } catch (connectivityError) {
      return null;
    }

    const { data, error } = await supabase
      .from('token_info')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      if (!error.message.includes('Failed to fetch')) {
        logError(error as Error, 'getTokensLastUpdate');
      }
      return null;
    }
    
    if (!data || data.length === 0) {
      return null;
    }

    return new Date(data[0].updated_at).toLocaleString();
  } catch (error) {
    logError(error as Error, 'getTokensLastUpdate');
    return null;
  }
}