/**
 * Token Usage Dashboard API
 * GET  /api/usage/summary      — Org-level usage summary (current month)
 * GET  /api/usage/souls         — Per-Soul usage breakdown
 * GET  /api/usage/history       — Daily usage history (last 30 days)
 * GET  /api/usage/budget        — Budget status + plan limits
 * POST /api/usage/budget        — Update budget settings (tenant_admin+ only)
 *
 * Tables: soul_usage, org_token_budgets, organizations
 * Author: Mingu (Backend Developer) | 2026-04-15
 */

import { Router, type Request, type Response } from "express";
import { supabaseAdmin, SUPABASE_CONFIGURED } from "../lib/supabase.ts";

// ── Helper: check if user is org admin/owner ──
async function isOrgAdmin(userId: string, orgId: string): Promise<boolean> {
  if (!SUPABASE_CONFIGURED || !userId) return false;
  try {
    const { data } = await supabaseAdmin
      .from("org_members")
      .select("role")
      .eq("user_id", userId)
      .eq("org_id", orgId)
      .single();
    return data?.role === "owner" || data?.role === "admin";
  } catch {
    return false;
  }
}

const router = Router();

// ── Helper: current billing period (YYYY-MM) ──
function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ── Plan token limits (monthly) ──
const PLAN_TOKEN_LIMITS: Record<string, number> = {
  free: 50_000,
  starter: 200_000,
  pro: 1_000_000,
  team: 3_000_000,
  max: 10_000_000,
  business: 10_000_000,
  enterprise: -1,  // unlimited
  trial: 500_000,
  demo: -1,
};

// Config: 나중에 system_settings or plan_limits 테이블로 이동 예정
const OVERAGE_RATE_PER_1K = Number(process.env.OVERAGE_RATE_PER_1K) || 15; // ₩15 per 1K tokens

/**
 * GET /api/usage/summary
 * Org-level token usage summary for current billing period.
 */
router.get("/summary", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const period = (req.query.period as string) || currentPeriod();

    if (!SUPABASE_CONFIGURED) {
      return res.json({
        period,
        total_tokens: 0,
        prompt_tokens: 0,
        completion_tokens: 0,
        message_count: 0,
        active_souls: 0,
        budget_limit: -1,
        budget_used_pct: 0,
        plan: "dev",
      });
    }

    // Aggregate soul_usage for org in period
    const { data: usageRows, error: usageErr } = await supabaseAdmin
      .from("soul_usage")
      .select("total_tokens, prompt_tokens_sum, completion_tokens_sum, message_count, agent_id")
      .eq("org_id", orgId)
      .eq("period", period);

    if (usageErr) {
      console.error("[usage] summary query failed:", usageErr.message);
      // Graceful fallback: soul_usage table may not exist or have schema mismatch
      return res.json({
        period,
        total_tokens: 0,
        prompt_tokens: 0,
        completion_tokens: 0,
        message_count: 0,
        active_souls: 0,
        budget_limit: -1,
        budget_used_pct: 0,
        plan: "unknown",
        note: "soul_usage 테이블 조회 실패 — DDL 미실행 또는 스키마 불일치",
      });
    }

    const rows = usageRows || [];
    const totalTokens = rows.reduce((sum, r) => sum + (r.total_tokens || 0), 0);
    const promptTokens = rows.reduce((sum, r) => sum + (r.prompt_tokens_sum || 0), 0);
    const completionTokens = rows.reduce((sum, r) => sum + (r.completion_tokens_sum || 0), 0);
    const messageCount = rows.reduce((sum, r) => sum + (r.message_count || 0), 0);
    const activeSouls = new Set(rows.map((r) => r.agent_id)).size;

    // Get budget info
    const { data: budget } = await supabaseAdmin
      .from("org_token_budgets")
      .select("tokens_used, monthly_budget")
      .eq("org_id", orgId)
      .maybeSingle();

    // Get org plan
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("plan")
      .eq("id", orgId)
      .single();

    const plan = org?.plan || "starter";
    const planLimit = PLAN_TOKEN_LIMITS[plan] ?? PLAN_TOKEN_LIMITS.starter;
    const budgetLimit = budget?.monthly_budget || planLimit;
    const budgetUsedPct = budgetLimit > 0
      ? Math.round((totalTokens / budgetLimit) * 100)
      : 0;

    // Calculate overage cost
    const overageTokens = budgetLimit > 0 ? Math.max(0, totalTokens - budgetLimit) : 0;
    const overageCostKrw = Math.ceil(overageTokens / 1000) * OVERAGE_RATE_PER_1K;

    res.json({
      period,
      total_tokens: totalTokens,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      message_count: messageCount,
      active_souls: activeSouls,
      budget_limit: budgetLimit,
      budget_used_pct: budgetUsedPct,
      overage_tokens: overageTokens,
      overage_cost_krw: overageCostKrw,
      plan,
    });
  } catch (err: any) {
    console.error("[usage] summary error:", err.message);
    res.status(500).json({ error: "Failed to fetch usage summary" });
  }
});

