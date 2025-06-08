import { createClient } from '@supabase/supabase-js';
import { Token } from '../types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that we have the required environment variables
let supabase;
try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    console.warn('Supabase environment variables not configured');
    supabase = null;
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  supabase = null;
}

// Function to get token info from the database
export async function getTokenInfo(tokenId: string): Promise<Partial<Token> | null> {
  try {
    if (!supabase) {
      console.warn('Supabase environment variables not configured. Skipping token info lookup.');
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

    return data.data as Partial<Token>;
  } catch (error) {
    console.error('Error in getTokenInfo:', error);
    return null;
  }
}

// Function to get all token info
export async function getAllTokenInfo(): Promise<Record<string, Partial<Token>> | null> {
  try {
    if (!supabase) {
      console.warn('Supabase environment variables not configured. Skipping token info lookup.');
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

    return tokenInfoMap;
  } catch (error) {
    console.error('Error in getAllTokenInfo:', error);
    return null;
  }
}

// Get the latest update timestamp
export async function getLastUpdateTime(): Promise<string | null> {
  try {
    if (!supabase) {
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