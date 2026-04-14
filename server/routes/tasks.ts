/**
 * Tasks API — 태스크/칸반 CRUD
 * GET    /api/tasks              — 태스크 목록 (필터)
 * POST   /api/tasks              — 태스크 생성
 * PUT    /api/tasks/:id          — 태스크 수정
 * PUT    /api/tasks/:id/status   — 상태 변경
 * PUT    /api/tasks/:id/assign   — Soul 배정
 * DELETE /api/tasks/:id          — 태스크 삭제
 */
export { taskRoutes };

import { Router, type Request, type Response } from "express";
import { supabaseAdmin } from "../lib/supabase.ts";

const router = Router();

// ─── GET /api/tasks ───
router.get("/", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    let query = supabaseAdmin
      .from("tickets")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    // Filters
    const { status, priority, assignee, goal_id, limit: lim } = req.query;
    if (status) query = query.eq("status", String(status));
    if (priority) query = query.eq("priority", String(priority));
    if (assignee) query = query.eq("assignee_agent_id", String(assignee));
    if (goal_id) query = query.eq("company_goal_id", String(goal_id));
    query = query.limit(Number(lim) || 200);

    const { data, error } = await query;
    if (error) {
      console.log("[Tasks] tickets not available:", error.message);
      return res.json({ tasks: [], available: false });
    }

    // Enrich with agent info
    const agentIds = [...new Set([
      ...(data || []).map((t: any) => t.assignee_agent_id),
      ...(data || []).map((t: any) => t.reviewer_agent_id),
    ].filter(Boolean))];
    let agentMap: Record<string, any> = {};
    if (agentIds.length > 0) {
      const { data: agents } = await supabaseAdmin
        .from("agents")
        .select("id, name, role, avatar_url, preset_id")
        .in("id", agentIds);
      if (agents) agentMap = Object.fromEntries(agents.map((a: any) => [a.id, a]));
    }

    const enriched = (data || []).map((t: any) => ({
      ...t,
      assignee: agentMap[t.assignee_agent_id] || null,
      reviewer: agentMap[t.reviewer_agent_id] || null,
    }));

    res.json({ tasks: enriched, available: true });
  } catch (err: any) {
    console.error("[API] GET /api/tasks error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/tasks ───
router.post("/", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { title, description, ticket_type, priority, assignee_agent_id, company_goal_id, due_date, labels } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });

    const { data, error } = await supabaseAdmin
      .from("tickets")
      .insert({
        org_id: orgId,
        title,
        description: description || null,
        ticket_type: ticket_type || "task",
        priority: priority || "medium",
        assignee_agent_id: assignee_agent_id || null,
        company_goal_id: company_goal_id || null,
        due_date: due_date || null,
        labels: labels || [],
        creator_type: "human",
        creator_id: "admin",
        status: assignee_agent_id ? "assigned" : "open",
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ task: data });
  } catch (err: any) {
    console.error("[API] POST /api/tasks error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/tasks/:id ───
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const allowed = ["title", "description", "ticket_type", "priority", "assignee_agent_id", "reviewer_agent_id", "company_goal_id", "due_date", "labels", "status", "estimated_tokens", "estimated_minutes"];
    const updates: any = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.status === "done") updates.completed_at = new Date().toISOString();
    if (updates.status === "in_progress" && !req.body.started_at) updates.started_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("tickets")
      .update(updates)
      .eq("id", req.params.id)
      .eq("org_id", orgId)
      .select()
      .single();

    if (error) throw error;
    res.json({ task: data });
  } catch (err: any) {
    console.error("[API] PUT /api/tasks/:id error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/tasks/:id/status ───
router.put("/:id/status", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "status is required" });

    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === "done") updates.completed_at = new Date().toISOString();
    if (status === "in_progress") updates.started_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("tickets")
      .update(updates)
      .eq("id", req.params.id)
      .eq("org_id", orgId)
      .select()
      .single();

    if (error) throw error;
    res.json({ task: data });
  } catch (err: any) {
    console.error("[API] PUT /api/tasks/:id/status error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/tasks/:id/assign ───
router.put("/:id/assign", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { assignee_agent_id } = req.body;

    const { data, error } = await supabaseAdmin
      .from("tickets")
      .update({
        assignee_agent_id: assignee_agent_id || null,
        status: assignee_agent_id ? "assigned" : "open",
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .eq("org_id", orgId)
      .select()
      .single();

    if (error) throw error;
    res.json({ task: data });
  } catch (err: any) {
    console.error("[API] PUT /api/tasks/:id/assign error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/tasks/:id ───
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { error } = await supabaseAdmin
      .from("tickets")
      .delete()
      .eq("id", req.params.id)
      .eq("org_id", orgId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("[API] DELETE /api/tasks/:id error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const taskRoutes = router;
