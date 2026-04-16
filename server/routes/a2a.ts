/**
 * A2A Routes — Soul간 대화 시스템
 * POST   /api/a2a/rooms                    — 방 생성
 * GET    /api/a2a/rooms                    — 방 목록
 * GET    /api/a2a/rooms/:roomId/messages   — 메시지 히스토리
 * POST   /api/a2a/rooms/:roomId/messages   — 메시지 전송
 * POST   /api/a2a/trigger                  — 대화 트리거 (LLM)
 */
export { a2aRoutes };

import { Router, type Request, type Response } from "express";
import { supabaseAdmin } from "../lib/supabase.ts";
import { getModelRouter } from "../llm/router.ts";
import { getUsageTracker } from "../llm/usage-tracker.ts";

const router = Router();

// Helper: update room's last_message_at timestamp
async function touchRoom(roomId: string): Promise<void> {
  await supabaseAdmin
    .from("soul_rooms")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", roomId)
    .catch(() => {});
}

// ─── GET /api/a2a/rooms ───
router.get("/rooms", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { data: rooms, error } = await supabaseAdmin
      .from("soul_rooms")
      .select("*")
      .eq("org_id", orgId)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.log("[A2A] soul_rooms not available:", error.message);
      return res.json({ rooms: [], available: false });
    }

    // Enrich with members
    const roomIds = (rooms || []).map((r: any) => r.id);
    let memberMap: Record<string, any[]> = {};
    if (roomIds.length > 0) {
      const { data: members } = await supabaseAdmin
        .from("soul_room_members")
        .select("room_id, soul_id")
        .in("room_id", roomIds);
      if (members) {
        for (const m of members) {
          if (!memberMap[m.room_id]) memberMap[m.room_id] = [];
          memberMap[m.room_id].push(m.soul_id);
        }
      }
    }

    // Get agent info
    const allSoulIds = [...new Set(Object.values(memberMap).flat())];
    let agentMap: Record<string, any> = {};
    if (allSoulIds.length > 0) {
      const { data: agents } = await supabaseAdmin
        .from("agents")
        .select("id, name, role, avatar_url, preset_id")
        .in("id", allSoulIds);
      if (agents) agentMap = Object.fromEntries(agents.map((a: any) => [a.id, a]));
    }

    // Last message per room — batch via RPC or DISTINCT ON
    // Using a single query with ordering to avoid N+1
    let lastMessageMap: Record<string, any> = {};
    if (roomIds.length > 0) {
      const { data: lastMsgs } = await supabaseAdmin
        .from("soul_messages")
        .select("room_id, content, sender_soul_id, created_at")
        .in("room_id", roomIds)
        .order("created_at", { ascending: false });

      // Take first per room_id (already sorted DESC)
      if (lastMsgs) {
        const seen = new Set<string>();
        for (const m of lastMsgs) {
          if (!seen.has(m.room_id)) {
            seen.add(m.room_id);
            lastMessageMap[m.room_id] = m;
          }
        }
      }
    }

    const enriched = (rooms || []).map((r: any) => ({
      ...r,
      members: (memberMap[r.id] || []).map((sid: string) => agentMap[sid] || { id: sid, name: sid }),
      last_message: lastMessageMap[r.id] || null,
    }));

    res.json({ rooms: enriched, available: true });
  } catch (err: any) {
    console.error("[API] GET /api/a2a/rooms error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/a2a/rooms ───
router.post("/rooms", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { name, room_type, soul_ids } = req.body;
    if (!soul_ids || soul_ids.length < 2)
      return res.status(400).json({ error: "At least 2 souls required" });

    // Create room
    const { data: room, error: roomErr } = await supabaseAdmin
      .from("soul_rooms")
      .insert({ org_id: orgId, name: name || null, room_type: room_type || "direct" })
      .select()
      .single();
    if (roomErr) throw roomErr;

    // Add members
    const members = soul_ids.map((sid: string) => ({ room_id: room.id, soul_id: sid }));
    const { error: memErr } = await supabaseAdmin
      .from("soul_room_members")
      .insert(members);
    if (memErr) throw memErr;

    // System message
    await supabaseAdmin.from("soul_messages").insert({
      org_id: orgId,
      room_id: room.id,
      sender_soul_id: soul_ids[0],
      content: "대화방이 생성되었습니다.",
      message_type: "system",
    });

    res.json({ room: { ...room, members: soul_ids } });
  } catch (err: any) {
    console.error("[API] POST /api/a2a/rooms error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/a2a/rooms/:roomId/messages ───
// Supports cursor pagination: ?cursor=<id>&limit=50&direction=before|after
router.get("/rooms/:roomId/messages", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const cursor = req.query.cursor as string; // message id
    const direction = (req.query.direction as string) || "before"; // before = older, after = newer

    let query = supabaseAdmin
      .from("soul_messages")
      .select("*")
      .eq("room_id", req.params.roomId)
      .eq("org_id", orgId);

    if (cursor) {
      // Get the cursor message's created_at for comparison
      const { data: cursorMsg } = await supabaseAdmin
        .from("soul_messages")
        .select("created_at")
        .eq("id", cursor)
        .single();

      if (cursorMsg) {
        if (direction === "before") {
          query = query.lt("created_at", cursorMsg.created_at)
            .order("created_at", { ascending: false });
        } else {
          query = query.gt("created_at", cursorMsg.created_at)
            .order("created_at", { ascending: true });
        }
      }
    } else {
      // No cursor: get latest messages (descending, then reverse for display)
      query = query.order("created_at", { ascending: false });
    }

    const { data: rawData, error } = await query.limit(limit);
    if (error) throw error;

    // Reverse if we fetched in descending order (for chronological display)
    const data = (!cursor || direction === "before")
      ? (rawData || []).reverse()
      : (rawData || []);

    // Enrich with sender info
    const senderIds = [...new Set((data || []).map((m: any) => m.sender_soul_id))];
    let agentMap: Record<string, any> = {};
    if (senderIds.length > 0) {
      const { data: agents } = await supabaseAdmin
        .from("agents")
        .select("id, name, role, avatar_url, preset_id")
        .in("id", senderIds);
      if (agents) agentMap = Object.fromEntries(agents.map((a: any) => [a.id, a]));
    }

    const messages = (data || []).map((m: any) => ({
      ...m,
      sender: agentMap[m.sender_soul_id] || { id: m.sender_soul_id, name: "Unknown" },
    }));

    // Cursor info for pagination
    const hasMore = messages.length === limit;
    const nextCursor = hasMore && messages.length > 0 ? messages[0].id : null; // oldest msg id for "before" pagination
    const prevCursor = messages.length > 0 ? messages[messages.length - 1].id : null; // newest msg id

    res.json({
      messages,
      cursor: {
        next: nextCursor, // pass as ?cursor=X&direction=before for older
        prev: prevCursor, // pass as ?cursor=X&direction=after for newer
        has_more: hasMore,
      },
    });
  } catch (err: any) {
    console.error("[API] GET messages error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/a2a/rooms/:roomId/messages ───
router.post("/rooms/:roomId/messages", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { sender_soul_id, content, message_type } = req.body;
    if (!sender_soul_id || !content)
      return res.status(400).json({ error: "sender_soul_id and content required" });

    const { data, error } = await supabaseAdmin
      .from("soul_messages")
      .insert({
        org_id: orgId,
        room_id: req.params.roomId,
        sender_soul_id,
        content,
        message_type: message_type || "text",
      })
      .select()
      .single();

    if (error) throw error;

    // Update room's last_message_at
    await touchRoom(req.params.roomId);

    // Broadcast to WebSocket clients for real-time UI update
    const broadcast = req.app.locals.broadcast;
    if (broadcast) {
      broadcast("a2a_message", {
        room_id: req.params.roomId,
        message: data,
      });
    }

    res.json({ message: data });
  } catch (err: any) {
    console.error("[API] POST message error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/a2a/trigger ───
// 대화 트리거: Soul A → Soul B에게 질문 → LLM 응답
router.post("/trigger", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { from_soul_id, to_soul_id, message, room_id } = req.body;
    if (!from_soul_id || !to_soul_id || !message)
      return res.status(400).json({ error: "from_soul_id, to_soul_id, message required" });

    // Get both souls
    const { data: souls } = await supabaseAdmin
      .from("agents")
      .select("id, name, role, persona_prompt, avatar_url, preset_id")
      .in("id", [from_soul_id, to_soul_id]);

    const fromSoul = souls?.find((s: any) => s.id === from_soul_id);
    const toSoul = souls?.find((s: any) => s.id === to_soul_id);
    if (!fromSoul || !toSoul)
      return res.status(404).json({ error: "Soul not found" });

    // Find or create room
    let targetRoomId = room_id;
    if (!targetRoomId) {
      // Check for existing direct room
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
        // Create room
        const { data: newRoom } = await supabaseAdmin
          .from("soul_rooms")
          .insert({ org_id: orgId, name: `${fromSoul.name} ↔ ${toSoul.name}`, room_type: "direct" })
          .select()
          .single();
        targetRoomId = newRoom?.id;

        await supabaseAdmin.from("soul_room_members").insert([
          { room_id: targetRoomId, soul_id: from_soul_id },
          { room_id: targetRoomId, soul_id: to_soul_id },
        ]);
      }
    }

    // Save the trigger message from sender
    await supabaseAdmin.from("soul_messages").insert({
      org_id: orgId,
      room_id: targetRoomId,
      sender_soul_id: from_soul_id,
      content: message,
      message_type: "trigger",
    });

    // Generate LLM response as toSoul
    const systemPrompt = toSoul.persona_prompt ||
      `You are ${toSoul.name}, a ${toSoul.role}. Respond professionally in Korean.`;

    const router = getModelRouter();
    let responseText = "";

    try {
      const llmResult = await router.complete(
        "auto",
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: `[${fromSoul.name} (${fromSoul.role})]: ${message}` },
        ],
        { complexity: "normal" }
      );
      responseText = llmResult.content;

      // Track token usage for the responding Soul
      const tracker = getUsageTracker();
      await tracker.recordUsage(to_soul_id, orgId, llmResult).catch(() => {});
    } catch (llmErr: any) {
      responseText = `[시스템] 응답 생성 실패: ${llmErr.message}`;
    }

    // Save response
    const { data: responseMsg } = await supabaseAdmin
      .from("soul_messages")
      .insert({
        org_id: orgId,
        room_id: targetRoomId,
        sender_soul_id: to_soul_id,
        content: responseText,
        message_type: "response",
      })
      .select()
      .single();

    await touchRoom(targetRoomId);

    // Broadcast trigger response
    const broadcast = req.app.locals.broadcast;
    if (broadcast && responseMsg) {
      broadcast("a2a_message", { room_id: targetRoomId, message: responseMsg });
    }

    res.json({
      room_id: targetRoomId,
      trigger_message: message,
      response: {
        ...responseMsg,
        sender: toSoul,
      },
    });
  } catch (err: any) {
    console.error("[API] POST /api/a2a/trigger error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/a2a/delegate ───
// 리더가 하위 Soul에게 업무 위임 → 자율 대화 체인 (최대 N턴)
router.post("/delegate", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { leader_soul_id, worker_soul_ids, task, max_turns } = req.body;
    if (!leader_soul_id || !worker_soul_ids?.length || !task)
      return res.status(400).json({ error: "leader_soul_id, worker_soul_ids, task required" });

    const turns = Math.min(max_turns || 4, 8);

    // Get all souls
    const allIds = [leader_soul_id, ...worker_soul_ids];
    const { data: souls } = await supabaseAdmin
      .from("agents")
      .select("id, name, role, persona_prompt, avatar_url, preset_id")
      .in("id", allIds);
    if (!souls || souls.length < 2)
      return res.status(404).json({ error: "Souls not found" });

    const soulMap = Object.fromEntries(souls.map((s: any) => [s.id, s]));
    const leader = soulMap[leader_soul_id];
    if (!leader) return res.status(404).json({ error: "Leader soul not found" });

    // Create group room
    const roomName = `${leader.name} 팀 회의`;
    const { data: room } = await supabaseAdmin
      .from("soul_rooms")
      .insert({ org_id: orgId, name: roomName, room_type: "group" })
      .select().single();
    if (!room) return res.status(500).json({ error: "Failed to create room" });

    // Add all members
    await supabaseAdmin.from("soul_room_members").insert(
      allIds.map((id: string) => ({ room_id: room.id, soul_id: id }))
    );

    // System message
    await supabaseAdmin.from("soul_messages").insert({
      org_id: orgId, room_id: room.id, sender_soul_id: leader_soul_id,
      content: `팀 회의가 시작되었습니다. \n업무: ${task}`,
      message_type: "system",
    });

    // Leader gives initial instruction
    const leaderPrompt = leader.persona_prompt || `You are ${leader.name}, a ${leader.role}. Speak in Korean.`;
    const router = getModelRouter();
    const tracker = getUsageTracker();
    let totalDelegateTokens = 0;

    let leaderInstruction = "";
    try {
      const r = await router.complete("auto", [
        { role: "system", content: leaderPrompt },
        { role: "user", content: `다음 업무를 팀원들에게 위임하세요. 각 팀원의 역할에 맞게 구체적 지시를 내리세요:\n\n업무: ${task}\n\n팀원: ${worker_soul_ids.map((id: string) => soulMap[id]?.name + " (" + soulMap[id]?.role + ")").join(", ")}` },
      ], { complexity: "normal" });
      leaderInstruction = r.content;
      totalDelegateTokens += r.usage.total_tokens;
      await tracker.recordUsage(leader_soul_id, orgId, r).catch(() => {});
    } catch {
      leaderInstruction = `팀원 여러분, 다음 업무를 진행해주세요: ${task}`;
    }

    await supabaseAdmin.from("soul_messages").insert({
      org_id: orgId, room_id: room.id, sender_soul_id: leader_soul_id,
      content: leaderInstruction, message_type: "trigger",
    });

    const messages: any[] = [{ role: "leader", name: leader.name, content: leaderInstruction }];

    // Workers respond in round-robin
    for (let turn = 0; turn < turns; turn++) {
      for (const workerId of worker_soul_ids) {
        const worker = soulMap[workerId];
        if (!worker) continue;

        const workerPrompt = worker.persona_prompt || `You are ${worker.name}, a ${worker.role}. Respond professionally in Korean.`;
        const history = messages.map(m => `[${m.name}]: ${m.content}`).join("\n\n");

        let response = "";
        try {
          const r = await router.complete("auto", [
            { role: "system", content: workerPrompt },
            { role: "user", content: `팀 회의 대화:\n\n${history}\n\n당신의 역할(${worker.role})에 맞게 응답하세요. 간결하게 (3-4문장).` },
          ], { complexity: "normal" });
          response = r.content;
          totalDelegateTokens += r.usage.total_tokens;
          await tracker.recordUsage(workerId, orgId, r).catch(() => {});
        } catch {
          response = `[시스템] ${worker.name} 응답 생성 실패`;
        }

        await supabaseAdmin.from("soul_messages").insert({
          org_id: orgId, room_id: room.id, sender_soul_id: workerId,
          content: response, message_type: "response",
        });

        messages.push({ role: "worker", name: worker.name, content: response });
      }

      // Leader follow-up (if not last turn)
      if (turn < turns - 1) {
        const followUpHistory = messages.map(m => `[${m.name}]: ${m.content}`).join("\n\n");
        let followUp = "";
        try {
          const r = await router.complete("auto", [
            { role: "system", content: leaderPrompt },
            { role: "user", content: `팀 회의 대화:\n\n${followUpHistory}\n\n리더로서 후속 지시나 피드백을 주세요. 간결하게 (2-3문장).` },
          ], { complexity: "normal" });
          followUp = r.content;
          totalDelegateTokens += r.usage.total_tokens;
          await tracker.recordUsage(leader_soul_id, orgId, r).catch(() => {});
        } catch {
          followUp = "각자 역할에 맞게 계속 진행해주세요.";
        }

        await supabaseAdmin.from("soul_messages").insert({
          org_id: orgId, room_id: room.id, sender_soul_id: leader_soul_id,
          content: followUp, message_type: "trigger",
        });
        messages.push({ role: "leader", name: leader.name, content: followUp });
      }
    }

    // Final summary from leader
    const finalHistory = messages.map(m => `[${m.name}]: ${m.content}`).join("\n\n");
    let summary = "";
    try {
      const r = await router.complete("auto", [
        { role: "system", content: leaderPrompt },
        { role: "user", content: `팀 회의 대화:\n\n${finalHistory}\n\n회의를 마무리하고 핵심 결론과 다음 단계를 정리해주세요.` },
      ], { complexity: "normal" });
      summary = r.content;
      totalDelegateTokens += r.usage.total_tokens;
      await tracker.recordUsage(leader_soul_id, orgId, r).catch(() => {});
    } catch {
      summary = "회의를 마무리합니다. 각자 역할에 맞게 진행해주세요.";
    }

    await supabaseAdmin.from("soul_messages").insert({
      org_id: orgId, room_id: room.id, sender_soul_id: leader_soul_id,
      content: summary, message_type: "system",
    });

    await touchRoom(room.id);

    res.json({
      room_id: room.id,
      room_name: roomName,
      total_messages: messages.length + 2,
      total_tokens: totalDelegateTokens,
      summary,
    });
  } catch (err: any) {
    console.error("[API] POST /api/a2a/delegate error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/a2a/rooms/:roomId/unread ───
// Unread message count for a soul in a room
router.get("/rooms/:roomId/unread", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const soulId = req.query.soul_id as string;
    if (!soulId) return res.status(400).json({ error: "soul_id query param required" });

    // Get last read timestamp for this soul in this room
    const { data: member } = await supabaseAdmin
      .from("soul_room_members")
      .select("last_read_at")
      .eq("room_id", req.params.roomId)
      .eq("soul_id", soulId)
      .maybeSingle();

    const lastRead = member?.last_read_at || "1970-01-01T00:00:00Z";

    const { count, error } = await supabaseAdmin
      .from("soul_messages")
      .select("*", { count: "exact", head: true })
      .eq("room_id", req.params.roomId)
      .eq("org_id", orgId)
      .neq("sender_soul_id", soulId)
      .gt("created_at", lastRead);

    if (error) {
      // last_read_at column may not exist yet
      return res.json({ unread: 0, note: "last_read_at not available" });
    }

    res.json({ unread: count || 0 });
  } catch (err: any) {
    res.json({ unread: 0 });
  }
});

// ─── POST /api/a2a/rooms/:roomId/read ───
// Mark messages as read for a soul
router.post("/rooms/:roomId/read", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { soul_id } = req.body;
    if (!soul_id) return res.status(400).json({ error: "soul_id required" });

    const { error } = await supabaseAdmin
      .from("soul_room_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("room_id", req.params.roomId)
      .eq("soul_id", soul_id);

    if (error) {
      // last_read_at column may not exist
      return res.json({ ok: true, note: "last_read_at not available" });
    }

    res.json({ ok: true });
  } catch (err: any) {
    res.json({ ok: true });
  }
});

const a2aRoutes = router;
