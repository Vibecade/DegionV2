import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
}

// Create a mock client for when environment variables are missing
const createMockClient = () => ({
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        maybeSingle: async () => ({ data: null, error: new Error('Supabase not configured') }),
        gte: (column: string, value: any) => ({ data: [], error: new Error('Supabase not configured') }),
        order: (column: string, options?: any) => ({
          limit: (count: number) => ({ data: [], error: new Error('Supabase not configured') })
        })
      }),
      order: (column: string, options?: any) => ({
        limit: (count: number) => ({ data: [], error: new Error('Supabase not configured') })
      })
    }),
    upsert: async (data: any, options?: any) => ({ error: new Error('Supabase not configured') }),
    insert: async (data: any) => ({ 
      error: new Error('Supabase not configured'),
      select: () => ({
        single: async () => ({ data: null, error: new Error('Supabase not configured') })
      })
    })
  })
});

// Export either real client or mock client
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : createMockClient();

// Export a flag to check if Supabase is available
export const isSupabaseAvailable = !!(supabaseUrl && supabaseKey);

if (!isSupabaseAvailable) {
  console.warn('🔌 Supabase environment variables not configured. Running in offline mode.');
  console.warn('📝 To enable full functionality, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');
} else {
  console.log('✅ Supabase connection established');
}