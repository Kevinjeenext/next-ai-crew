/**
 * A2A Auto-Chain — Soul간 자율적 멀티턴 대화 (SSE 스트리밍)
 * POST /api/a2a/auto-chain — 자율 대화 체인 시작 (SSE 응답)
 *
 * Flow:
 *   1. 방 생성 또는 기존 방 사용
 *   2. initiator Soul이 task 분석 + 팀원 지시 (LLM) → SSE event
 *   3. 각 participant 순서대로 응답 (LLM) → 각 SSE event
 *   4. 모든 메시지를 soul_messages에 저장 + WS broadcast
 *   5. max_rounds 후 initiator가 최종 정리 → SSE done event
 *
 * Author: Mingu (Backend Developer) | 2026-04-18
 * Ticket: A2A Soul간 자율 대화 — Kevin 피드백
 */
export { a2aAutoChainRoutes };

import { Router, type Request, type Response } from "express";
import { supabaseAdmin } from "../lib/supabase.ts";
import { getModelRouter } from "../llm/router.ts";
import { getUsageTracker } from "../llm/usage-tracker.ts";

const router = Router();

// ── Types ──
interface ChainParticipant {
  id: string;
  name: string;
  display_name: string;
  role: string;
  department?: string;
  persona_prompt?: string;
}

interface ChainMessage {
  soul_id: string;
  soul_name: string;
  role: string;
  content: string;
  round: number;
  is_final: boolean;
}

// ── SSE Helper ──
function writeSSE(res: Response, event: string, data: unknown): void {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch {
    /* client disconnected */
  }
}

