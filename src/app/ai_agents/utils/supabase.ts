import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role
export const getServiceClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables for Supabase connection');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
};

// Utility to handle database errors
export const handleDatabaseError = (error: any, operation: string) => {
  console.error(`Database error during ${operation}:`, error?.message || error);
  if (error?.code) console.error('Error code:', error.code);
  if (error?.details) console.error('Error details:', error.details);
  if (error?.hint) console.error('Error hint:', error.hint);
  throw error;
};

// Utility to validate required environment variables
export const validateEnvironment = () => {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
