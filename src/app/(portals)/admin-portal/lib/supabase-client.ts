import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

let supabaseInstance: ReturnType<typeof createClientComponentClient> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    console.log('[SupabaseClient] Creating new instance');
    supabaseInstance = createClientComponentClient();
  }
  return supabaseInstance;
};
