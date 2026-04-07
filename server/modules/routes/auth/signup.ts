/**
 * Auth Signup Handler — auto-creates organization on first signup.
 *
 * Flow:
 * 1. User signs up via Supabase Auth (Google OAuth or email)
 * 2. Supabase webhook or client-side callback hits this endpoint
 * 3. We create an organization + add user as owner
 * 4. Seed default departments + workflow packs for the new org
 */
import { Router } from "express";
import { supabaseAdmin } from "../../../lib/supabase.ts";
import { createOrgForUser, getOrgIdForUser } from "../../../lib/get-org-id.ts";
import * as pgAdapter from "../../../db/pg-adapter.ts";

const router = Router();

/**
 * POST /api/auth/setup
 * Called after first login to ensure user has an organization.
 * Idempotent: if org already exists, returns existing org_id.
 */
router.post("/api/auth/setup", async (req, res) => {
  try {
    const authHeader = req.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No authorization token" });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Check if user already has an org
    try {
      const existingOrgId = await getOrgIdForUser(user.id);

      // Upgrade existing orgs on free/starter to team plan (trial)
      // This ensures Kevin and early users can create multiple agents
      const { data: existingOrg } = await supabaseAdmin
        .from("organizations")
        .select("plan")
        .eq("id", existingOrgId)
        .single();
      if (existingOrg && (existingOrg.plan === "free" || existingOrg.plan === "starter")) {
        await supabaseAdmin
          .from("organizations")
          .update({ plan: "team" })
          .eq("id", existingOrgId);
        console.log(`[Auth Setup] Upgraded org ${existingOrgId} from ${existingOrg.plan} → team`);
      }

      return res.json({
        org_id: existingOrgId,
        created: false,
        message: "Organization already exists",
      });
    } catch {
      // No org yet — create one
    }

    // Derive org name from user metadata
    const displayName = user.user_metadata?.full_name
      ?? user.user_metadata?.name
      ?? user.email?.split("@")[0]
      ?? "My Team";
    const orgName = `${displayName}'s Team`;

    const orgId = await createOrgForUser(user.id, orgName);

    // Seed default departments for new org
    const defaultDepartments = [
      { id: "engineering", name: "Engineering", name_ko: "엔지니어링", icon: "⚙️", color: "#3b82f6", sort_order: 1 },
      { id: "design", name: "Design", name_ko: "디자인", icon: "🎨", color: "#8b5cf6", sort_order: 2 },
      { id: "marketing", name: "Marketing", name_ko: "마케팅", icon: "📢", color: "#f59e0b", sort_order: 3 },
      { id: "planning", name: "Planning", name_ko: "기획", icon: "📊", color: "#6366f1", sort_order: 4 },
      { id: "operations", name: "Operations", name_ko: "운영", icon: "📋", color: "#10b981", sort_order: 5 },
    ];

    for (const dept of defaultDepartments) {
      await pgAdapter.insertRow("departments", { org_id: orgId, ...dept });
    }

    return res.status(201).json({
      org_id: orgId,
      created: true,
      message: "Organization created with default departments",
    });
  } catch (err: any) {
    console.error("[Auth Setup] Error:", err.message);
    return res.status(500).json({ error: "Failed to setup organization" });
  }
});

/**
 * GET /api/auth/me
 * Returns current user info + org context.
 */
router.get("/api/auth/me", async (req, res) => {
  try {
    const authHeader = req.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ error: "No authorization token" });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    let orgId: string | null = null;
    let orgRole: string | null = null;
    try {
      orgId = await getOrgIdForUser(user.id);
      // Get role
      const { data: member } = await supabaseAdmin
        .from("org_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("org_id", orgId)
        .single();
      orgRole = member?.role ?? null;
    } catch {
      // No org yet
    }

    return res.json({
      user_id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      org_id: orgId,
      org_role: orgRole,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to get user info" });
  }
});

export default router;