/**
 * GET /api/usage/souls
 * Per-Soul token usage breakdown for current period.
 */
router.get("/souls", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const period = (req.query.period as string) || currentPeriod();

    if (!SUPABASE_CONFIGURED) {
      return res.json({ period, souls: [] });
    }

    // Get usage per soul
    const { data: usageRows, error } = await supabaseAdmin
      .from("soul_usage")
      .select("agent_id, total_tokens, prompt_tokens_sum, completion_tokens_sum, message_count, last_model_used, updated_at")
      .eq("org_id", orgId)
      .eq("period", period)
      .order("total_tokens", { ascending: false });

    if (error) {
      console.error("[usage] souls query failed:", error.message);
      return res.json({ period, souls: [], note: "soul_usage 테이블 조회 실패" });
    }

    // Enrich with soul names
    const agentIds = (usageRows || []).map((r) => r.agent_id).filter(Boolean);
    let nameMap: Record<string, { name: string; role: string; department: string }> = {};

    if (agentIds.length > 0) {
      const { data: agents } = await supabaseAdmin
        .from("agents")
        .select("id, name, role, department")
        .in("id", agentIds);

      if (agents) {
        nameMap = Object.fromEntries(
          agents.map((a: any) => [a.id, { name: a.name, role: a.role, department: a.department }])
        );
      }
    }

    const souls = (usageRows || []).map((r) => ({
      agent_id: r.agent_id,
      name: nameMap[r.agent_id]?.name || r.agent_id,
      role: nameMap[r.agent_id]?.role || null,
      department: nameMap[r.agent_id]?.department || null,
      total_tokens: r.total_tokens || 0,
      prompt_tokens: r.prompt_tokens_sum || 0,
      completion_tokens: r.completion_tokens_sum || 0,
      message_count: r.message_count || 0,
      last_model: r.last_model_used,
      last_active: r.updated_at,
      cost_krw: Math.ceil((r.total_tokens || 0) / 1000) * OVERAGE_RATE_PER_1K,
    }));

    res.json({ period, souls });
  } catch (err: any) {
    console.error("[usage] souls error:", err.message);
    res.status(500).json({ error: "Failed to fetch soul usage" });
  }
});

/**
 * GET /api/usage/history
 * Daily token usage for the last N days (default 30).
 * Uses soul_usage updated_at for daily breakdown.
 */
router.get("/history", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const days = Math.min(Number(req.query.days) || 30, 90);
    const period = (req.query.period as string) || currentPeriod();

    if (!SUPABASE_CONFIGURED) {
      return res.json({ period, days, history: [] });
    }

    // Get all conversations with token data for daily breakdown
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const { data: convs, error } = await supabaseAdmin
      .from("soul_conversations")
      .select("total_tokens, model_used, created_at")
      .eq("org_id", orgId)
      .gte("created_at", sinceDate.toISOString())
      .not("total_tokens", "is", null)
      .order("created_at", { ascending: true });

    if (error) {
      // Fallback: return monthly aggregate only
      console.error("[usage] history query failed:", error.message);
      const { data: monthlyUsage } = await supabaseAdmin
        .from("soul_usage")
        .select("total_tokens, message_count, updated_at")
        .eq("org_id", orgId)
        .eq("period", period);

      return res.json({
        period,
        days,
        history: [],
        monthly_total: (monthlyUsage || []).reduce((s, r) => s + (r.total_tokens || 0), 0),
      });
    }

    // Group by date
    const dailyMap = new Map<string, { tokens: number; messages: number; models: Set<string> }>();
    for (const conv of (convs || [])) {
      const date = conv.created_at?.substring(0, 10); // YYYY-MM-DD
      if (!date) continue;
      const entry = dailyMap.get(date) || { tokens: 0, messages: 0, models: new Set<string>() };
      entry.tokens += conv.total_tokens || 0;
      entry.messages += 1;
      if (conv.model_used) entry.models.add(conv.model_used);
      dailyMap.set(date, entry);
    }

    const history = [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        tokens: data.tokens,
        messages: data.messages,
        models: [...data.models],
        cost_krw: Math.ceil(data.tokens / 1000) * OVERAGE_RATE_PER_1K,
      }));

    res.json({ period, days, history });
  } catch (err: any) {
    console.error("[usage] history error:", err.message);
    res.status(500).json({ error: "Failed to fetch usage history" });
  }
});

