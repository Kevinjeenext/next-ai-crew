/**
 * Soul Chat Panel — 1:1 conversation with a Soul
 * Opens from office/hire when clicking a Soul avatar
 * Supports streaming (SSE) + standard responses
 */
import { useState, useRef, useEffect, useCallback } from "react";
import "./soul-chat.css";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
}

interface Props {
  soulId: string;
  soulName: string;
  soulNameKo: string;
  soulRole: string;
  soulAvatar: string;
  department: string;
  onClose: () => void;
}

const DEPT_COLORS: Record<string, string> = {
  engineering: "#2563EB",
  design: "#06B6D4",
  planning: "#6366F1",
  marketing: "#F59E0B",
  qa: "#10B981",
  security: "#EF4444",
  devops: "#8B5CF6",
  operations: "#64748B",
};

export default function SoulChatPanel({
  soulId,
  soulName,
  soulNameKo,
  soulRole,
  soulAvatar,
  department,
  onClose,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [llmReady, setLlmReady] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const deptColor = DEPT_COLORS[department] || "#2563EB";

  // Check LLM status on mount
  useEffect(() => {
    fetch("/api/llm/status")
      .then((r) => r.json())
      .then((d) => setLlmReady(d.ready))
      .catch(() => setLlmReady(false));
  }, []);

  // Load history
  useEffect(() => {
    fetch(`/api/souls/${soulId}/messages?limit=50`)
      .then((r) => r.json())
      .then((d) => {
        if (d.messages?.length) {
          setMessages(
            d.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              timestamp: new Date(m.created_at),
              model: m.model_used,
            }))
          );
        }
      })
      .catch(() => {});
  }, [soulId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/souls/${soulId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
          stream: false, // Use standard for now; SSE later
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: data.message || data.error || "응답을 받지 못했습니다.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } else {
        if (data.conversation_id) setConversationId(data.conversation_id);
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
          model: data.model,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "네트워크 오류가 발생했습니다.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, soulId, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="soul-chat-panel">
      {/* Header */}
      <div className="soul-chat-header" style={{ borderColor: deptColor }}>
        <img src={soulAvatar} alt={soulName} className="soul-chat-avatar" />
        <div className="soul-chat-header-info">
          <div className="soul-chat-name">{soulNameKo}</div>
          <div className="soul-chat-role">{soulRole}</div>
        </div>
        <div className="soul-chat-header-actions">
          {llmReady === false && (
            <span className="soul-chat-badge offline">LLM 미설정</span>
          )}
          {llmReady === true && (
            <span className="soul-chat-badge online">온라인</span>
          )}
          <button className="soul-chat-close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="soul-chat-messages">
        {messages.length === 0 && (
          <div className="soul-chat-empty">
            <img src={soulAvatar} alt="" className="soul-chat-empty-avatar" />
            <p className="soul-chat-empty-name">{soulNameKo}</p>
            <p className="soul-chat-empty-role">{soulRole}</p>
            <p className="soul-chat-empty-hint">메시지를 보내 대화를 시작하세요</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`soul-chat-msg ${msg.role}`}>
            {msg.role === "assistant" && (
              <img src={soulAvatar} alt="" className="soul-chat-msg-avatar" />
            )}
            <div className="soul-chat-msg-bubble">
              <div className="soul-chat-msg-content">{msg.content}</div>
              <div className="soul-chat-msg-meta">
                {msg.timestamp.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                {msg.model && <span className="soul-chat-msg-model">{msg.model}</span>}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="soul-chat-msg assistant">
            <img src={soulAvatar} alt="" className="soul-chat-msg-avatar" />
            <div className="soul-chat-msg-bubble">
              <div className="soul-chat-typing">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="soul-chat-input-area">
        <textarea
          ref={inputRef}
          className="soul-chat-input"
          placeholder={`${soulNameKo}에게 메시지 보내기...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={loading}
        />
        <button
          className="soul-chat-send"
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          style={{ background: deptColor }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
