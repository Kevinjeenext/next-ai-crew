/**
 * Plan Limit Middleware — Agent count enforcement
 * CTO Soojin architecture: checkAgentLimit + requireAgentSlot
 */

import { supabaseAdmin, SUPABASE_CONFIGURED } from "../lib/supabase.ts";

interface AgentLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  plan: string;
}

const FALLBACK_LIMITS: Record<string, number> = {
  free: 1,
  starter: 3,
  pro: 5,
  max: 10,
  enterprise: -1,
};

/**
 * Check if org can create another agent
 */
export async function checkAgentLimit(orgId: string): Promise<AgentLimitResult> {
  if (!SUPABASE_CONFIGURED) {
    return { allowed: true, current: 0, limit: -1, plan: "dev" };
  }

  const { data: org, error: orgErr } = await supabaseAdmin
    .from("organizations")
    .select("plan, agent_limit")
    .eq("id", orgId)
    .single();

  if (orgErr || !org) {
    console.error("[plan-limit] Org lookup failed:", orgErr?.message);
    // Fail open for MVP — don't block if DB is unreachable
    return { allowed: true, current: 0, limit: -1, plan: "unknown" };
  }

  const limit = org.agent_limit ?? FALLBACK_LIMITS[org.plan] ?? 1;

  // Unlimited
  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1, plan: org.plan };
  }

  const { count, error: countErr } = await supabaseAdmin
    .from("agents")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId);

  if (countErr) {
    console.error("[plan-limit] Agent count failed:", countErr.message);
    return { allowed: true, current: 0, limit, plan: org.plan };
  }

  const current = count ?? 0;

  return {
    allowed: current < limit,
    current,
    limit,
    plan: org.plan,
  };
}

/**
 * Express middleware: block agent creation if limit reached (402)
 */
export function requireAgentSlot() {
  return async (req: any, res: any, next: any) => {
    try {
      const orgId = req.orgId;
      if (!orgId) return next(); // No org context → skip

      const result = await checkAgentLimit(orgId);

      if (!result.allowed) {
        return res.status(402).json({
          error: "Agent limit reached",
          current: result.current,
          limit: result.limit,
          plan: result.plan,
          upgrade_url: "/pricing",
          message: `Your ${result.plan} plan allows ${result.limit} agent(s). Upgrade to add more.`,
        });
      }

      res.set("X-Agent-Current", String(result.current));
      res.set("X-Agent-Limit", String(result.limit));
      next();
    } catch (err: any) {
      console.error("[plan-limit] Middleware error:", err.message);
      next(); // Fail open
    }
  };
}
