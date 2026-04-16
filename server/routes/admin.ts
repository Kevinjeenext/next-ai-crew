/**
 * Admin API Routes — /api/admin/*
 * Requires system_role: admin or super_admin
 * 
 * Architecture: Soojin CTO admin-backoffice-architecture.md
 */
import { Router } from "express";
import pg from "pg";
import { supabaseAdmin } from "../lib/supabase";
import { requireSystemRole, getProfile, logAdminAction } from "../middleware/require-role";

const router = Router();

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
      req.get("x-forwarded-for") || req.ip
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
      "organization", id, updates, req.get("x-forwarded-for") || req.ip
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

// ─── GET /api/admin/settings ───
router.get("/api/admin/settings", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("system_settings")
      .select("key, value, updated_at");
    if (error) throw error;
    // Convert array to object map
    const settings: Record<string, any> = {};
    for (const row of (data || [])) {
      settings[row.key] = { value: row.value, updated_at: row.updated_at };
    }
    res.json({ settings });
  } catch (err: any) {
    console.error("[API] GET /api/admin/settings error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/admin/settings/:key ─── (super_admin only)
router.put("/api/admin/settings/:key", requireSystemRole("super_admin"), async (req, res) => {
  try {
    const key = req.params.key as string;
    const { value } = req.body;
    const profile = getProfile(req);

    const { data, error } = await supabaseAdmin
      .from("system_settings")
      .upsert({ key, value: JSON.parse(JSON.stringify(value)), updated_by: profile!.id, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (error) throw error;

    await logAdminAction(
      profile!.id, profile!.email, "update_setting",
      "system_settings", key, { value }, req.get("x-forwarded-for") || req.ip
    );

    res.json({ ok: true, setting: data });
  } catch (err: any) {
    console.error("[API] PUT /api/admin/settings/:key error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/admin/ddl ─── (super_admin only)
// Execute DDL statements directly via pg Pool (for schema migrations)
router.post("/api/admin/ddl", requireSystemRole("super_admin"), async (req, res) => {
  try {
    const profile = getProfile(req);
    const { sql } = req.body;

    if (!sql || typeof sql !== "string") {
      return res.status(400).json({ error: "sql field required (string)" });
    }

    // Safety: block destructive operations on critical tables
    const sqlLower = sql.toLowerCase().trim();
    const blocked = ["drop database", "drop schema public", "truncate auth."];
    for (const b of blocked) {
      if (sqlLower.includes(b)) {
        return res.status(403).json({ error: `Blocked operation: ${b}` });
      }
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return res.status(500).json({ error: "DATABASE_URL not configured" });
    }

    // Execute via pg Pool
    const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
    try {
      const result = await pool.query(sql);
      await logAdminAction(
        profile!.id, profile!.email, "execute_ddl",
        "database", undefined,
        { sql_preview: sql.slice(0, 500), rows_affected: result.rowCount },
        req.get("x-forwarded-for") || req.ip
      );

      res.json({
        ok: true,
        command: result.command,
        rows_affected: result.rowCount,
        message: "DDL 실행 완료",
      });
    } finally {
      await pool.end();
    }
  } catch (err: any) {
    console.error("[API] POST /api/admin/ddl error:", err.message);
    res.status(500).json({ error: err.message, detail: err.detail || null });
  }
});

export default router;
