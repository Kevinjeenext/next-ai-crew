import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const SUPABASE_CONFIGURED = !!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

if (!SUPABASE_CONFIGURED) {
  console.warn(
    "[Next AI Crew] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. " +
      "Supabase features will be unavailable.",
  );
}

/**
 * Admin client using service role key — bypasses RLS.
 * Use for server-side operations only.
 *
 * When env vars are missing, creates a dummy client that will fail gracefully
 * on actual API calls rather than crashing at import time.
 */
export const supabaseAdmin: SupabaseClient = SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: "public" },
    })
  : createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: "public" },
    });

/**
 * Create a per-request Supabase client that respects RLS
 * by forwarding the user's JWT access token.
 */
export function createSupabaseClient(accessToken?: string): SupabaseClient {
  if (!SUPABASE_CONFIGURED) {
    console.warn("[Next AI Crew] createSupabaseClient called without Supabase config");
  }
  return createClient(
    SUPABASE_URL || "https://placeholder.supabase.co",
    SUPABASE_ANON_KEY || "placeholder-key",
    {
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: "public" },
    },
  );
}

export { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_CONFIGURED };
