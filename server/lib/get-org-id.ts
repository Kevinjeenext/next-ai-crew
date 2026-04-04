/**
 * Extract org_id from authenticated user.
 *
 * Architecture (CTO Soojin):
 * Phase 1 (MVP): 1 user = 1 org. Auto-create org on signup.
 * Phase 2: Multi-org support with org selector UI.
 *
 * Server-side: JWT auth.uid() → org_members → org_id
 * Client-side: RLS handles filtering automatically via get_user_org_ids()
 */
import { supabaseAdmin } from "./supabase.ts";

/**
 * Get the org_id for a given user.
 * Returns the first (and in MVP, only) org the user belongs to.
 */
export async function getOrgIdForUser(userId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("org_members")
    .select("org_id")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(`No organization found for user ${userId}`);
  }

  return data.org_id;
}

/**
 * Create an organization for a new user (called on signup).
 * Sets up org + org_members entry with 'owner' role.
 */
export async function createOrgForUser(
  userId: string,
  orgName: string,
  orgSlug?: string,
): Promise<string> {
  const slug = orgSlug ?? orgName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");

  // Create organization
  const { data: org, error: orgError } = await supabaseAdmin
    .from("organizations")
    .insert({
      name: orgName,
      slug,
      owner_id: userId,
      plan: "free",
    })
    .select("id")
    .single();

  if (orgError || !org) {
    throw new Error(`Failed to create organization: ${orgError?.message}`);
  }

  // Add user as owner
  const { error: memberError } = await supabaseAdmin
    .from("org_members")
    .insert({
      org_id: org.id,
      user_id: userId,
      role: "owner",
    });

  if (memberError) {
    throw new Error(`Failed to add org member: ${memberError.message}`);
  }

  return org.id;
}

/**
 * Extract org_id from Express request.
 * Reads the Supabase JWT from Authorization header, gets user_id,
 * then looks up org_id.
 *
 * For MVP server-side (service_role key), we trust the JWT.
 */
export async function getOrgIdFromRequest(req: {
  headers?: Record<string, string | string[] | undefined>;
  get?: (name: string) => string | undefined;
}): Promise<string> {
  // Get auth token from request
  const authHeader = req.get?.("authorization") ?? req.headers?.authorization;
  const token = typeof authHeader === "string" ? authHeader.replace("Bearer ", "") : undefined;

  if (!token) {
    throw new Error("No authorization token provided");
  }

  // Verify JWT and get user
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    throw new Error(`Invalid auth token: ${error?.message}`);
  }

  return getOrgIdForUser(user.id);
}
