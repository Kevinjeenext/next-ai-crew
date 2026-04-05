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
import { initializeSupabaseRuntime, getOrgIdFromRequest } from "./db/supabase-db-shim.ts";
import * as pgAdapter from "./db/pg-adapter.ts";
import { createWsHub } from "./ws/hub.ts";
import authRoutes from "./modules/routes/auth/signup.ts";
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
  res.json({
    status: "ok",
    mode: "supabase",
    version: process.env.npm_package_version ?? "0.1.0",
    timestamp: new Date().toISOString(),
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
  try {
    return await getOrgIdFromRequest(req);
  } catch (err: any) {
    // MVP fallback: if no auth token, use DEFAULT_ORG_ID for development
    const fallbackOrgId = process.env.DEFAULT_ORG_ID;
    if (fallbackOrgId) return fallbackOrgId;
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
    res.json(agents);
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
    res.json(agent);
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
    const agent = await pgAdapter.insertRow("agents", {
      org_id: orgId,
      id: id ?? crypto.randomUUID(),
      name: name ?? "New Agent",
      department_id,
      role: role ?? "junior",
      avatar_emoji: avatar_emoji ?? "🤖",
      personality,
      ...rest,
    });
    broadcast("agent_update", agent);
    res.status(201).json(agent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/agents/:id", express.json(), async (req, res) => {
  try {
    const orgId = await requireOrg(req, res);
    if (!orgId) return;
    const updated = await pgAdapter.updateRow("agents", orgId, req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Agent not found" });
    broadcast("agent_update", updated);
    res.json(updated);
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
    res.json(departments);
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
    res.status(201).json(dept);
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
    res.json(tasks);
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
    res.json(task);
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
    res.status(201).json(task);
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
  console.log(`[Next AI Crew] SUPABASE_URL=${SUPABASE_CONFIGURED ? 'SET' : 'MISSING'} DATABASE_URL=${process.env.DATABASE_URL ? 'SET' : 'MISSING'}`);

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
