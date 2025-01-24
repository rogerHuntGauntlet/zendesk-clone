// This file is deprecated. Use createClientComponentClient from @supabase/auth-helpers-nextjs directly.
// Keeping this file temporarily for reference during migration.
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const createClient = () => {
  return createClientComponentClient();
};