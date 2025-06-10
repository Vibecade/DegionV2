import { supabase, safeSupabaseOperation } from './supabaseClient';
import { logError } from '../utils/errorLogger';

export interface TokenInfo {
  id: string;
  name: string;
  status: string;
  launchDate: string;
  seedPrice: string;
  vestingEnd?: string;
  description?: string;
  links?: Record<string, string>;
}

// Get static token info as fallback
async function getStaticTokenInfo(tokenId: string): Promise<TokenInfo | null> {
  try {
    const { tokens } = await import('../data/tokens');
    const token = tokens.find(t => t.id.toLowerCase() === tokenId.toLowerCase());
    
    if (!token) return null;
    
    return {
      id: token.id,
      name: token.name,
      status: token.status,
      launchDate: token.launchDate,
      seedPrice: token.seedPrice,
      vestingEnd: token.vestingEnd,
      description: token.description,
      links: token.links
    };
  } catch (error) {
    logError(error as Error, 'getStaticTokenInfo', { tokenId });
    return null;
  }
}

export async function getTokenInfo(tokenId: string): Promise<TokenInfo | null> {
  try {
    console.log(`🔄 Fetching token info for ${tokenId}`);
    
    // Get static data as fallback
    const staticTokenInfo = await getStaticTokenInfo(tokenId);
    
    // Try to fetch from Supabase with automatic fallback
    const { data, error, usedFallback } = await safeSupabaseOperation(
      () => supabase
        .from('token_info')
        .select('*')
        .eq('token_id', tokenId)
        .maybeSingle(),
      staticTokenInfo
    );

    if (usedFallback) {
      console.warn(`🔌 Using static token info for ${tokenId} due to database connection issues`);
      return staticTokenInfo;
    }

    if (error) {
      console.warn(`Token info error for ${tokenId}, using static data:`, error.message);
      return staticTokenInfo;
    }

    if (!data) {
      console.warn(`Token info not found for ${tokenId}, using static data`);
      return staticTokenInfo;
    }

    // Transform database data
    const tokenInfo: TokenInfo = {
      id: data.token_id,
      name: data.name || data.token_id,
      status: data.status || 'ICO Soon',
      launchDate: data.launch_date || 'TBD',
      seedPrice: data.seed_price || 'TBD',
      vestingEnd: data.vesting_end,
      description: data.description,
      links: data.links || {}
    };

    console.log(`✅ Fetched token info for ${tokenId}`);
    return tokenInfo;

  } catch (error) {
    logError(error as Error, 'getTokenInfo', { tokenId });
    
    // Fallback to static data
    return await getStaticTokenInfo(tokenId);
  }
}

export async function updateTokenInfo(tokenId: string, updates: Partial<TokenInfo>): Promise<boolean> {
  try {
    const { error, usedFallback } = await safeSupabaseOperation(
      () => supabase
        .from('token_info')
        .upsert({
          token_id: tokenId,
          name: updates.name,
          status: updates.status,
          launch_date: updates.launchDate,
          seed_price: updates.seedPrice,
          vesting_end: updates.vestingEnd,
          description: updates.description,
          links: updates.links,
          updated_at: new Date().toISOString()
        }),
      null
    );

    if (usedFallback) {
      console.warn(`🔌 Cannot update token info for ${tokenId} - database not available`);
      return false;
    }

    if (error) {
      console.error(`Failed to update token info for ${tokenId}:`, error.message);
      return false;
    }

    console.log(`✅ Updated token info for ${tokenId}`);
    return true;

  } catch (error) {
    logError(error as Error, 'updateTokenInfo', { tokenId, updates });
    return false;
  }
}