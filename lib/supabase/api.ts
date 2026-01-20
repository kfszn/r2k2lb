import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client for use in API routes
 * This doesn't require cookies and works in any server context
 */
export function createApiClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
