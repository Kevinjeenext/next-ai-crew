/**
 * Soul Chat API — LLM Proxy + Message Storage
 * POST /api/souls/:id/chat — send message, get AI response
 * GET  /api/souls/:id/messages — conversation history
 */
export { soulChatRoutes };

import { Router, type Request, type Response } from "express";
import { supabaseAdmin } from "../lib/supabase.ts";
import { generateSoulPrompt } from "../services/soul-generator.ts";
import { getModelRouter } from "../llm/router.ts";
import { getUsageTracker } from "../llm/usage-tracker.ts";
import { detectMentions, type Colleague } from "./a2a-delegation.ts";
import type { LLMMessage } from "../llm/providers.ts";

const router = Router();

// POST /api/souls/:id/chat — send message to Soul, get response
router.post("/:id/chat", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const soulId = String(req.params.id);
    const message = String(req.body.message || "");
    const conversation_id: string | undefined = typeof req.body.conversation_id === "string" ? req.body.conversation_id : undefined;
    const wantStream = !!req.body.stream;

    if (!message?.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    // 1. Load Soul
    const { data: soul, error: soulErr } = await supabaseAdmin
      .from("agents")
      .select("*")
      .eq("id", soulId)
      .eq("org_id", orgId)
      .single();

    if (soulErr || !soul) {
      return res.status(404).json({ error: "Soul not found" });
    }

    // 2. Check budget
    const tracker = getUsageTracker();
    const { allowed, usagePct } = await tracker.checkBudget(orgId);
    if (!allowed) {
      res.set("Retry-After", "3600"); // 1 hour
      return res.status(429).json({
        error: "budget_exceeded",
        usagePct,
        message: "토큰 한도를 초과했습니다. 충전이 필요합니다.",
      });
    }

    // 2.5 Check per-Soul budget (soul_budgets, 008 DDL)
    const soulBudget = await tracker.checkSoulBudget(soulId, orgId);
    if (!soulBudget.allowed) {
      res.set("Retry-After", "3600");
      return res.status(429).json({
        error: "soul_budget_exceeded",
        usagePct: soulBudget.usagePct,
        alertLevel: soulBudget.alertLevel,
        message: `이 Soul의 토큰 예산이 초과되었습니다 (${soulBudget.usagePct}%). 관리자에게 문의하세요.`,
      });
    }

    // 3. Generate system prompt (SOUL.md pattern)
    const systemPrompt = generateSoulPrompt({
      name: soul.name,
      display_name: soul.display_name || soul.name,
      role: soul.role || "AI Agent",
      department: soul.department || "general",
      persona_prompt: soul.persona_prompt,
      personality_traits: soul.personality_traits,
      communication_style: soul.communication_style,
      skill_tags: soul.skill_tags,
      tools: soul.tools,
      boundaries: soul.boundaries,
      memory_enabled: soul.memory_enabled ?? false,
      long_term_memory: soul.long_term_memory,
      greeting_message: soul.greeting_message,
    });

    // 3.5 Inject org chart context — Soul knows its position/reports/org structure
    let orgContext = "";
    try {
      const { data: orgNode } = await supabaseAdmin
        .from("soul_org_chart")
        .select("*")
        .eq("agent_id", soulId)
        .eq("org_id", orgId)
        .single();

      if (orgNode) {
        const { data: orgChart } = await supabaseAdmin
          .from("soul_org_chart")
          .select("agent_id, title, department, rank, parent_agent_id")
          .eq("org_id", orgId)
          .eq("is_active", true);

        const agentIds = (orgChart || []).map((n: any) => n.agent_id).filter(Boolean);
        let nameMap: Record<string, string> = {};
        if (agentIds.length > 0) {
          const { data: agents } = await supabaseAdmin
            .from("agents")
            .select("id, name, role")
            .in("id", agentIds);
          if (agents) nameMap = Object.fromEntries(agents.map((a: any) => [a.id, a.name]));
        }

        orgContext = `\n\n## 조직 정보`;
        orgContext += `\n- 직책: ${orgNode.title}`;
        orgContext += `\n- 직급: ${orgNode.rank}`;
        orgContext += `\n- 부서: ${orgNode.department}`;
        if (orgNode.parent_agent_id && nameMap[orgNode.parent_agent_id]) {
          orgContext += `\n- 상사: ${nameMap[orgNode.parent_agent_id]}`;
        }
        const reports = (orgChart || []).filter((n: any) => n.parent_agent_id === soulId);
        if (reports.length > 0) {
          orgContext += `\n- 부하: ${reports.map((r: any) => nameMap[r.agent_id] || r.title).join(", ")}`;
        }
        orgContext += `\n\n## 전체 조직도`;
        (orgChart || []).forEach((n: any) => {
          const parent = n.parent_agent_id ? (nameMap[n.parent_agent_id] || "(알 수 없음)") : "(최상위)";
          orgContext += `\n- ${nameMap[n.agent_id] || "?"} (${n.title}, ${n.rank}) → 보고: ${parent}`;
        });
      }
    } catch (orgErr: any) {
      // org chart not available (DDL not run) — skip
      console.log("[SoulChat] Org context skipped:", orgErr.message);
    }

    // 3.6 Inject colleague context — Soul knows its teammates
    let colleagueContext = "";
    try {
      const { data: colleagues } = await supabaseAdmin
        .from("agents")
        .select("id, name, display_name, role, department")
        .eq("org_id", orgId)
        .neq("id", soulId)
        .eq("is_active", true);

      if (colleagues && colleagues.length > 0) {
        colleagueContext = `\n\n## Your Team\nYou work with these colleagues in the same organization:`;
        for (const c of colleagues) {
          const name = c.display_name || c.name;
          const dept = c.department ? `, ${c.department}` : "";
          colleagueContext += `\n- ${name} (${c.role || "Team Member"}${dept})`;
        }
        colleagueContext += `\nYou can reference them and collaborate when relevant.`;
      }
    } catch {
      // agents table query failed — skip
    }

    const fullSystemPrompt = systemPrompt + orgContext + colleagueContext;

    // 4. Load conversation history (last 20 messages for context)
    let history: LLMMessage[] = [];
    if (conversation_id) {
      // Try per-row schema first
      const { data: msgs } = await supabaseAdmin
        .from("soul_conversations")
        .select("role, content")
        .eq("conversation_id", conversation_id)
        .eq("agent_id", soulId)
        .eq("org_id", orgId)
        .order("created_at", { ascending: true })
        .limit(10);
      if (msgs && msgs.length > 0 && msgs[0].role) {
        history = msgs.map((m: any) => ({ role: m.role, content: m.content }));
      }
    }
    // Fallback: JSONB messages from latest conversation
    if (history.length === 0) {
      const { data: convs } = await supabaseAdmin
        .from("soul_conversations")
        .select("messages")
        .eq("agent_id", soulId).eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(1);
      const jsonMsgs = convs?.[0]?.messages;
      if (Array.isArray(jsonMsgs)) {
        history = jsonMsgs.slice(-10).map((m: any) => ({ role: m.role, content: m.content }));
      }
    }

    // 5. Build LLM messages with context truncation
    // Rough estimate: 1 token ≈ 4 chars. Keep under ~6000 tokens for context.
    const MAX_CONTEXT_CHARS = 24000;
    let contextChars = fullSystemPrompt.length + message.length;
    const truncatedHistory: LLMMessage[] = [];
    for (let i = history.length - 1; i >= 0; i--) {
      const msgLen = history[i].content.length;
      if (contextChars + msgLen > MAX_CONTEXT_CHARS) break;
      contextChars += msgLen;
      truncatedHistory.unshift(history[i]);
    }

    const llmMessages: LLMMessage[] = [
      { role: "system", content: fullSystemPrompt },
      ...truncatedHistory,
      { role: "user", content: message },
    ];

    // 6. Get router
    const modelRouter = getModelRouter();

    // 7. Mock mode if LLM not configured
    if (!modelRouter.isReady()) {
      const mockResponses = [
        `안녕하세요! 저는 ${soul.name}입니다. ${soul.role}로서 도움이 필요하시면 말씀해주세요! 😊`,
        `네, 알겠습니다! ${soul.skill_tags?.slice(0, 3).join(", ") || "다양한 분야"}에 대해 도움드릴 수 있어요.`,
        `좋은 질문이네요! 제가 ${soul.department || "팀"}에서 경험한 바로는...\n\n이 부분은 좀 더 자세히 살펴볼 필요가 있겠네요. 구체적인 요구사항을 알려주시면 더 정확한 답변을 드릴 수 있습니다.`,
      ];
      const mockContent = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      const convId = await saveMessages(soulId, orgId, conversation_id, message, mockContent);

      if (wantStream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        // Simulate streaming
        for (const char of mockContent) {
          res.write(`data: ${JSON.stringify({ content: char })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ done: true, content: mockContent, conversation_id: convId })}\n\n`);
        res.end();
        return;
      }

      return res.json({
        ok: true,
        response: mockContent,
        model: "mock (LLM not configured)",
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        conversation_id: convId,
        budget: { usagePct: 0 },
        mock: true,
      });
    }

    // 7. Streaming or standard response
    if (wantStream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Railway/Nginx SSE buffering prevention
      req.setTimeout(60000); // 60s timeout for LLM streaming

      let fullContent = "";
      try {
        for await (const chunk of modelRouter.stream(
          soul.llm_model || "auto",
          llmMessages,
          { temperature: soul.llm_temperature ?? 0.7 }
        )) {
          fullContent += chunk;
          res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ done: true, content: fullContent })}\n\n`);
        res.end();
      } catch (err: any) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
        return;
      }

      // Save messages + track usage (fire-and-forget)
      saveMessages(soulId, orgId, conversation_id, message, fullContent).catch(() => {});
      return;
    }

    // Standard (non-streaming) response
    const llmResponse = await modelRouter.complete(
      soul.llm_model || "auto",
      llmMessages,
      { temperature: soul.llm_temperature ?? 0.7 }
    );

    // 8. Save user message + assistant response
    const convId = await saveMessages(soulId, orgId, conversation_id, message, llmResponse.content);

    // 9. Track token usage
    await tracker.recordUsage(soulId, orgId, llmResponse, { conversation_id: convId });

    // 10. Update Soul's last_active
    await supabaseAdmin
      .from("agents")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", soulId);

    // 11. Detect @mentions in response → trigger delegations (fire-and-forget)
    try {
      const { data: colleagueData } = await supabaseAdmin
        .from("agents")
        .select("id, name, display_name, role, department")
        .eq("org_id", orgId)
        .neq("id", soulId)
        .eq("is_active", true);

      if (colleagueData && colleagueData.length > 0) {
        const colleagues: Colleague[] = colleagueData.map((c: any) => ({
          id: c.id,
          name: c.name,
          display_name: c.display_name || c.name,
          role: c.role || "",
          department: c.department,
        }));
        const mentions = detectMentions(llmResponse.content, colleagues);
        if (mentions.length > 0) {
          // Return mentions info in response, delegate async
          for (const mention of mentions) {
            // Fire-and-forget: POST to delegate endpoint internally
            // (실제 위임은 프론트엔드가 delegate API 호출로 트리거)
          }
          return res.json({
            ok: true,
            response: llmResponse.content,
            model: llmResponse.model,
            usage: llmResponse.usage,
            conversation_id: convId,
            budget: { usagePct },
            mentions: mentions.map(m => ({ soul_id: m.soul_id, display_name: m.display_name })),
          });
        }
      }
    } catch {
      // mention detection failure is non-critical
    }

    res.json({
      ok: true,
      response: llmResponse.content,
      model: llmResponse.model,
      usage: llmResponse.usage,
      conversation_id: convId,
      budget: { usagePct },
    });
  } catch (err: any) {
    console.error("[API] POST /api/souls/:id/chat error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/souls/:id/messages — conversation history
router.get("/:id/messages", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const soulId = String(req.params.id);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const conversationId = String(req.query.conversation_id || "") || undefined;

    // Try per-row schema first (009 DDL)
    let query = supabaseAdmin
      .from("soul_conversations")
      .select("id, role, content, model_used, total_tokens, created_at")
      .eq("agent_id", soulId)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (conversationId) {
      query = query.eq("conversation_id", conversationId);
    }

    const { data, error } = await query;

    if (!error && data && data.length > 0 && data[0].role) {
      // Per-row schema
      res.json({ messages: (data || []).reverse() });
    } else {
      // Fallback: JSONB messages column (005 DDL)
      const { data: convs } = await supabaseAdmin
        .from("soul_conversations")
        .select("id, messages, created_at")
        .eq("agent_id", soulId).eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(1);

      const msgs = convs?.[0]?.messages;
      if (Array.isArray(msgs)) {
        res.json({ messages: msgs.slice(-limit) });
      } else {
        res.json({ messages: [] });
      }
    }
  } catch (err: any) {
    console.error("[API] GET /api/souls/:id/messages error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Helper: Save messages ──────────────────
async function saveMessages(
  soulId: string,
  orgId: string,
  conversationId: string | undefined,
  userMessage: string,
  assistantResponse: string
): Promise<string> {
  const convId = conversationId || crypto.randomUUID();

  // Try per-row insert (009 DDL schema)
  const { error } = await supabaseAdmin.from("soul_conversations").insert({
    agent_id: soulId,
    org_id: orgId,
    conversation_id: convId,
    role: "user",
    content: userMessage,
  });

  if (!error) {
    // Per-row schema works — save assistant too
    await supabaseAdmin.from("soul_conversations").insert({
      agent_id: soulId,
      org_id: orgId,
      conversation_id: convId,
      role: "assistant",
      content: assistantResponse,
    });
  } else {
    // Fallback: JSONB messages column (original 005 DDL schema)
    console.log("[saveMessages] Per-row failed, JSONB fallback:", error.message);
    const now = new Date().toISOString();
    const newMsgs = [
      { role: "user", content: userMessage, timestamp: now },
      { role: "assistant", content: assistantResponse, timestamp: now },
    ];
    const { data: existing } = await supabaseAdmin
      .from("soul_conversations")
      .select("id, messages")
      .eq("agent_id", soulId).eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1).single();

    if (existing) {
      const msgs = Array.isArray(existing.messages) ? existing.messages : [];
      await supabaseAdmin.from("soul_conversations")
        .update({ messages: [...msgs, ...newMsgs] })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("soul_conversations").insert({
        agent_id: soulId, org_id: orgId, title: "Chat", messages: newMsgs,
      });
    }
  }

  return convId;
}

// ─── GET /:soulId/conversations — list conversations for a soul ───
router.get("/:soulId/conversations", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });
    const { soulId } = req.params;

    // Try per-row schema
    const { data: convs, error } = await supabaseAdmin
      .from("soul_conversations")
      .select("conversation_id, created_at")
      .eq("soul_id", soulId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && convs && convs.length > 0) {
      // Deduplicate by conversation_id
      const seen = new Set<string>();
      const unique = convs.filter((c: any) => {
        if (seen.has(c.conversation_id)) return false;
        seen.add(c.conversation_id);
        return true;
      });
      return res.json({ conversations: unique });
    }

    // Fallback: try JSONB messages in agents table
    const { data: agent } = await supabaseAdmin
      .from("agents")
      .select("messages")
      .eq("id", soulId)
      .eq("org_id", orgId)
      .single();

    if (agent?.messages && Array.isArray(agent.messages) && agent.messages.length > 0) {
      return res.json({ conversations: [{ conversation_id: "default", created_at: new Date().toISOString() }] });
    }

    res.json({ conversations: [] });
  } catch (err: any) {
    console.error("[API] GET /:soulId/conversations error:", err.message);
    res.json({ conversations: [] });
  }
});

const soulChatRoutes = router;
