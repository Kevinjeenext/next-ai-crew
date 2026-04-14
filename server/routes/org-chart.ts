/**
 * Org Chart API — Soul 조직도 CRUD
 * GET    /api/org-chart        — 조직도 트리 조회
 * POST   /api/org-chart        — 포지션 추가
 * PUT    /api/org-chart/:id    — 포지션 수정
 * DELETE /api/org-chart/:id    — 포지션 삭제
 */
export { orgChartRoutes };

import { Router, type Request, type Response } from "express";
import { supabaseAdmin } from "../lib/supabase.ts";

const router = Router();

// ─── GET /api/org-chart — 조직도 전체 조회 ───
router.get("/", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    // Try soul_org_chart table first (008 DDL)
    const { data, error } = await supabaseAdmin
      .from("soul_org_chart")
      .select("id, agent_id, parent_agent_id, title, department, level, rank, can_delegate, can_approve, can_hire, max_direct_reports, is_active, metadata, created_at")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("level", { ascending: true });

    if (error) {
      // DDL not run yet — return mock from hired agents
      console.log("[OrgChart] soul_org_chart not available, building from agents:", error.message);
      return await buildFromAgents(orgId, res);
    }

    // Enrich with agent info (name, avatar, role)
    const agentIds = (data || []).map((d: any) => d.agent_id).filter(Boolean);
    let agentMap: Record<string, any> = {};
    if (agentIds.length > 0) {
      const { data: agents } = await supabaseAdmin
        .from("agents")
        .select("id, name, role, avatar_url, status, preset_id")
        .in("id", agentIds);
      if (agents) {
        agentMap = Object.fromEntries(agents.map((a: any) => [a.id, a]));
      }
    }

    const enriched = (data || []).map((node: any) => ({
      ...node,
      agent: agentMap[node.agent_id] || null,
    }));

    res.json({ positions: enriched });
  } catch (err: any) {
    console.error("[API] GET /api/org-chart error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/org-chart — 포지션 추가 ───
router.post("/", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { agent_id, parent_agent_id, title, department, level, rank } = req.body;
    if (!agent_id || !title) {
      return res.status(400).json({ error: "agent_id and title are required" });
    }

    const { data, error } = await supabaseAdmin
      .from("soul_org_chart")
      .upsert({
        org_id: orgId,
        agent_id,
        parent_agent_id: parent_agent_id || null,
        title,
        department: department || null,
        level: level ?? 4,
        rank: rank || "ic",
        is_active: true,
      }, { onConflict: "org_id,agent_id" })
      .select()
      .single();

    if (error) throw error;
    res.json({ position: data });
  } catch (err: any) {
    console.error("[API] POST /api/org-chart error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/org-chart/:id — 포지션 수정 ───
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { parent_agent_id, title, department, level, rank } = req.body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (parent_agent_id !== undefined) updates.parent_agent_id = parent_agent_id || null;
    if (title) updates.title = title;
    if (department !== undefined) updates.department = department;
    if (level !== undefined) updates.level = level;
    if (rank) updates.rank = rank;

    const { data, error } = await supabaseAdmin
      .from("soul_org_chart")
      .update(updates)
      .eq("id", req.params.id)
      .eq("org_id", orgId)
      .select()
      .single();

    if (error) throw error;
    res.json({ position: data });
  } catch (err: any) {
    console.error("[API] PUT /api/org-chart/:id error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/org-chart/:id — 포지션 삭제 ───
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    // Soft delete
    const { error } = await supabaseAdmin
      .from("soul_org_chart")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .eq("org_id", orgId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    console.error("[API] DELETE /api/org-chart/:id error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Fallback: Build org chart from agents table ───
async function buildFromAgents(orgId: string, res: Response) {
  const { data: agents, error } = await supabaseAdmin
    .from("agents")
    .select("id, name, role, avatar_url, status, preset_id")
    .eq("org_id", orgId)
    .not("status", "eq", "offline");

  if (error) {
    return res.json({ positions: [], fallback: true });
  }

  // Auto-assign levels based on role/preset
  const positions = (agents || []).map((a: any) => {
    const role = (a.role || "").toLowerCase();
    const preset = (a.preset_id || "").toLowerCase();
    let level = 4, rank = "ic", department = "general";

    if (["ceo"].some(r => preset.includes(r) || role.includes(r))) {
      level = 0; rank = "c_level"; department = "executive";
    } else if (["cfo", "coo", "cmo", "cso", "cpo", "chro", "clo"].some(r => preset === r || role.includes(r))) {
      level = 0; rank = "c_level"; department = preset || "executive";
    } else if (role.includes("lead") || role.includes("manager")) {
      level = 3; rank = "manager";
    } else if (role.includes("senior")) {
      level = 3; rank = "senior";
    }

    // Detect department from preset/role
    if (role.includes("developer") || role.includes("engineer") || preset.includes("developer")) department = "engineering";
    else if (role.includes("design")) department = "design";
    else if (role.includes("market")) department = "marketing";
    else if (role.includes("security")) department = "security";

    return {
      id: `fallback-${a.id}`,
      agent_id: a.id,
      parent_agent_id: null,
      title: a.role || a.name,
      department,
      level,
      rank,
      is_active: true,
      agent: a,
    };
  });

  res.json({ positions, fallback: true });
}

const orgChartRoutes = router;
