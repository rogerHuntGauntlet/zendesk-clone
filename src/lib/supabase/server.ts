import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url && process.env.NODE_ENV === 'production') {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }
  return url || 'http://localhost:54321'; // Fallback for build time
};

const getSupabaseKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key && process.env.NODE_ENV === 'production') {
    console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return key || 'dummy-key-for-build-time';
};

export const createClient = () => {
  return createSupabaseClient(getSupabaseUrl(), getSupabaseKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
};