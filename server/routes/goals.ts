/**
 * Goals API — OKR 목표 정렬 CRUD
 * GET    /api/goals              — 전체 목표 조회 (트리)
 * POST   /api/goals              — 목표 추가
 * PUT    /api/goals/:id          — 목표 수정
 * DELETE /api/goals/:id          — 목표 삭제
 * PUT    /api/goals/:id/progress — 진행률 업데이트
 */
export { goalsRoutes };

import { Router, type Request, type Response } from "express";
import { supabaseAdmin } from "../lib/supabase.ts";

const router = Router();

// ─── GET /api/goals — 전체 목표 조회 ───
router.get("/", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { data, error } = await supabaseAdmin
      .from("company_goals")
      .select("*")
      .eq("org_id", orgId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.log("[Goals] company_goals not available:", error.message);
      return res.json({ goals: [], available: false });
    }

    // Enrich with agent info for owner
    const ownerIds = [...new Set((data || []).map((g: any) => g.owner_agent_id).filter(Boolean))];
    let agentMap: Record<string, any> = {};
    if (ownerIds.length > 0) {
      const { data: agents } = await supabaseAdmin
        .from("agents")
        .select("id, name, role, avatar_url, preset_id")
        .in("id", ownerIds);
      if (agents) {
        agentMap = Object.fromEntries(agents.map((a: any) => [a.id, a]));
      }
    }

    const enriched = (data || []).map((g: any) => ({
      ...g,
      owner: agentMap[g.owner_agent_id] || null,
    }));

    res.json({ goals: enriched, available: true });
  } catch (err: any) {
    console.error("[API] GET /api/goals error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/goals — 목표 추가 ───
router.post("/", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { title, description, goal_type, parent_id, owner_agent_id, metric_type, target_value, unit, start_date, due_date, color } = req.body;
    if (!title || !goal_type) {
      return res.status(400).json({ error: "title and goal_type are required" });
    }

    const { data, error } = await supabaseAdmin
      .from("company_goals")
      .insert({
        org_id: orgId,
        title,
        description: description || null,
        goal_type,
        parent_id: parent_id || null,
        owner_agent_id: owner_agent_id || null,
        metric_type: metric_type || null,
        target_value: target_value || null,
        unit: unit || null,
        start_date: start_date || null,
        due_date: due_date || null,
        color: color || "#2563EB",
        status: "active",
        progress: 0,
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ goal: data });
  } catch (err: any) {
    console.error("[API] POST /api/goals error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/goals/:id — 목표 수정 ───
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const allowed = ["title", "description", "goal_type", "parent_id", "owner_agent_id", "metric_type", "target_value", "current_value", "unit", "start_date", "due_date", "status", "progress", "color", "sort_order"];
    const updates: any = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const { data, error } = await supabaseAdmin
      .from("company_goals")
      .update(updates)
      .eq("id", req.params.id)
      .eq("org_id", orgId)
      .select()
      .single();

    if (error) throw error;
    res.json({ goal: data });
  } catch (err: any) {
    console.error("[API] PUT /api/goals/:id error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/goals/:id/progress — 진행률 업데이트 ───
router.put("/:id/progress", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { progress, current_value, status } = req.body;
    const updates: any = { updated_at: new Date().toISOString() };
    if (progress !== undefined) updates.progress = Math.min(100, Math.max(0, progress));
    if (current_value !== undefined) updates.current_value = current_value;
    if (status) updates.status = status;

    // Auto-complete
    if (updates.progress === 100 && !status) updates.status = "completed";

    const { data, error } = await supabaseAdmin
      .from("company_goals")
      .update(updates)
      .eq("id", req.params.id)
      .eq("org_id", orgId)
      .select()
      .single();

    if (error) throw error;
    res.json({ goal: data });
  } catch (err: any) {
    console.error("[API] PUT /api/goals/:id/progress error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/goals/:id — 목표 삭제 ───
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { error } = await supabaseAdmin
      .from("company_goals")
      .delete()
      .eq("id", req.params.id)
      .eq("org_id", orgId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("[API] DELETE /api/goals/:id error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const goalsRoutes = router;
