/**
 * A2A Delegation Routes — Soul간 업무 위임 + @멘션 + SSE 스트림
 * POST   /api/a2a/delegate              — 위임 생성 + LLM 호출 + 결과 반환
 * GET    /api/a2a/rooms/:id/delegations — 방의 위임 이력
 * GET    /api/a2a/delegations/:id       — 위임 상세
 * GET    /api/a2a/rooms/:id/stream      — SSE 실시간 스트림
 *
 * Author: Mingu (Backend Developer) | 2026-04-16
 * Arch: CTO Soojin a2a_mingu.txt
 */
export { a2aDelegationRoutes };

import { Router, type Request, type Response } from "express";
import { supabaseAdmin } from "../lib/supabase.ts";
import { getModelRouter } from "../llm/router.ts";
import { getUsageTracker } from "../llm/usage-tracker.ts";

const router = Router();
const MAX_DELEGATION_DEPTH = 3;

// ── Types ──
interface Colleague {
  id: string;
  name: string;
  display_name: string;
  role: string;
  department?: string;
  persona_prompt?: string;
}

interface Mention {
  soul_id: string;
  display_name: string;
  pattern: string;
}

// ── @멘션 감지 ──
function detectMentions(text: string, colleagues: Colleague[]): Mention[] {
  const mentions: Mention[] = [];
  const seen = new Set<string>();
  for (const c of colleagues) {
    const patterns = [
      `@${c.display_name}`,
      `@${c.name}`,
      `@${c.role}`,
      `@${c.id}`,
    ];
    for (const p of patterns) {
      if (text.includes(p) && !seen.has(c.id)) {
        seen.add(c.id);
        mentions.push({ soul_id: c.id, display_name: c.display_name || c.name, pattern: p });
        break;
      }
    }
  }
  return mentions;
}

// ── 위임 메시지 추출 (멘션 뒤의 내용) ──
function extractDelegationMessage(text: string, mention: Mention): string {
  const idx = text.indexOf(mention.pattern);
  if (idx === -1) return text;
  const after = text.slice(idx + mention.pattern.length).trim();
  return after || text;
}

// ── SSE 연결 관리 ──
const roomConnections = new Map<string, Set<Response>>();

function addSSEClient(roomId: string, res: Response): void {
  if (!roomConnections.has(roomId)) roomConnections.set(roomId, new Set());
  roomConnections.get(roomId)!.add(res);
}

function removeSSEClient(roomId: string, res: Response): void {
  roomConnections.get(roomId)?.delete(res);
  if (roomConnections.get(roomId)?.size === 0) roomConnections.delete(roomId);
}

function broadcastToRoom(roomId: string, event: string, data: any): void {
  const clients = roomConnections.get(roomId);
  if (!clients) return;
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try { res.write(msg); } catch { /* client disconnected */ }
  }
}

