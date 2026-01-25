import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function createClient() {
  if (typeof window === "undefined") {
    // Server-side, always create a new client
    return createSupabaseBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  // Client-side, reuse singleton instance
  if (!supabaseClient) {
    supabaseClient = createSupabaseBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  return supabaseClient;
}

export function createBrowserClient() {
  return createClient();
}
