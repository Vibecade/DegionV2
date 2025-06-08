import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a mock client for when environment variables are missing
const createMockClient = () => ({
  from: () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: null, error: null })
      })
    }),
    upsert: async () => ({ error: null }),
    insert: async () => ({ error: null })
  })
});

// Export either real client or mock client
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : createMockClient();

// Export a flag to check if Supabase is available
export const isSupabaseAvailable = !!(supabaseUrl && supabaseKey);

if (!isSupabaseAvailable) {
  console.warn('Supabase environment variables not configured. Running in offline mode.');
}