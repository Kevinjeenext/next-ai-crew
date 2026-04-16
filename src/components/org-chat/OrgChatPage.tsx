/**
 * OrgChatPage — 조직 대화 (A2A 위임 + SSE 실시간)
 * /org-chat → 방 목록, /org-chat/:roomId → 대화 상세
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageSquare, Plus, Send, Users, Radio, ArrowRight, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { apiFetch } from "../../lib/api-fetch";
import SoulAvatar from "../ui/SoulAvatar";
import "./org-chat.css";

interface Room {
  id: string;
  name: string | null;
  room_type: string;
  members: { id: string; name: string; avatar_url?: string; role?: string }[];
  last_message: { content: string; sender_soul_id: string; created_at: string } | null;
  created_at: string;
  unread_count?: number;
}

interface Message {
  id: string;
  sender_soul_id: string;
  content: string;
  message_type: "chat" | "delegation" | "delegation_result" | "system" | "trigger" | "response";
  delegation_id?: string;
  mentioned_soul_ids?: string[];
  tokens_used?: number;
  created_at: string;
  sender: { id: string; name: string; avatar_url?: string; role?: string };
}

interface Delegation {
  id: string;
  from_soul: { name: string; role?: string };
  to_soul: { name: string; role?: string };
  original_message: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
  result_message?: string;
  tokens_used: number;
  created_at: string;
  completed_at?: string;
}

interface Soul { id: string; name: string; role?: string; avatar_url?: string; }

export default function OrgChatPage() {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [souls, setSouls] = useState<Soul[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Load rooms
  const loadRooms = useCallback(async () => {
    try {
      const res = await apiFetch("/api/a2a/rooms");
      const data = await res.json();
      setRooms(data.rooms || []);
      setAvailable(data.available !== false);
    } catch { setRooms([]); }
    finally { setLoading(false); }
  }, []);

  // Load messages
  const loadMessages = useCallback(async (rid: string) => {
    try {
      const res = await apiFetch(`/api/a2a/rooms/${rid}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch { setMessages([]); }
  }, []);

  // Load souls
  useEffect(() => {
    loadRooms();
    apiFetch("/api/souls").then(r => r.json()).then(d => {
      setSouls((d.agents || d || []).map((a: any) => ({ id: a.id, name: a.name, role: a.role, avatar_url: a.avatar_url })));
    }).catch(() => {});
  }, [loadRooms]);

  // SSE or polling for messages
  useEffect(() => {
    if (!roomId) return;
    loadMessages(roomId);

    // Try SSE first
    const API = import.meta.env.VITE_API_URL || "";
    const sseUrl = `${API}/api/a2a/rooms/${roomId}/stream`;
    
    try {
      const es = new EventSource(sseUrl, { withCredentials: true });
      sseRef.current = es;

      es.onopen = () => setSseConnected(true);
      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "message" || msg.type === "delegation_result" || msg.type === "delegation_start") {
            setMessages(prev => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
        } catch {}
      };
      es.onerror = () => {
        setSseConnected(false);
        es.close();
        // Fallback to polling
        startPolling(roomId);
      };
    } catch {
      // SSE not available, use polling
      startPolling(roomId);
    }

    return () => {
      sseRef.current?.close();
      sseRef.current = null;
      setSseConnected(false);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [roomId, loadMessages]);

  function startPolling(rid: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => { loadMessages(rid); loadRooms(); }, 2000);
  }

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send trigger/delegation
  const handleSend = async () => {
    if (!input.trim() || !roomId || sending) return;
    const room = rooms.find(r => r.id === roomId);
    if (!room || room.members.length < 2) return;

    setSending(true);
    try {
      await apiFetch("/api/a2a/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_soul_id: room.members[0].id,
          to_soul_id: room.members[1].id,
          message: input,
          room_id: roomId,
        }),
      });
      setInput("");
      if (!sseConnected) await loadMessages(roomId);
    } catch (err) {
      console.error("Send failed:", err);
    } finally { setSending(false); }
  };

  // Create room
  const handleCreateRoom = async (soulIds: string[], name?: string) => {
    try {
      const res = await apiFetch("/api/a2a/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soul_ids: soulIds, name, room_type: soulIds.length === 2 ? "direct" : "group" }),
      });
      const data = await res.json();
      setShowCreate(false);
      await loadRooms();
      if (data.room?.id) navigate(`/org-chat/${data.room.id}`);
    } catch {}
  };

  const selectedRoom = rooms.find(r => r.id === roomId);

  if (loading) return <div className="oc-loading"><MessageSquare size={48} strokeWidth={1} /><p>로딩 중...</p></div>;

  return (
    <div className="oc-page">
      {/* Sidebar: Room List */}
      <div className="oc-sidebar">
        <div className="oc-sidebar-header">
          <h2>조직 대화</h2>
          <button className="oc-create-btn" onClick={() => setShowCreate(true)} title="대화방 만들기"><Plus size={16} /></button>
        </div>

        {!available && <div className="oc-notice">⚠️ DDL 실행 대기</div>}

        <div className="oc-room-list">
          {rooms.length === 0 ? (
            <div className="oc-empty-rooms">
              <Users size={24} strokeWidth={1} />
              <p>대화방이 없습니다</p>
              <button className="btn-primary" onClick={() => setShowCreate(true)}>대화방 만들기</button>
            </div>
          ) : rooms.map(room => (
            <div
              key={room.id}
              className={`oc-room-item ${roomId === room.id ? "active" : ""}`}
              onClick={() => navigate(`/org-chat/${room.id}`)}
            >
              <div className="oc-room-avatars">
                {room.members.slice(0, 3).map(m => (
                  <SoulAvatar key={m.id} name={m.name} imageUrl={m.avatar_url} size="xs" />
                ))}
              </div>
              <div className="oc-room-info">
                <span className="oc-room-name">{room.name || room.members.map(m => m.name).join(" ↔ ")}</span>
                {room.last_message && (
                  <span className="oc-room-preview">{room.last_message.content.slice(0, 40)}</span>
                )}
              </div>
              <span className="oc-room-badge">{room.room_type === "direct" ? "1:1" : "그룹"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main: Chat View */}
      <div className="oc-main">
        {!roomId ? (
          <div className="oc-empty-chat">
            <MessageSquare size={64} strokeWidth={1} />
            <h3>대화방을 선택하세요</h3>
            <p>Soul 간 업무 위임과 협업을 관전하세요</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="oc-chat-header">
              <div className="oc-chat-members">
                {selectedRoom?.members.map(m => (
                  <div key={m.id} className="oc-member-chip">
                    <SoulAvatar name={m.name} imageUrl={m.avatar_url} size="xs" />
                    <span>{m.name}</span>
                    {m.role && <span className="oc-member-role">{m.role}</span>}
                  </div>
                ))}
              </div>
              <div className="oc-header-right">
                <div className={`oc-live ${sseConnected ? "connected" : ""}`}>
                  <Radio size={12} /> {sseConnected ? "실시간" : "폴링"}
                </div>
                <span className="oc-msg-count">{messages.length}건</span>
              </div>
            </div>

            {/* Messages */}
            <div className="oc-messages">
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="oc-input-bar">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={`${selectedRoom?.members[0]?.name || "Soul"}에게 지시하기...`}
                disabled={sending}
              />
              <button className="oc-send-btn" onClick={handleSend} disabled={!input.trim() || sending}>
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreate && (
        <CreateRoomModal souls={souls} onClose={() => setShowCreate(false)} onCreate={handleCreateRoom} />
      )}
    </div>
  );
}

/* ─── Message Bubble (type-based rendering) ─── */
function MessageBubble({ msg }: { msg: Message }) {
  switch (msg.message_type) {
    case "system":
      return (
        <div className="oc-msg oc-msg-system">
          <div className="oc-system-text">{msg.content}</div>
        </div>
      );

    case "delegation":
      return (
        <div className="oc-msg oc-msg-delegation">
          <div className="oc-delegation-banner">
            <div className="oc-delegation-header">
              <ArrowRight size={16} />
              <span className="oc-delegation-label">업무 위임</span>
            </div>
            <div className="oc-delegation-flow">
              <SoulAvatar name={msg.sender.name} imageUrl={msg.sender.avatar_url} size="sm" />
              <ArrowRight size={14} className="oc-arrow" />
              <span className="oc-delegation-target">
                {msg.mentioned_soul_ids?.[0] || "대상 Soul"}
              </span>
            </div>
            <p className="oc-delegation-task">{msg.content}</p>
          </div>
        </div>
      );

    case "delegation_result":
      return (
        <div className="oc-msg oc-msg-result">
          <SoulAvatar name={msg.sender.name} imageUrl={msg.sender.avatar_url} size="sm" />
          <div className="oc-result-body">
            <div className="oc-result-header">
              <span className="oc-msg-sender">{msg.sender.name}</span>
              <span className="oc-result-badge"><CheckCircle2 size={12} /> 위임 결과</span>
              {msg.tokens_used && (
                <span className="oc-token-badge"><Zap size={10} /> {msg.tokens_used.toLocaleString()}</span>
              )}
              <span className="oc-msg-time">{new Date(msg.created_at).toLocaleTimeString("ko")}</span>
            </div>
            <div className="oc-result-content">{msg.content}</div>
          </div>
        </div>
      );

    case "trigger":
      return (
        <div className="oc-msg oc-msg-trigger">
          <SoulAvatar name={msg.sender.name} imageUrl={msg.sender.avatar_url} size="sm" />
          <div className="oc-msg-body">
            <div className="oc-msg-header">
              <span className="oc-msg-sender">{msg.sender.name}</span>
              {msg.sender.role && <span className="oc-msg-role">{msg.sender.role}</span>}
              <span className="oc-msg-badge trigger">지시</span>
              <span className="oc-msg-time">{new Date(msg.created_at).toLocaleTimeString("ko")}</span>
            </div>
            <p className="oc-msg-content">{msg.content}</p>
          </div>
        </div>
      );

    default: // chat, response
      return (
        <div className={`oc-msg ${msg.message_type === "response" ? "oc-msg-response" : ""}`}>
          <SoulAvatar name={msg.sender.name} imageUrl={msg.sender.avatar_url} size="sm" />
          <div className="oc-msg-body">
            <div className="oc-msg-header">
              <span className="oc-msg-sender">{msg.sender.name}</span>
              {msg.sender.role && <span className="oc-msg-role">{msg.sender.role}</span>}
              {msg.message_type === "response" && <span className="oc-msg-badge response">AI 응답</span>}
              <span className="oc-msg-time">{new Date(msg.created_at).toLocaleTimeString("ko")}</span>
            </div>
            <p className="oc-msg-content">{msg.content}</p>
          </div>
        </div>
      );
  }
}

/* ─── Create Room Modal ─── */
function CreateRoomModal({ souls, onClose, onCreate }: {
  souls: Soul[];
  onClose: () => void;
  onCreate: (ids: string[], name?: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");

  const toggle = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div className="oc-modal-overlay" onClick={onClose}>
      <div className="oc-modal" onClick={e => e.stopPropagation()}>
        <h2>대화방 만들기</h2>
        <label>방 이름 (선택)</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="예: 마케팅 회의" />
        <label>Soul 선택 (2명 이상)</label>
        <div className="oc-soul-select">
          {souls.map(s => (
            <div key={s.id} className={`oc-soul-chip ${selected.has(s.id) ? "active" : ""}`} onClick={() => toggle(s.id)}>
              <SoulAvatar name={s.name} imageUrl={s.avatar_url} size="xs" />
              <span>{s.name}</span>
              {s.role && <span className="oc-soul-role">{s.role}</span>}
            </div>
          ))}
          {souls.length === 0 && <p>채용된 Soul이 없습니다</p>}
        </div>
        <div className="oc-modal-actions">
          <button className="btn-secondary" onClick={onClose}>취소</button>
          <button className="btn-primary" disabled={selected.size < 2} onClick={() => onCreate([...selected], name || undefined)}>
            만들기 ({selected.size}명)
          </button>
        </div>
      </div>
    </div>
  );
}
