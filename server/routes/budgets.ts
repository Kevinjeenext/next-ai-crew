/**
 * Budget API — Soul 예산 관리 CRUD
 * GET    /api/budgets          — 예산 목록
 * GET    /api/budgets/summary  — 월간 집계
 * POST   /api/budgets          — 예산 할당
 * PUT    /api/budgets/:id      — 예산 수정
 * DELETE /api/budgets/:id      — 예산 삭제
 */
export { budgetRoutes };

import { Router, type Request, type Response } from "express";
import { supabaseAdmin } from "../lib/supabase.ts";

const router = Router();

// ─── GET /api/budgets — 전체 예산 조회 ───
router.get("/", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { data, error } = await supabaseAdmin
      .from("soul_budgets")
      .select("*")
      .eq("org_id", orgId)
      .order("period_start", { ascending: false });

    if (error) {
      console.log("[Budget] soul_budgets not available:", error.message);
      return res.json({ budgets: [], available: false });
    }

    // Enrich with agent info
    const agentIds = [...new Set((data || []).map((b: any) => b.agent_id).filter(Boolean))];
    let agentMap: Record<string, any> = {};
    if (agentIds.length > 0) {
      const { data: agents } = await supabaseAdmin
        .from("agents")
        .select("id, name, role, avatar_url, preset_id")
        .in("id", agentIds);
      if (agents) {
        agentMap = Object.fromEntries(agents.map((a: any) => [a.id, a]));
      }
    }

    const enriched = (data || []).map((b: any) => ({
      ...b,
      agent: agentMap[b.agent_id] || null,
      usage_pct: b.token_limit > 0 ? Math.round((b.tokens_used / b.token_limit) * 100) : 0,
      cost_pct: b.cost_limit_cents > 0 ? Math.round((b.cost_used_cents / b.cost_limit_cents) * 100) : 0,
    }));

    res.json({ budgets: enriched, available: true });
  } catch (err: any) {
    console.error("[API] GET /api/budgets error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/budgets/summary — 월간 집계 ───
router.get("/summary", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { data, error } = await supabaseAdmin
      .from("soul_budgets")
      .select("*")
      .eq("org_id", orgId)
      .eq("status", "active")
      .order("period_start", { ascending: false });

    if (error) {
      return res.json({ summary: null, available: false });
    }

    const budgets = data || [];
    const totalTokenLimit = budgets.reduce((s: number, b: any) => s + (b.token_limit || 0), 0);
    const totalTokensUsed = budgets.reduce((s: number, b: any) => s + (b.tokens_used || 0), 0);
    const totalCostLimit = budgets.reduce((s: number, b: any) => s + (b.cost_limit_cents || 0), 0);
    const totalCostUsed = budgets.reduce((s: number, b: any) => s + (b.cost_used_cents || 0), 0);
    const warningCount = budgets.filter((b: any) => b.status === "warning" || b.status === "limit_reached").length;

    res.json({
      summary: {
        total_budgets: budgets.length,
        total_token_limit: totalTokenLimit,
        total_tokens_used: totalTokensUsed,
        total_cost_limit_cents: totalCostLimit,
        total_cost_used_cents: totalCostUsed,
        token_usage_pct: totalTokenLimit > 0 ? Math.round((totalTokensUsed / totalTokenLimit) * 100) : 0,
        cost_usage_pct: totalCostLimit > 0 ? Math.round((totalCostUsed / totalCostLimit) * 100) : 0,
        warning_count: warningCount,
      },
      available: true,
    });
  } catch (err: any) {
    console.error("[API] GET /api/budgets/summary error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/budgets — 예산 할당 ───
router.post("/", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { agent_id, token_limit, cost_limit_cents, period_type, period_start, period_end, warning_threshold, auto_pause_at_limit } = req.body;
    if (!agent_id) return res.status(400).json({ error: "agent_id is required" });

    // Default: current month
    const now = new Date();
    const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const defaultEnd = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-${String(nextMonth.getDate()).padStart(2, "0")}`;

    const { data, error } = await supabaseAdmin
      .from("soul_budgets")
      .insert({
        org_id: orgId,
        agent_id,
        token_limit: token_limit || 1000000,
        cost_limit_cents: cost_limit_cents || 6000,
        period_type: period_type || "monthly",
        period_start: period_start || defaultStart,
        period_end: period_end || defaultEnd,
        warning_threshold: warning_threshold || 80,
        auto_pause_at_limit: auto_pause_at_limit !== false,
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ budget: data });
  } catch (err: any) {
    console.error("[API] POST /api/budgets error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/budgets/:id — 예산 수정 ───
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const allowed = ["token_limit", "cost_limit_cents", "tokens_used", "cost_used_cents", "status", "warning_threshold", "auto_pause_at_limit"];
    const updates: any = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const { data, error } = await supabaseAdmin
      .from("soul_budgets")
      .update(updates)
      .eq("id", req.params.id)
      .eq("org_id", orgId)
      .select()
      .single();

    if (error) throw error;
    res.json({ budget: data });
  } catch (err: any) {
    console.error("[API] PUT /api/budgets/:id error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/budgets/:id ───
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { error } = await supabaseAdmin
      .from("soul_budgets")
      .delete()
      .eq("id", req.params.id)
      .eq("org_id", orgId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("[API] DELETE /api/budgets/:id error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const budgetRoutes = router;
