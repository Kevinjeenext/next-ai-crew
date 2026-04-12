/**
 * Admin API Routes — /api/admin/*
 * Requires system_role: admin or super_admin
 * 
 * Architecture: Soojin CTO admin-backoffice-architecture.md
 */
import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { requireSystemRole, getProfile, logAdminAction } from "../middleware/require-role";

const router = Router();

// ─── GET /api/auth/me ─── (public for authenticated users)
// Returns profile + system_role + org memberships
router.get("/api/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const token = authHeader.slice(7);

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Get profile (may not exist if DDL not run)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, avatar_url, system_role, is_active, metadata, created_at")
      .eq("id", user.id)
      .single();

    // Get org memberships
    const { data: memberships } = await supabaseAdmin
      .from("org_members")
      .select("org_id, role, organizations(id, name, slug, status)")
      .eq("user_id", user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        ...(profile || {}),
        system_role: profile?.system_role || "user",
      },
      orgs: (memberships || []).map((m: any) => ({
        org_id: m.org_id,
        role: m.role,
        ...(m.organizations || {}),
      })),
    });
  } catch (err: any) {
    console.error("[API] GET /api/auth/me error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── All /api/admin/* routes require admin role ───
router.use("/api/admin", requireSystemRole("admin"));

// ─── GET /api/admin/stats ───
router.get("/api/admin/stats", async (req, res) => {
  try {
    const [usersRes, orgsRes, agentsRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("organizations").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("agents").select("id", { count: "exact", head: true }),
    ]);

    res.json({
      total_users: usersRes.count || 0,
      total_tenants: orgsRes.count || 0,
      total_souls: agentsRes.count || 0,
      // MRR placeholder — will connect to StepPay later
      mrr: 0,
    });
  } catch (err: any) {
    console.error("[API] GET /api/admin/stats error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/users ───
router.get("/api/admin/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const search = (req.query.search as string) || "";
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, avatar_url, system_role, is_active, created_at, last_sign_in_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    res.json({ users: data || [], total: count || 0, page, limit });
  } catch (err: any) {
    console.error("[API] GET /api/admin/users error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/admin/users/:id/role ─── (super_admin only)
router.put("/api/admin/users/:id/role", requireSystemRole("super_admin"), async (req, res) => {
  try {
    const id = req.params.id as string;
    const { system_role } = req.body;
    const profile = getProfile(req);

    if (!["super_admin", "admin", "user"].includes(system_role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ system_role, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(
      profile!.id, profile!.email, "change_user_role",
      "user", id, { new_role: system_role },
      req.ip
    );

    res.json({ ok: true, user: data });
  } catch (err: any) {
    console.error("[API] PUT /api/admin/users/:id/role error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/tenants ───
router.get("/api/admin/tenants", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabaseAdmin
      .from("organizations")
      .select("id, name, slug, status, max_souls, max_members, trial_ends_at, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({ tenants: data || [], total: count || 0, page, limit });
  } catch (err: any) {
    console.error("[API] GET /api/admin/tenants error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/admin/tenants/:id ─── (status change)
router.put("/api/admin/tenants/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const { status, max_souls, max_members, suspended_reason } = req.body;
    const profile = getProfile(req);

    const updates: Record<string, any> = {};
    if (status) updates.status = status;
    if (max_souls !== undefined) updates.max_souls = max_souls;
    if (max_members !== undefined) updates.max_members = max_members;
    if (suspended_reason !== undefined) updates.suspended_reason = suspended_reason;

    const { data, error } = await supabaseAdmin
      .from("organizations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(
      profile!.id, profile!.email, "update_tenant",
      "organization", id, updates, req.ip
    );

    res.json({ ok: true, tenant: data });
  } catch (err: any) {
    console.error("[API] PUT /api/admin/tenants/:id error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/admin/audit-log ───
router.get("/api/admin/audit-log", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const { data, error } = await supabaseAdmin
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json({ logs: data || [] });
  } catch (err: any) {
    console.error("[API] GET /api/admin/audit-log error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
