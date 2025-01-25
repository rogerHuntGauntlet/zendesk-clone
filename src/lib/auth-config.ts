import { createClient } from '@supabase/supabase-js'

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

export const supabase = createClient(getSupabaseUrl(), getSupabaseKey(), {
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
})

export const getRedirectUrl = () => {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/auth/callback`
}
