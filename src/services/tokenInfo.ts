import { Token } from '../types';
import { supabase, isSupabaseAvailable } from './supabaseClient';

// Function to get token info from the database
export async function getTokenInfo(tokenId: string): Promise<Partial<Token> | null> {
  try {
    if (!isSupabaseAvailable) {
      console.warn('Token info feature not available - Supabase not configured');
      return null;
    }

    const { data, error } = await supabase
      .from('token_info')
      .select('data')
      .eq('token_id', tokenId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching token info:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    console.log(`📊 Retrieved token info for ${tokenId}`);
    return data.data as Partial<Token>;
  } catch (error) {
    console.error('Error in getTokenInfo:', error);
    return null;
  }
}

// Function to get all token info
export async function getAllTokenInfo(): Promise<Record<string, Partial<Token>> | null> {
  try {
    if (!isSupabaseAvailable) {
      console.warn('Token info feature not available - Supabase not configured');
      return null;
    }

    const { data, error } = await supabase
      .from('token_info')
      .select('token_id, data');

    if (error) {
      console.error('Error fetching all token info:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Convert array to record with token_id as key
    const tokenInfoMap: Record<string, Partial<Token>> = {};
    for (const item of data) {
      tokenInfoMap[item.token_id] = item.data as Partial<Token>;
    }

    console.log(`📊 Retrieved info for ${Object.keys(tokenInfoMap).length} tokens`);
    return tokenInfoMap;
  } catch (error) {
    console.error('Error in getAllTokenInfo:', error);
    return null;
  }
}

// Get the latest update timestamp
export async function getLastUpdateTime(): Promise<string | null> {
  try {
    if (!isSupabaseAvailable) {
      return null;
    }

    const { data, error } = await supabase
      .from('token_info')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    return new Date(data[0].updated_at).toLocaleString();
  } catch (error) {
    console.error('Error getting last update time:', error);
    return null;
  }
}