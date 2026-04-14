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

const router = Router();

// ─── GET /api/a2a/rooms ───
router.get("/rooms", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const { data: rooms, error } = await supabaseAdmin
      .from("soul_rooms")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

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

    // Last message per room
    let lastMessageMap: Record<string, any> = {};
    if (roomIds.length > 0) {
      for (const rid of roomIds) {
        const { data: msgs } = await supabaseAdmin
          .from("soul_messages")
          .select("content, sender_soul_id, created_at")
          .eq("room_id", rid)
          .order("created_at", { ascending: false })
          .limit(1);
        if (msgs?.[0]) lastMessageMap[rid] = msgs[0];
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
router.get("/rooms/:roomId/messages", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).orgId;
    if (!orgId) return res.status(401).json({ error: "Unauthorized" });

    const limit = Number(req.query.limit) || 100;
    const { data, error } = await supabaseAdmin
      .from("soul_messages")
      .select("*")
      .eq("room_id", req.params.roomId)
      .eq("org_id", orgId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;

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

    res.json({ messages });
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

const a2aRoutes = router;
