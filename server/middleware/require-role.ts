/**
 * requireSystemRole — 시스템 레벨 권한 미들웨어
 * profiles.system_role 체크 (super_admin / admin / user)
 * 
 * Usage: app.get("/api/admin/stats", requireSystemRole("admin"), handler)
 *   → super_admin, admin 모두 통과 (hierarchy: super_admin > admin > user)
 */
import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase";

const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 3,
  admin: 2,
  user: 1,
};

export function requireSystemRole(minRole: "super_admin" | "admin" | "user" = "admin") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract user from auth header (JWT → user_id)
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const token = authHeader.slice(7);

      // Get user from Supabase JWT
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      // Lookup profile + system_role
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, system_role, is_active")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        // Profile might not exist yet (DDL not run) — fail gracefully
        return res.status(403).json({ error: "Profile not found. Admin DDL may not be applied." });
      }

      if (!profile.is_active) {
        return res.status(403).json({ error: "Account suspended" });
      }

      const userLevel = ROLE_HIERARCHY[profile.system_role] || 0;
      const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

      if (userLevel < requiredLevel) {
        return res.status(403).json({ error: `Requires ${minRole} role. Current: ${profile.system_role}` });
      }

      // Attach to request for downstream handlers
      (req as any).profile = profile;
      (req as any).systemRole = profile.system_role;
      next();
    } catch (err: any) {
      console.error("[requireSystemRole] Error:", err.message);
      return res.status(500).json({ error: "Authorization check failed" });
    }
  };
}

/**
 * Helper: get profile from request (set by requireSystemRole)
 */
export function getProfile(req: Request) {
  return (req as any).profile as {
    id: string;
    email: string;
    full_name: string;
    system_role: string;
    is_active: boolean;
  } | undefined;
}

/**
 * Helper: log admin action to audit log
 */
export async function logAdminAction(
  actorId: string,
  actorEmail: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, any>,
  ipAddress?: string | string[],
) {
  try {
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: actorId,
      actor_email: actorEmail,
      action,
      target_type: targetType || null,
      target_id: targetId || null,
      details: details || {},
      ip_address: (Array.isArray(ipAddress) ? ipAddress[0] : ipAddress) || null,
    });
  } catch (err: any) {
    // Don't fail the request if audit logging fails
    console.error("[audit] Failed to log:", err.message);
  }
}
