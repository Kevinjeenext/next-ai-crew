/**
 * Next AI Crew — Server entry point (Supabase/PG mode).
 *
 * This is the PG-mode counterpart of server-main.ts.
 * When DATABASE_URL is set, the app uses this initialization path.
 *
 * Architecture:
 * - Supabase handles DB, Auth, Storage, Realtime
 * - Express handles API routes + WebSocket hub
 * - Railway hosts the Express server
 * - Vercel hosts the frontend SPA
 */
import express from "express";
import { WebSocketServer, WebSocket } from "ws";

import { DIST_DIR, IS_PRODUCTION, PORT, HOST } from "./config/runtime.ts";
import {
  IN_PROGRESS_ORPHAN_GRACE_MS,
  IN_PROGRESS_ORPHAN_SWEEP_MS,
  SUBTASK_DELEGATION_SWEEP_MS,
} from "./db/runtime.ts";
import {
  installSecurityMiddleware,
  isIncomingMessageAuthenticated,
  isIncomingMessageOriginTrusted,
} from "./security/auth.ts";
import { supabaseAdmin, SUPABASE_CONFIGURED } from "./lib/supabase.ts";
import { initializeSupabaseRuntime, getOrgIdFromRequest, createOrgForUser } from "./db/supabase-db-shim.ts";
import * as pgAdapter from "./db/pg-adapter.ts";
import { createWsHub } from "./ws/hub.ts";
import authRoutes from "./modules/routes/auth/signup.ts";
import { soulChatRoutes } from "./routes/soul-chat.ts";
import { getModelRouter } from "./llm/router.ts";
import billingRoutes, { webhookRouter } from "./modules/routes/billing.ts";
import { checkAgentLimit } from "./middleware/plan-limit.ts";

// ---------------------------------------------------------------------------
// Initialize
// ---------------------------------------------------------------------------

const app = express();
installSecurityMiddleware(app);

const distDir = DIST_DIR;
const isProduction = IS_PRODUCTION;

// Initialize WebSocket hub (preserved from original — handles agent status, task updates, etc.)
const { wsClients, broadcast } = createWsHub(() => Date.now());

// ---------------------------------------------------------------------------
// Health check endpoint (for Railway)
// ---------------------------------------------------------------------------
// Health check (Railway checks /api/health per railway.toml)
app.get("/api/health", (_req, res) => {
  const supabaseConfigured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  res.json({
    status: "ok",
    mode: "supabase",
    version: process.env.npm_package_version ?? "0.1.0",
    git_sha: process.env.GIT_SHA ?? process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 8) ?? "unknown",
    timestamp: new Date().toISOString(),
    config: {
      supabase_url: !!process.env.SUPABASE_URL,
      supabase_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabase_anon_key: !!process.env.SUPABASE_ANON_KEY,
      database_url: !!process.env.DATABASE_URL,
      auth_ready: supabaseConfigured,
      demo_bypass_limits: process.env.DEMO_BYPASS_LIMITS === "true",
    },
  });
});

// Root health (fallback for Railway default / check)
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ---------------------------------------------------------------------------
// Core API routes (Supabase-backed)
// ---------------------------------------------------------------------------

