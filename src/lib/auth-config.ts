import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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