// ─── POST /api/a2a/delegate ─── (리팩토링: 위임 추적 + 토큰 + SSE)
router.post("/delegate", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { room_id, from_soul_id, to_soul_id, message, depth } = req.body;
    if (!from_soul_id || !to_soul_id || !message) {
      return res.status(400).json({ error: "from_soul_id, to_soul_id, message required" });
    }

    const currentDepth = depth || 0;
    if (currentDepth >= MAX_DELEGATION_DEPTH) {
      return res.status(400).json({
        error: "max_delegation_depth",
        message: `위임 깊이 제한 초과 (최대 ${MAX_DELEGATION_DEPTH}단계)`,
      });
    }

    // Load both souls
    const { data: souls } = await supabaseAdmin
      .from("agents")
      .select("id, name, display_name, role, department, persona_prompt")
      .in("id", [from_soul_id, to_soul_id])
      .eq("org_id", orgId);

    const fromSoul = souls?.find((s: any) => s.id === from_soul_id);
    const toSoul = souls?.find((s: any) => s.id === to_soul_id);
    if (!fromSoul || !toSoul) {
      return res.status(404).json({ error: "Soul not found" });
    }

    // Find or create room
    let targetRoomId = room_id;
    if (!targetRoomId) {
      const { data: existingRooms } = await supabaseAdmin
        .from("soul_rooms")
        .select("id")
        .eq("org_id", orgId)
        .eq("room_type", "direct");

      let found = false;
      if (existingRooms) {
        for (const r of existingRooms) {
          const { data: members } = await supabaseAdmin
            .from("soul_room_members")
            .select("soul_id")
            .eq("room_id", r.id);
          const mids = (members || []).map((m: any) => m.soul_id).sort();
          if (mids.length === 2 && mids.includes(from_soul_id) && mids.includes(to_soul_id)) {
            targetRoomId = r.id;
            found = true;
            break;
          }
        }
      }

      if (!found) {
        const fromName = fromSoul.display_name || fromSoul.name;
        const toName = toSoul.display_name || toSoul.name;
        const { data: newRoom } = await supabaseAdmin
          .from("soul_rooms")
          .insert({ org_id: orgId, name: `${fromName} ↔ ${toName}`, room_type: "direct" })
          .select().single();
        targetRoomId = newRoom?.id;
        await supabaseAdmin.from("soul_room_members").insert([
          { room_id: targetRoomId, soul_id: from_soul_id },
          { room_id: targetRoomId, soul_id: to_soul_id },
        ]);
      }
    }

    // Create delegation record
    const { data: delegation, error: delErr } = await supabaseAdmin
      .from("soul_delegations")
      .insert({
        org_id: orgId,
        room_id: targetRoomId,
        from_soul_id,
        to_soul_id,
        original_message: message,
        status: "pending",
        depth: currentDepth,
      })
      .select()
      .single();

    if (delErr) {
      // soul_delegations may not exist (013 DDL not run) — fallback
      console.error("[A2A] delegation insert failed:", delErr.message);
    }
    const delegationId = delegation?.id || null;

    // Save delegation message
    const { data: triggerMsg } = await supabaseAdmin.from("soul_messages").insert({
      org_id: orgId,
      room_id: targetRoomId,
      sender_soul_id: from_soul_id,
      content: message,
      message_type: "delegation",
      delegation_id: delegationId,
      mentioned_soul_ids: [to_soul_id],
    }).select().single();

    // SSE: delegation start
    broadcastToRoom(targetRoomId, "delegation_start", {
      delegation_id: delegationId,
      from: fromSoul.display_name || fromSoul.name,
      to: toSoul.display_name || toSoul.name,
      message,
    });

    // Update delegation status to in_progress
    if (delegationId) {
      try {
        await supabaseAdmin.from("soul_delegations")
          .update({ status: "in_progress", original_message_id: triggerMsg?.id })
          .eq("id", delegationId);
      } catch {}
    }

    // Generate LLM response as toSoul
    const toSoulPrompt = toSoul.persona_prompt ||
      `You are ${toSoul.display_name || toSoul.name}, a ${toSoul.role}. Respond professionally in Korean.`;

    const fromName = fromSoul.display_name || fromSoul.name;
    const modelRouter = getModelRouter();
    const tracker = getUsageTracker();
    let responseText = "";
    let tokensUsed = 0;

    try {
      const llmResult = await modelRouter.complete("auto", [
        { role: "system", content: toSoulPrompt },
        { role: "user", content: `[${fromName} (${fromSoul.role})이(가) 업무를 위임했습니다]\n\n${message}\n\n위 요청에 대해 전문적으로 수행하고 결과를 보고하세요.` },
      ], { complexity: "normal" });
      responseText = llmResult.content;
      tokensUsed = llmResult.usage?.total_tokens || 0;
      await tracker.recordUsage(to_soul_id, orgId, llmResult).catch(() => {});
    } catch (llmErr: any) {
      responseText = `[시스템] 응답 생성 실패: ${llmErr.message}`;
    }

    // Save result message
    const { data: resultMsg } = await supabaseAdmin.from("soul_messages").insert({
      org_id: orgId,
      room_id: targetRoomId,
      sender_soul_id: to_soul_id,
      content: responseText,
      message_type: "delegation_result",
      delegation_id: delegationId,
    }).select().single();

    // Update delegation to completed
    if (delegationId) {
      try {
        await supabaseAdmin.from("soul_delegations")
          .update({
            status: "completed",
            result_message: responseText,
            result_message_id: resultMsg?.id,
            tokens_used: tokensUsed,
            completed_at: new Date().toISOString(),
          })
          .eq("id", delegationId);
      } catch {}
    }

    // Update room last_message_at
    try {
      await supabaseAdmin.from("soul_rooms")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", targetRoomId);
    } catch {}

    // SSE: delegation result
    broadcastToRoom(targetRoomId, "delegation_result", {
      delegation_id: delegationId,
      from: toSoul.display_name || toSoul.name,
      content: responseText,
      tokens_used: tokensUsed,
    });

    // WS broadcast
    const broadcast = req.app.locals.broadcast;
    if (broadcast && resultMsg) {
      broadcast("a2a_message", { room_id: targetRoomId, message: resultMsg });
    }

    res.json({
      delegation_id: delegationId,
      room_id: targetRoomId,
      status: "completed",
      from_soul: { id: from_soul_id, name: fromSoul.display_name || fromSoul.name, role: fromSoul.role },
      to_soul: { id: to_soul_id, name: toSoul.display_name || toSoul.name, role: toSoul.role },
      trigger_message: message,
      response: responseText,
      tokens_used: tokensUsed,
    });
  } catch (err: any) {
    console.error("[API] POST /api/a2a/delegate error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/a2a/rooms/:roomId/delegations ───
router.get("/rooms/:roomId/delegations", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const status = req.query.status as string;

    let query = supabaseAdmin
      .from("soul_delegations")
      .select("*")
      .eq("room_id", req.params.roomId)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      return res.json({ delegations: [], note: "soul_delegations 테이블 미존재" });
    }

    res.json({ delegations: data || [] });
  } catch (err: any) {
    res.json({ delegations: [] });
  }
});

