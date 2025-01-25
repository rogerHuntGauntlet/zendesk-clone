import { createClient } from '@supabase/supabase-js'

// Client-side Supabase instance
export const createBrowserSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key, {
    auth: {
      persistSession: true,
      storageKey: 'sb-auth-token',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      detectSessionInUrl: true,
      flowType: 'pkce',
      autoRefreshToken: true,
      debug: process.env.NODE_ENV === 'development'
    },
    cookies: {
      name: 'sb-auth-token',
      lifetime: 60 * 60 * 24 * 7, // 7 days
      domain: '',
      path: '/',
      sameSite: 'lax'
    }
  });
};

// Server-side Supabase instance with fallback values during build
export const createServerSupabaseClient = () => {
  const isBuild = process.env.NODE_ENV === 'production' && typeof window === 'undefined';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || (isBuild ? 'http://localhost:54321' : undefined);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (isBuild ? 'dummy-key' : undefined);

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  });
};

// Create a singleton instance for the browser
export const supabase = typeof window !== 'undefined' ? createBrowserSupabaseClient() : createServerSupabaseClient();

export const getRedirectUrl = () => {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/auth/callback`
}
