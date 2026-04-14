/**
 * ConversationsPage — A2A Soul 대화 열람
 * 좌: 방 목록 | 우: 채팅 뷰어
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { MessageSquare, Plus, Send, Users, RefreshCw, Radio } from "lucide-react";
import { apiFetch } from "../../lib/api-fetch";
import SoulAvatar from "../ui/SoulAvatar";
import "./conversations.css";

interface Room {
  id: string;
  name: string | null;
  room_type: string;
  members: { id: string; name: string; avatar_url?: string }[];
  last_message: { content: string; sender_soul_id: string; created_at: string } | null;
  created_at: string;
}

interface Message {
  id: string;
  sender_soul_id: string;
  content: string;
  message_type: string;
  created_at: string;
  sender: { id: string; name: string; avatar_url?: string; role?: string };
}

interface Soul {
  id: string;
  name: string;
  role?: string;
  avatar_url?: string;
}

export default function ConversationsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [souls, setSouls] = useState<Soul[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [triggerInput, setTriggerInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const loadRooms = useCallback(async () => {
    try {
      const res = await apiFetch("/api/a2a/rooms");
      const data = await res.json();
      setRooms(data.rooms || []);
      setAvailable(data.available !== false);
    } catch { setRooms([]); }
    finally { setLoading(false); }
  }, []);

  const loadMessages = useCallback(async (roomId: string) => {
    try {
      const res = await apiFetch(`/api/a2a/rooms/${roomId}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch { setMessages([]); }
  }, []);

  const loadSouls = useCallback(async () => {
    try {
      const res = await apiFetch("/api/souls");
      const data = await res.json();
      setSouls((data.agents || data || []).map((a: any) => ({ id: a.id, name: a.name, role: a.role, avatar_url: a.avatar_url })));
    } catch {}
  }, []);

  useEffect(() => { loadRooms(); loadSouls(); }, [loadRooms, loadSouls]);

  // Poll for new messages
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (selectedRoom) {
      loadMessages(selectedRoom);
      pollRef.current = setInterval(() => { loadMessages(selectedRoom); loadRooms(); }, 2000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedRoom, loadMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoom(roomId);
    setTriggerInput("");
  };

  const handleTrigger = async () => {
    if (!triggerInput.trim() || !selectedRoom || sending) return;
    const room = rooms.find((r) => r.id === selectedRoom);
    if (!room || room.members.length < 2) return;

    setSending(true);
    try {
      const from = room.members[0];
      const to = room.members[1];
      await apiFetch("/api/a2a/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_soul_id: from.id,
          to_soul_id: to.id,
          message: triggerInput,
          room_id: selectedRoom,
        }),
      });
      setTriggerInput("");
      await loadMessages(selectedRoom);
    } catch (err) {
      console.error("Trigger failed:", err);
    } finally { setSending(false); }
  };

  const handleCreateRoom = async (soulIds: string[], name?: string) => {
    try {
      await apiFetch("/api/a2a/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soul_ids: soulIds, name, room_type: soulIds.length === 2 ? "direct" : "group" }),
      });
      setShowCreate(false);
      await loadRooms();
    } catch (err) { console.error("Create room failed:", err); }
  };

  const selectedRoomData = rooms.find((r) => r.id === selectedRoom);

  if (loading) {
    return <div className="conv-loading"><MessageSquare size={48} strokeWidth={1} /><p>대화 로딩 중...</p></div>;
  }

  return (
    <div className="conv-page">
      {/* Left: Room List */}
      <div className="conv-sidebar">
        <div className="conv-sidebar-header">
          <h2>Soul 대화</h2>
          <button className="conv-create-btn" onClick={() => setShowCreate(true)}>
            <Plus size={16} />
          </button>
        </div>

        {!available && (
          <div className="conv-unavailable">⚠️ 010 DDL 실행 대기</div>
        )}

        <div className="conv-room-list">
          {rooms.length === 0 ? (
            <div className="conv-empty-rooms">
              <Users size={24} strokeWidth={1} />
              <p>대화방 없음</p>
              <button onClick={() => setShowCreate(true)}>대화방 만들기</button>
            </div>
          ) : rooms.map((room) => (
            <div
              key={room.id}
              className={`conv-room-item ${selectedRoom === room.id ? "active" : ""}`}
              onClick={() => handleSelectRoom(room.id)}
            >
              <div className="conv-room-avatars">
                {room.members.slice(0, 3).map((m) => (
                  <SoulAvatar key={m.id} name={m.name} imageUrl={(m as any).avatar_url} size="xs" />
                ))}
              </div>
              <div className="conv-room-info">
                <span className="conv-room-name">{room.name || room.members.map((m) => m.name).join(" ↔ ")}</span>
                {room.last_message && (
                  <span className="conv-room-preview">{room.last_message.content.slice(0, 40)}</span>
                )}
              </div>
              <span className="conv-room-type">{room.room_type === "direct" ? "1:1" : "그룹"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Chat Viewer */}
      <div className="conv-main">
        {!selectedRoom ? (
          <div className="conv-empty-chat">
            <MessageSquare size={64} strokeWidth={1} />
            <h3>대화방을 선택하세요</h3>
            <p>Soul간 A2A 대화를 열람할 수 있습니다</p>
          </div>
        ) : (
          <>
            <div className="conv-chat-header">
              <div className="conv-chat-title">
                {selectedRoomData?.members.map((m) => (
                  <div key={m.id} className="conv-chat-member">
                    <SoulAvatar name={m.name} imageUrl={(m as any).avatar_url} size="xs" />
                    <span>{m.name}</span>
                  </div>
                ))}
              </div>
              <div className="conv-live-indicator">
                <Radio size={12} className="conv-live-pulse" />
                <span>실시간</span>
              </div>
              <span className="conv-msg-count">{messages.length}건</span>
              <button className="conv-refresh-btn" onClick={() => loadMessages(selectedRoom!)}>
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="conv-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`conv-message ${msg.message_type === "system" ? "system" : ""}`}>
                  {msg.message_type === "system" ? (
                    <div className="conv-system-msg">{msg.content}</div>
                  ) : (
                    <>
                      <SoulAvatar name={msg.sender.name} imageUrl={msg.sender.avatar_url} size="sm" />
                      <div className="conv-msg-body">
                        <div className="conv-msg-header">
                          <span className="conv-msg-sender">{msg.sender.name}</span>
                          {msg.sender.role && <span className="conv-msg-role">{msg.sender.role}</span>}
                          <span className="conv-msg-time">{new Date(msg.created_at).toLocaleTimeString("ko")}</span>
                          {msg.message_type === "trigger" && <span className="conv-msg-badge trigger">트리거</span>}
                          {msg.message_type === "response" && <span className="conv-msg-badge response">AI 응답</span>}
                        </div>
                        <p className="conv-msg-content">{msg.content}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="conv-input-bar">
              <input
                value={triggerInput}
                onChange={(e) => setTriggerInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleTrigger()}
                placeholder={`${selectedRoomData?.members[0]?.name || "Soul"}에게 지시하기...`}
                disabled={sending}
              />
              <button className="conv-send-btn" onClick={handleTrigger} disabled={!triggerInput.trim() || sending}>
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreate && (
        <CreateRoomModal
          souls={souls}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </div>
  );
}

function CreateRoomModal({ souls, onClose, onCreate }: {
  souls: Soul[];
  onClose: () => void;
  onCreate: (ids: string[], name?: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="conv-modal-overlay" onClick={onClose}>
      <div className="conv-modal" onClick={(e) => e.stopPropagation()}>
        <h2>대화방 만들기</h2>
        <label>방 이름 (선택)</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 마케팅 회의" />
        <label>Soul 선택 (2명 이상)</label>
        <div className="conv-soul-select">
          {souls.map((s) => (
            <div
              key={s.id}
              className={`conv-soul-chip ${selected.has(s.id) ? "active" : ""}`}
              onClick={() => toggle(s.id)}
            >
              <SoulAvatar name={s.name} imageUrl={s.avatar_url} size="xs" />
              <span>{s.name}</span>
              {s.role && <span className="conv-soul-role">{s.role}</span>}
            </div>
          ))}
          {souls.length === 0 && <p className="conv-no-souls">채용된 Soul이 없습니다</p>}
        </div>
        <div className="conv-modal-actions">
          <button className="conv-btn-cancel" onClick={onClose}>취소</button>
          <button
            className="conv-btn-save"
            disabled={selected.size < 2}
            onClick={() => onCreate([...selected], name || undefined)}
          >
            만들기 ({selected.size}명)
          </button>
        </div>
      </div>
    </div>
  );
}