// --- Auth routes ---
app.use(authRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/webhooks", webhookRouter);

// --- Auth middleware helper ---
async function requireOrg(req: any, res: any): Promise<string | null> {
  // Get auth token from request
  const authHeader = req.get?.("authorization") ?? req.headers?.authorization;
  const token = typeof authHeader === "string" ? authHeader.replace("Bearer ", "") : undefined;

  if (!token) {
    res.status(401).json({ error: "Authentication required", detail: "NO_AUTH_HEADER", hint: "Supabase JWT missing from Authorization: Bearer header" });
    return null;
  }

  try {
    return await getOrgIdFromRequest(req);
  } catch (err: any) {
    console.error("[requireOrg] getOrgIdFromRequest failed:", err.message, "| path:", req.path);

    // Auto-create org if user is valid but has no org yet (first-time login race condition)
    // This handles the case where /api/auth/setup was never called or failed silently
    try {
      const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (!userError && user) {
        console.log("[requireOrg] Auto-creating org for user:", user.id);
        const displayName = user.user_metadata?.full_name
          ?? user.user_metadata?.name
          ?? user.email?.split("@")[0]
          ?? "My Team";
        const orgId = await createOrgForUser(user.id, `${displayName}'s Team`);
        console.log("[requireOrg] Auto-created org:", orgId);
        return orgId;
      }
    } catch (autoCreateErr: any) {
      console.error("[requireOrg] Auto-create org failed:", autoCreateErr.message);
    }

    // Dev-only fallback (never set DEFAULT_ORG_ID in production)
    const fallbackOrgId = process.env.NODE_ENV !== "production" ? process.env.DEFAULT_ORG_ID : undefined;
    if (fallbackOrgId) {
      console.warn("[requireOrg] Using DEFAULT_ORG_ID fallback — dev mode only");
      return fallbackOrgId;
    }

    res.status(401).json({ error: "Authentication required", detail: err.message });
    return null;
  }
}

// --- Agents CRUD ---
app.get("/api/agents", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const agents = await pgAdapter.queryAll("agents", orgId, undefined, {
      orderBy: "created_at",
      ascending: true,
    });
    res.json({ agents });
  } catch (err: any) {
    console.error("[API] GET /api/agents error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/agents/:id", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const agent = await pgAdapter.queryOne("agents", orgId, req.params.id);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    res.json({ agent });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/agents", express.json(), async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;

    // Check plan agent limit
    const limitCheck = await checkAgentLimit(orgId);
    if (!limitCheck.allowed) {
      return res.status(402).json({
        error: "Agent limit reached",
        current: limitCheck.current,
        limit: limitCheck.limit,
        plan: limitCheck.plan,
        upgrade_url: "/pricing",
        message: `Your ${limitCheck.plan} plan allows ${limitCheck.limit} agent(s). Upgrade to add more.`,
      });
    }

    const { id, name, department_id, role, avatar_emoji, personality, ...rest } = req.body;
    const agentId = id ?? crypto.randomUUID();
    let agent: any;
    try {
      agent = await pgAdapter.insertRow("agents", {
        org_id: orgId,
        id: agentId,
        name: name ?? "New Agent",
        department_id,
        role: role ?? "junior",
        avatar_emoji: avatar_emoji ?? "🤖",
        personality,
        ...rest,
      });
    } catch (insertErr: any) {
      // FK violation on department_id — retry with null
      if (department_id && (insertErr.message?.includes("foreign key") || insertErr.message?.includes("violates") || insertErr.code === "23503")) {
        console.warn(`[API] department_id FK violation for '${department_id}', retrying with null`);
        agent = await pgAdapter.insertRow("agents", {
          org_id: orgId,
          id: agentId,
          name: name ?? "New Agent",
          department_id: null,
          role: role ?? "junior",
          avatar_emoji: avatar_emoji ?? "🤖",
          personality,
          ...rest,
        });
      } else {
        throw insertErr;
      }
    }
    broadcast("agent_update", agent);
    res.status(201).json({ ok: true, agent });
  } catch (err: any) {
    console.error("[API] POST /api/agents error:", err.message, err.code);
    res.status(500).json({ error: err.message, code: err.code });
  }
});

