/**
 * Supabase DB Shim — runtime initialization for PG mode.
 *
 * org_id strategy (CTO Soojin architecture guide):
 * - MVP: 1 user = 1 org, auto-created on signup
 * - Auth JWT → org_members → org_id (no hardcoding)
 * - RLS policies handle tenant isolation automatically
 */
import { supabaseAdmin } from "../lib/supabase.ts";
import { getOrgIdFromRequest, getOrgIdForUser, createOrgForUser } from "../lib/get-org-id.ts";

export { getOrgIdFromRequest, getOrgIdForUser, createOrgForUser };

/**
 * Initialize the Supabase-backed runtime.
 * Verifies DB connection and logs status.
 */
export async function initializeSupabaseRuntime(): Promise<void> {
  console.log("[Next AI Crew] Initializing Supabase runtime...");

  // Verify connection by querying organizations table
  const { error } = await supabaseAdmin
    .from("organizations")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("[Next AI Crew] Supabase connection failed:", error.message);
    console.error("[Next AI Crew] Make sure the DDL has been run in Supabase SQL Editor.");
    throw error;
  }

  console.log("[Next AI Crew] Supabase runtime ready. Connection verified.");
}