// ── POST /api/a2a/auto-chain ──
router.post("/auto-chain", async (req: Request, res: Response) => {
  const orgId = (req as any).orgId;
  if (!orgId) return res.status(401).json({ error: "Unauthorized" });

  const {
    initiator_soul_id,
    task,
    participant_soul_ids,
    max_rounds = 3,
    room_id,
  } = req.body;

  // ── Validation ──
  if (!initiator_soul_id || !task || !participant_soul_ids?.length) {
    return res.status(400).json({
      error: "initiator_soul_id, task, participant_soul_ids required",
    });
  }

  const rounds = Math.min(Math.max(1, max_rounds), 5); // 1~5 rounds

  // ── SSE Headers ──
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Railway/Nginx
  res.flushHeaders();

  // Keepalive (every 15s)
  const keepalive = setInterval(() => {
    try { res.write(":keepalive\n\n"); } catch { clearInterval(keepalive); }
  }, 15_000);

  // Cleanup on disconnect
  let aborted = false;
  req.on("close", () => {
    aborted = true;
    clearInterval(keepalive);
  });

  try {
    // ── 1. Load all participants ──
    const allIds = [initiator_soul_id, ...participant_soul_ids];
    const uniqueIds = [...new Set(allIds)];

    const { data: souls } = await supabaseAdmin
      .from("agents")
      .select("id, name, display_name, role, department, persona_prompt")
      .in("id", uniqueIds)
      .eq("org_id", orgId);

    if (!souls || souls.length < 2) {
      writeSSE(res, "error", { message: "Insufficient participants found" });
      res.end();
      clearInterval(keepalive);
      return;
    }

    const soulMap = new Map<string, ChainParticipant>(
      souls.map((s: any) => [
        s.id,
        {
          id: s.id,
          name: s.name,
          display_name: s.display_name || s.name,
          role: s.role || "Team Member",
          department: s.department,
          persona_prompt: s.persona_prompt,
        },
      ])
    );

    const initiator = soulMap.get(initiator_soul_id);
    if (!initiator) {
      writeSSE(res, "error", { message: "Initiator soul not found" });
      res.end();
      clearInterval(keepalive);
      return;
    }

    // ── 2. Find or create room ──
    let targetRoomId = room_id;
    if (!targetRoomId) {
      const participantNames = uniqueIds
        .map((id) => soulMap.get(id)?.display_name || id)
        .join(", ");
      const roomName = `${initiator.display_name} 팀 회의: ${task.slice(0, 40)}`;

      const { data: room } = await supabaseAdmin
        .from("soul_rooms")
        .insert({
          org_id: orgId,
          name: roomName,
          room_type: "group",
        })
        .select()
        .single();

      if (!room) {
        writeSSE(res, "error", { message: "Failed to create room" });
        res.end();
        clearInterval(keepalive);
        return;
      }

      targetRoomId = room.id;

      // Add all members
      await supabaseAdmin.from("soul_room_members").insert(
        uniqueIds.map((id) => ({ room_id: targetRoomId, soul_id: id }))
      );
    }

    // ── SSE: chain_start ──
    writeSSE(res, "chain_start", {
      room_id: targetRoomId,
      initiator: {
        soul_id: initiator.id,
        soul_name: initiator.display_name,
        role: initiator.role,
      },
      participants: participant_soul_ids.map((id: string) => {
        const p = soulMap.get(id);
        return {
          soul_id: id,
          soul_name: p?.display_name || id,
          role: p?.role || "Unknown",
        };
      }),
      task,
      max_rounds: rounds,
    });

    // ── System message in room ──
    await supabaseAdmin.from("soul_messages").insert({
      org_id: orgId,
      room_id: targetRoomId,
      sender_soul_id: initiator_soul_id,
      content: `🔗 자율 대화가 시작되었습니다.\n\n**주제:** ${task}\n**참여자:** ${uniqueIds.map((id) => soulMap.get(id)?.display_name || id).join(", ")}\n**라운드:** ${rounds}`,
      message_type: "system",
    });

    const modelRouter = getModelRouter();
    const tracker = getUsageTracker();
    const broadcast = req.app.locals.broadcast;

    // Conversation history for LLM context
    const conversationHistory: ChainMessage[] = [];
    let totalTokens = 0;
    let totalMessages = 0;

    // ── Helper: Generate response from a soul ──
    async function generateSoulResponse(
      soul: ChainParticipant,
      context: string,
      round: number,
      isFinal: boolean
    ): Promise<string> {
      if (aborted) return "[중단됨]";

      const systemPrompt =
        soul.persona_prompt ||
        `You are ${soul.display_name}, a ${soul.role}. Respond professionally in Korean.`;

      let content = "";
      try {
        const llmResult = await modelRouter.complete("auto", [
          { role: "system", content: systemPrompt },
          { role: "user", content: context },
        ], { complexity: "normal" });

        content = llmResult.content;
        totalTokens += llmResult.usage?.total_tokens || 0;
        await tracker.recordUsage(soul.id, orgId, llmResult).catch(() => {});
      } catch (err: any) {
        content = `[시스템] ${soul.display_name} 응답 생성 실패: ${err.message}`;
      }

      // Save to DB
      const { data: savedMsg } = await supabaseAdmin
        .from("soul_messages")
        .insert({
          org_id: orgId,
          room_id: targetRoomId,
          sender_soul_id: soul.id,
          content,
          message_type: isFinal ? "chain_summary" : "chain_response",
        })
        .select()
        .single();

      // WS broadcast for real-time
      if (broadcast && savedMsg) {
        broadcast("a2a_message", {
          room_id: targetRoomId,
          message: savedMsg,
        });
      }

      totalMessages++;

      // SSE event
      const chainMsg: ChainMessage = {
        soul_id: soul.id,
        soul_name: soul.display_name,
        role: soul.role,
        content,
        round,
        is_final: isFinal,
      };
      writeSSE(res, "message", chainMsg);
      conversationHistory.push(chainMsg);

      return content;
    }

    // ── 3. Initiator kick-off ──
    const participantList = participant_soul_ids
      .map((id: string) => {
        const p = soulMap.get(id);
        return p ? `${p.display_name} (${p.role})` : id;
      })
      .join(", ");

    await generateSoulResponse(
      initiator,
      `다음 업무를 팀원들에게 지시하세요. 각 팀원의 역할에 맞게 구체적으로 지시해주세요.\n\n` +
        `**업무:** ${task}\n\n` +
        `**팀원:** ${participantList}\n\n` +
        `간결하게 3-5문장으로 지시하세요.`,
      0,
      false
    );

    // ── 4. Multi-round conversation ──
    for (let round = 1; round <= rounds; round++) {
      if (aborted) break;

      // Each participant responds
      for (const pid of participant_soul_ids) {
        if (aborted) break;

        const participant = soulMap.get(pid);
        if (!participant) continue;

        const history = conversationHistory
          .map((m) => `[${m.soul_name} (${m.role})]: ${m.content}`)
          .join("\n\n");

        await generateSoulResponse(
          participant,
          `팀 대화 (라운드 ${round}/${rounds}):\n\n${history}\n\n` +
            `당신의 역할(${participant.role})에 맞게 응답하세요. 간결하게 3-4문장.`,
          round,
          false
        );
      }

      // Initiator follow-up (except last round)
      if (round < rounds && !aborted) {
        const history = conversationHistory
          .map((m) => `[${m.soul_name} (${m.role})]: ${m.content}`)
          .join("\n\n");

        await generateSoulResponse(
          initiator,
          `팀 대화 (라운드 ${round}/${rounds}):\n\n${history}\n\n` +
            `리더로서 후속 지시나 피드백을 주세요. 간결하게 2-3문장.`,
          round,
          false
        );
      }
    }

    // ── 5. Final summary from initiator ──
    if (!aborted) {
      const fullHistory = conversationHistory
        .map((m) => `[${m.soul_name} (${m.role})]: ${m.content}`)
        .join("\n\n");

      await generateSoulResponse(
        initiator,
        `팀 대화 전체:\n\n${fullHistory}\n\n` +
          `회의를 마무리하고 핵심 결론과 다음 단계를 정리해주세요. 간결하게.`,
        rounds,
        true
      );
    }

    // ── Update room timestamp ──
    try {
      await supabaseAdmin
        .from("soul_rooms")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", targetRoomId);
    } catch {}

    // ── SSE: done ──
    writeSSE(res, "done", {
      room_id: targetRoomId,
      total_messages: totalMessages,
      total_tokens: totalTokens,
      total_rounds: rounds,
      summary: conversationHistory[conversationHistory.length - 1]?.content || "",
    });
  } catch (err: any) {
    console.error("[API] POST /api/a2a/auto-chain error:", err.message);
    writeSSE(res, "error", { message: err.message });
  } finally {
    clearInterval(keepalive);
    try { res.end(); } catch {}
  }
});

const a2aAutoChainRoutes = router;
