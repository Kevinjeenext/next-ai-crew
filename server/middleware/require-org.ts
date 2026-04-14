/**
 * Shared middleware: inject orgId into request
 * Replaces 4 duplicated inline middlewares in server-main-pg.ts
 */
import type { Request, Response, NextFunction } from "express";

export function requireOrgMiddleware(requireOrgFn: (req: any, res: any) => Promise<string | null>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = await requireOrgFn(req, res).catch(() => null);
      if (!orgId) return res.status(401).json({ error: "Unauthorized" });
      (req as any).orgId = orgId;
    } catch { /* handled in route */ }
    next();
  };
}