/**
 * GET /api/usage/budget
 * Budget status: limit, used, remaining, alerts.
 */
router.get("/budget", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    if (!SUPABASE_CONFIGURED) {
      return res.json({
        monthly_budget: -1,
        tokens_used: 0,
        tokens_remaining: -1,
        usage_pct: 0,
        alert_threshold: 80,
        is_exceeded: false,
        plan: "dev",
        plan_limit: -1,
      });
    }

    // Get budget
    const { data: budget } = await supabaseAdmin
      .from("org_token_budgets")
      .select("monthly_budget, tokens_used, alert_threshold_pct, auto_pause")
      .eq("org_id", orgId)
      .maybeSingle();

    // Get org plan
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("plan")
      .eq("id", orgId)
      .single();

    const plan = org?.plan || "starter";
    const planLimit = PLAN_TOKEN_LIMITS[plan] ?? PLAN_TOKEN_LIMITS.starter;
    const monthlyBudget = budget?.monthly_budget || planLimit;
    const tokensUsed = budget?.tokens_used || 0;
    const alertThreshold = budget?.alert_threshold_pct || 80;
    const tokensRemaining = monthlyBudget > 0 ? Math.max(0, monthlyBudget - tokensUsed) : -1;
    const usagePct = monthlyBudget > 0 ? Math.round((tokensUsed / monthlyBudget) * 100) : 0;

    // Alert levels
    let alertLevel: "normal" | "warning" | "critical" | "exceeded" = "normal";
    if (usagePct >= 100) alertLevel = "exceeded";
    else if (usagePct >= 90) alertLevel = "critical";
    else if (usagePct >= alertThreshold) alertLevel = "warning";

    res.json({
      monthly_budget: monthlyBudget,
      tokens_used: tokensUsed,
      tokens_remaining: tokensRemaining,
      usage_pct: usagePct,
      alert_threshold: alertThreshold,
      alert_level: alertLevel,
      auto_pause: budget?.auto_pause ?? true,
      is_exceeded: usagePct >= 100,
      plan,
      plan_limit: planLimit,
      overage_rate_per_1k: OVERAGE_RATE_PER_1K,
    });
  } catch (err: any) {
    console.error("[usage] budget error:", err.message);
    res.status(500).json({ error: "Failed to fetch budget" });
  }
});

/**
 * POST /api/usage/budget
 * Update budget settings (org owner/admin only).
 * Body: { monthly_budget?: number, alert_threshold_pct?: number, auto_pause?: boolean }
 */
router.post("/budget", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    const userId = (req as any).userId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    if (!SUPABASE_CONFIGURED) {
      return res.status(503).json({ error: "Database not configured" });
    }

    // Permission: tenant_admin (owner/admin) only
    if (!(await isOrgAdmin(userId, orgId))) {
      return res.status(403).json({ error: "Forbidden", message: "예산 설정은 조직 관리자만 가능합니다." });
    }

    const { monthly_budget, alert_threshold_pct, auto_pause } = req.body;

    // Validate inputs
    if (monthly_budget !== undefined && (typeof monthly_budget !== "number" || monthly_budget < 0)) {
      return res.status(400).json({ error: "monthly_budget must be a non-negative number" });
    }
    if (alert_threshold_pct !== undefined && (typeof alert_threshold_pct !== "number" || alert_threshold_pct < 0 || alert_threshold_pct > 100)) {
      return res.status(400).json({ error: "alert_threshold_pct must be between 0 and 100" });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (monthly_budget !== undefined) updates.monthly_budget = monthly_budget;
    if (alert_threshold_pct !== undefined) updates.alert_threshold_pct = alert_threshold_pct;
    if (auto_pause !== undefined) updates.auto_pause = !!auto_pause;

    // Upsert org_token_budgets
    const { data: existing } = await supabaseAdmin
      .from("org_token_budgets")
      .select("id")
      .eq("org_id", orgId)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("org_token_budgets")
        .update(updates)
        .eq("org_id", orgId);
    } else {
      await supabaseAdmin
        .from("org_token_budgets")
        .insert({ org_id: orgId, ...updates, tokens_used: 0 });
    }

    res.json({ ok: true, message: "Budget updated" });
  } catch (err: any) {
    console.error("[usage] budget update error:", err.message);
    res.status(500).json({ error: "Failed to update budget" });
  }
});