app.patch("/api/agents/:id", express.json(), async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const updated = await pgAdapter.updateRow("agents", orgId, req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Agent not found" });
    broadcast("agent_update", updated);
    res.json({ agent: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/agents/:id", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const deleted = await pgAdapter.deleteRow("agents", orgId, req.params.id);
    if (!deleted) return res.status(404).json({ error: "Agent not found" });
    broadcast("agent_removed", { id: req.params.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Departments CRUD ---
app.get("/api/departments", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const departments = await pgAdapter.queryAll("departments", orgId, undefined, {
      orderBy: "sort_order",
      ascending: true,
    });
    res.json({ departments });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/departments", express.json(), async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const dept = await pgAdapter.insertRow("departments", {
      org_id: orgId,
      ...req.body,
    });
    broadcast("department_update", dept);
    res.status(201).json({ ok: true, department: dept });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/departments/:id", express.json(), async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const updated = await pgAdapter.updateRow("departments", orgId, req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Department not found" });
    broadcast("department_update", updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Tasks CRUD ---
app.get("/api/tasks", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const filters: Record<string, unknown> = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.assigned_agent_id) filters.assigned_agent_id = req.query.assigned_agent_id;
    if (req.query.department_id) filters.department_id = req.query.department_id;

    const tasks = await pgAdapter.queryAll("tasks", orgId, Object.keys(filters).length ? filters : undefined, {
      orderBy: "updated_at",
      ascending: false,
      limit: req.query.limit ? Number(req.query.limit) : 100,
    });
    res.json({ tasks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/tasks/:id", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const task = await pgAdapter.queryOne("tasks", orgId, req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ task });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tasks", express.json(), async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const task = await pgAdapter.insertRow("tasks", {
      org_id: orgId,
      id: req.body.id ?? crypto.randomUUID(),
      title: req.body.title ?? "New Task",
      status: req.body.status ?? "inbox",
      ...req.body,
    });
    broadcast("task_update", task);
    res.status(201).json({ ok: true, task });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/tasks/:id", express.json(), async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const updated = await pgAdapter.updateRow("tasks", orgId, req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Task not found" });
    broadcast("task_update", updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const deleted = await pgAdapter.deleteRow("tasks", orgId, req.params.id);
    if (!deleted) return res.status(404).json({ error: "Task not found" });
    broadcast("task_removed", { id: req.params.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Messages ---
app.get("/api/messages", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const filters: Record<string, unknown> = {};
    if (req.query.receiver_type) filters.receiver_type = req.query.receiver_type;
    if (req.query.receiver_id) filters.receiver_id = req.query.receiver_id;

    const messages = await pgAdapter.queryAll("messages", orgId, Object.keys(filters).length ? filters : undefined, {
      orderBy: "created_at",
      ascending: false,
      limit: req.query.limit ? Number(req.query.limit) : 50,
    });
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/messages", express.json(), async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const msg = await pgAdapter.insertRow("messages", {
      org_id: orgId,
      id: req.body.id ?? crypto.randomUUID(),
      sender_type: req.body.sender_type ?? "ceo",
      sender_id: req.body.sender_id ?? null,
      receiver_type: req.body.receiver_type ?? "all",
      receiver_id: req.body.receiver_id ?? null,
      content: req.body.content ?? "",
      message_type: req.body.message_type ?? "chat",
      task_id: req.body.task_id ?? null,
    });
    broadcast("new_message", msg);
    res.status(201).json(msg);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Settings ---
app.get("/api/settings/:key", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const value = await pgAdapter.readSetting(orgId, req.params.key);
    res.json({ key: req.params.key, value: value ?? null });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/settings/:key", express.json(), async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    await pgAdapter.writeSetting(orgId, req.params.key, req.body.value ?? "");
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Projects CRUD ---
app.get("/api/projects", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const projects = await pgAdapter.queryAll("projects", orgId, undefined, {
      orderBy: "last_used_at",
      ascending: false,
    });
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Subtasks ---
app.get("/api/tasks/:taskId/subtasks", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const subtasks = await pgAdapter.queryAll("subtasks", orgId, { task_id: req.params.taskId }, {
      orderBy: "created_at",
      ascending: true,
    });
    res.json(subtasks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Workflow Packs ---
app.get("/api/workflow-packs", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const packs = await pgAdapter.queryAll("workflow_packs", orgId);
    res.json(packs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Soul Presets (Public catalog — no auth required) ---
// Soul avatar fallback — demo photos until DB has thumbnail_url
// Soul avatar fallback — Ivy curated portraits (demo/prototype)
// ⚠️ 데모 후 generated.photos / 자체 AI 생성 이미지로 교체
const AVATAR_FALLBACKS: Record<string, string> = {
  alex: "https://randomuser.me/api/portraits/men/32.jpg",
  sophia: "https://randomuser.me/api/portraits/women/44.jpg",
  marcus: "https://randomuser.me/api/portraits/men/83.jpg",
  yuna: "https://randomuser.me/api/portraits/women/65.jpg",
  liam: "https://randomuser.me/api/portraits/men/11.jpg",
  priya: "https://randomuser.me/api/portraits/women/79.jpg",
  carlos: "https://randomuser.me/api/portraits/men/46.jpg",
  emma: "https://randomuser.me/api/portraits/women/14.jpg",
  jin: "https://randomuser.me/api/portraits/men/56.jpg",
  amara: "https://randomuser.me/api/portraits/women/91.jpg",
  noah: "https://randomuser.me/api/portraits/men/23.jpg",
  hana: "https://randomuser.me/api/portraits/women/57.jpg",
  diego: "https://randomuser.me/api/portraits/men/68.jpg",
  nadia: "https://randomuser.me/api/portraits/women/37.jpg",
  ryan: "https://randomuser.me/api/portraits/men/77.jpg",
  zoe: "https://randomuser.me/api/portraits/women/25.jpg",
  samuel: "https://randomuser.me/api/portraits/men/92.jpg",
  mei: "https://randomuser.me/api/portraits/women/48.jpg",
  ethan: "https://randomuser.me/api/portraits/men/35.jpg",
  isabel: "https://randomuser.me/api/portraits/women/62.jpg",
};

app.get("/api/soul-presets", async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("soul_presets")
      .select("id, name, display_name, category, description, skill_tags, domain, default_model, greeting_message, thumbnail_url, is_premium, premium_price_krw, popularity_score, rating_avg")
      .eq("is_public", true)
      .order("popularity_score", { ascending: false });
    if (error) throw error;
    // Inject fallback avatar URLs if DB has no thumbnail_url
    const presets = (data || []).map((p: any) => ({
      ...p,
      thumbnail_url: p.thumbnail_url || AVATAR_FALLBACKS[p.name?.toLowerCase()] || null,
    }));
    res.json({ presets });
  } catch (err: any) {
    console.error("[API] GET /api/soul-presets error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/soul-presets/:id", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("soul_presets")
      .select("*")
      .eq("id", req.params.id)
      .eq("is_public", true)
      .single();
    if (error || !data) return res.status(404).json({ error: "Preset not found" });
    res.json({ preset: data });
  } catch (err: any) {
    console.error("[API] GET /api/soul-presets/:id error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Soul Usage (per-org token usage) ---
app.get("/api/soul-usage", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const period = (req.query.period as string) || new Date().toISOString().slice(0, 7);
    const { data, error } = await supabaseAdmin
      .from("soul_usage")
      .select("*, agents(name, avatar, department_id)")
      .eq("org_id", orgId)
      .eq("period", period)
      .order("total_output_tokens", { ascending: false });
    if (error) throw error;
    res.json({ usage: data || [], period });
  } catch (err: any) {
    console.error("[API] GET /api/soul-usage error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Org Token Budget ---
app.get("/api/org-budget", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const { data: budget } = await supabaseAdmin
      .from("org_token_budgets")
      .select("*")
      .eq("org_id", orgId)
      .maybeSingle();
    // Also get org plan + limits
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("plan")
      .eq("id", orgId)
      .single();
    let planLimits = null;
    if (org?.plan) {
      const { data: pl } = await supabaseAdmin
        .from("plan_limits")
        .select("monthly_tokens, token_overage_rate_krw, plan")
        .eq("plan", org.plan)
        .single();
      planLimits = pl;
    }
    res.json({ budget: budget || null, planLimits });
  } catch (err: any) {
    console.error("[API] GET /api/org-budget error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ========== SOUL CHAT (LLM Proxy) ==========
// Mount soul chat routes with org middleware
app.use("/api/souls", async (req: any, _res, next) => {
  try {
    req.orgId = await getOrgIdFromRequest(req);
  } catch { /* handled in route */ }
  next();
}, soulChatRoutes);

// --- LLM Health ---
app.get("/api/llm/status", (_req, res) => {
  const router = getModelRouter();
  res.json({
    ready: router.isReady(),
    providers: router.getProviders(),
  });
});

// ========== SOUL CRUD API ==========
import { generateSoulPrompt } from "./services/soul-generator.ts";

// GET /api/souls — list org Souls
app.get("/api/souls", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const { data, error } = await supabaseAdmin
      .from("agents")
      .select("id, name, display_name, role, department, status, avatar_url, avatar_style, persona_prompt, personality_traits, skill_tags, tools, llm_model, llm_temperature, memory_enabled, preset_id, created_at, updated_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    // Inject fallback avatar URLs
    const souls = (data || []).map((s: any) => ({
      ...s,
      avatar_url: s.avatar_url || AVATAR_FALLBACKS[s.name?.toLowerCase()] || null,
    }));
    res.json({ souls });
  } catch (err: any) {
    console.error("[API] GET /api/souls error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/souls/:id — single Soul detail
app.get("/api/souls/:id", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const { data, error } = await supabaseAdmin
      .from("agents")
      .select("*")
      .eq("id", req.params.id)
      .eq("org_id", orgId)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Soul not found" });
    // Generate system prompt for reference
    const systemPrompt = generateSoulPrompt({
      name: data.name,
      display_name: data.display_name || data.name,
      role: data.role || "AI Agent",
      department: data.department || "general",
      persona_prompt: data.persona_prompt,
      personality_traits: data.personality_traits,
      communication_style: data.communication_style,
      skill_tags: data.skill_tags,
      tools: data.tools,
      boundaries: data.boundaries,
      memory_enabled: data.memory_enabled ?? false,
      long_term_memory: data.long_term_memory,
      greeting_message: data.greeting_message,
    });
    res.json({ soul: data, systemPrompt });
  } catch (err: any) {
    console.error("[API] GET /api/souls/:id error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/souls — create Soul (from preset or custom)
app.post("/api/souls", express.json(), async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const { preset_id, name, display_name, role, department, persona_prompt, personality_traits, communication_style, skill_tags, tools, llm_model, llm_temperature, boundaries, greeting_message, avatar_url, avatar_style } = req.body;

    let soulData: Record<string, any> = {
      org_id: orgId,
      name: name || "New Soul",
      display_name: display_name || name || "New Soul",
      role: role || "AI Agent",
      department: department || "general",
      status: "active",
      persona_prompt: persona_prompt || null,
      personality_traits: personality_traits || null,
      communication_style: communication_style || null,
      skill_tags: skill_tags || [],
      tools: tools || [],
      llm_model: llm_model || "auto",
      llm_temperature: llm_temperature ?? 0.7,
      boundaries: boundaries || [],
      greeting_message: greeting_message || null,
      memory_enabled: true,
      avatar_url: avatar_url || null,
      avatar_style: avatar_style || "pixel",
      preset_id: preset_id || null,
    };

    // If creating from preset, merge preset data
    if (preset_id) {
      const { data: preset } = await supabaseAdmin
        .from("soul_presets")
        .select("*")
        .eq("id", preset_id)
        .single();
      if (preset) {
        soulData = {
          ...soulData,
          name: name || preset.name,
          display_name: display_name || preset.display_name,
          role: role || preset.description,
          department: department || preset.category,
          persona_prompt: persona_prompt || preset.persona_prompt,
          personality_traits: personality_traits || preset.personality_traits,
          communication_style: communication_style || preset.communication_style,
          skill_tags: skill_tags || preset.skill_tags,
          tools: tools || preset.default_tools,
          llm_model: llm_model || preset.default_model || "auto",
          llm_temperature: llm_temperature ?? preset.default_temperature ?? 0.7,
          boundaries: boundaries || preset.boundaries,
          greeting_message: greeting_message || preset.greeting_message,
          avatar_url: avatar_url || preset.thumbnail_url,
        };
      }
    }

    const { data, error } = await supabaseAdmin
      .from("agents")
      .insert(soulData)
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ ok: true, soul: data });
  } catch (err: any) {
    console.error("[API] POST /api/souls error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/souls/:id — update Soul
app.put("/api/souls/:id", express.json(), async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const updates: Record<string, any> = {};
    const allowed = ["name", "display_name", "role", "department", "persona_prompt", "personality_traits", "communication_style", "skill_tags", "tools", "llm_model", "llm_temperature", "boundaries", "greeting_message", "memory_enabled", "long_term_memory", "heartbeat_enabled", "heartbeat_interval_min", "heartbeat_tasks", "avatar_url", "avatar_style", "status"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("agents")
      .update(updates)
      .eq("id", req.params.id)
      .eq("org_id", orgId)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Soul not found" });
    res.json({ ok: true, soul: data });
  } catch (err: any) {
    console.error("[API] PUT /api/souls/:id error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/souls/:id — delete Soul
app.delete("/api/souls/:id", async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const { error } = await supabaseAdmin
      .from("agents")
      .delete()
      .eq("id", req.params.id)
      .eq("org_id", orgId);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[API] DELETE /api/souls/:id error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Static file serving (production)
// ---------------------------------------------------------------------------
if (isProduction) {
  const path = await import("node:path");
  app.use(express.static(distDir));
  app.get("{*path}", (_req, res) => {
    res.sendFile(path.default.join(distDir, "index.html"));
  });
}

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
async function start() {
  console.log(`[Next AI Crew] Starting... PORT=${PORT} HOST=${HOST} NODE_ENV=${process.env.NODE_ENV ?? 'unset'}`);
  const supabaseUrlSet = !!process.env.SUPABASE_URL;
  const supabaseKeySet = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log(`[Next AI Crew] SUPABASE_URL=${supabaseUrlSet ? 'SET' : 'MISSING'} SUPABASE_SERVICE_ROLE_KEY=${supabaseKeySet ? 'SET' : 'MISSING'} DATABASE_URL=${process.env.DATABASE_URL ? 'SET' : 'MISSING'}`);
  if (!supabaseUrlSet || !supabaseKeySet) {
    console.error('[Next AI Crew] CRITICAL: Supabase env vars missing! JWT auth will fail for ALL requests. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Railway Variables.');
  }

  // Initialize Supabase runtime (create default org, etc.)
  try {
    await initializeSupabaseRuntime();
    console.log("[Next AI Crew] Supabase connection verified.");
  } catch (err: any) {
    console.error("[Next AI Crew] Supabase init failed (non-fatal, server still starts):", err.message);
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`[Next AI Crew] Server listening on http://${HOST}:${PORT} (PG/Supabase mode)`);
    console.log(`[Next AI Crew] Healthcheck ready at /api/health`);
  });

  // WebSocket upgrade
  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (request, socket, head) => {
    if (request.url === "/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wsClients.add(ws);
        ws.on("close", () => wsClients.delete(ws));
      });
    } else {
      socket.destroy();
    }
  });

  console.log("[Next AI Crew] WebSocket hub ready at /ws");
}

start().catch((err) => {
  console.error("[Next AI Crew] Fatal startup error:", err);
  process.exit(1);
});
