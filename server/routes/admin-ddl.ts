/**
 * POST /api/admin/ddl — Raw DDL execution via pg Pool
 * Security:
 *   - requireSystemRole('super_admin') only
 *   - Dangerous statement patterns are blocked (DROP DATABASE, DROP SCHEMA, TRUNCATE, etc.)
 *   - Audit log written to admin_audit_log table
 * Used for migration automation when exec_sql RPC is unavailable.
 */
import { Router } from "express";
import pkg from "pg";
const { Pool } = pkg;
import { requireSystemRole } from "../middleware/require-role.ts";
import { supabaseAdmin } from "../lib/supabase.ts";

const router = Router();

// Dangerous patterns to block
const BLOCKED_PATTERNS = [
  /DROP\s+DATABASE/i,
  /DROP\s+SCHEMA\s+(?!IF EXISTS\s+)(public|auth|storage|extensions)\b/i,
  /TRUNCATE\s+(ALL|TABLE)?\s*(profiles|organizations|agents|soul_rooms|soul_messages)/i,
  /DELETE\s+FROM\s+(profiles|organizations|agents)\s+WHERE\s+1\s*=\s*1/i,
  /\bSHUTDOWN\b/i,
  /pg_read_file|pg_write_file|pg_ls_dir/i,
  /COPY\s+.*\s+TO\s+'\/(?!tmp)/i,  // block COPY to arbitrary paths
];

router.post("/api/admin/ddl", requireSystemRole("super_admin"), async (req: any, res: any) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== "string") {
    return res.status(400).json({ error: "sql required" });
  }

  // Block dangerous patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(sql)) {
      // Audit log
      await supabaseAdmin.from("admin_audit_log").insert({
        actor_id: req.userId || "system",
        action: "ddl_blocked",
        target_type: "sql",
        details: { reason: "dangerous_pattern", pattern: pattern.toString(), sql_preview: sql.slice(0, 200) },
      }).catch(() => {});
      return res.status(403).json({ ok: false, error: "Blocked: dangerous SQL pattern detected", pattern: pattern.toString() });
    }
  }

  // Connect via DATABASE_URL (pg Transaction Pooler)
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10000,
  });

  let result: any = { ok: false };
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");
      result = { ok: true };
    } catch (err: any) {
      await client.query("ROLLBACK");
      result = { ok: false, error: err.message };
    } finally {
      client.release();
    }
  } catch (err: any) {
    result = { ok: false, error: err.message };
  } finally {
    await pool.end();
  }

  // Audit log
  await supabaseAdmin.from("admin_audit_log").insert({
    actor_id: req.userId || "system",
    action: result.ok ? "ddl_executed" : "ddl_failed",
    target_type: "sql",
    details: { sql_preview: sql.slice(0, 500), ok: result.ok, error: result.error || null },
  }).catch(() => {});

  res.status(result.ok ? 200 : 500).json(result);
});

export { router as adminDdlRoutes };