/**
 * GET /api/usage/breakdown
 * Soul별·모델별·시간대별 집계 (CTO 수진 요청).
 * Query: ?period=YYYY-MM&group_by=soul|model|hour
 */
router.get("/breakdown", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const period = (req.query.period as string) || currentPeriod();
    const groupBy = (req.query.group_by as string) || "soul";

    if (!SUPABASE_CONFIGURED) {
      return res.json({ period, group_by: groupBy, breakdown: [] });
    }

    if (groupBy === "soul") {
      // Same as /souls but lighter
      const { data, error } = await supabaseAdmin
        .from("soul_usage")
        .select("agent_id, total_tokens, prompt_tokens_sum, completion_tokens_sum, message_count, last_model_used")
        .eq("org_id", orgId)
        .eq("period", period)
        .order("total_tokens", { ascending: false });

      if (error) {
        return res.json({ period, group_by: groupBy, breakdown: [], note: "soul_usage 테이블 조회 실패" });
      }

      // Enrich with names
      const agentIds = (data || []).map((r) => r.agent_id).filter(Boolean);
      let nameMap: Record<string, string> = {};
      if (agentIds.length > 0) {
        const { data: agents } = await supabaseAdmin
          .from("agents")
          .select("id, name")
          .in("id", agentIds);
        if (agents) nameMap = Object.fromEntries(agents.map((a: any) => [a.id, a.name]));
      }

      const breakdown = (data || []).map((r) => ({
        key: r.agent_id,
        label: nameMap[r.agent_id] || r.agent_id,
        total_tokens: r.total_tokens || 0,
        prompt_tokens: r.prompt_tokens_sum || 0,
        completion_tokens: r.completion_tokens_sum || 0,
        message_count: r.message_count || 0,
        last_model: r.last_model_used,
      }));

      return res.json({ period, group_by: groupBy, breakdown });
    }

    if (groupBy === "model") {
      // Group by model from budget_transactions
      const sinceDate = new Date();
      sinceDate.setDate(1); // first of current month
      // Parse period into date range
      const [year, month] = period.split("-").map(Number);
      const periodStart = new Date(year, month - 1, 1);
      const periodEnd = new Date(year, month, 0, 23, 59, 59);

      const { data: txns, error } = await supabaseAdmin
        .from("budget_transactions")
        .select("model, provider, input_tokens, output_tokens, cost_cents")
        .eq("org_id", orgId)
        .gte("created_at", periodStart.toISOString())
        .lte("created_at", periodEnd.toISOString());

      if (error) {
        // budget_transactions may not exist — fallback to soul_usage
        const { data: usageData } = await supabaseAdmin
          .from("soul_usage")
          .select("last_model_used, total_tokens, message_count")
          .eq("org_id", orgId)
          .eq("period", period);

        const modelMap = new Map<string, { tokens: number; messages: number }>();
        for (const r of (usageData || [])) {
          const model = r.last_model_used || "unknown";
          const entry = modelMap.get(model) || { tokens: 0, messages: 0 };
          entry.tokens += r.total_tokens || 0;
          entry.messages += r.message_count || 0;
          modelMap.set(model, entry);
        }

        const breakdown = [...modelMap.entries()]
          .sort(([, a], [, b]) => b.tokens - a.tokens)
          .map(([model, data]) => ({
            key: model,
            label: model,
            total_tokens: data.tokens,
            message_count: data.messages,
          }));

        return res.json({ period, group_by: groupBy, breakdown, fallback: true });
      }

      // Group transactions by model
      const modelMap = new Map<string, { input: number; output: number; total: number; cost: number; count: number; provider: string }>();
      for (const tx of (txns || [])) {
        const model = tx.model || "unknown";
        const entry = modelMap.get(model) || { input: 0, output: 0, total: 0, cost: 0, count: 0, provider: tx.provider || "unknown" };
        entry.input += tx.input_tokens || 0;
        entry.output += tx.output_tokens || 0;
        entry.total += (tx.input_tokens || 0) + (tx.output_tokens || 0);
        entry.cost += tx.cost_cents || 0;
        entry.count += 1;
        modelMap.set(model, entry);
      }

      const breakdown = [...modelMap.entries()]
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([model, data]) => ({
          key: model,
          label: model,
          provider: data.provider,
          prompt_tokens: data.input,
          completion_tokens: data.output,
          total_tokens: data.total,
          cost_cents: data.cost,
          request_count: data.count,
        }));

      return res.json({ period, group_by: groupBy, breakdown });
    }

    if (groupBy === "hour") {
      // Hourly breakdown from budget_transactions
      const [year, month] = period.split("-").map(Number);
      const periodStart = new Date(year, month - 1, 1);
      const periodEnd = new Date(year, month, 0, 23, 59, 59);

      const { data: txns, error } = await supabaseAdmin
        .from("budget_transactions")
        .select("input_tokens, output_tokens, created_at")
        .eq("org_id", orgId)
        .gte("created_at", periodStart.toISOString())
        .lte("created_at", periodEnd.toISOString());

      if (error) {
        return res.json({ period, group_by: groupBy, breakdown: [], error: "budget_transactions not available" });
      }

      // Group by hour (0-23)
      const hourMap = new Map<number, { tokens: number; count: number }>();
      for (let h = 0; h < 24; h++) hourMap.set(h, { tokens: 0, count: 0 });

      for (const tx of (txns || [])) {
        const hour = new Date(tx.created_at).getHours();
        const entry = hourMap.get(hour)!;
        entry.tokens += (tx.input_tokens || 0) + (tx.output_tokens || 0);
        entry.count += 1;
      }

      const breakdown = [...hourMap.entries()]
        .sort(([a], [b]) => a - b)
        .map(([hour, data]) => ({
          key: String(hour).padStart(2, "0"),
          label: `${String(hour).padStart(2, "0")}:00`,
          total_tokens: data.tokens,
          request_count: data.count,
        }));

      return res.json({ period, group_by: groupBy, breakdown });
    }

    return res.status(400).json({ error: "Invalid group_by. Use: soul, model, hour" });
  } catch (err: any) {
    console.error("[usage] breakdown error:", err.message);
    res.status(500).json({ error: "Failed to fetch usage breakdown" });
  }
});

