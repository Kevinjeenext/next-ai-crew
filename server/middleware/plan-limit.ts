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
  pro: 10,
  team: 20,
  max: 50,
  enterprise: -1,
  trial: -1, // Unlimited during trial
};

/**
 * Check if org can create another agent
 */
export async function checkAgentLimit(orgId: string): Promise<AgentLimitResult> {
  // DEMO_BYPASS: env flag to completely disable limit checks (for demos/testing)
  if (process.env.DEMO_BYPASS_LIMITS === "true") {
    console.log(`[plan-limit] DEMO_BYPASS_LIMITS=true — skipping limit check for org ${orgId}`);
    return { allowed: true, current: 0, limit: -1, plan: "demo" };
  }

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
    // Fail open — don't block if DB is unreachable
    return { allowed: true, current: 0, limit: -1, plan: "unknown" };
  }

  // Auto-upgrade free/starter orgs to team
  if (org.plan === "free" || org.plan === "starter") {
    console.log(`[plan-limit] Auto-upgrading org ${orgId} from ${org.plan} → team (agent_limit=20)`);
    const { error: upErr } = await supabaseAdmin
      .from("organizations")
      .update({ plan: "team", agent_limit: 20 })
      .eq("id", orgId);
    if (upErr) {
      console.error(`[plan-limit] Upgrade failed (fail-open):`, upErr.message);
      // Fail open: allow creation even if upgrade failed
      return { allowed: true, current: 0, limit: -1, plan: "team" };
    }
    org.plan = "team";
    org.agent_limit = 20;
  }

  // agent_limit in DB: use it only if it's a meaningful value (>= team default)
  // If it's set to a low value (1 or 3 from old free/starter era), ignore it
  const dbLimit = (org.agent_limit != null && org.agent_limit > 3) ? org.agent_limit : null;
  const limit = dbLimit ?? FALLBACK_LIMITS[org.plan] ?? 20;
  console.log(`[plan-limit] org=${orgId} plan=${org.plan} db_limit=${org.agent_limit} effective_limit=${limit}`);

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
