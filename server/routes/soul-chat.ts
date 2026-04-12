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
      return res.status(429).json({
        error: "Token budget exceeded",
        usagePct,
        message: "토큰 한도를 초과했습니다. 충전이 필요합니다.",
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

    // 4. Load conversation history (last 20 messages for context)
    let history: LLMMessage[] = [];
    if (conversation_id) {
      const { data: msgs } = await supabaseAdmin
        .from("soul_conversations")
        .select("role, content")
        .eq("conversation_id", conversation_id)
        .eq("agent_id", soulId)
        .order("created_at", { ascending: true })
        .limit(20);
      if (msgs) {
        history = msgs.map((m: any) => ({ role: m.role, content: m.content }));
      }
    }

    // 5. Build LLM messages with context truncation
    // Rough estimate: 1 token ≈ 4 chars. Keep under ~6000 tokens for context.
    const MAX_CONTEXT_CHARS = 24000;
    let contextChars = systemPrompt.length + message.length;
    const truncatedHistory: LLMMessage[] = [];
    for (let i = history.length - 1; i >= 0; i--) {
      const msgLen = history[i].content.length;
      if (contextChars + msgLen > MAX_CONTEXT_CHARS) break;
      contextChars += msgLen;
      truncatedHistory.unshift(history[i]);
    }

    const llmMessages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      ...truncatedHistory,
      { role: "user", content: message },
    ];

    // 6. Get router and complete
    const modelRouter = getModelRouter();
    if (!modelRouter.isReady()) {
      return res.status(503).json({
        error: "LLM not configured",
        message: "LLM API 키가 설정되지 않았습니다. 관리자에게 문의하세요.",
        providers: [],
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

    let query = supabaseAdmin
      .from("soul_conversations")
      .select("id, role, content, model_used, total_tokens, created_at")
      .eq("agent_id", soulId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (conversationId) {
      query = query.eq("conversation_id", conversationId);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ messages: (data || []).reverse() });
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

  // Save user message
  await supabaseAdmin.from("soul_conversations").insert({
    agent_id: soulId,
    org_id: orgId,
    conversation_id: convId,
    role: "user",
    content: userMessage,
  });

  // Save assistant response
  await supabaseAdmin.from("soul_conversations").insert({
    agent_id: soulId,
    org_id: orgId,
    conversation_id: convId,
    role: "assistant",
    content: assistantResponse,
  });

  return convId;
}

const soulChatRoutes = router;