/**
 * GET /api/usage/soul/:soulId/budget
 * Per-Soul budget status (soul_budgets 테이블).
 */
router.get("/soul/:soulId/budget", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { soulId } = req.params;
    const today = new Date().toISOString().substring(0, 10);

    if (!SUPABASE_CONFIGURED) {
      return res.json({ soul_id: soulId, budget: null });
    }

    const { data: budget, error } = await supabaseAdmin
      .from("soul_budgets")
      .select("*")
      .eq("org_id", orgId)
      .eq("agent_id", soulId)
      .lte("period_start", today)
      .gte("period_end", today)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // soul_budgets may not exist (008 DDL)
      return res.json({ soul_id: soulId, budget: null, note: "soul_budgets table not available" });
    }

    if (!budget) {
      return res.json({ soul_id: soulId, budget: null });
    }

    const usagePct = budget.token_limit > 0
      ? Math.round(((budget.tokens_used || 0) / budget.token_limit) * 100)
      : 0;

    let alertLevel: string = "normal";
    if (usagePct >= 100) alertLevel = "exceeded";
    else if (usagePct >= 90) alertLevel = "critical";
    else if (usagePct >= (budget.warning_threshold || 80)) alertLevel = "warning";

    res.json({
      soul_id: soulId,
      budget: {
        id: budget.id,
        period_type: budget.period_type,
        period_start: budget.period_start,
        period_end: budget.period_end,
        token_limit: budget.token_limit,
        tokens_used: budget.tokens_used || 0,
        tokens_remaining: Math.max(0, (budget.token_limit || 0) - (budget.tokens_used || 0)),
        usage_pct: usagePct,
        alert_level: alertLevel,
        status: budget.status,
        auto_pause: budget.auto_pause_at_limit,
        warning_threshold: budget.warning_threshold,
      },
    });
  } catch (err: any) {
    console.error("[usage] soul budget error:", err.message);
    res.status(500).json({ error: "Failed to fetch soul budget" });
  }
});

export { router as tokenUsageRoutes };
