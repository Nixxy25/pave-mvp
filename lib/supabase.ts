import { createClient } from '@supabase/supabase-js';

// Server-only: never import this file from client components or hooks
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);
