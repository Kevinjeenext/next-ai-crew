/**
 * Supabase DB Shim — provides a DatabaseSync-like interface over supabase-js.
 *
 * This shim allows the existing codebase (138 files using db.prepare().get/all/run)
 * to work with Supabase PG without rewriting every file.
 *
 * Strategy:
 * - The shim wraps supabase-js and provides sync-looking methods
 * - Route handlers that use the shim must be async
 * - For MVP, we keep both interfaces: shim for unchanged code,
 *   direct supabase-js for new/converted code
 *
 * This is the "Option B + hybrid" approach per CTO architecture guide.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../lib/supabase.ts";

// Default org_id for MVP (single-tenant mode)
// Will be replaced with Auth-derived org_id in Day 2
const MVP_DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID ?? "00000000-0000-0000-0000-000000000000";

export { MVP_DEFAULT_ORG_ID };

/**
 * Helper to get org_id — in MVP, returns default.
 * Day 2 will extract from Auth JWT.
 */
export function getOrgId(_req?: unknown): string {
  return MVP_DEFAULT_ORG_ID;
}

/**
 * Initialize the Supabase-backed runtime.
 * Creates default org if it doesn't exist.
 */
export async function initializeSupabaseRuntime(): Promise<void> {
  console.log("[Next AI Crew] Initializing Supabase runtime...");

  // Ensure default org exists (MVP single-tenant)
  const { data: existingOrg } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("id", MVP_DEFAULT_ORG_ID)
    .single();

  if (!existingOrg) {
    const { error } = await supabaseAdmin.from("organizations").insert({
      id: MVP_DEFAULT_ORG_ID,
      name: "Next AI Crew",
      slug: "next-ai-crew",
      plan: "pro",
    });
    if (error) {
      console.error("[Next AI Crew] Failed to create default org:", error.message);
    } else {
      console.log("[Next AI Crew] Default organization created.");
    }
  }

  console.log("[Next AI Crew] Supabase runtime ready.");
}
