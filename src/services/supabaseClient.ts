import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

// Create a mock client for when environment variables are missing or when network fails
const createMockClient = () => ({
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        maybeSingle: async () => ({ data: null, error: new Error('Supabase not available') }),
        gte: (column: string, value: any) => ({ data: [], error: new Error('Supabase not available') }),
        order: (column: string, options?: any) => ({
          limit: (count: number) => ({ data: [], error: new Error('Supabase not available') })
        })
      }),
      order: (column: string, options?: any) => ({
        limit: (count: number) => ({ data: [], error: new Error('Supabase not available') })
      })
    }),
    upsert: async (data: any, options?: any) => ({ error: new Error('Supabase not available') }),
    insert: async (data: any) => ({ 
      error: new Error('Supabase not available'),
      select: () => ({
        single: async () => ({ data: null, error: new Error('Supabase not available') })
      })
    })
  })
});

// Test Supabase connection
let isConnectionTested = false;
let connectionWorking = false;

async function testSupabaseConnection(): Promise<boolean> {
  if (isConnectionTested) {
    return connectionWorking;
  }

  if (!supabaseUrl || !supabaseKey) {
    isConnectionTested = true;
    connectionWorking = false;
    return false;
  }

  try {
    const testClient = createClient(supabaseUrl, supabaseKey);
    // Try a simple query to test connection
    const { error } = await testClient.from('token_info').select('count').limit(1);
    
    isConnectionTested = true;
    connectionWorking = !error;
    
    if (connectionWorking) {
      console.log('✅ Supabase connection test successful');
    } else {
      console.warn('⚠️ Supabase connection test failed:', error?.message);
    }
    
    return connectionWorking;
  } catch (error) {
    console.warn('⚠️ Supabase connection test failed:', error);
    isConnectionTested = true;
    connectionWorking = false;
    return false;
  }
}

// Export either real client or mock client
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : createMockClient();

// Export a flag to check if Supabase is available
export const isSupabaseAvailable = !!(supabaseUrl && supabaseKey);

// Export connection test function
export { testSupabaseConnection };

// Enhanced wrapper for Supabase operations with automatic fallback
export async function safeSupabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  fallbackData: T | null = null
): Promise<{ data: T | null; error: any; usedFallback: boolean }> {
  if (!isSupabaseAvailable) {
    return { 
      data: fallbackData, 
      error: new Error('Supabase not configured'), 
      usedFallback: true 
    };
  }

  try {
    const result = await operation();
    
    // Check if the error is a network error
    if (result.error && (
      result.error.message?.includes('Failed to fetch') ||
      result.error.message?.includes('NetworkError') ||
      result.error.message?.includes('fetch')
    )) {
      console.warn('🔌 Network error detected, using fallback data');
      return { 
        data: fallbackData, 
        error: result.error, 
        usedFallback: true 
      };
    }
    
    return { ...result, usedFallback: false };
  } catch (error) {
    console.warn('🔌 Supabase operation failed, using fallback data:', error);
    return { 
      data: fallbackData, 
      error: error as Error, 
      usedFallback: true 
    };
  }
}

if (!isSupabaseAvailable) {
  console.warn('🔌 Supabase environment variables not configured. Running in offline mode.');
  console.warn('📝 To enable full functionality, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');
} else {
  console.log('✅ Supabase client initialized');
  // Test connection in background
  testSupabaseConnection().catch(() => {
    console.warn('🔌 Initial Supabase connection test failed - will fall back to static data');
  });
}