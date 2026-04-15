/**
 * Shared middleware: inject orgId + userId into request
 * Replaces duplicated inline middlewares in server-main-pg.ts
 *
 * Note: userId is extracted from the JWT to support permission checks
 * (e.g., budget POST requires tenant_admin role).
 */
import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase.ts";

export function requireOrgMiddleware(requireOrgFn: (req: any, res: any) => Promise<string | null>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = await requireOrgFn(req, res).catch(() => null);
      if (!orgId) return res.status(401).json({ error: "Unauthorized" });
      (req as any).orgId = orgId;

      // Extract userId from JWT for permission checks (best-effort)
      if (!(req as any).userId) {
        try {
          const authHeader = req.get("authorization");
          const token = authHeader?.replace("Bearer ", "");
          if (token) {
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            if (user) {
              (req as any).userId = user.id;
              (req as any).userEmail = user.email;
            }
          }
        } catch {
          // userId is best-effort — not all routes need it
        }
      }
    } catch { /* handled in route */ }
    next();
  };
}