// ─── GET /api/a2a/delegations/:id ───
router.get("/delegations/:id", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { data, error } = await supabaseAdmin
      .from("soul_delegations")
      .select("*")
      .eq("id", req.params.id)
      .eq("org_id", orgId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Delegation not found" });
    }

    // Enrich with soul names
    const soulIds = [data.from_soul_id, data.to_soul_id];
    const { data: souls } = await supabaseAdmin
      .from("agents")
      .select("id, name, display_name, role")
      .in("id", soulIds);

    const soulMap = Object.fromEntries((souls || []).map((s: any) => [s.id, s]));

    res.json({
      ...data,
      from_soul: soulMap[data.from_soul_id] || { id: data.from_soul_id },
      to_soul: soulMap[data.to_soul_id] || { id: data.to_soul_id },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/a2a/rooms/:roomId/stream ─── (SSE 실시간)
router.get("/rooms/:roomId/stream", async (req: Request, res: Response) => {
  const orgId = (req as any).orgId;
  if (!orgId) return res.status(401).json({ error: "Unauthorized" });

  const roomId = String(req.params.roomId);

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ room_id: roomId })}\n\n`);

  // Register client
  addSSEClient(roomId, res);

  // Keepalive every 30s
  const keepalive = setInterval(() => {
    try { res.write(":keepalive\n\n"); } catch { clearInterval(keepalive); }
  }, 30_000);

  // 60s timeout
  const timeout = setTimeout(() => {
    try {
      res.write(`event: timeout\ndata: ${JSON.stringify({ message: "Stream timeout. Reconnect." })}\n\n`);
      res.end();
    } catch {}
  }, 60_000);

  // Cleanup on disconnect
  req.on("close", () => {
    clearInterval(keepalive);
    clearTimeout(timeout);
    removeSSEClient(roomId, res);
  });
});

// Export mention detection for soul-chat.ts
export { detectMentions, extractDelegationMessage, broadcastToRoom };
export type { Colleague, Mention };

const a2aDelegationRoutes = router;
